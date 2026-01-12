"""Add game_saves table

Revision ID: 002
Revises: 001
Create Date: 2026-01-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'game_saves',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('slot_number', sa.Integer(), nullable=False, default=0),
        sa.Column('save_name', sa.String(100), nullable=True),
        sa.Column('save_version', sa.Integer(), nullable=False, default=1),
        sa.Column('current_level', sa.Integer(), nullable=False, default=1),
        sa.Column('player_level', sa.Integer(), nullable=False, default=1),
        sa.Column('player_hp', sa.Integer(), nullable=False, default=0),
        sa.Column('player_max_hp', sa.Integer(), nullable=False, default=0),
        sa.Column('score', sa.Integer(), nullable=False, default=0),
        sa.Column('turns_played', sa.Integer(), nullable=False, default=0),
        sa.Column('game_state', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'slot_number', name='uq_user_save_slot')
    )
    op.create_index(op.f('ix_game_saves_id'), 'game_saves', ['id'], unique=False)
    op.create_index(op.f('ix_game_saves_user_id'), 'game_saves', ['user_id'], unique=False)
    op.create_index(op.f('ix_game_saves_is_active'), 'game_saves', ['is_active'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_game_saves_is_active'), table_name='game_saves')
    op.drop_index(op.f('ix_game_saves_user_id'), table_name='game_saves')
    op.drop_index(op.f('ix_game_saves_id'), table_name='game_saves')
    op.drop_table('game_saves')
