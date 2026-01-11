"""Game state serialization and deserialization."""
from typing import TYPE_CHECKING, List

from ..core.constants import TileType, EnemyType
from ..world import Dungeon
from ..entities import Player, Enemy
from ..items import Item, ItemType, create_item, create_lore_item
from ..data import save_game, load_game, delete_save

if TYPE_CHECKING:
    from ..core.game import Game


class SaveManager:
    """Manages saving and loading game state."""

    def __init__(self, game: 'Game'):
        self.game = game

    def auto_save(self) -> bool:
        """
        Perform an auto-save and reset turn counter.

        Returns:
            True if save succeeded, False otherwise
        """
        if self.save_game():
            self.game.turns_since_save = 0
            return True
        return False

    def save_game(self) -> bool:
        """
        Save the current game state to disk.

        Returns:
            True if save succeeded, False otherwise
        """
        game_state = {
            'current_level': self.game.current_level,
            'messages': self.game.messages,
            'player': self._serialize_player(self.game.player),
            'enemies': [self._serialize_enemy(e) for e in self.game.entity_manager.enemies],
            'items': [self._serialize_item(i) for i in self.game.entity_manager.items],
            'dungeon': self._serialize_dungeon(self.game.dungeon),
            'story_manager': self.game.story_manager.to_dict() if self.game.story_manager else None,
            'field_pulse_manager': self.game.field_pulse_manager.get_state() if hasattr(self.game, 'field_pulse_manager') and self.game.field_pulse_manager else None,
            'artifact_manager': self.game.entity_manager.artifact_manager.get_state() if hasattr(self.game.entity_manager, 'artifact_manager') else None,
            'ghost_manager': self.game.ghost_manager.get_state() if hasattr(self.game, 'ghost_manager') and self.game.ghost_manager else None,
            'completion_ledger': self.game.completion_ledger.to_dict() if hasattr(self.game, 'completion_ledger') and self.game.completion_ledger else None,
        }

        return save_game(game_state)

    def load_game(self) -> bool:
        """
        Load game state from disk.

        Returns:
            True if load succeeded, False otherwise
        """
        game_state = load_game()
        if not game_state:
            return False

        return self.load_game_state(game_state)

    def load_game_state(self, game_state: dict) -> bool:
        """
        Load game state from a dictionary.

        Args:
            game_state: Dictionary containing serialized game state

        Returns:
            True if load succeeded, False otherwise
        """
        try:
            self.game.current_level = game_state['current_level']
            self.game.messages = game_state['messages']
            self.game.player = self._deserialize_player(game_state['player'])
            self.game.entity_manager.enemies = [self._deserialize_enemy(e) for e in game_state['enemies']]
            self.game.entity_manager.items = [item for item in (self._deserialize_item(i) for i in game_state['items']) if item is not None]
            self.game.dungeon = self._deserialize_dungeon(game_state['dungeon'])

            # v5.5: Restore completion_ledger FIRST (it's source of truth for story_manager)
            if game_state.get('completion_ledger') and hasattr(self.game, 'completion_ledger'):
                from ..story import CompletionLedger
                self.game.completion_ledger = CompletionLedger.from_dict(game_state['completion_ledger'])

            # Restore story_manager state if present, passing ledger for hydration
            if game_state.get('story_manager') and self.game.story_manager:
                from ..story import StoryManager
                self.game.story_manager = StoryManager.from_dict(
                    game_state['story_manager'],
                    ledger=self.game.completion_ledger if hasattr(self.game, 'completion_ledger') else None
                )

            # Restore field_pulse_manager state if present
            if game_state.get('field_pulse_manager') and hasattr(self.game, 'field_pulse_manager') and self.game.field_pulse_manager:
                self.game.field_pulse_manager.load_state(game_state['field_pulse_manager'])
                # Sync amplification with hazard manager

            # v5.5: Restore artifact_manager state if present
            if game_state.get('artifact_manager') and hasattr(self.game.entity_manager, 'artifact_manager'):
                self.game.entity_manager.artifact_manager.load_state(game_state['artifact_manager'])
                current_amp = self.game.field_pulse_manager.get_current_amplification()
                if hasattr(self.game, 'hazard_manager') and self.game.hazard_manager:
                    self.game.hazard_manager.set_amplification(current_amp)

            # v5.5: Restore ghost_manager state if present
            if game_state.get('ghost_manager') and hasattr(self.game, 'ghost_manager') and self.game.ghost_manager:
                self.game.ghost_manager.load_state(game_state['ghost_manager'])

            # Note: completion_ledger is restored earlier (before story_manager)

            # Update FOV after loading (with vision bonus from race traits)
            vision_bonus = self.game.player.get_vision_bonus() if hasattr(self.game.player, 'get_vision_bonus') else 0
            self.game.dungeon.update_fov(self.game.player.x, self.game.player.y, vision_bonus=vision_bonus)

            return True
        except Exception as e:
            print(f"Error loading game state: {e}")
            return False

    def delete_save(self):
        """Delete the save file (for permadeath)."""
        delete_save()

    # Serialization methods

    def _serialize_player(self, player: Player) -> dict:
        """Serialize player to dictionary."""
        return {
            'x': player.x,
            'y': player.y,
            'health': player.health,
            'max_health': player.max_health,
            'attack_damage': player.attack_damage,
            'base_attack': player.base_attack,
            'defense': player.defense,
            'level': player.level,
            'xp': player.xp,
            'xp_to_next_level': player.xp_to_next_level,
            'kills': player.kills,
            'inventory': [self._serialize_item(item) for item in player.inventory.items],
            'equipped_weapon': self._serialize_item(player.equipped_weapon) if player.equipped_weapon else None,
            'equipped_armor': self._serialize_item(player.equipped_armor) if player.equipped_armor else None,
            # v5.5: Artifacts
            'artifacts': [self._serialize_artifact(a) for a in getattr(player, 'artifacts', [])],
            'duplicate_next_consumable': getattr(player, 'duplicate_next_consumable', False),
            'guaranteed_rare_from_boss': getattr(player, 'guaranteed_rare_from_boss', False),
        }

    def _serialize_artifact(self, artifact) -> dict:
        """Serialize artifact instance to dictionary."""
        from ..items.artifacts import ArtifactId, VowType
        return {
            'artifact_id': artifact.artifact_id.name,
            'charges': artifact.charges,
            'used': artifact.used,
            'floor_acquired': artifact.floor_acquired,
            'active_vow': artifact.active_vow.name if artifact.active_vow else None,
            'vow_broken': artifact.vow_broken,
        }

    def _deserialize_artifact(self, data: dict):
        """Deserialize artifact instance from dictionary."""
        from ..items.artifacts import ArtifactId, ArtifactInstance, VowType
        return ArtifactInstance(
            artifact_id=ArtifactId[data['artifact_id']],
            charges=data.get('charges', 1),
            used=data.get('used', False),
            floor_acquired=data.get('floor_acquired', 0),
            active_vow=VowType[data['active_vow']] if data.get('active_vow') else None,
            vow_broken=data.get('vow_broken', False),
        )

    def _deserialize_player(self, data: dict) -> Player:
        """Deserialize player from dictionary."""
        player = Player(data['x'], data['y'])
        player.health = data['health']
        player.max_health = data['max_health']
        player.attack_damage = data['attack_damage']
        player.base_attack = data.get('base_attack', data['attack_damage'])
        player.defense = data.get('defense', 0)
        player.level = data['level']
        player.xp = data['xp']
        player.xp_to_next_level = data['xp_to_next_level']
        player.kills = data['kills']

        # Restore inventory (filter out None for items that couldn't be restored)
        player.inventory.items = [item for item in (self._deserialize_item(item_data) for item_data in data['inventory']) if item is not None]

        # Restore equipped items
        if data.get('equipped_weapon'):
            player.equipped_weapon = self._deserialize_item(data['equipped_weapon'])
        if data.get('equipped_armor'):
            player.equipped_armor = self._deserialize_item(data['equipped_armor'])

        # v5.5: Restore artifacts
        player.artifacts = [self._deserialize_artifact(a) for a in data.get('artifacts', [])]
        player.duplicate_next_consumable = data.get('duplicate_next_consumable', False)
        player.guaranteed_rare_from_boss = data.get('guaranteed_rare_from_boss', False)

        return player

    def _serialize_enemy(self, enemy: Enemy) -> dict:
        """Serialize enemy to dictionary."""
        # Handle bosses which have enemy_type = None
        enemy_type_name = enemy.enemy_type.name if enemy.enemy_type else None
        return {
            'x': enemy.x,
            'y': enemy.y,
            'health': enemy.health,
            'max_health': enemy.max_health,
            'attack_damage': enemy.attack_damage,
            'is_elite': enemy.is_elite,
            'enemy_type': enemy_type_name,
            'is_boss': getattr(enemy, 'is_boss', False),
            'boss_type': getattr(enemy, 'boss_type', None).name if getattr(enemy, 'boss_type', None) else None,
            'name': enemy.name if hasattr(enemy, 'name') and enemy.name else None
        }

    def _deserialize_enemy(self, data: dict) -> Enemy:
        """Deserialize enemy from dictionary."""
        enemy_type_name = data.get('enemy_type')
        enemy_type = EnemyType[enemy_type_name] if enemy_type_name else None
        enemy = Enemy(data['x'], data['y'], enemy_type=enemy_type, is_elite=data.get('is_elite', False))
        enemy.health = data['health']
        enemy.max_health = data['max_health']
        enemy.attack_damage = data['attack_damage']

        # Restore boss if this was a boss
        if data.get('is_boss') and data.get('boss_type'):
            from ..core.constants import BossType
            boss_type = BossType[data['boss_type']]
            enemy.make_boss(boss_type)
            enemy.health = data['health']  # Re-apply health after make_boss

        return enemy

    def _serialize_item(self, item: Item) -> dict:
        """Serialize item to dictionary."""
        # Check if this is a lore item (has lore_id attribute)
        if hasattr(item, 'lore_id'):
            return {
                'x': item.x,
                'y': item.y,
                'item_type': item.item_type.name,
                'lore_id': item.lore_id,
                'name': item.name,
                'symbol': item.symbol
            }

        # Get the item type name by matching item name
        item_type_name = None
        for item_type in ItemType:
            # Skip lore types as they can't be created without lore_id
            if item_type in (ItemType.SCROLL_LORE, ItemType.BOOK):
                continue
            try:
                if item.name == create_item(item_type, 0, 0).name:
                    item_type_name = item_type.name
                    break
            except ValueError:
                continue

        return {
            'x': item.x,
            'y': item.y,
            'item_type': item_type_name,
            'name': item.name,
            'symbol': item.symbol
        }

    def _deserialize_item(self, data: dict) -> Item:
        """Deserialize item from dictionary."""
        item_type_name = data.get('item_type')
        if not item_type_name:
            return None

        try:
            item_type = ItemType[item_type_name]
        except KeyError:
            return None

        # Handle lore items specially - they need lore_id
        if item_type in (ItemType.SCROLL_LORE, ItemType.BOOK):
            lore_id = data.get('lore_id')
            if lore_id:
                return create_lore_item(lore_id, data['x'], data['y'])
            else:
                # Fallback: can't restore lore item without lore_id
                return None

        return create_item(item_type, data['x'], data['y'])

    def _serialize_dungeon(self, dungeon: Dungeon) -> dict:
        """Serialize dungeon to dictionary."""
        # Convert TileType enum values to strings for serialization
        tiles = [[tile.value for tile in row] for row in dungeon.tiles]

        return {
            'width': dungeon.width,
            'height': dungeon.height,
            'level': dungeon.level,
            'tiles': tiles,
            'explored': dungeon.explored,
            'visible': dungeon.visible,
            'stairs_up_pos': dungeon.stairs_up_pos,
            'stairs_down_pos': dungeon.stairs_down_pos,
            'has_stairs_up': dungeon.has_stairs_up
        }

    def _deserialize_dungeon(self, data: dict) -> Dungeon:
        """Deserialize dungeon from dictionary."""
        # Create empty dungeon (will override its generated content)
        dungeon = Dungeon(
            width=data['width'],
            height=data['height'],
            level=data['level'],
            has_stairs_up=data['has_stairs_up']
        )

        # Restore tiles by converting chars back to TileType enums
        dungeon.tiles = []
        for row in data['tiles']:
            tile_row = []
            for tile_char in row:
                for tile_type in TileType:
                    if tile_type.value == tile_char:
                        tile_row.append(tile_type)
                        break
            dungeon.tiles.append(tile_row)

        dungeon.explored = data['explored']
        dungeon.visible = data['visible']
        dungeon.stairs_up_pos = data['stairs_up_pos']
        dungeon.stairs_down_pos = data['stairs_down_pos']

        return dungeon
