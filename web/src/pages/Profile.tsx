import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileApi } from '../services/api';
import type { UserProfile, UserAchievement, UserGameHistory } from '../types';
import './Profile.css';

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isOwnProfile = !userId || (user && userId === String(user.id));

  useEffect(() => {
    loadProfile();
  }, [userId, isAuthenticated]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError('');

    try {
      let data;
      if (isOwnProfile && isAuthenticated) {
        data = await profileApi.getMyProfile();
      } else if (userId) {
        data = await profileApi.getProfile(parseInt(userId));
      } else {
        // Not authenticated and no userId - redirect to login
        navigate('/login');
        return;
      }
      setProfile(data as UserProfile);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="profile">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile">
        <div className="error-message">{error || 'Profile not found'}</div>
      </div>
    );
  }

  return (
    <div className="profile">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {(profile.display_name || profile.username).charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{profile.username}</h1>
          {profile.display_name && (
            <p className="profile-display-name">@{profile.display_name}</p>
          )}
          <p className="profile-meta">
            {profile.rank && <span className="rank">Rank #{profile.rank}</span>}
            <span className="joined">Member since {formatDate(profile.created_at)}</span>
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{profile.high_score.toLocaleString()}</div>
          <div className="stat-label">High Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile.games_played}</div>
          <div className="stat-label">Games</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile.victories}</div>
          <div className="stat-label">Victories</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile.win_rate}%</div>
          <div className="stat-label">Win Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile.total_kills.toLocaleString()}</div>
          <div className="stat-label">Total Kills</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile.max_level_reached}</div>
          <div className="stat-label">Max Level</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="extra-stats">
        <div className="extra-stat">
          <span className="label">Avg Score:</span>
          <span className="value">{Math.round(profile.avg_score).toLocaleString()}</span>
        </div>
        <div className="extra-stat">
          <span className="label">Avg Kills/Game:</span>
          <span className="value">{profile.avg_kills_per_game.toFixed(1)}</span>
        </div>
        {profile.favorite_death_cause && (
          <div className="extra-stat">
            <span className="label">Nemesis:</span>
            <span className="value nemesis">{profile.favorite_death_cause}</span>
          </div>
        )}
      </div>

      {/* Achievements Section */}
      <div className="profile-section">
        <div className="section-header">
          <h2>Achievements</h2>
          <span className="achievement-summary">
            {profile.achievement_count}/{profile.total_achievements} unlocked
            ({profile.achievement_points} pts)
          </span>
          <Link to="/achievements" className="view-all">View All</Link>
        </div>

        {profile.achievements.length > 0 ? (
          <div className="achievements-showcase">
            {profile.achievements.slice(0, 6).map((ach: UserAchievement) => (
              <div
                key={ach.achievement_id}
                className={`achievement-badge ${ach.rarity}`}
                title={`${ach.name}: ${ach.description}`}
              >
                <div
                  className="badge-icon"
                  style={{ borderColor: RARITY_COLORS[ach.rarity] }}
                >
                  {getAchievementIcon(ach.icon)}
                </div>
                <div className="badge-name">{ach.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-achievements">No achievements unlocked yet</p>
        )}
      </div>

      {/* Recent Games Section */}
      {profile.recent_games && profile.recent_games.length > 0 && (
        <div className="profile-section">
          <div className="section-header">
            <h2>Recent Games</h2>
          </div>

          <div className="games-list">
            {profile.recent_games.map((game: UserGameHistory) => (
              <div
                key={game.id}
                className={`game-entry ${game.victory ? 'victory' : 'death'}`}
              >
                <div className="game-result">
                  {game.victory ? '🏆 Victory' : '💀 Death'}
                </div>
                <div className="game-stats">
                  <span>Score: {game.score.toLocaleString()}</span>
                  <span>Level {game.level_reached}</span>
                  <span>{game.kills} kills</span>
                  <span>{game.turns_taken} turns</span>
                </div>
                {!game.victory && game.killed_by && (
                  <div className="death-cause">Killed by {game.killed_by}</div>
                )}
                <div className="game-date">{formatDate(game.ended_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getAchievementIcon(iconName: string): string {
  const icons: Record<string, string> = {
    sword: '⚔️',
    skull: '💀',
    dragon: '🐉',
    explosion: '💥',
    crown: '👑',
    trophy: '🏆',
    medal: '🎖️',
    stairs: '🪜',
    star: '⭐',
    calendar: '📅',
    lightning: '⚡',
    shield: '🛡️',
    flask: '🧪',
    sparkle: '✨',
    bag: '🎒',
    potion: '🧴',
    chest: '📦',
    door: '🚪',
    heart: '❤️',
    coins: '🪙',
  };
  return icons[iconName] || '🏅';
}
