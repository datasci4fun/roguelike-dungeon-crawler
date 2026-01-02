import { useState, useEffect } from 'react';
import { leaderboardApi } from '../services/api';
import type { LeaderboardEntry, GlobalStats } from '../types';
import './Leaderboard.css';

type LeaderboardType = 'top' | 'weekly' | 'daily' | 'victories' | 'speedrun' | 'kills';

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [activeTab, setActiveTab] = useState<LeaderboardType>('top');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const pageSize = 10;

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, page]);

  const loadStats = async () => {
    try {
      const data = await leaderboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const fetchers: Record<LeaderboardType, () => Promise<unknown>> = {
        top: () => leaderboardApi.getTop(page, pageSize),
        weekly: () => leaderboardApi.getWeekly(page, pageSize),
        daily: () => leaderboardApi.getDaily(page, pageSize),
        victories: () => leaderboardApi.getVictories(page, pageSize),
        speedrun: () => leaderboardApi.getSpeedrun(page, pageSize),
        kills: () => leaderboardApi.getKills(page, pageSize),
      };

      const data = await fetchers[activeTab]() as { entries: LeaderboardEntry[]; total: number };
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { key: LeaderboardType; label: string }[] = [
    { key: 'top', label: 'All Time' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'daily', label: 'Daily' },
    { key: 'victories', label: 'Victories' },
    { key: 'speedrun', label: 'Speedrun' },
    { key: 'kills', label: 'Most Kills' },
  ];

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="leaderboard">
      <h1>Leaderboard</h1>

      {stats && (
        <div className="global-stats">
          <div className="stat">
            <span className="stat-value">{stats.total_games.toLocaleString()}</span>
            <span className="stat-label">Total Games</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.total_players.toLocaleString()}</span>
            <span className="stat-label">Players</span>
          </div>
          <div className="stat">
            <span className="stat-value">{(stats.victory_rate * 100).toFixed(1)}%</span>
            <span className="stat-label">Victory Rate</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.highest_score.toLocaleString()}</span>
            <span className="stat-label">Highest Score</span>
          </div>
        </div>
      )}

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Score</th>
                <th>Level</th>
                <th>Kills</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.game_id}>
                  <td className="rank">#{entry.rank}</td>
                  <td className="player">{entry.display_name || entry.username}</td>
                  <td className="score">{entry.score.toLocaleString()}</td>
                  <td>{entry.level_reached}</td>
                  <td>{entry.kills}</td>
                  <td className={entry.victory ? 'victory' : 'death'}>
                    {entry.victory ? 'Victory' : 'Death'}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="no-data">
                    No entries yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>

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
    </div>
  );
}
