/**
 * AssetViewer - Dev tool for viewing 3D assets and managing generation queue
 */

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  ASSET_QUEUE,
  getAssetStats,
  getQueuedByPriority,
  type Asset3D,
} from '../data/assetQueue';
import { ModelViewer } from '../components/ModelViewer';
import { ProceduralModelViewer } from '../components/ProceduralModelViewer';
import { useJobs } from '../contexts/JobsContext';
import {
  MODEL_LIBRARY,
  type ModelDefinition,
  type ModelCategory,
} from '../models';

const API_BASE = 'http://localhost:8000';

type TabId = 'queue' | 'done' | 'all' | 'procedural';
type CategoryFilter = 'all' | Asset3D['category'];
type ProceduralCategoryFilter = 'all' | ModelCategory;

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

const PROCEDURAL_CATEGORY_COLORS: Record<ModelCategory, string> = {
  structure: '#4dabf7',
  furniture: '#f59f00',
  decoration: '#cc5de8',
  interactive: '#69db7c',
  prop: '#868e96',
};

export function AssetViewer() {
  const [tab, setTab] = useState<TabId>('queue');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [proceduralCategory, setProceduralCategory] = useState<ProceduralCategoryFilter>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset3D | null>(null);
  const [selectedProcedural, setSelectedProcedural] = useState<ModelDefinition | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use global jobs context
  const { jobs, createJob, isLoading: generating } = useJobs();

  // Find active job for selected asset
  const currentJob = selectedAsset
    ? jobs.find(j => j.asset_id === selectedAsset.id && (j.status === 'pending' || j.status === 'processing'))
    : null;

  const stats = useMemo(() => getAssetStats(), []);

  const filteredProceduralModels = useMemo(() => {
    if (proceduralCategory === 'all') {
      return MODEL_LIBRARY;
    }
    return MODEL_LIBRARY.filter((m) => m.category === proceduralCategory);
  }, [proceduralCategory]);

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

  // Handle escape key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreen]);

  // Clear messages when selecting a different asset
  useEffect(() => {
    setUploadError(null);
    setUploadSuccess(null);
    setGenerateError(null);
  }, [selectedAsset?.id]);

  // Handle file upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAsset) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${API_BASE}/api/assets/concept-art/${selectedAsset.id}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }

      const result = await response.json();
      setUploadSuccess(`Uploaded ${result.filename} (${(result.size / 1024).toFixed(1)} KB)`);

      // Update the asset's sourceImage in the local state
      if (selectedAsset) {
        selectedAsset.sourceImage = result.path;
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle generate model request
  const handleGenerateClick = async () => {
    if (!selectedAsset) return;

    setGenerateError(null);

    const job = await createJob(selectedAsset.id);
    if (!job) {
      setGenerateError('Failed to create job');
    }
    // Job tracking is handled globally by JobsContext
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      color: '#e0e0e0',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

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
              onClick={() => { setTab(t); setSelectedProcedural(null); }}
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
          <span style={{ color: '#444', margin: '0 5px' }}>|</span>
          <button
            onClick={() => { setTab('procedural'); setSelectedAsset(null); }}
            style={{
              padding: '8px 16px',
              background: tab === 'procedural' ? '#cc5de8' : 'transparent',
              color: tab === 'procedural' ? '#fff' : '#888',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Procedural ({MODEL_LIBRARY.length})
          </button>
        </div>

        <span style={{ color: '#444' }}>|</span>

        {/* Category Filter */}
        {tab === 'procedural' ? (
          <select
            value={proceduralCategory}
            onChange={(e) => setProceduralCategory(e.target.value as ProceduralCategoryFilter)}
            style={{
              padding: '8px 12px',
              background: '#2a2a4e',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '4px',
            }}
          >
            <option value="all">All Categories</option>
            <option value="structure">Structure</option>
            <option value="furniture">Furniture</option>
            <option value="decoration">Decoration</option>
            <option value="interactive">Interactive</option>
            <option value="prop">Props</option>
          </select>
        ) : (
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
        )}

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
        {/* Asset/Model List */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '15px',
          }}>
            {tab === 'procedural' ? (
              /* Procedural Models List */
              <>
                {filteredProceduralModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => setSelectedProcedural(model)}
                    style={{
                      padding: '15px',
                      background: selectedProcedural?.id === model.id ? '#3a2a5e' : '#232340',
                      borderRadius: '8px',
                      border: `1px solid ${selectedProcedural?.id === model.id ? '#cc5de8' : '#333'}`,
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
                      <h3 style={{ margin: 0, color: '#fff' }}>{model.name}</h3>
                      <span style={{
                        padding: '2px 8px',
                        background: '#cc5de822',
                        color: '#cc5de8',
                        borderRadius: '4px',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                      }}>
                        Procedural
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
                        background: PROCEDURAL_CATEGORY_COLORS[model.category] + '22',
                        color: PROCEDURAL_CATEGORY_COLORS[model.category],
                        borderRadius: '4px',
                        fontSize: '11px',
                        textTransform: 'capitalize',
                      }}>
                        {model.category}
                      </span>

                      <span style={{ color: '#666', fontSize: '12px', fontFamily: 'monospace' }}>
                        {model.id}
                      </span>
                    </div>

                    <p style={{
                      margin: 0,
                      color: '#888',
                      fontSize: '13px',
                      lineHeight: '1.4',
                    }}>
                      {model.description}
                    </p>

                    {model.tags.length > 0 && (
                      <div style={{
                        marginTop: '8px',
                        display: 'flex',
                        gap: '4px',
                        flexWrap: 'wrap',
                      }}>
                        {model.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              padding: '1px 6px',
                              background: '#333',
                              borderRadius: '3px',
                              fontSize: '10px',
                              color: '#888',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {model.tags.length > 4 && (
                          <span style={{ fontSize: '10px', color: '#666' }}>
                            +{model.tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {filteredProceduralModels.length === 0 && (
                  <div style={{
                    gridColumn: '1 / -1',
                    padding: '40px',
                    textAlign: 'center',
                    color: '#666',
                  }}>
                    No procedural models found
                  </div>
                )}
              </>
            ) : (
              /* Asset Queue List */
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{
          width: '350px',
          flexShrink: 0,
        }}>
          {/* Procedural Model Detail */}
          {tab === 'procedural' && selectedProcedural ? (
            <div style={{
              background: '#232340',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #333',
            }}>
              <h2 style={{ margin: '0 0 15px', color: '#fff' }}>{selectedProcedural.name}</h2>

              {/* 3D Preview */}
              <div style={{
                height: '250px',
                background: '#1a1a2e',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '15px',
                border: '1px solid #333',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <Suspense fallback={<span style={{ color: '#888' }}>Loading model...</span>}>
                  <ProceduralModelViewer
                    createModel={selectedProcedural.create}
                    modelId={selectedProcedural.id}
                    width={310}
                    height={250}
                  />
                </Suspense>
                <button
                  onClick={() => setFullscreen(true)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '6px 10px',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                  title="View fullscreen"
                >
                  ⛶ Fullscreen
                </button>
              </div>

              {/* Details */}
              <table style={{ width: '100%', fontSize: '14px' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#888', padding: '5px 0' }}>ID</td>
                    <td style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedProcedural.id}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#888', padding: '5px 0' }}>Category</td>
                    <td style={{ color: PROCEDURAL_CATEGORY_COLORS[selectedProcedural.category] }}>
                      {selectedProcedural.category}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: '#888', padding: '5px 0' }}>Scale</td>
                    <td style={{ color: '#fff' }}>{selectedProcedural.defaultScale}x</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#888', padding: '5px 0' }}>Bounding Box</td>
                    <td style={{ color: '#fff', fontFamily: 'monospace', fontSize: '12px' }}>
                      {selectedProcedural.boundingBox.x.toFixed(2)} x {selectedProcedural.boundingBox.y.toFixed(2)} x {selectedProcedural.boundingBox.z.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '15px' }}>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '5px' }}>Description</div>
                <p style={{ margin: 0, color: '#ccc', fontSize: '14px' }}>
                  {selectedProcedural.description}
                </p>
              </div>

              {selectedProcedural.tags.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>Tags</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedProcedural.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '3px 8px',
                          background: '#333',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#aaa',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage code */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                  Usage
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
                  {`import { create${selectedProcedural.id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')} } from '../models';`}
                </div>
              </div>
            </div>
          ) : tab === 'procedural' ? (
            <div style={{
              background: '#232340',
              borderRadius: '8px',
              padding: '40px 20px',
              border: '1px solid #333',
              textAlign: 'center',
              color: '#666',
            }}>
              Select a procedural model to view details
            </div>
          ) : selectedAsset ? (
            <div style={{
              background: '#232340',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #333',
            }}>
              <h2 style={{ margin: '0 0 15px', color: '#fff' }}>{selectedAsset.name}</h2>

              {/* 3D Preview */}
              <div style={{
                height: '250px',
                background: '#1a1a2e',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '15px',
                border: '1px solid #333',
                overflow: 'hidden',
                position: 'relative',
              }}>
                {selectedAsset.status === 'done' && selectedAsset.modelPath ? (
                  <>
                    <Suspense fallback={<span style={{ color: '#888' }}>Loading model...</span>}>
                      <ModelViewer
                        modelPath={selectedAsset.modelPath}
                        width={310}
                        height={250}
                      />
                    </Suspense>
                    <button
                      onClick={() => setFullscreen(true)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        padding: '6px 10px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                      title="View fullscreen"
                    >
                      ⛶ Fullscreen
                    </button>
                  </>
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

              {/* Concept Art Upload Section */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                  Concept Art
                </div>

                {selectedAsset.sourceImage ? (
                  <div style={{
                    padding: '10px',
                    background: '#1a1a2e',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#69db7c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ color: '#37b24d' }}>&#10003;</span>
                    {selectedAsset.sourceImage}
                  </div>
                ) : (
                  <div style={{
                    padding: '10px',
                    background: '#1a1a2e',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#888',
                  }}>
                    No concept art uploaded
                  </div>
                )}

                <button
                  onClick={handleUploadClick}
                  disabled={uploading}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '12px',
                    background: uploading ? '#444' : '#4dabf7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {uploading ? (
                    <>Uploading...</>
                  ) : (
                    <>
                      <span style={{ fontSize: '16px' }}>&#8593;</span>
                      Upload Concept Art
                    </>
                  )}
                </button>

                {uploadError && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    background: '#f03e3e22',
                    border: '1px solid #f03e3e',
                    borderRadius: '4px',
                    color: '#f03e3e',
                    fontSize: '12px',
                  }}>
                    {uploadError}
                  </div>
                )}

                {uploadSuccess && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    background: '#37b24d22',
                    border: '1px solid #37b24d',
                    borderRadius: '4px',
                    color: '#37b24d',
                    fontSize: '12px',
                  }}>
                    {uploadSuccess}
                  </div>
                )}
              </div>

              {/* Generate 3D Model Section */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                  3D Model Generation
                </div>

                <button
                  onClick={handleGenerateClick}
                  disabled={generating || !selectedAsset.sourceImage}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: generating
                      ? '#444'
                      : !selectedAsset.sourceImage
                      ? '#333'
                      : '#cc5de8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: generating || !selectedAsset.sourceImage ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                  title={!selectedAsset.sourceImage ? 'Upload concept art first' : 'Start 3D model generation'}
                >
                  {generating ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <span style={{ fontSize: '16px' }}>&#9881;</span>
                      Generate 3D Model
                    </>
                  )}
                </button>

                {!selectedAsset.sourceImage && (
                  <div style={{
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#888',
                    textAlign: 'center',
                  }}>
                    Upload concept art first
                  </div>
                )}

                {currentJob && (
                  <div style={{
                    marginTop: '8px',
                    background: '#4dabf722',
                    border: '1px solid #4dabf7',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '8px 10px',
                      color: '#4dabf7',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span>
                        {currentJob.progress || currentJob.status}
                        {currentJob.status === 'pending' && ' - waiting for worker'}
                      </span>
                      {currentJob.progress_pct !== undefined && currentJob.progress_pct !== null && (
                        <span style={{ fontWeight: 'bold' }}>{currentJob.progress_pct}%</span>
                      )}
                    </div>
                    {currentJob.progress_pct !== undefined && currentJob.progress_pct !== null && (
                      <div style={{ height: '3px', background: '#1a1a2e' }}>
                        <div style={{
                          width: `${currentJob.progress_pct}%`,
                          height: '100%',
                          background: '#4dabf7',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    )}
                  </div>
                )}

                {generateError && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    background: '#f03e3e22',
                    border: '1px solid #f03e3e',
                    borderRadius: '4px',
                    color: '#f03e3e',
                    fontSize: '12px',
                  }}>
                    {generateError}
                  </div>
                )}

              </div>

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
              {tab === 'procedural' ? 'Procedural Models' : 'AI Asset Workflow'}
            </h4>
            {tab === 'procedural' ? (
              <ol style={{ margin: 0, paddingLeft: '20px', color: '#888', fontSize: '13px' }}>
                <li style={{ marginBottom: '8px' }}>
                  Use <code style={{ color: '#cc5de8' }}>/model-generator</code> skill to create new models
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Models saved to <code style={{ color: '#69db7c' }}>web/src/models/</code>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Register in <code style={{ color: '#69db7c' }}>models/index.ts</code>
                </li>
                <li>
                  Use in Level Editor or game set pieces
                </li>
              </ol>
            ) : (
              <ol style={{ margin: 0, paddingLeft: '20px', color: '#888', fontSize: '13px' }}>
                <li style={{ marginBottom: '8px' }}>
                  Select asset, click <strong style={{ color: '#4dabf7' }}>Upload Concept Art</strong>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Click <strong style={{ color: '#cc5de8' }}>Generate 3D Model</strong> to queue job
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Run worker: <code style={{ color: '#69db7c' }}>docker compose up 3d-worker</code>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  GLB output to <code style={{ color: '#69db7c' }}>web/public/assets/models/</code>
                </li>
                <li>
                  Update <code style={{ color: '#69db7c' }}>assetQueue.ts</code> status
                </li>
              </ol>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreen && (selectedAsset?.modelPath || selectedProcedural) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setFullscreen(false)}
        >
          <div
            style={{
              background: '#1a1a2e',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #444',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
            }}>
              <h2 style={{ margin: 0, color: '#fff' }}>
                {selectedProcedural?.name || selectedAsset?.name}
              </h2>
              <button
                onClick={() => setFullscreen(false)}
                style={{
                  padding: '8px 16px',
                  background: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✕ Close (Esc)
              </button>
            </div>
            <Suspense fallback={<span style={{ color: '#888' }}>Loading model...</span>}>
              {selectedProcedural ? (
                <ProceduralModelViewer
                  createModel={selectedProcedural.create}
                  modelId={selectedProcedural.id}
                  width={800}
                  height={600}
                />
              ) : selectedAsset?.modelPath ? (
                <ModelViewer
                  modelPath={selectedAsset.modelPath}
                  width={800}
                  height={600}
                />
              ) : null}
            </Suspense>
            <div style={{
              marginTop: '10px',
              textAlign: 'center',
              color: '#888',
              fontSize: '12px',
            }}>
              Drag to rotate • Scroll to zoom • Click outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetViewer;
