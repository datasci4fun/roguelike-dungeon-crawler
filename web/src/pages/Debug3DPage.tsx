/**
 * Debug3DPage - Full-page Three.js debug view for tile inspection
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DebugScene3D } from '../components/SceneRenderer/DebugScene3D';
import { BIOMES, type BiomeId } from '../components/SceneRenderer/biomes';

export function Debug3DPage() {
  const [biome, setBiome] = useState<BiomeId>('dungeon');

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header controls */}
      <div style={{
        padding: '10px 20px',
        background: '#2a2a4e',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        borderBottom: '1px solid #444',
      }}>
        <Link
          to="/first-person-test"
          style={{ color: '#88f', textDecoration: 'none' }}
        >
          &larr; Back to Test Page
        </Link>

        <span style={{ color: '#fff' }}>|</span>

        <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Biome:
          <select
            value={biome}
            onChange={(e) => setBiome(e.target.value as BiomeId)}
            style={{
              padding: '5px 10px',
              background: '#3a3a5e',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
            }}
          >
            {Object.values(BIOMES).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>

        <span style={{ color: '#888', fontSize: '14px' }}>
          Free-fly camera for inspecting tile rendering
        </span>
      </div>

      {/* 3D View */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <DebugScene3D
          width={Math.min(1200, window.innerWidth - 40)}
          height={Math.min(800, window.innerHeight - 100)}
          biome={biome}
        />
      </div>
    </div>
  );
}

export default Debug3DPage;
