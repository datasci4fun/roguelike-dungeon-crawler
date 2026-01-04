import { PlayerFeat, FeatCategory } from '../hooks/useGameSocket';
import './FeatSelector.css';

interface FeatSelectorProps {
  availableFeats: PlayerFeat[];
  onSelectFeat: (featId: string) => void;
  isStartingFeat?: boolean;
}

const CATEGORY_COLORS: Record<FeatCategory, string> = {
  COMBAT: '#ff6b6b',
  DEFENSE: '#4dabf7',
  UTILITY: '#51cf66',
  SPECIAL: '#be4bdb',
};

const CATEGORY_ICONS: Record<FeatCategory, string> = {
  COMBAT: '\u2694', // Crossed swords
  DEFENSE: '\u{1F6E1}', // Shield
  UTILITY: '\u2728', // Sparkles
  SPECIAL: '\u2B50', // Star
};

export function FeatSelector({ availableFeats, onSelectFeat, isStartingFeat }: FeatSelectorProps) {
  // Group feats by category
  const featsByCategory = availableFeats.reduce((acc, feat) => {
    if (!acc[feat.category]) {
      acc[feat.category] = [];
    }
    acc[feat.category].push(feat);
    return acc;
  }, {} as Record<FeatCategory, PlayerFeat[]>);

  const categories: FeatCategory[] = ['COMBAT', 'DEFENSE', 'UTILITY', 'SPECIAL'];

  return (
    <div className="feat-selector-overlay">
      <div className="feat-selector-modal">
        <div className="feat-selector-header">
          <h2>{isStartingFeat ? 'Choose Your Starting Feat' : 'Level Up! Choose a Feat'}</h2>
          <p className="feat-selector-subtitle">
            {isStartingFeat
              ? 'As a Human, you begin your journey with a special talent.'
              : 'You have earned a new feat! Choose wisely.'}
          </p>
        </div>

        <div className="feat-categories">
          {categories.map((category) => {
            const feats = featsByCategory[category];
            if (!feats || feats.length === 0) return null;

            return (
              <div key={category} className="feat-category">
                <h3
                  className="category-title"
                  style={{ color: CATEGORY_COLORS[category] }}
                >
                  {CATEGORY_ICONS[category]} {category}
                </h3>
                <div className="feat-list">
                  {feats.map((feat) => (
                    <button
                      key={feat.id}
                      className="feat-card"
                      onClick={() => onSelectFeat(feat.id)}
                      style={{ borderColor: CATEGORY_COLORS[category] }}
                    >
                      <div className="feat-name">{feat.name}</div>
                      <div className="feat-description">{feat.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
