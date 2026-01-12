/**
 * FirstPersonDemo - Demo page to test FirstPersonRenderer without backend
 */
import { useState, useEffect } from 'react';
import { FirstPersonRenderer } from '../components/SceneRenderer';
import { Graphics3DErrorBoundary } from '../components/ErrorBoundary';
import type { FirstPersonView } from '../hooks/useGameSocket';

// Enemy types for demo
const ENEMY_TYPES = [
  { name: 'Goblin', symbol: 'g', maxHealth: 15 },
  { name: 'Orc', symbol: 'O', maxHealth: 30 },
  { name: 'Skeleton', symbol: 's', maxHealth: 20 },
  { name: 'Rat', symbol: 'r', maxHealth: 8 },
  { name: 'Bat', symbol: 'b', maxHealth: 6 },
  { name: 'Demon', symbol: 'd', maxHealth: 40 },
  { name: 'Zombie', symbol: 'z', maxHealth: 25 },
  { name: 'Troll', symbol: 't', maxHealth: 50 },
  { name: 'Dragon Boss', symbol: 'D', maxHealth: 100 },
];

// Item types for demo
const ITEM_TYPES = [
  { name: 'Health Potion', symbol: '!' },
  { name: 'Mana Potion', symbol: '!' },
  { name: 'Strength Potion', symbol: '!' },
  { name: 'Scroll of Fire', symbol: '?' },
  { name: 'Iron Sword', symbol: '/' },
  { name: 'Steel Shield', symbol: ']' },
  { name: 'Gold Ring', symbol: '=' },
  { name: 'Gold Coins', symbol: '$' },
  { name: 'Rusty Key', symbol: '*' },
  { name: 'Food Ration', symbol: '%' },
];

// Generate mock first-person view data
function generateMockView(facing: { dx: number; dy: number }, entityDensity: number = 0.5): FirstPersonView {
  const rows = [];
  const entities = [];
  const depth = 8;

  // Corridor width pattern - creates more realistic dungeon corridors
  // Options: 'corridor' (narrow), 'room' (wide), 'junction' (opening up)
  const sceneType = Math.random();
  const isCorridor = sceneType < 0.4;
  const isJunction = sceneType >= 0.4 && sceneType < 0.7;

  for (let d = 1; d <= depth; d++) {
    const row = [];

    // Calculate corridor width based on scene type
    let halfWidth: number;
    if (isCorridor) {
      // Narrow corridor - width of 1-2 tiles
      halfWidth = Math.min(2, Math.floor((3 * d) / depth) + 1);
    } else if (isJunction) {
      // Junction - starts narrow, gets wider
      halfWidth = Math.floor((4 * d) / depth) + 1;
    } else {
      // Room - wider from the start
      halfWidth = Math.floor((5 * d) / depth) + 2;
    }

    for (let w = -halfWidth; w <= halfWidth; w++) {
      // Corridor walls should be at edges
      const atEdge = Math.abs(w) === halfWidth;

      // Occasional pillars or obstacles in rooms
      const isPillar = !isCorridor && !atEdge && Math.random() < 0.08 && d > 2 && Math.abs(w) > 1;

      // Walls at edges and occasional pillars
      const isWall = atEdge || isPillar;

      // Doors - more likely in corridors at certain depths
      const isDoor = !isWall && Math.random() < (isCorridor ? 0.08 : 0.03) && d > 1 && d < depth;

      // Stairs at the back
      const isStairs = !isWall && !isDoor && d === depth && w === 0 && Math.random() < 0.3;

      let tile = '.';
      if (isWall) tile = '#';
      else if (isDoor) tile = 'D';
      else if (isStairs) tile = Math.random() < 0.5 ? '<' : '>';

      row.push({
        tile,
        x: w + 10,
        y: d + 10,
        visible: true,
        walkable: !isWall,
        has_entity: false,
      });
    }
    rows.push(row);
  }

  // Add enemies based on density
  const numEnemies = Math.floor(Math.random() * 3 * entityDensity) + (entityDensity > 0.3 ? 1 : 0);
  for (let i = 0; i < numEnemies; i++) {
    const enemyType = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const isElite = Math.random() < 0.2;
    entities.push({
      type: 'enemy' as const,
      name: enemyType.name,
      symbol: enemyType.symbol,
      distance: Math.floor(Math.random() * 5) + 1,
      offset: Math.floor(Math.random() * 5) - 2,
      x: 10 + i,
      y: 12 + i,
      health: Math.floor(Math.random() * enemyType.maxHealth * 0.5) + enemyType.maxHealth * 0.5,
      max_health: enemyType.maxHealth * (isElite ? 1.5 : 1),
      is_elite: isElite,
    });
  }

  // Add items based on density
  const numItems = Math.floor(Math.random() * 2 * entityDensity) + (entityDensity > 0.5 ? 1 : 0);
  for (let i = 0; i < numItems; i++) {
    const itemType = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    entities.push({
      type: 'item' as const,
      name: itemType.name,
      symbol: itemType.symbol,
      distance: Math.floor(Math.random() * 6) + 1,
      offset: Math.floor(Math.random() * 5) - 2,
      x: 9 + i,
      y: 11 + i,
    });
  }

  return {
    rows,
    entities,
    facing,
    depth,
  };
}

