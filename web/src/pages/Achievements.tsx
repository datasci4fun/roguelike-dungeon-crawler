import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { achievementsApi } from '../services/api';
import type { AchievementDef, UserAchievement, AchievementCategory } from '../types';
import './Achievements.css';

const CATEGORIES: { id: AchievementCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'combat', label: 'Combat' },
  { id: 'progression', label: 'Progression' },
  { id: 'efficiency', label: 'Efficiency' },
  { id: 'collection', label: 'Collection' },
  { id: 'special', label: 'Special' },
];

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export function Achievements() {
  const { isAuthenticated } = useAuth();
  const [allAchievements, setAllAchievements] = useState<AchievementDef[]>([]);
  const [userAchievements, setUserAchievements] = useState<Map<string, UserAchievement>>(new Map());
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ unlocked: 0, total: 0, points: 0, percentage: 0 });

  useEffect(() => {
    loadAchievements();
  }, [isAuthenticated]);

  const loadAchievements = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Load all achievement definitions
      const allData = await achievementsApi.getAll();
      setAllAchievements(allData.achievements as AchievementDef[]);

      // Load user achievements if authenticated
      if (isAuthenticated) {
        const userData = await achievementsApi.getMine();
        const userMap = new Map<string, UserAchievement>();
        for (const ua of userData.unlocked as UserAchievement[]) {
          userMap.set(ua.achievement_id, ua);
        }
        setUserAchievements(userMap);
        setStats({
          unlocked: userData.total_unlocked,
          total: userData.total_achievements,
          points: userData.total_points,
          percentage: userData.completion_percentage,
        });
      } else {
        setStats({
          unlocked: 0,
          total: allData.total,
          points: 0,
          percentage: 0,
        });
      }
    } catch (err) {
      setError('Failed to load achievements');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAchievements = activeCategory === 'all'
    ? allAchievements
    : allAchievements.filter(a => a.category === activeCategory);

  // Sort: unlocked first, then by rarity (legendary → common)
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    const aUnlocked = userAchievements.has(a.id) ? 0 : 1;
    const bUnlocked = userAchievements.has(b.id) ? 0 : 1;
    if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="achievements-page">
        <div className="loading">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <h1>Achievements</h1>
        <div className="achievements-stats">
          <span className="stat-item">
            <span className="stat-value">{stats.unlocked}/{stats.total}</span>
            <span className="stat-label">Unlocked</span>
          </span>
          <span className="stat-item">
            <span className="stat-value">{stats.points}</span>
            <span className="stat-label">Points</span>
          </span>
          <span className="stat-item">
            <span className="stat-value">{stats.percentage}%</span>
            <span className="stat-label">Complete</span>
          </span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="achievements-grid">
        {sortedAchievements.map(ach => {
          const userAch = userAchievements.get(ach.id);
          const isUnlocked = !!userAch;

          return (
            <div
              key={ach.id}
              className={`achievement-card ${ach.rarity} ${isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div
                className="achievement-icon"
                style={{ borderColor: RARITY_COLORS[ach.rarity] }}
              >
                {getAchievementIcon(ach.icon)}
              </div>
              <div className="achievement-content">
                <div className="achievement-header">
                  <h3 className="achievement-name">{ach.name}</h3>
                  <span
                    className="achievement-rarity"
                    style={{ color: RARITY_COLORS[ach.rarity] }}
                  >
                    {RARITY_LABELS[ach.rarity]}
                  </span>
                </div>
                <p className="achievement-description">{ach.description}</p>
                <div className="achievement-footer">
                  <span className="achievement-points">{ach.points} pts</span>
                  {isUnlocked && userAch && (
                    <span className="achievement-date">
                      Unlocked {formatDate(userAch.unlocked_at)}
                    </span>
                  )}
                </div>
              </div>
              {!isUnlocked && <div className="locked-overlay" />}
            </div>
          );
        })}
      </div>

      {sortedAchievements.length === 0 && (
        <div className="no-achievements">
          No achievements in this category
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
    handshake: '🤝',
    users: '👥',
    'trophy-star': '🌟',
    compass: '🧭',
    target: '🎯',
    'skull-pile': '☠️',
    'heart-crack': '💔',
    dove: '🕊️',
    rocket: '🚀',
    gem: '💎',
    'skull-crossbones': '☠️',
  };
  return icons[iconName] || '🏅';
}
