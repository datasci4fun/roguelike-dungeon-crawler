/**
 * AssetViewer - Dev tool for viewing 3D assets and managing generation queue
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ASSET_QUEUE,
  getAssetStats,
  getQueuedByPriority,
  type Asset3D,
} from '../data/assetQueue';

type TabId = 'queue' | 'done' | 'all';
type CategoryFilter = 'all' | Asset3D['category'];

const CATEGORY_COLORS: Record<Asset3D['category'], string> = {
  enemy: '#ff6b6b',
  boss: '#cc5de8',
  item: '#ffd43b',
  prop: '#69db7c',
  character: '#74c0fc',
};

const STATUS_BADGES: Record<Asset3D['status'], { bg: string; text: string }> = {
  queued: { bg: '#495057', text: '#dee2e6' },
  generating: { bg: '#f59f00', text: '#1a1a1a' },
  done: { bg: '#37b24d', text: '#fff' },
  error: { bg: '#f03e3e', text: '#fff' },
};

const PRIORITY_STYLES: Record<Asset3D['priority'], { color: string; icon: string }> = {
  high: { color: '#ff6b6b', icon: '!!!' },
  medium: { color: '#ffd43b', icon: '!!' },
  low: { color: '#69db7c', icon: '!' },
};

export function AssetViewer() {
  const [tab, setTab] = useState<TabId>('queue');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset3D | null>(null);

  const stats = useMemo(() => getAssetStats(), []);

  const filteredAssets = useMemo(() => {
    let assets: Asset3D[];

    switch (tab) {
      case 'queue':
        assets = getQueuedByPriority();
        break;
      case 'done':
        assets = ASSET_QUEUE.filter(a => a.status === 'done');
        break;
      default:
        assets = ASSET_QUEUE;
    }

    if (category !== 'all') {
      assets = assets.filter(a => a.category === category);
    }

    return assets;
  }, [tab, category]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      color: '#e0e0e0',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 40px',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <Link to="/" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
            &larr; Home
          </Link>
          <h1 style={{ margin: '10px 0 0', color: '#fff' }}>3D Asset Viewer</h1>
          <p style={{ margin: '5px 0 0', color: '#888' }}>
            Dev tool for managing AI-generated 3D assets
          </p>
        </div>

        {/* Progress */}
        <div style={{
          textAlign: 'right',
          minWidth: '200px',
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4dabf7' }}>
            {stats.progress}%
          </div>
          <div style={{ fontSize: '14px', color: '#888' }}>
            {stats.done} / {stats.total} assets complete
          </div>
          <div style={{
            marginTop: '8px',
            height: '6px',
            background: '#333',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${stats.progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4dabf7, #37b24d)',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div style={{
        padding: '15px 40px',
        background: '#1f1f3a',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        borderBottom: '1px solid #333',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '5px' }}>
          {(['queue', 'done', 'all'] as TabId[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px',
                background: tab === t ? '#4dabf7' : 'transparent',
                color: tab === t ? '#fff' : '#888',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t}
              {t === 'queue' && ` (${stats.queued})`}
              {t === 'done' && ` (${stats.done})`}
            </button>
          ))}
        </div>

        <span style={{ color: '#444' }}>|</span>

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryFilter)}
          style={{
            padding: '8px 12px',
            background: '#2a2a4e',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '4px',
          }}
        >
          <option value="all">All Categories</option>
          <option value="enemy">Enemies</option>
          <option value="boss">Bosses</option>
          <option value="item">Items</option>
          <option value="prop">Props</option>
          <option value="character">Characters</option>
        </select>

        <div style={{ flex: 1 }} />

        {/* Generate Command */}
        <div style={{
          padding: '10px 15px',
          background: '#2a2a4e',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#69db7c',
        }}>
          python tools/3d-pipeline/generate_asset.py &lt;image&gt; --name &lt;id&gt;
        </div>
      </div>

      {/* Content */}
      <div style={{
        display: 'flex',
        padding: '20px 40px',
        gap: '30px',
      }}>
        {/* Asset List */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '15px',
          }}>
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                style={{
                  padding: '15px',
                  background: selectedAsset?.id === asset.id ? '#2a3a5e' : '#232340',
                  borderRadius: '8px',
                  border: `1px solid ${selectedAsset?.id === asset.id ? '#4dabf7' : '#333'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                }}>
                  <h3 style={{ margin: 0, color: '#fff' }}>{asset.name}</h3>
                  <span style={{
                    padding: '2px 8px',
                    background: STATUS_BADGES[asset.status].bg,
                    color: STATUS_BADGES[asset.status].text,
                    borderRadius: '4px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                  }}>
                    {asset.status}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    padding: '2px 8px',
                    background: CATEGORY_COLORS[asset.category] + '22',
                    color: CATEGORY_COLORS[asset.category],
                    borderRadius: '4px',
                    fontSize: '11px',
                    textTransform: 'capitalize',
                  }}>
                    {asset.category}
                  </span>

                  <span style={{
                    color: PRIORITY_STYLES[asset.priority].color,
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}>
                    {PRIORITY_STYLES[asset.priority].icon}
                  </span>

                  <span style={{ color: '#666', fontSize: '12px', fontFamily: 'monospace' }}>
                    {asset.id}
                  </span>
                </div>

                {asset.notes && (
                  <p style={{
                    margin: 0,
                    color: '#888',
                    fontSize: '13px',
                    lineHeight: '1.4',
                  }}>
                    {asset.notes}
                  </p>
                )}
              </div>
            ))}

            {filteredAssets.length === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                padding: '40px',
                textAlign: 'center',
                color: '#666',
              }}>
                No assets found
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{
          width: '350px',
          flexShrink: 0,
        }}>
          {selectedAsset ? (
            <div style={{
              background: '#232340',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #333',
            }}>
              <h2 style={{ margin: '0 0 15px', color: '#fff' }}>{selectedAsset.name}</h2>

              {/* Preview placeholder */}
              <div style={{
                height: '200px',
                background: '#1a1a2e',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '15px',
                border: '1px solid #333',
              }}>
                {selectedAsset.status === 'done' && selectedAsset.modelPath ? (
                  <span style={{ color: '#69db7c' }}>3D Preview Available</span>
                ) : (
                  <span style={{ color: '#666' }}>No 3D model yet</span>
                )}
              </div>

              {/* Details */}
              <table style={{ width: '100%', fontSize: '14px' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#888', padding: '5px 0' }}>ID</td>
                    <td style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedAsset.id}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#888', padding: '5px 0' }}>Category</td>
                    <td style={{ color: CATEGORY_COLORS[selectedAsset.category] }}>
                      {selectedAsset.category}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: '#888', padding: '5px 0' }}>Priority</td>
                    <td style={{ color: PRIORITY_STYLES[selectedAsset.priority].color }}>
                      {selectedAsset.priority}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: '#888', padding: '5px 0' }}>Status</td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        background: STATUS_BADGES[selectedAsset.status].bg,
                        color: STATUS_BADGES[selectedAsset.status].text,
                        borderRadius: '4px',
                        fontSize: '11px',
                      }}>
                        {selectedAsset.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {selectedAsset.notes && (
                <div style={{ marginTop: '15px' }}>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '5px' }}>Notes</div>
                  <p style={{ margin: 0, color: '#ccc', fontSize: '14px' }}>
                    {selectedAsset.notes}
                  </p>
                </div>
              )}

              {/* Generate command */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                  Generate Command
                </div>
                <div style={{
                  padding: '10px',
                  background: '#1a1a2e',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#69db7c',
                  wordBreak: 'break-all',
                }}>
                  python tools/3d-pipeline/generate_asset.py concept_art/{selectedAsset.id}.png --name {selectedAsset.id}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#232340',
              borderRadius: '8px',
              padding: '40px 20px',
              border: '1px solid #333',
              textAlign: 'center',
              color: '#666',
            }}>
              Select an asset to view details
            </div>
          )}

          {/* How to use */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#232340',
            borderRadius: '8px',
            border: '1px solid #333',
          }}>
            <h4 style={{ margin: '0 0 10px', color: '#fff', fontSize: '14px' }}>
              Workflow
            </h4>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#888', fontSize: '13px' }}>
              <li style={{ marginBottom: '8px' }}>
                Create concept art in <code style={{ color: '#69db7c' }}>concept_art/</code>
              </li>
              <li style={{ marginBottom: '8px' }}>
                Run generate command (see above)
              </li>
              <li style={{ marginBottom: '8px' }}>
                Convert OBJ to GLB in Blender
              </li>
              <li style={{ marginBottom: '8px' }}>
                Place in <code style={{ color: '#69db7c' }}>web/public/assets/models/</code>
              </li>
              <li>
                Update <code style={{ color: '#69db7c' }}>assetQueue.ts</code> status
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssetViewer;
