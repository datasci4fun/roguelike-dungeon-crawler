/**
 * Database Explorer - Dev tool for browsing database contents
 *
 * Features:
 * - Table list with row counts
 * - Schema viewer (columns, types, keys)
 * - Data browser with pagination
 * - Read-only SQL query runner
 */

import { useState, useEffect, useCallback } from 'react';
import './DatabaseExplorer.css';

const API_BASE = 'http://localhost:8000/api/db';

interface TableInfo {
  name: string;
  row_count: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  primary_key: boolean;
}

interface TableSchema {
  name: string;
  columns: ColumnInfo[];
  primary_keys: string[];
  foreign_keys: { columns: string[]; referred_table: string; referred_columns: string[] }[];
  indexes: { name: string; columns: string[]; unique: boolean }[];
}

interface TableData {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface QueryResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  row_count: number;
  truncated: boolean;
}

type TabType = 'schema' | 'data' | 'query';

export function DatabaseExplorer() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [data, setData] = useState<TableData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('schema');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query state
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Fetch tables on mount
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tables`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch tables');
      }
      const data = await res.json();
      setTables(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchema = useCallback(async (tableName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tables/${tableName}/schema`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch schema');
      }
      const data = await res.json();
      setSchema(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch schema');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(async (tableName: string, pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tables/${tableName}/data?page=${pageNum}&page_size=50`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch data');
      }
      const data = await res.json();
      setData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle table selection
  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName);
    setPage(1);
    setSchema(null);
    setData(null);
    fetchSchema(tableName);
  };

  // Handle tab change
  useEffect(() => {
    if (!selectedTable) return;

    if (activeTab === 'schema' && !schema) {
      fetchSchema(selectedTable);
    } else if (activeTab === 'data') {
      fetchData(selectedTable, page);
    }
  }, [activeTab, selectedTable, page, fetchSchema, fetchData, schema]);

  // Execute query
  const executeQuery = async () => {
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: query }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Query failed');
      }
      const result = await res.json();
      setQueryResult(result);
    } catch (e) {
      setQueryError(e instanceof Error ? e.message : 'Query failed');
    } finally {
      setQueryLoading(false);
    }
  };

  // Format cell value for display
  const formatCell = (value: unknown): string => {
    if (value === null) return 'NULL';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="db-explorer">
      {/* Sidebar - Table List */}
      <aside className="db-sidebar">
        <div className="sidebar-header">
          <h2>Tables</h2>
          <button onClick={fetchTables} className="refresh-btn" title="Refresh">
            ↻
          </button>
        </div>

        {loading && tables.length === 0 && (
          <div className="sidebar-loading">Loading...</div>
        )}

        {error && tables.length === 0 && (
          <div className="sidebar-error">{error}</div>
        )}

        <ul className="table-list">
          {tables.map((table) => (
            <li
              key={table.name}
              className={`table-item ${selectedTable === table.name ? 'selected' : ''}`}
              onClick={() => handleSelectTable(table.name)}
            >
              <span className="table-name">{table.name}</span>
              <span className="table-count">{table.row_count}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main className="db-main">
        {!selectedTable ? (
          <div className="db-empty">
            <div className="empty-icon">🗄️</div>
            <h2>Database Explorer</h2>
            <p>Select a table from the sidebar to view its schema and data.</p>
            {error && <div className="error-banner">{error}</div>}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <header className="db-header">
              <h1>{selectedTable}</h1>
              <nav className="db-tabs">
                <button
                  className={`tab-btn ${activeTab === 'schema' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schema')}
                >
                  Schema
                </button>
                <button
                  className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
                  onClick={() => setActiveTab('data')}
                >
                  Data
                </button>
                <button
                  className={`tab-btn ${activeTab === 'query' ? 'active' : ''}`}
                  onClick={() => setActiveTab('query')}
                >
                  Query
                </button>
              </nav>
            </header>

            {error && <div className="error-banner">{error}</div>}

            {/* Schema Tab */}
            {activeTab === 'schema' && schema && (
              <div className="schema-view">
                {/* Columns */}
                <section className="schema-section">
                  <h3>Columns ({schema.columns.length})</h3>
                  <table className="schema-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Nullable</th>
                        <th>Default</th>
                        <th>Key</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schema.columns.map((col) => (
                        <tr key={col.name} className={col.primary_key ? 'pk-row' : ''}>
                          <td className="col-name">{col.name}</td>
                          <td className="col-type">{col.type}</td>
                          <td className="col-nullable">{col.nullable ? 'YES' : 'NO'}</td>
                          <td className="col-default">{col.default || '-'}</td>
                          <td className="col-key">{col.primary_key ? '🔑 PK' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                {/* Foreign Keys */}
                {schema.foreign_keys.length > 0 && (
                  <section className="schema-section">
                    <h3>Foreign Keys ({schema.foreign_keys.length})</h3>
                    <table className="schema-table">
                      <thead>
                        <tr>
                          <th>Columns</th>
                          <th>References</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schema.foreign_keys.map((fk, i) => (
                          <tr key={i}>
                            <td>{fk.columns.join(', ')}</td>
                            <td>{fk.referred_table}({fk.referred_columns.join(', ')})</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}

                {/* Indexes */}
                {schema.indexes.length > 0 && (
                  <section className="schema-section">
                    <h3>Indexes ({schema.indexes.length})</h3>
                    <table className="schema-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Columns</th>
                          <th>Unique</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schema.indexes.map((idx, i) => (
                          <tr key={i}>
                            <td>{idx.name}</td>
                            <td>{idx.columns.join(', ')}</td>
                            <td>{idx.unique ? 'YES' : 'NO'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="data-view">
                {loading ? (
                  <div className="data-loading">Loading data...</div>
                ) : data ? (
                  <>
                    <div className="data-info">
                      Showing {data.rows.length} of {data.total_count} rows
                      (Page {data.page} of {data.total_pages})
                    </div>

                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {data.columns.map((col) => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.rows.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j} className={cell === null ? 'null-cell' : ''}>
                                  {formatCell(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage(1)}
                      >
                        ««
                      </button>
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        «
                      </button>
                      <span className="page-info">
                        Page {page} of {data.total_pages}
                      </span>
                      <button
                        disabled={page >= data.total_pages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        »
                      </button>
                      <button
                        disabled={page >= data.total_pages}
                        onClick={() => setPage(data.total_pages)}
                      >
                        »»
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* Query Tab */}
            {activeTab === 'query' && (
              <div className="query-view">
                <div className="query-editor">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter SQL query (SELECT only)..."
                    spellCheck={false}
                  />
                  <div className="query-actions">
                    <button
                      onClick={executeQuery}
                      disabled={queryLoading || !query.trim()}
                      className="execute-btn"
                    >
                      {queryLoading ? 'Running...' : 'Execute Query'}
                    </button>
                    <span className="query-hint">Only SELECT queries allowed. Max 1000 rows.</span>
                  </div>
                </div>

                {queryError && (
                  <div className="query-error">{queryError}</div>
                )}

                {queryResult && (
                  <div className="query-result">
                    <div className="result-info">
                      {queryResult.row_count} rows returned
                      {queryResult.truncated && ' (truncated to 1000)'}
                    </div>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {queryResult.columns.map((col) => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j} className={cell === null ? 'null-cell' : ''}>
                                  {formatCell(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default DatabaseExplorer;
