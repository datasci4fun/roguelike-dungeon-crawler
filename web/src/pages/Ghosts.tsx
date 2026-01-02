import { useState, useEffect, useCallback } from 'react';
import { ghostApi } from '../services/api';
import { GhostReplayViewer } from '../components/GhostReplayViewer';
import type { GhostSummary, GhostDetail } from '../types';
import './Ghosts.css';

export function Ghosts() {
  const [ghosts, setGhosts] = useState<GhostSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Replay viewer state
  const [selectedGhost, setSelectedGhost] = useState<GhostDetail | null>(null);
  const [loadingReplay, setLoadingReplay] = useState<number | null>(null);

  const pageSize = 10;

  useEffect(() => {
    loadGhosts();
  }, [page]);

  const loadGhosts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ghostApi.getRecent(page, pageSize) as {
        ghosts: GhostSummary[];
        total: number;
      };
      setGhosts(data.ghosts || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError('Failed to load ghost replays');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const watchReplay = useCallback(async (gameId: number) => {
    setLoadingReplay(gameId);
    setError('');
    try {
      const data = await ghostApi.getByGameId(gameId) as GhostDetail;
      setSelectedGhost(data);
    } catch (err) {
      setError('Failed to load replay data');
      console.error(err);
    } finally {
      setLoadingReplay(null);
    }
  }, []);

  const closeReplay = useCallback(() => {
    setSelectedGhost(null);
  }, []);

  const formatDuration = (started: string, ended: string) => {
    const start = new Date(started).getTime();
    const end = new Date(ended).getTime();
    const seconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="ghosts">
      <h1>Ghost Replays</h1>
      <p className="description">
        Watch recordings of past dungeon runs. See the paths players
        took and how they met their fate.
      </p>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="ghost-list">
            {ghosts.map((ghost) => (
              <div key={ghost.game_id} className="ghost-card">
                <div className="ghost-header">
                  <span className="ghost-player">{ghost.username}</span>
                  <span className={`ghost-result ${ghost.victory ? 'victory' : 'death'}`}>
                    {ghost.victory ? 'Victory' : ghost.cause_of_death || 'Death'}
                  </span>
                </div>
                <div className="ghost-stats">
                  <div className="ghost-stat">
                    <span className="label">Level</span>
                    <span className="value">{ghost.final_level}</span>
                  </div>
                  <div className="ghost-stat">
                    <span className="label">Score</span>
                    <span className="value">{ghost.final_score.toLocaleString()}</span>
                  </div>
                  <div className="ghost-stat">
                    <span className="label">Turns</span>
                    <span className="value">{ghost.total_turns}</span>
                  </div>
                  <div className="ghost-stat">
                    <span className="label">Duration</span>
                    <span className="value">
                      {formatDuration(ghost.started_at, ghost.ended_at)}
                    </span>
                  </div>
                </div>
                {ghost.killed_by && (
                  <div className="ghost-death">
                    Killed by: <span>{ghost.killed_by}</span>
                  </div>
                )}
                <div className="ghost-footer">
                  <span className="ghost-date">
                    {new Date(ghost.ended_at).toLocaleDateString()}
                  </span>
                  <button
                    className="watch-btn"
                    onClick={() => watchReplay(ghost.game_id)}
                    disabled={loadingReplay === ghost.game_id}
                  >
                    {loadingReplay === ghost.game_id ? 'Loading...' : '▶ Watch Replay'}
                  </button>
                </div>
              </div>
            ))}
            {ghosts.length === 0 && (
              <div className="no-data">No ghost replays available yet</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {selectedGhost && (
        <GhostReplayViewer ghost={selectedGhost} onClose={closeReplay} />
      )}
    </div>
  );
}
