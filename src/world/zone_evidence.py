"""Zone evidence configuration for dungeon floors.

Evidence types:
- trail_tells: Boss approach trail markers
- lore_markers: Pre-boss lore spots
- evidence_props: Key zone evidence props
- key_lore_zones: Zone IDs that get evidence props
"""


def get_evidence_config(level: int) -> dict:
    """Get zone evidence configuration for a dungeon level.

    Returns config with:
    - trail_tells: List of (char, color) for boss approach trail markers
    - lore_markers: List of (char, color) for pre-boss lore spots
    - evidence_props: List of (char, color) for key zone evidence
    - key_lore_zones: List of zone IDs that get evidence props
    """
    # Floor 1 - Stone Dungeon (Prison theme)
    if level == 1:
        return {
            "trail_tells": [
                (".", 3),   # Blood droplet (red)
                (",", 3),   # Blood smear (red)
                ("~", 8),   # Drag marks (dark gray)
            ],
            "lore_markers": [
                ("?", 4),   # Document scrap (yellow)
                ("!", 4),   # Notice (yellow)
            ],
            "evidence_props": [
                ("=", 8),   # Broken shackle (gray)
                ("?", 4),   # Document (yellow)
                ("+", 7),   # Key fragment (white)
            ],
            "key_lore_zones": ["wardens_office", "record_vaults"],
        }

    # Floor 2 - Sewers (Plague/rats theme)
    elif level == 2:
        return {
            "trail_tells": [
                (".", 2),   # Rat droppings (green)
                (",", 2),   # Gnaw marks (green)
                ("~", 5),   # Slime trail (cyan)
            ],
            "lore_markers": [
                ("?", 4),   # Waterlogged note (yellow)
                ("$", 4),   # Coin (yellow)
            ],
            "evidence_props": [
                ("?", 4),   # Document (yellow)
                ("&", 8),   # Debris (gray)
                ("=", 8),   # Pipe fragment (gray)
            ],
            "key_lore_zones": ["colony_heart", "seal_drifts"],
        }

    # Floor 3 - Forest Depths (Nature/spider theme)
    elif level == 3:
        return {
            "trail_tells": [
                ("%", 7),   # Bone fragment (white)
                (",", 8),   # Claw marks (gray)
                ("~", 7),   # Webbing strand (white)
            ],
            "lore_markers": [
                ("?", 4),   # Bark etching (yellow)
                ("*", 2),   # Glowing moss (green)
            ],
            "evidence_props": [
                ("*", 2),   # Ritual herb (green)
                ("?", 4),   # Scroll (yellow)
                ("o", 7),   # Egg sac (white)
            ],
            "key_lore_zones": ["druid_ring", "nursery"],
        }

    # Floor 4 - Mirror Valdris (Ruined palace theme)
    elif level == 4:
        return {
            "trail_tells": [
                (".", 3),   # Blood (red)
                (",", 8),   # Ash (gray)
                ("~", 5),   # Ghostly residue (cyan)
            ],
            "lore_markers": [
                ("?", 4),   # Decree fragment (yellow)
                ("!", 6),   # Warning sigil (magenta)
            ],
            "evidence_props": [
                ("?", 4),   # Historical record (yellow)
                ("=", 4),   # Seal fragment (yellow)
                ("+", 7),   # Broken crest (white)
            ],
            "key_lore_zones": ["oath_chambers", "seal_chambers", "record_vaults"],
        }

    # Floor 5 - Ice Cavern (Frozen laboratory theme)
    elif level == 5:
        return {
            "trail_tells": [
                ("*", 5),   # Ice crystals (cyan)
                (",", 7),   # Frost marks (white)
                ("~", 5),   # Frozen breath (cyan)
            ],
            "lore_markers": [
                ("?", 4),   # Frozen note (yellow)
                ("!", 5),   # Ice warning sigil (cyan)
            ],
            "evidence_props": [
                ("=", 5),   # Frozen experiment (cyan)
                ("?", 4),   # Research notes (yellow)
                ("o", 7),   # Frozen specimen (white)
            ],
            "key_lore_zones": ["suspended_laboratories", "thaw_fault", "breathing_chamber"],
        }

    # Floor 6 - Ancient Library (Scholar/arcane theme)
    elif level == 6:
        return {
            "trail_tells": [
                (".", 4),   # Ink drops (yellow)
                (",", 8),   # Page scraps (gray)
                ("~", 6),   # Arcane residue (magenta)
            ],
            "lore_markers": [
                ("?", 4),   # Bookmark (yellow)
                ("!", 6),   # Arcane warning (magenta)
            ],
            "evidence_props": [
                ("?", 4),   # Scroll (yellow)
                ("=", 8),   # Broken shelf (gray)
                ("+", 6),   # Ritual focus (magenta)
            ],
            "key_lore_zones": ["indexing_heart", "catalog_chambers"],
        }

    # Floor 7 - Volcanic Depths (Forge/fire theme)
    elif level == 7:
        return {
            "trail_tells": [
                (".", 3),   # Slag drips (red)
                (",", 4),   # Ember marks (yellow)
                ("~", 3),   # Heat shimmer (red)
            ],
            "lore_markers": [
                ("?", 4),   # Scorched tablet (yellow)
                ("!", 3),   # Fire warning (red)
            ],
            "evidence_props": [
                ("=", 8),   # Forged rune (gray)
                ("?", 4),   # Smith's notes (yellow)
                ("+", 3),   # Molten offering (red)
            ],
            "key_lore_zones": ["crucible_heart", "rune_press"],
        }

    # Floor 8 - Crystal Cave / Dragon's Lair
    elif level == 8:
        return {
            "trail_tells": [
                ("*", 6),   # Crystal shards (magenta)
                (",", 4),   # Gold dust (yellow)
                ("~", 7),   # Scale residue (white)
            ],
            "lore_markers": [
                ("?", 4),   # Ancient pact (yellow)
                ("!", 3),   # Dragon mark (red)
            ],
            "evidence_props": [
                ("$", 4),   # Gold coin (yellow)
                ("*", 6),   # Binding crystal (magenta)
                ("+", 7),   # Dragon scale (white)
            ],
            "key_lore_zones": ["dragons_hoard", "oath_interface", "vault_antechamber"],
        }

    # Fallback for unknown floors
    return {}
