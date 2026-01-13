"""Add codebase health tables

Revision ID: 003
Revises: 002
Create Date: 2026-01-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create codebase_file_stats table
    op.create_table(
        'codebase_file_stats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('path', sa.String(500), nullable=False),
        sa.Column('loc', sa.Integer(), nullable=False),
        sa.Column('nesting_depth', sa.Integer(), nullable=False),
        sa.Column('file_type', sa.String(50), nullable=False),
        sa.Column('area', sa.String(50), nullable=False),
        sa.Column('size_category', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_codebase_file_stats_id'), 'codebase_file_stats', ['id'], unique=False)
    op.create_index(op.f('ix_codebase_file_stats_path'), 'codebase_file_stats', ['path'], unique=True)
    op.create_index(op.f('ix_codebase_file_stats_file_type'), 'codebase_file_stats', ['file_type'], unique=False)
    op.create_index(op.f('ix_codebase_file_stats_area'), 'codebase_file_stats', ['area'], unique=False)

    # Create codebase_refactor_todos table
    op.create_table(
        'codebase_refactor_todos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.String(50), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('priority', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, default='pending'),
        sa.Column('category', sa.JSON(), nullable=False),
        sa.Column('effort', sa.String(20), nullable=False),
        sa.Column('affected_files', sa.JSON(), nullable=False),
        sa.Column('details', sa.JSON(), nullable=False),
        sa.Column('automated_reason', sa.Text(), nullable=True),
        sa.Column('technique', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_codebase_refactor_todos_id'), 'codebase_refactor_todos', ['id'], unique=False)
    op.create_index(op.f('ix_codebase_refactor_todos_item_id'), 'codebase_refactor_todos', ['item_id'], unique=True)
    op.create_index(op.f('ix_codebase_refactor_todos_priority'), 'codebase_refactor_todos', ['priority'], unique=False)
    op.create_index(op.f('ix_codebase_refactor_todos_status'), 'codebase_refactor_todos', ['status'], unique=False)

    # Create codebase_scan_meta table
    op.create_table(
        'codebase_scan_meta',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('generated_at', sa.DateTime(), nullable=False),
        sa.Column('total_files', sa.Integer(), nullable=False),
        sa.Column('total_loc', sa.Integer(), nullable=False),
        sa.Column('total_todos', sa.Integer(), nullable=False),
        sa.Column('avg_loc', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_codebase_scan_meta_id'), 'codebase_scan_meta', ['id'], unique=False)


def downgrade() -> None:
    # Drop codebase_scan_meta
    op.drop_index(op.f('ix_codebase_scan_meta_id'), table_name='codebase_scan_meta')
    op.drop_table('codebase_scan_meta')

    # Drop codebase_refactor_todos
    op.drop_index(op.f('ix_codebase_refactor_todos_status'), table_name='codebase_refactor_todos')
    op.drop_index(op.f('ix_codebase_refactor_todos_priority'), table_name='codebase_refactor_todos')
    op.drop_index(op.f('ix_codebase_refactor_todos_item_id'), table_name='codebase_refactor_todos')
    op.drop_index(op.f('ix_codebase_refactor_todos_id'), table_name='codebase_refactor_todos')
    op.drop_table('codebase_refactor_todos')

    # Drop codebase_file_stats
    op.drop_index(op.f('ix_codebase_file_stats_area'), table_name='codebase_file_stats')
    op.drop_index(op.f('ix_codebase_file_stats_file_type'), table_name='codebase_file_stats')
    op.drop_index(op.f('ix_codebase_file_stats_path'), table_name='codebase_file_stats')
    op.drop_index(op.f('ix_codebase_file_stats_id'), table_name='codebase_file_stats')
    op.drop_table('codebase_file_stats')
