/**
 * FirstPersonDemo - Demo page to test FirstPersonRenderer without backend
 */
import { useState, useEffect } from 'react';
import { FirstPersonRenderer } from '../components/SceneRenderer';
import type { FirstPersonView } from '../hooks/useGameSocket';

// Generate mock first-person view data
function generateMockView(facing: { dx: number; dy: number }): FirstPersonView {
  const rows = [];
  const entities = [];
  const depth = 8;

  for (let d = 1; d <= depth; d++) {
    const row = [];
    const halfWidth = Math.floor((5 * d) / depth) + 1;

    for (let w = -halfWidth; w <= halfWidth; w++) {
      // Random tile generation
      const isWall = Math.abs(w) === halfWidth || (Math.random() < 0.15 && d > 2);
      const isDoor = !isWall && Math.random() < 0.05;
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

  // Add some enemies
  if (Math.random() < 0.7) {
    entities.push({
      type: 'enemy' as const,
      name: 'Goblin',
      symbol: 'g',
      distance: Math.floor(Math.random() * 4) + 2,
      offset: Math.floor(Math.random() * 3) - 1,
      x: 10,
      y: 12,
      health: Math.floor(Math.random() * 10) + 5,
      max_health: 15,
      is_elite: false,
    });
  }

  if (Math.random() < 0.4) {
    entities.push({
      type: 'enemy' as const,
      name: 'Orc',
      symbol: 'O',
      distance: Math.floor(Math.random() * 3) + 3,
      offset: Math.floor(Math.random() * 5) - 2,
      x: 11,
      y: 14,
      health: Math.floor(Math.random() * 20) + 10,
      max_health: 30,
      is_elite: Math.random() < 0.3,
    });
  }

  // Add items
  if (Math.random() < 0.5) {
    entities.push({
      type: 'item' as const,
      name: 'Health Potion',
      symbol: '!',
      distance: Math.floor(Math.random() * 5) + 1,
      offset: Math.floor(Math.random() * 3) - 1,
      x: 9,
      y: 11,
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
  const [view, setView] = useState<FirstPersonView>(() => generateMockView(facing));
  const [autoRotate, setAutoRotate] = useState(false);

  // Regenerate view when facing changes
  useEffect(() => {
    setView(generateMockView(facing));
  }, [facing]);

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
        setView(generateMockView(facing));
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
            <FirstPersonRenderer
              view={view}
              width={500}
              height={400}
              enableAnimations={true}
            />
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
              onClick={() => setView(generateMockView(facing))}
              style={{
                ...buttonStyle(false),
                width: '100%',
                padding: '0.5rem',
              }}
            >
              Regenerate View (R)
            </button>
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