export function FirstPersonDemo() {
  const [facing, setFacing] = useState({ dx: 0, dy: 1 });
  const [entityDensity, setEntityDensity] = useState(0.7);
  const [view, setView] = useState<FirstPersonView>(() => generateMockView(facing, 0.7));
  const [autoRotate, setAutoRotate] = useState(false);

  // Regenerate view when facing changes
  useEffect(() => {
    setView(generateMockView(facing, entityDensity));
  }, [facing, entityDensity]);

  // Auto-rotate effect
  useEffect(() => {
    if (!autoRotate) return;

    const directions = [
      { dx: 0, dy: -1, name: 'North' },
      { dx: 1, dy: 0, name: 'East' },
      { dx: 0, dy: 1, name: 'South' },
      { dx: -1, dy: 0, name: 'West' },
    ];
    let idx = 0;

    const interval = setInterval(() => {
      idx = (idx + 1) % 4;
      setFacing(directions[idx]);
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRotate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        setFacing({ dx: 0, dy: -1 });
        break;
      case 'ArrowDown':
      case 's':
        setFacing({ dx: 0, dy: 1 });
        break;
      case 'ArrowLeft':
      case 'a':
        setFacing({ dx: -1, dy: 0 });
        break;
      case 'ArrowRight':
      case 'd':
        setFacing({ dx: 1, dy: 0 });
        break;
      case 'r':
        setView(generateMockView(facing, entityDensity));
        break;
    }
  };

  const getDirectionName = () => {
    if (facing.dy < 0) return 'North';
    if (facing.dy > 0) return 'South';
    if (facing.dx < 0) return 'West';
    if (facing.dx > 0) return 'East';
    return 'Unknown';
  };

  return (
    <div
      style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        minHeight: '100vh',
        color: '#eaeaea',
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <h1 style={{ marginBottom: '1rem', color: '#8be9fd' }}>
        First-Person Renderer Demo
      </h1>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              border: '2px solid #333',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            <Graphics3DErrorBoundary name="FirstPersonDemo">
              <FirstPersonRenderer
                view={view}
                width={500}
                height={400}
                enableAnimations={true}
              />
            </Graphics3DErrorBoundary>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#888' }}>
            <p>
              <strong>Facing:</strong> {getDirectionName()}
            </p>
            <p>
              <strong>Entities in view:</strong> {view.entities.length}
            </p>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '1.5rem',
            borderRadius: '8px',
            minWidth: '250px',
          }}
        >
          <h3 style={{ marginBottom: '1rem', color: '#50fa7b' }}>Controls</h3>

          <div style={{ marginBottom: '1rem' }}>
            <p style={{ marginBottom: '0.5rem' }}>Direction:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: '4px' }}>
              <div />
              <button
                onClick={() => setFacing({ dx: 0, dy: -1 })}
                style={buttonStyle(facing.dy < 0)}
              >
                N
              </button>
              <div />
              <button
                onClick={() => setFacing({ dx: -1, dy: 0 })}
                style={buttonStyle(facing.dx < 0)}
              >
                W
              </button>
              <div />
              <button
                onClick={() => setFacing({ dx: 1, dy: 0 })}
                style={buttonStyle(facing.dx > 0)}
              >
                E
              </button>
              <div />
              <button
                onClick={() => setFacing({ dx: 0, dy: 1 })}
                style={buttonStyle(facing.dy > 0)}
              >
                S
              </button>
              <div />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => setView(generateMockView(facing, entityDensity))}
              style={{
                ...buttonStyle(false),
                width: '100%',
                padding: '0.5rem',
              }}
            >
              Regenerate View (R)
            </button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Entity Density: {Math.round(entityDensity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={entityDensity * 100}
              onChange={(e) => setEntityDensity(Number(e.target.value) / 100)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
              />
              Auto-rotate
            </label>
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#666' }}>
            <p>Keyboard shortcuts:</p>
            <ul style={{ paddingLeft: '1rem', marginTop: '0.5rem' }}>
              <li>Arrow keys / WASD - Change direction</li>
              <li>R - Regenerate view</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function buttonStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.5rem',
    background: active ? '#50fa7b' : 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '4px',
    color: active ? '#1a1a2e' : '#eaeaea',
    cursor: 'pointer',
    fontWeight: active ? 'bold' : 'normal',
  };
}

export default FirstPersonDemo;
