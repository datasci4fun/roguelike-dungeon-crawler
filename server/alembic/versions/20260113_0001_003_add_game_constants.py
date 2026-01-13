"""Add game constants tables

Revision ID: 003
Revises: 002
Create Date: 2026-01-13

Tables created:
- game_enemies: Enemy definitions
- game_floor_enemy_pools: Floor spawn configurations
- game_bosses: Boss definitions
- game_races: Playable race definitions
- game_classes: Playable class definitions
- game_themes: Dungeon theme configurations
- game_traps: Trap definitions
- game_hazards: Environmental hazard definitions
- game_status_effects: Status effect definitions
- game_items: Item definitions
- game_constants_meta: Seed version tracking
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
    # Enemies table
    op.create_table(
        'game_enemies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('enemy_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('symbol', sa.String(10), nullable=False),
        sa.Column('hp', sa.Integer(), nullable=False),
        sa.Column('damage', sa.Integer(), nullable=False),
        sa.Column('xp', sa.Integer(), nullable=False),
        sa.Column('weight', sa.Integer(), nullable=False, default=10),
        sa.Column('min_level', sa.Integer(), nullable=False, default=1),
        sa.Column('max_level', sa.Integer(), nullable=False, default=8),
        sa.Column('ai_type', sa.String(50), nullable=True),
        sa.Column('element', sa.String(50), nullable=True),
        sa.Column('abilities', sa.JSON(), nullable=True),
        sa.Column('resistances', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_enemies_id', 'game_enemies', ['id'], unique=False)
    op.create_index('ix_game_enemies_enemy_id', 'game_enemies', ['enemy_id'], unique=True)

    # Floor enemy pools table
    op.create_table(
        'game_floor_enemy_pools',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('floor', sa.Integer(), nullable=False),
        sa.Column('enemy_id', sa.String(50), nullable=False),
        sa.Column('weight', sa.Integer(), nullable=False),
        sa.Column('theme', sa.String(50), nullable=True),
        sa.Column('lore_aspect', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_floor_enemy_pools_id', 'game_floor_enemy_pools', ['id'], unique=False)
    op.create_index('ix_game_floor_enemy_pools_floor', 'game_floor_enemy_pools', ['floor'], unique=False)
    op.create_index('ix_game_floor_enemy_pools_enemy_id', 'game_floor_enemy_pools', ['enemy_id'], unique=False)

    # Bosses table
    op.create_table(
        'game_bosses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('boss_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('symbol', sa.String(10), nullable=False),
        sa.Column('hp', sa.Integer(), nullable=False),
        sa.Column('damage', sa.Integer(), nullable=False),
        sa.Column('xp', sa.Integer(), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('theme', sa.String(50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('abilities', sa.JSON(), nullable=True),
        sa.Column('loot', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_bosses_id', 'game_bosses', ['id'], unique=False)
    op.create_index('ix_game_bosses_boss_id', 'game_bosses', ['boss_id'], unique=True)
    op.create_index('ix_game_bosses_level', 'game_bosses', ['level'], unique=False)

    # Races table
    op.create_table(
        'game_races',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('race_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('hp_modifier', sa.Integer(), nullable=False, default=0),
        sa.Column('atk_modifier', sa.Integer(), nullable=False, default=0),
        sa.Column('def_modifier', sa.Integer(), nullable=False, default=0),
        sa.Column('trait', sa.String(50), nullable=False),
        sa.Column('trait_name', sa.String(100), nullable=False),
        sa.Column('trait_description', sa.Text(), nullable=False),
        sa.Column('starts_with_feat', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_races_id', 'game_races', ['id'], unique=False)
    op.create_index('ix_game_races_race_id', 'game_races', ['race_id'], unique=True)

    # Classes table
    op.create_table(
        'game_classes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('hp_modifier', sa.Integer(), nullable=False, default=0),
        sa.Column('atk_modifier', sa.Integer(), nullable=False, default=0),
        sa.Column('def_modifier', sa.Integer(), nullable=False, default=0),
        sa.Column('active_abilities', sa.JSON(), nullable=True),
        sa.Column('passive_abilities', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_classes_id', 'game_classes', ['id'], unique=False)
    op.create_index('ix_game_classes_class_id', 'game_classes', ['class_id'], unique=True)

    # Themes table
    op.create_table(
        'game_themes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('theme_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('tiles', sa.JSON(), nullable=False),
        sa.Column('decorations', sa.JSON(), nullable=False),
        sa.Column('terrain_features', sa.JSON(), nullable=False),
        sa.Column('torch_count_min', sa.Integer(), nullable=False, default=4),
        sa.Column('torch_count_max', sa.Integer(), nullable=False, default=8),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_themes_id', 'game_themes', ['id'], unique=False)
    op.create_index('ix_game_themes_theme_id', 'game_themes', ['theme_id'], unique=True)
    op.create_index('ix_game_themes_level', 'game_themes', ['level'], unique=False)

    # Traps table
    op.create_table(
        'game_traps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trap_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('symbol_hidden', sa.String(10), nullable=False),
        sa.Column('symbol_visible', sa.String(10), nullable=False),
        sa.Column('damage_min', sa.Integer(), nullable=False),
        sa.Column('damage_max', sa.Integer(), nullable=False),
        sa.Column('cooldown', sa.Integer(), nullable=False),
        sa.Column('effect', sa.String(50), nullable=True),
        sa.Column('detection_dc', sa.Integer(), nullable=False, default=10),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_traps_id', 'game_traps', ['id'], unique=False)
    op.create_index('ix_game_traps_trap_id', 'game_traps', ['trap_id'], unique=True)

    # Hazards table
    op.create_table(
        'game_hazards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('hazard_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('symbol', sa.String(10), nullable=False),
        sa.Column('damage_per_turn', sa.Integer(), nullable=False, default=0),
        sa.Column('effect', sa.String(50), nullable=True),
        sa.Column('blocks_movement', sa.Boolean(), nullable=False, default=False),
        sa.Column('color', sa.Integer(), nullable=False, default=7),
        sa.Column('causes_slide', sa.Boolean(), nullable=False, default=False),
        sa.Column('spreads', sa.Boolean(), nullable=False, default=False),
        sa.Column('slows_movement', sa.Boolean(), nullable=False, default=False),
        sa.Column('drown_chance', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_hazards_id', 'game_hazards', ['id'], unique=False)
    op.create_index('ix_game_hazards_hazard_id', 'game_hazards', ['hazard_id'], unique=True)

    # Status effects table
    op.create_table(
        'game_status_effects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('effect_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('damage_per_turn', sa.Integer(), nullable=False, default=0),
        sa.Column('duration', sa.Integer(), nullable=False),
        sa.Column('max_stacks', sa.Integer(), nullable=False, default=1),
        sa.Column('stacking', sa.String(20), nullable=False, default='none'),
        sa.Column('color', sa.Integer(), nullable=False, default=7),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('movement_penalty', sa.Float(), nullable=True),
        sa.Column('skip_turn', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_status_effects_id', 'game_status_effects', ['id'], unique=False)
    op.create_index('ix_game_status_effects_effect_id', 'game_status_effects', ['effect_id'], unique=True)

    # Items table
    op.create_table(
        'game_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.String(50), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('symbol', sa.String(10), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('rarity', sa.String(20), nullable=False),
        sa.Column('slot', sa.String(50), nullable=True),
        sa.Column('attack_bonus', sa.Integer(), nullable=True),
        sa.Column('defense_bonus', sa.Integer(), nullable=True),
        sa.Column('stat_bonuses', sa.JSON(), nullable=True),
        sa.Column('block_chance', sa.Float(), nullable=True),
        sa.Column('heal_amount', sa.Integer(), nullable=True),
        sa.Column('atk_increase', sa.Integer(), nullable=True),
        sa.Column('effect', sa.String(50), nullable=True),
        sa.Column('effect_value', sa.Integer(), nullable=True),
        sa.Column('damage', sa.Integer(), nullable=True),
        sa.Column('range', sa.Integer(), nullable=True),
        sa.Column('is_ranged', sa.Boolean(), nullable=False, default=False),
        sa.Column('key_level', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_items_id', 'game_items', ['id'], unique=False)
    op.create_index('ix_game_items_item_id', 'game_items', ['item_id'], unique=True)
    op.create_index('ix_game_items_category', 'game_items', ['category'], unique=False)
    op.create_index('ix_game_items_rarity', 'game_items', ['rarity'], unique=False)

    # Constants metadata table
    op.create_table(
        'game_constants_meta',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('table_name', sa.String(100), nullable=False),
        sa.Column('version', sa.String(20), nullable=False),
        sa.Column('seed_file', sa.String(200), nullable=False),
        sa.Column('record_count', sa.Integer(), nullable=False, default=0),
        sa.Column('last_synced_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_constants_meta_id', 'game_constants_meta', ['id'], unique=False)
    op.create_index('ix_game_constants_meta_table_name', 'game_constants_meta', ['table_name'], unique=True)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('ix_game_constants_meta_table_name', table_name='game_constants_meta')
    op.drop_index('ix_game_constants_meta_id', table_name='game_constants_meta')
    op.drop_table('game_constants_meta')

    op.drop_index('ix_game_items_rarity', table_name='game_items')
    op.drop_index('ix_game_items_category', table_name='game_items')
    op.drop_index('ix_game_items_item_id', table_name='game_items')
    op.drop_index('ix_game_items_id', table_name='game_items')
    op.drop_table('game_items')

    op.drop_index('ix_game_status_effects_effect_id', table_name='game_status_effects')
    op.drop_index('ix_game_status_effects_id', table_name='game_status_effects')
    op.drop_table('game_status_effects')

    op.drop_index('ix_game_hazards_hazard_id', table_name='game_hazards')
    op.drop_index('ix_game_hazards_id', table_name='game_hazards')
    op.drop_table('game_hazards')

    op.drop_index('ix_game_traps_trap_id', table_name='game_traps')
    op.drop_index('ix_game_traps_id', table_name='game_traps')
    op.drop_table('game_traps')

    op.drop_index('ix_game_themes_level', table_name='game_themes')
    op.drop_index('ix_game_themes_theme_id', table_name='game_themes')
    op.drop_index('ix_game_themes_id', table_name='game_themes')
    op.drop_table('game_themes')

    op.drop_index('ix_game_classes_class_id', table_name='game_classes')
    op.drop_index('ix_game_classes_id', table_name='game_classes')
    op.drop_table('game_classes')

    op.drop_index('ix_game_races_race_id', table_name='game_races')
    op.drop_index('ix_game_races_id', table_name='game_races')
    op.drop_table('game_races')

    op.drop_index('ix_game_bosses_level', table_name='game_bosses')
    op.drop_index('ix_game_bosses_boss_id', table_name='game_bosses')
    op.drop_index('ix_game_bosses_id', table_name='game_bosses')
    op.drop_table('game_bosses')

    op.drop_index('ix_game_floor_enemy_pools_enemy_id', table_name='game_floor_enemy_pools')
    op.drop_index('ix_game_floor_enemy_pools_floor', table_name='game_floor_enemy_pools')
    op.drop_index('ix_game_floor_enemy_pools_id', table_name='game_floor_enemy_pools')
    op.drop_table('game_floor_enemy_pools')

    op.drop_index('ix_game_enemies_enemy_id', table_name='game_enemies')
    op.drop_index('ix_game_enemies_id', table_name='game_enemies')
    op.drop_table('game_enemies')
