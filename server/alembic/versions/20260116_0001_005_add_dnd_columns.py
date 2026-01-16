"""Add D&D ability score columns and weapons table

Revision ID: 005
Revises: 004
Create Date: 2026-01-16

Adds D&D-style combat columns:
- game_enemies: armor_class, attack_bonus, damage_dice, str/dex/con_score
- game_races: base_str/dex/con/luck, str/dex/con/luck_modifier
- game_classes: str/dex/con/luck_modifier, hit_die, primary_stat, armor_proficiency
- game_weapons: New table for D&D weapon definitions
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add D&D columns to game_enemies
    op.add_column('game_enemies', sa.Column('armor_class', sa.Integer(), nullable=False, server_default='10'))
    op.add_column('game_enemies', sa.Column('attack_bonus', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('game_enemies', sa.Column('damage_dice', sa.String(20), nullable=False, server_default='1d4'))
    op.add_column('game_enemies', sa.Column('str_score', sa.Integer(), nullable=False, server_default='10'))
    op.add_column('game_enemies', sa.Column('dex_score', sa.Integer(), nullable=False, server_default='10'))
    op.add_column('game_enemies', sa.Column('con_score', sa.Integer(), nullable=False, server_default='10'))

    # Add D&D columns to game_races
    op.add_column('game_races', sa.Column('base_str', sa.Integer(), nullable=False, server_default='10'))
    op.add_column('game_races', sa.Column('base_dex', sa.Integer(), nullable=False, server_default='10'))
    op.add_column('game_races', sa.Column('base_con', sa.Integer(), nullable=False, server_default='10'))
    op.add_column('game_races', sa.Column('base_luck', sa.Integer(), nullable=False, server_default='10'))
    op.add_column('game_races', sa.Column('str_modifier', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('game_races', sa.Column('dex_modifier', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('game_races', sa.Column('con_modifier', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('game_races', sa.Column('luck_modifier', sa.Integer(), nullable=False, server_default='0'))

    # Add D&D columns to game_classes
    op.add_column('game_classes', sa.Column('str_modifier', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('game_classes', sa.Column('dex_modifier', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('game_classes', sa.Column('con_modifier', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('game_classes', sa.Column('luck_modifier', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('game_classes', sa.Column('hit_die', sa.String(10), nullable=False, server_default='d8'))
    op.add_column('game_classes', sa.Column('primary_stat', sa.String(10), nullable=False, server_default='STR'))
    op.add_column('game_classes', sa.Column('armor_proficiency', sa.JSON(), nullable=True))

    # Create game_weapons table
    op.create_table(
        'game_weapons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('weapon_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('damage_dice', sa.String(20), nullable=False),
        sa.Column('damage_type', sa.String(30), nullable=False, server_default='slashing'),
        sa.Column('stat_used', sa.String(10), nullable=False, server_default='STR'),
        sa.Column('is_ranged', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('range', sa.Integer(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('rarity', sa.String(20), nullable=False, server_default='common'),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_weapons_id', 'game_weapons', ['id'], unique=False)
    op.create_index('ix_game_weapons_weapon_id', 'game_weapons', ['weapon_id'], unique=True)


def downgrade() -> None:
    # Drop game_weapons table
    op.drop_index('ix_game_weapons_weapon_id', table_name='game_weapons')
    op.drop_index('ix_game_weapons_id', table_name='game_weapons')
    op.drop_table('game_weapons')

    # Remove D&D columns from game_classes
    op.drop_column('game_classes', 'armor_proficiency')
    op.drop_column('game_classes', 'primary_stat')
    op.drop_column('game_classes', 'hit_die')
    op.drop_column('game_classes', 'luck_modifier')
    op.drop_column('game_classes', 'con_modifier')
    op.drop_column('game_classes', 'dex_modifier')
    op.drop_column('game_classes', 'str_modifier')

    # Remove D&D columns from game_races
    op.drop_column('game_races', 'luck_modifier')
    op.drop_column('game_races', 'con_modifier')
    op.drop_column('game_races', 'dex_modifier')
    op.drop_column('game_races', 'str_modifier')
    op.drop_column('game_races', 'base_luck')
    op.drop_column('game_races', 'base_con')
    op.drop_column('game_races', 'base_dex')
    op.drop_column('game_races', 'base_str')

    # Remove D&D columns from game_enemies
    op.drop_column('game_enemies', 'con_score')
    op.drop_column('game_enemies', 'dex_score')
    op.drop_column('game_enemies', 'str_score')
    op.drop_column('game_enemies', 'damage_dice')
    op.drop_column('game_enemies', 'attack_bonus')
    op.drop_column('game_enemies', 'armor_class')
