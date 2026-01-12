/**
 * Features Page - Showcase the game's unique elements
 *
 * Designed to entice players with:
 * - Visual feature breakdowns
 * - Gameplay highlights
 * - Lore integration
 * - Clear calls to action
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AtmosphericPage } from '../components/AtmosphericPage';
import { PhosphorHeader } from '../components/PhosphorHeader';
import { FLOOR_DESCRIPTIONS, RACE_LORE, CLASS_LORE } from '../data/loreSkyfall';
import './Features.css';

// Feature highlights with icons and descriptions
const CORE_FEATURES = [
  {
    icon: '🗺️',
    title: 'Procedural Dungeons',
    description: 'No two descents are alike. Each run generates a unique dungeon layout with randomized rooms, corridors, and secret passages.',
    detail: 'BSP algorithm ensures balanced exploration with strategic chokepoints and hidden treasures.',
  },
  {
    icon: '⚔️',
    title: 'Tactical Combat',
    description: 'Position matters. Flank enemies, use terrain, and time your abilities for devastating combos.',
    detail: 'Turn-based battles reward careful planning over button mashing.',
  },
  {
    icon: '👁️',
    title: 'First-Person Exploration',
    description: 'Experience the dungeon through your character\'s eyes. Every shadow could hide danger—or treasure.',
    detail: 'Immersive 3D rendering with dynamic lighting and atmospheric fog.',
  },
  {
    icon: '💀',
    title: 'Meaningful Permadeath',
    description: 'Death is not the end—it\'s a legacy. Your fallen heroes become Ghosts that haunt future runs.',
    detail: 'Encounter echoes of your past selves, or challenge the ghosts of other players.',
  },
  {
    icon: '🎵',
    title: 'Adaptive Soundtrack',
    description: '16 unique tracks that shift based on your situation. Tension builds as danger approaches.',
    detail: 'Procedural sound effects create an ever-changing audio landscape.',
  },
  {
    icon: '📜',
    title: 'Deep Lore',
    description: 'Uncover the mystery of the Skyfall Seed. Piece together the truth from scattered fragments.',
    detail: '32 lore entries hidden across 8 floors—journals, evidence, and dark revelations.',
  },
];

// Achievement categories
const ACHIEVEMENT_CATEGORIES = [
  { name: 'Combat', count: 11, icon: '⚔️', examples: ['First Blood', 'Dragon Slayer', 'Kingslayer'] },
  { name: 'Progression', count: 6, icon: '📈', examples: ['Champion', 'Deep Delver', 'Mighty Hero'] },
  { name: 'Efficiency', count: 7, icon: '⚡', examples: ['Speedrunner', 'Untouchable', 'Purist'] },
  { name: 'Collection', count: 4, icon: '💎', examples: ['Treasure Hunter', 'Collector', 'Hoarder'] },
  { name: 'Special', count: 5, icon: '✨', examples: ['Comeback King', 'High Roller', '???'] },
];

// Ending types
const ENDINGS = {
  death: {
    title: 'Death Fates',
    description: 'When you fall, the Field claims you in one of three ways:',
    variants: [
      { name: 'Echo', icon: '👻', desc: 'Your path loops endlessly, trapped in your final moments' },
      { name: 'Hollowed', icon: '💀', desc: 'Your rage lingers, hollow and purposeless' },
      { name: 'Silence', icon: '🕯️', desc: 'Your absence echoes through the dungeon' },
    ],
  },
  victory: {
    title: 'Victory Legacies',
    description: 'Defeat the Dragon Emperor and your legend takes shape:',
    variants: [
      { name: 'Beacon', icon: '✦', desc: 'A light for those who follow—balanced mastery' },
      { name: 'Champion', icon: '⚔️', desc: 'Your strength inspires—combat supremacy' },
      { name: 'Archivist', icon: '📜', desc: 'Your knowledge persists—lore collector' },
    ],
  },
};

// Combat abilities showcase
const COMBAT_HIGHLIGHTS = [
  { name: 'Power Strike', class: 'Warrior', effect: 'Deal 150% damage with knockback' },
  { name: 'Fireball', class: 'Mage', effect: 'AoE damage that ignites enemies' },
  { name: 'Backstab', class: 'Rogue', effect: 'Triple damage from behind' },
  { name: 'Divine Shield', class: 'Cleric', effect: 'Block all damage for 2 turns' },
];

// Race/Class data for showcase
const RACES = [
  { id: 'HUMAN', name: 'Human', trait: 'Adaptability', bonus: '+1 to all stats' },
  { id: 'ELF', name: 'Elf', trait: 'Eagle Eye', bonus: '+2 ATK, extended vision' },
  { id: 'DWARF', name: 'Dwarf', trait: 'Stone Blood', bonus: '+3 DEF, poison resist' },
  { id: 'HALFLING', name: 'Halfling', trait: 'Lucky', bonus: 'Critical hit chance' },
  { id: 'ORC', name: 'Orc', trait: 'Berserker', bonus: '+5 HP, damage when low' },
];

const CLASSES = [
  { id: 'WARRIOR', name: 'Warrior', role: 'Front-line fighter', symbol: '⚔️' },
  { id: 'MAGE', name: 'Mage', role: 'Arcane devastator', symbol: '✧' },
  { id: 'ROGUE', name: 'Rogue', role: 'Shadow striker', symbol: '◆' },
  { id: 'CLERIC', name: 'Cleric', role: 'Divine protector', symbol: '✚' },
];

export function Features() {
  const { isAuthenticated } = useAuth();

  return (
    <AtmosphericPage
      backgroundType="underground"
      particles={{ type: 'dust', count: 20, speed: 'slow', opacity: 0.15 }}
      crt={true}
      crtIntensity="light"
    >
      <div className="features-page">
        {/* Hero Section */}
        <section className="features-hero">
          <PhosphorHeader
            title="DISCOVER THE DEPTHS"
            subtitle="A roguelike experience unlike any other"
            style="dramatic"
            delay={100}
          />
          <p className="hero-tagline">
            Descend into a reality-warping dungeon where every choice matters,
            every death leaves a mark, and the truth lies buried beneath eight
            floors of corrupted existence.
          </p>
        </section>

        {/* Core Features Grid */}
        <section className="features-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            Core Features
            <span className="title-decoration">═══</span>
          </h2>
          <div className="features-grid">
            {CORE_FEATURES.map((feature, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
                <p className="feature-detail">{feature.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The Descent - Floor Showcase */}
        <section className="features-section descent-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            Eight Floors of Terror
            <span className="title-decoration">═══</span>
          </h2>
          <p className="section-intro">
            Each floor is a pocket of corrupted reality, guarded by a powerful Warden.
            Master one biome before facing the next—or be consumed by the Field.
          </p>
          <div className="floors-showcase">
            {FLOOR_DESCRIPTIONS.map((floor) => (
              <div key={floor.floor} className={`floor-card floor-${floor.floor}`}>
                <div className="floor-number">F{floor.floor}</div>
                <div className="floor-info">
                  <h3 className="floor-name">{floor.name}</h3>
                  <span className="floor-aspect">{floor.aspect}</span>
                  <p className="floor-hint">{floor.hint}</p>
                  <div className="floor-warden">
                    <span className="warden-label">Warden:</span>
                    <span className="warden-name">{floor.warden}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Combat System */}
        <section className="features-section combat-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            Tactical Combat
            <span className="title-decoration">═══</span>
          </h2>
          <div className="combat-layout">
            <div className="combat-description">
              <p>
                Combat in the dungeon is deliberate and deadly. Each turn, you must
                consider positioning, ability cooldowns, and enemy patterns.
              </p>
              <ul className="combat-features">
                <li><span className="bullet">◈</span> Turn-based tactical battles on a grid</li>
                <li><span className="bullet">◈</span> Position-based damage bonuses</li>
                <li><span className="bullet">◈</span> Unique abilities per class</li>
                <li><span className="bullet">◈</span> Environmental hazards to exploit</li>
                <li><span className="bullet">◈</span> Boss fights with special mechanics</li>
              </ul>
            </div>
            <div className="abilities-showcase">
              <h3>Signature Abilities</h3>
              {COMBAT_HIGHLIGHTS.map((ability, i) => (
                <div key={i} className="ability-card">
                  <span className="ability-name">{ability.name}</span>
                  <span className="ability-class">{ability.class}</span>
                  <span className="ability-effect">{ability.effect}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Character Creation */}
        <section className="features-section characters-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            Forge Your Legend
            <span className="title-decoration">═══</span>
          </h2>
          <div className="characters-layout">
            <div className="races-showcase">
              <h3>Five Races</h3>
              <p className="showcase-intro">Each race has a unique relationship with the Field</p>
              {RACES.map((race) => (
                <div key={race.id} className="race-card">
                  <div className="race-header">
                    <span className="race-name">{race.name}</span>
                    <span className="race-trait">{race.trait}</span>
                  </div>
                  <p className="race-bonus">{race.bonus}</p>
                  <p className="race-lore">{RACE_LORE[race.id]}</p>
                </div>
              ))}
            </div>
            <div className="classes-showcase">
              <h3>Four Classes</h3>
              <p className="showcase-intro">Master a playstyle that suits your approach</p>
              {CLASSES.map((cls) => (
                <div key={cls.id} className="class-card">
                  <div className="class-symbol">{cls.symbol}</div>
                  <div className="class-info">
                    <span className="class-name">{cls.name}</span>
                    <span className="class-role">{cls.role}</span>
                  </div>
                  <p className="class-lore">{CLASS_LORE[cls.id]}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ghost System */}
        <section className="features-section ghost-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            Death Is Not The End
            <span className="title-decoration">═══</span>
          </h2>
          <div className="ghost-content">
            <div className="ghost-description">
              <p className="ghost-intro">
                When you fall in the dungeon, your character becomes a <strong>Ghost</strong>—an
                echo trapped in the Field's memory. These spirits persist across runs,
                creating a living history of your failures and triumphs.
              </p>
              <div className="ghost-types">
                <div className="ghost-type">
                  <h4>☠ Echoes</h4>
                  <p>Fallen heroes replay their final moments. Encounter them for loot drops or mercy kills.</p>
                </div>
                <div className="ghost-type">
                  <h4>👻 Hollowed</h4>
                  <p>Players who died with unfinished business. Help them—or harvest their essence.</p>
                </div>
                <div className="ghost-type">
                  <h4>✦ Beacons</h4>
                  <p>Victorious players leave Imprints. Their blessing grants temporary power.</p>
                </div>
              </div>
            </div>
            <div className="ghost-features">
              <h3>Ghost Features</h3>
              <ul>
                <li><span className="bullet">◈</span> Encounter ghosts of other players</li>
                <li><span className="bullet">◈</span> Watch replay recordings of deaths</li>
                <li><span className="bullet">◈</span> Leave messages for future explorers</li>
                <li><span className="bullet">◈</span> Build a legacy across multiple runs</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Achievements Section */}
        <section className="features-section achievements-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            33 Achievements to Unlock
            <span className="title-decoration">═══</span>
          </h2>
          <p className="section-intro">
            From your first kill to conquering the Dragon Emperor, every milestone is remembered.
            Hunt rare achievements, compete on leaderboards, and prove your mastery.
          </p>
          <div className="achievements-grid">
            {ACHIEVEMENT_CATEGORIES.map((cat) => (
              <div key={cat.name} className="achievement-category">
                <div className="category-header">
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-name">{cat.name}</span>
                  <span className="category-count">{cat.count}</span>
                </div>
                <div className="category-examples">
                  {cat.examples.map((ex, i) => (
                    <span key={i} className="example-achievement">{ex}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="achievements-rarity">
            <h3>Rarity Tiers</h3>
            <div className="rarity-tiers">
              <span className="rarity common">Common</span>
              <span className="rarity rare">Rare</span>
              <span className="rarity epic">Epic</span>
              <span className="rarity legendary">Legendary</span>
            </div>
          </div>
        </section>

        {/* Lore Codex Section */}
        <section className="features-section codex-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            The Lore Codex
            <span className="title-decoration">═══</span>
          </h2>
          <div className="codex-content">
            <div className="codex-description">
              <p className="codex-intro">
                Scattered throughout the dungeon are <strong>32 lore fragments</strong>—journals
                of the lost, evidence of reality's decay, and secrets of the Skyfall Seed.
                Collect them all to piece together the truth.
              </p>
              <div className="codex-types">
                <div className="codex-type">
                  <h4>📜 Journals & Notes</h4>
                  <p>Personal accounts from those who descended before you. Their warnings may save your life.</p>
                </div>
                <div className="codex-type">
                  <h4>🔍 Evidence</h4>
                  <p>Environmental discoveries—plaques, seals, and anomalies that reveal the Field's influence.</p>
                </div>
                <div className="codex-type">
                  <h4>📖 Research</h4>
                  <p>Academic studies of the phenomenon. Cold analysis of impossible events.</p>
                </div>
              </div>
            </div>
            <div className="codex-preview">
              <h3>Entries Per Floor</h3>
              <div className="floor-entries">
                {FLOOR_DESCRIPTIONS.slice(0, 4).map((floor) => (
                  <div key={floor.floor} className="floor-entry-row">
                    <span className="floor-label">F{floor.floor}</span>
                    <span className="floor-name-small">{floor.name}</span>
                    <span className="entry-count">4 entries</span>
                  </div>
                ))}
                <div className="floor-entry-row more">
                  <span>+ 4 more floors...</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multiple Endings Section */}
        <section className="features-section endings-section">
          <h2 className="section-title">
            <span className="title-decoration">═══</span>
            Your Story, Your Ending
            <span className="title-decoration">═══</span>
          </h2>
          <p className="section-intro">
            How you play determines how you're remembered. Six distinct endings await,
            shaped by your choices, your kills, and the lore you uncover.
          </p>
          <div className="endings-layout">
            <div className="ending-group death-endings">
              <h3>{ENDINGS.death.title}</h3>
              <p className="ending-group-desc">{ENDINGS.death.description}</p>
              <div className="ending-variants">
                {ENDINGS.death.variants.map((variant) => (
                  <div key={variant.name} className="ending-variant death">
                    <span className="variant-icon">{variant.icon}</span>
                    <div className="variant-info">
                      <span className="variant-name">{variant.name}</span>
                      <span className="variant-desc">{variant.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ending-group victory-endings">
              <h3>{ENDINGS.victory.title}</h3>
              <p className="ending-group-desc">{ENDINGS.victory.description}</p>
              <div className="ending-variants">
                {ENDINGS.victory.variants.map((variant) => (
                  <div key={variant.name} className="ending-variant victory">
                    <span className="variant-icon">{variant.icon}</span>
                    <div className="variant-info">
                      <span className="variant-name">{variant.name}</span>
                      <span className="variant-desc">{variant.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="secret-ending-tease">
            <span className="secret-icon">❓</span>
            <span className="secret-text">Rumors speak of a hidden ending for those who uncover everything...</span>
          </div>
        </section>

        {/* Final CTA */}
        <section className="features-cta">
          <div className="cta-content">
            <h2>Ready to Face the Field?</h2>
            <p>
              The Skyfall Seed waits beneath Valdris. Your loved ones are starting
              to forget you. Will you descend before it's too late?
            </p>
            <div className="cta-buttons">
              {isAuthenticated ? (
                <Link to="/character-creation" className="cta-button primary">
                  Begin Your Descent
                </Link>
              ) : (
                <>
                  <Link to="/register" className="cta-button primary">
                    Create Your Legend
                  </Link>
                  <Link to="/login" className="cta-button secondary">
                    Resume Descent
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </AtmosphericPage>
  );
}
