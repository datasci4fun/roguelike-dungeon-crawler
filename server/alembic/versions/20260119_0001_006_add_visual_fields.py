"""Add visual fields for model generation and procedural model registry

Revision ID: 006
Revises: 005
Create Date: 2026-01-19

Changes:
- Add visual fields to game_races table (appearance, lore, base_height, skin_color, eye_color, icon)
- Add visual fields to game_classes table (playstyle, lore, equipment_type, starting_equipment, colors, icon, abilities)
- Create procedural_model table for tracking code-generated 3D models
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add visual fields to game_races
    op.add_column('game_races', sa.Column('appearance', sa.Text(), nullable=True))
    op.add_column('game_races', sa.Column('lore', sa.Text(), nullable=True))
    op.add_column('game_races', sa.Column('base_height', sa.Float(), nullable=False, server_default='1.8'))
    op.add_column('game_races', sa.Column('skin_color', sa.String(20), nullable=True))
    op.add_column('game_races', sa.Column('eye_color', sa.String(20), nullable=True))
    op.add_column('game_races', sa.Column('icon', sa.String(10), nullable=True))

    # Add visual fields to game_classes
    op.add_column('game_classes', sa.Column('playstyle', sa.Text(), nullable=True))
    op.add_column('game_classes', sa.Column('lore', sa.Text(), nullable=True))
    op.add_column('game_classes', sa.Column('equipment_type', sa.String(50), nullable=True))
    op.add_column('game_classes', sa.Column('starting_equipment', sa.String(200), nullable=True))
    op.add_column('game_classes', sa.Column('primary_color', sa.String(20), nullable=True))
    op.add_column('game_classes', sa.Column('secondary_color', sa.String(20), nullable=True))
    op.add_column('game_classes', sa.Column('glow_color', sa.String(20), nullable=True))
    op.add_column('game_classes', sa.Column('icon', sa.String(10), nullable=True))
    op.add_column('game_classes', sa.Column('abilities', sa.JSON(), nullable=True))

    # Create procedural_model table
    op.create_table(
        'procedural_model',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.String(100), nullable=False),
        sa.Column('name', sa.String(150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(30), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('base_model_id', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('file_path', sa.String(255), nullable=False),
        sa.Column('factory_function', sa.String(100), nullable=False),
        sa.Column('meta_export', sa.String(100), nullable=False),
        sa.Column('enemy_name', sa.String(100), nullable=True),
        sa.Column('race_id', sa.String(50), nullable=True),
        sa.Column('class_id', sa.String(50), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('bounding_box', sa.JSON(), nullable=True),
        sa.Column('default_scale', sa.Float(), nullable=True, server_default='1.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_procedural_model_id', 'procedural_model', ['id'], unique=False)
    op.create_index('ix_procedural_model_model_id', 'procedural_model', ['model_id'], unique=True)
    op.create_index('ix_procedural_model_category', 'procedural_model', ['category'], unique=False)
    op.create_index('ix_procedural_model_status', 'procedural_model', ['status'], unique=False)
    op.create_index('ix_procedural_model_base_model_id', 'procedural_model', ['base_model_id'], unique=False)
    op.create_index('ix_procedural_model_enemy_name', 'procedural_model', ['enemy_name'], unique=False)
    op.create_index('ix_procedural_model_race_id', 'procedural_model', ['race_id'], unique=False)
    op.create_index('ix_procedural_model_class_id', 'procedural_model', ['class_id'], unique=False)


def downgrade() -> None:
    # Drop procedural_model table
    op.drop_index('ix_procedural_model_class_id', table_name='procedural_model')
    op.drop_index('ix_procedural_model_race_id', table_name='procedural_model')
    op.drop_index('ix_procedural_model_enemy_name', table_name='procedural_model')
    op.drop_index('ix_procedural_model_base_model_id', table_name='procedural_model')
    op.drop_index('ix_procedural_model_status', table_name='procedural_model')
    op.drop_index('ix_procedural_model_category', table_name='procedural_model')
    op.drop_index('ix_procedural_model_model_id', table_name='procedural_model')
    op.drop_index('ix_procedural_model_id', table_name='procedural_model')
    op.drop_table('procedural_model')

    # Remove visual fields from game_classes
    op.drop_column('game_classes', 'abilities')
    op.drop_column('game_classes', 'icon')
    op.drop_column('game_classes', 'glow_color')
    op.drop_column('game_classes', 'secondary_color')
    op.drop_column('game_classes', 'primary_color')
    op.drop_column('game_classes', 'starting_equipment')
    op.drop_column('game_classes', 'equipment_type')
    op.drop_column('game_classes', 'lore')
    op.drop_column('game_classes', 'playstyle')

    # Remove visual fields from game_races
    op.drop_column('game_races', 'icon')
    op.drop_column('game_races', 'eye_color')
    op.drop_column('game_races', 'skin_color')
    op.drop_column('game_races', 'base_height')
    op.drop_column('game_races', 'lore')
    op.drop_column('game_races', 'appearance')
