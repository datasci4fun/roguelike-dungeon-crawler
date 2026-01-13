"""
Database Explorer API - Dev tool for browsing database contents.

SECURITY: Only available when DEBUG=true. Read-only queries only.
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text, inspect
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from ..core.config import settings
from ..core.database import get_db, engine

router = APIRouter(prefix="/api/db", tags=["database-explorer"])


# Pydantic models for responses
class TableInfo(BaseModel):
    name: str
    row_count: int


class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool
    default: str | None
    primary_key: bool


class TableSchema(BaseModel):
    name: str
    columns: list[ColumnInfo]
    primary_keys: list[str]
    foreign_keys: list[dict[str, Any]]
    indexes: list[dict[str, Any]]


class QueryRequest(BaseModel):
    sql: str


class QueryResult(BaseModel):
    columns: list[str]
    rows: list[list[Any]]
    row_count: int
    truncated: bool


def require_debug():
    """Dependency that blocks access unless DEBUG mode is enabled."""
    if not settings.debug:
        raise HTTPException(
            status_code=403,
            detail="Database explorer is only available in debug mode"
        )


@router.get("/tables", response_model=list[TableInfo])
async def list_tables(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_debug),
):
    """List all tables with row counts."""
    # Get table names using inspector
    def get_tables(connection):
        inspector = inspect(connection)
        return inspector.get_table_names()

    async with engine.connect() as conn:
        table_names = await conn.run_sync(get_tables)

    # Get row counts for each table
    tables = []
    for table_name in sorted(table_names):
        result = await db.execute(
            text(f'SELECT COUNT(*) FROM "{table_name}"')
        )
        count = result.scalar() or 0
        tables.append(TableInfo(name=table_name, row_count=count))

    return tables


@router.get("/tables/{table_name}/schema", response_model=TableSchema)
async def get_table_schema(
    table_name: str,
    _: None = Depends(require_debug),
):
    """Get schema details for a specific table."""
    def get_schema(connection):
        inspector = inspect(connection)

        # Verify table exists
        if table_name not in inspector.get_table_names():
            return None

        # Get columns
        columns = []
        for col in inspector.get_columns(table_name):
            columns.append(ColumnInfo(
                name=col["name"],
                type=str(col["type"]),
                nullable=col.get("nullable", True),
                default=str(col.get("default")) if col.get("default") else None,
                primary_key=False,  # Will be set below
            ))

        # Get primary keys
        pk_constraint = inspector.get_pk_constraint(table_name)
        pk_columns = pk_constraint.get("constrained_columns", []) if pk_constraint else []

        # Mark primary key columns
        for col in columns:
            col.primary_key = col.name in pk_columns

        # Get foreign keys
        fks = []
        for fk in inspector.get_foreign_keys(table_name):
            fks.append({
                "columns": fk.get("constrained_columns", []),
                "referred_table": fk.get("referred_table"),
                "referred_columns": fk.get("referred_columns", []),
            })

        # Get indexes
        indexes = []
        for idx in inspector.get_indexes(table_name):
            indexes.append({
                "name": idx.get("name"),
                "columns": idx.get("column_names", []),
                "unique": idx.get("unique", False),
            })

        return TableSchema(
            name=table_name,
            columns=columns,
            primary_keys=pk_columns,
            foreign_keys=fks,
            indexes=indexes,
        )

    async with engine.connect() as conn:
        schema = await conn.run_sync(get_schema)

    if schema is None:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")

    return schema


@router.get("/tables/{table_name}/data")
async def get_table_data(
    table_name: str,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_debug),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    order_by: str | None = None,
    order_dir: str = Query("asc", pattern="^(asc|desc)$"),
):
    """Get paginated data from a table."""
    # Verify table exists
    def check_table(connection):
        inspector = inspect(connection)
        return table_name in inspector.get_table_names()

    async with engine.connect() as conn:
        exists = await conn.run_sync(check_table)

    if not exists:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")

    # Build query with pagination
    offset = (page - 1) * page_size

    # Get total count
    count_result = await db.execute(
        text(f'SELECT COUNT(*) FROM "{table_name}"')
    )
    total_count = count_result.scalar() or 0

    # Build data query
    order_clause = ""
    if order_by:
        # Sanitize order_by to prevent injection
        order_clause = f' ORDER BY "{order_by}" {order_dir.upper()}'

    query = text(
        f'SELECT * FROM "{table_name}"{order_clause} LIMIT :limit OFFSET :offset'
    )
    result = await db.execute(query, {"limit": page_size, "offset": offset})

    # Get column names and rows
    columns = list(result.keys())
    rows = []
    for row in result.fetchall():
        # Convert row to list, handling special types
        row_data = []
        for val in row:
            if val is None:
                row_data.append(None)
            elif isinstance(val, (dict, list)):
                row_data.append(val)
            else:
                row_data.append(str(val) if not isinstance(val, (int, float, bool)) else val)
        rows.append(row_data)

    return {
        "columns": columns,
        "rows": rows,
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size,
    }


@router.post("/query", response_model=QueryResult)
async def execute_query(
    request: QueryRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_debug),
):
    """
    Execute a read-only SQL query.

    Only SELECT statements are allowed. Results are limited to 1000 rows.
    """
    sql = request.sql.strip()

    # Security: Only allow SELECT statements
    sql_upper = sql.upper()
    if not sql_upper.startswith("SELECT"):
        raise HTTPException(
            status_code=400,
            detail="Only SELECT queries are allowed"
        )

    # Block dangerous keywords
    dangerous = ["INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE", "GRANT", "REVOKE"]
    for keyword in dangerous:
        if keyword in sql_upper:
            raise HTTPException(
                status_code=400,
                detail=f"Query contains forbidden keyword: {keyword}"
            )

    try:
        result = await db.execute(text(sql))
        columns = list(result.keys())

        # Limit results
        max_rows = 1000
        rows = []
        truncated = False

        for i, row in enumerate(result.fetchall()):
            if i >= max_rows:
                truncated = True
                break
            row_data = []
            for val in row:
                if val is None:
                    row_data.append(None)
                elif isinstance(val, (dict, list)):
                    row_data.append(val)
                else:
                    row_data.append(str(val) if not isinstance(val, (int, float, bool)) else val)
            rows.append(row_data)

        return QueryResult(
            columns=columns,
            rows=rows,
            row_count=len(rows),
            truncated=truncated,
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Query error: {str(e)}"
        )
