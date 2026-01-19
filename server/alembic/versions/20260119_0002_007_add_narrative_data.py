"""Add narrative data tables

Revision ID: 007
Revises: 006
Create Date: 2026-01-19

Changes:
- Create game_boss_abilities table
- Create game_feats table
- Create game_artifacts table
- Create game_vows table
- Create game_lore_entries table
- Create game_encounter_messages table
- Create game_level_intros table
- Create game_tutorial_hints table
- Create game_micro_events table
- Create game_floor_descriptions table
- Create game_lore_quotes table
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '007'
down_revision: Union[str, None] = '006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create game_boss_abilities table
    op.create_table(
        'game_boss_abilities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ability_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('ability_type', sa.String(30), nullable=False),
        sa.Column('cooldown', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('damage', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('range', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('radius', sa.Integer(), nullable=True),
        sa.Column('summon_type', sa.String(50), nullable=True),
        sa.Column('summon_count', sa.Integer(), nullable=True),
        sa.Column('buff_stat', sa.String(30), nullable=True),
        sa.Column('buff_amount', sa.Integer(), nullable=True),
        sa.Column('buff_duration', sa.Integer(), nullable=True),
        sa.Column('status_effect', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_boss_abilities_id', 'game_boss_abilities', ['id'])
    op.create_index('ix_game_boss_abilities_ability_id', 'game_boss_abilities', ['ability_id'], unique=True)
    op.create_index('ix_game_boss_abilities_ability_type', 'game_boss_abilities', ['ability_type'])

    # Create game_feats table
    op.create_table(
        'game_feats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('feat_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(30), nullable=False),
        sa.Column('hp_bonus', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('atk_bonus', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('def_bonus', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('damage_bonus', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('crit_chance_bonus', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('dodge_bonus', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('effects', sa.JSON(), nullable=True),
        sa.Column('level_required', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('prerequisites', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_feats_id', 'game_feats', ['id'])
    op.create_index('ix_game_feats_feat_id', 'game_feats', ['feat_id'], unique=True)
    op.create_index('ix_game_feats_category', 'game_feats', ['category'])

    # Create game_artifacts table
    op.create_table(
        'game_artifacts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('artifact_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('lore', sa.Text(), nullable=True),
        sa.Column('effect', sa.JSON(), nullable=False),
        sa.Column('cost', sa.JSON(), nullable=True),
        sa.Column('unlock_condition', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_artifacts_id', 'game_artifacts', ['id'])
    op.create_index('ix_game_artifacts_artifact_id', 'game_artifacts', ['artifact_id'], unique=True)

    # Create game_vows table
    op.create_table(
        'game_vows',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vow_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('restriction_type', sa.String(50), nullable=False),
        sa.Column('xp_multiplier', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('reward', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_vows_id', 'game_vows', ['id'])
    op.create_index('ix_game_vows_vow_id', 'game_vows', ['vow_id'], unique=True)

    # Create game_lore_entries table
    op.create_table(
        'game_lore_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lore_id', sa.String(100), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(30), nullable=False),
        sa.Column('level_hint', sa.Integer(), nullable=True),
        sa.Column('item_type', sa.String(50), nullable=True),
        sa.Column('zone_hint', sa.String(50), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_lore_entries_id', 'game_lore_entries', ['id'])
    op.create_index('ix_game_lore_entries_lore_id', 'game_lore_entries', ['lore_id'], unique=True)
    op.create_index('ix_game_lore_entries_category', 'game_lore_entries', ['category'])

    # Create game_encounter_messages table
    op.create_table(
        'game_encounter_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('enemy_id', sa.String(50), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_encounter_messages_id', 'game_encounter_messages', ['id'])
    op.create_index('ix_game_encounter_messages_enemy_id', 'game_encounter_messages', ['enemy_id'])

    # Create game_level_intros table
    op.create_table(
        'game_level_intros',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('floor', sa.Integer(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_level_intros_id', 'game_level_intros', ['id'])
    op.create_index('ix_game_level_intros_floor', 'game_level_intros', ['floor'], unique=True)

    # Create game_tutorial_hints table
    op.create_table(
        'game_tutorial_hints',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('hint_id', sa.String(50), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('trigger_condition', sa.String(100), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_tutorial_hints_id', 'game_tutorial_hints', ['id'])
    op.create_index('ix_game_tutorial_hints_hint_id', 'game_tutorial_hints', ['hint_id'], unique=True)

    # Create game_micro_events table
    op.create_table(
        'game_micro_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.String(50), nullable=False),
        sa.Column('floor', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(100), nullable=False),
        sa.Column('messages', sa.JSON(), nullable=False),
        sa.Column('effect_type', sa.String(30), nullable=False),
        sa.Column('effect_value', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('evidence_id', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_micro_events_id', 'game_micro_events', ['id'])
    op.create_index('ix_game_micro_events_event_id', 'game_micro_events', ['event_id'], unique=True)
    op.create_index('ix_game_micro_events_floor', 'game_micro_events', ['floor'])

    # Create game_floor_descriptions table
    op.create_table(
        'game_floor_descriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('floor', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('aspect', sa.String(50), nullable=False),
        sa.Column('hint', sa.Text(), nullable=False),
        sa.Column('warden', sa.String(100), nullable=False),
        sa.Column('warden_symbol', sa.String(10), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_floor_descriptions_id', 'game_floor_descriptions', ['id'])
    op.create_index('ix_game_floor_descriptions_floor', 'game_floor_descriptions', ['floor'], unique=True)

    # Create game_lore_quotes table
    op.create_table(
        'game_lore_quotes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('quote_id', sa.String(50), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('author', sa.String(100), nullable=False),
        sa.Column('category', sa.String(30), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_game_lore_quotes_id', 'game_lore_quotes', ['id'])
    op.create_index('ix_game_lore_quotes_quote_id', 'game_lore_quotes', ['quote_id'], unique=True)


def downgrade() -> None:
    # Drop all tables in reverse order
    op.drop_index('ix_game_lore_quotes_quote_id', table_name='game_lore_quotes')
    op.drop_index('ix_game_lore_quotes_id', table_name='game_lore_quotes')
    op.drop_table('game_lore_quotes')

    op.drop_index('ix_game_floor_descriptions_floor', table_name='game_floor_descriptions')
    op.drop_index('ix_game_floor_descriptions_id', table_name='game_floor_descriptions')
    op.drop_table('game_floor_descriptions')

    op.drop_index('ix_game_micro_events_floor', table_name='game_micro_events')
    op.drop_index('ix_game_micro_events_event_id', table_name='game_micro_events')
    op.drop_index('ix_game_micro_events_id', table_name='game_micro_events')
    op.drop_table('game_micro_events')

    op.drop_index('ix_game_tutorial_hints_hint_id', table_name='game_tutorial_hints')
    op.drop_index('ix_game_tutorial_hints_id', table_name='game_tutorial_hints')
    op.drop_table('game_tutorial_hints')

    op.drop_index('ix_game_level_intros_floor', table_name='game_level_intros')
    op.drop_index('ix_game_level_intros_id', table_name='game_level_intros')
    op.drop_table('game_level_intros')

    op.drop_index('ix_game_encounter_messages_enemy_id', table_name='game_encounter_messages')
    op.drop_index('ix_game_encounter_messages_id', table_name='game_encounter_messages')
    op.drop_table('game_encounter_messages')

    op.drop_index('ix_game_lore_entries_category', table_name='game_lore_entries')
    op.drop_index('ix_game_lore_entries_lore_id', table_name='game_lore_entries')
    op.drop_index('ix_game_lore_entries_id', table_name='game_lore_entries')
    op.drop_table('game_lore_entries')

    op.drop_index('ix_game_vows_vow_id', table_name='game_vows')
    op.drop_index('ix_game_vows_id', table_name='game_vows')
    op.drop_table('game_vows')

    op.drop_index('ix_game_artifacts_artifact_id', table_name='game_artifacts')
    op.drop_index('ix_game_artifacts_id', table_name='game_artifacts')
    op.drop_table('game_artifacts')

    op.drop_index('ix_game_feats_category', table_name='game_feats')
    op.drop_index('ix_game_feats_feat_id', table_name='game_feats')
    op.drop_index('ix_game_feats_id', table_name='game_feats')
    op.drop_table('game_feats')

    op.drop_index('ix_game_boss_abilities_ability_type', table_name='game_boss_abilities')
    op.drop_index('ix_game_boss_abilities_ability_id', table_name='game_boss_abilities')
    op.drop_index('ix_game_boss_abilities_id', table_name='game_boss_abilities')
    op.drop_table('game_boss_abilities')
