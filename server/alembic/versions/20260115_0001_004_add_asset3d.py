"""Add 3D asset tables

Revision ID: 004
Revises: 003
Create Date: 2026-01-15

Tables created:
- asset_3d: 3D asset definitions with metadata
- generation_job: 3D model generation job tracking
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Asset3D table
    op.create_table(
        'asset_3d',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('category', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='queued'),
        sa.Column('priority', sa.String(20), nullable=False, server_default='medium'),
        sa.Column('source_image', sa.String(255), nullable=True),
        sa.Column('model_path', sa.String(255), nullable=True),
        sa.Column('texture_path', sa.String(255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('vertex_count', sa.Integer(), nullable=True),
        sa.Column('file_size_bytes', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_asset_3d_id', 'asset_3d', ['id'], unique=False)
    op.create_index('ix_asset_3d_asset_id', 'asset_3d', ['asset_id'], unique=True)
    op.create_index('ix_asset_3d_category', 'asset_3d', ['category'], unique=False)
    op.create_index('ix_asset_3d_status', 'asset_3d', ['status'], unique=False)

    # GenerationJob table
    op.create_table(
        'generation_job',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.String(50), nullable=False),
        sa.Column('asset_id', sa.String(50), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('source_image', sa.String(255), nullable=False),
        sa.Column('output_dir', sa.String(255), nullable=True),
        sa.Column('texture_resolution', sa.Integer(), nullable=False, server_default='1024'),
        sa.Column('device', sa.String(20), nullable=False, server_default='cpu'),
        sa.Column('result_path', sa.String(255), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('progress', sa.String(100), nullable=True),
        sa.Column('progress_pct', sa.Integer(), nullable=True),
        sa.Column('logs', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['asset_id'], ['asset_3d.asset_id'], ondelete='CASCADE')
    )
    op.create_index('ix_generation_job_id', 'generation_job', ['id'], unique=False)
    op.create_index('ix_generation_job_job_id', 'generation_job', ['job_id'], unique=True)
    op.create_index('ix_generation_job_asset_id', 'generation_job', ['asset_id'], unique=False)
    op.create_index('ix_generation_job_status', 'generation_job', ['status'], unique=False)


def downgrade() -> None:
    # Drop generation_job table first (foreign key dependency)
    op.drop_index('ix_generation_job_status', table_name='generation_job')
    op.drop_index('ix_generation_job_asset_id', table_name='generation_job')
    op.drop_index('ix_generation_job_job_id', table_name='generation_job')
    op.drop_index('ix_generation_job_id', table_name='generation_job')
    op.drop_table('generation_job')

    # Drop asset_3d table
    op.drop_index('ix_asset_3d_status', table_name='asset_3d')
    op.drop_index('ix_asset_3d_category', table_name='asset_3d')
    op.drop_index('ix_asset_3d_asset_id', table_name='asset_3d')
    op.drop_index('ix_asset_3d_id', table_name='asset_3d')
    op.drop_table('asset_3d')
