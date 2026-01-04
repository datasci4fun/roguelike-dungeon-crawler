/**
 * Color schemes and styles for entities
 */

export interface EnemyColors {
  primary: string;
  secondary: string;
  accent: string;
  eye: string;
}

export interface ItemStyle {
  color: string;
  glowColor: string;
  shape: 'potion' | 'scroll' | 'weapon' | 'armor' | 'ring' | 'food' | 'gold' | 'key' | 'default';
}

/**
 * Get enemy color scheme based on symbol/name
 */
export function getEnemyColors(symbol: string, name: string, isElite: boolean): EnemyColors {
  const lowerName = name.toLowerCase();
  const lowerSymbol = symbol.toLowerCase();

  // Base colors for different enemy types
  if (lowerSymbol === 'g' || lowerName.includes('goblin')) {
    return { primary: '#4a7c4e', secondary: '#2d4d2f', accent: '#8bc34a', eye: '#ffeb3b' };
  } else if (lowerSymbol === 'o' || lowerName.includes('orc')) {
    return { primary: '#5d8a5d', secondary: '#3d5a3d', accent: '#7cb342', eye: '#ff5722' };
  } else if (lowerSymbol === 's' || lowerName.includes('skeleton')) {
    return { primary: '#e0e0e0', secondary: '#9e9e9e', accent: '#ffffff', eye: '#ff1744' };
  } else if (lowerSymbol === 'r' || lowerName.includes('rat')) {
    return { primary: '#8d6e63', secondary: '#5d4037', accent: '#a1887f', eye: '#ff5252' };
  } else if (lowerSymbol === 'b' || lowerName.includes('bat')) {
    return { primary: '#37474f', secondary: '#263238', accent: '#546e7a', eye: '#ff1744' };
  } else if (lowerSymbol === 'd' || lowerName.includes('demon')) {
    return { primary: '#b71c1c', secondary: '#7f0000', accent: '#ff5252', eye: '#ffeb3b' };
  } else if (lowerSymbol === 'z' || lowerName.includes('zombie')) {
    return { primary: '#558b2f', secondary: '#33691e', accent: '#8bc34a', eye: '#fff176' };
  } else if (lowerSymbol === 't' || lowerName.includes('troll')) {
    return { primary: '#6d4c41', secondary: '#4e342e', accent: '#8d6e63', eye: '#ffc107' };
  } else if (lowerName.includes('boss') || lowerName.includes('dragon')) {
    return { primary: '#4a148c', secondary: '#311b92', accent: '#7c4dff', eye: '#ff1744' };
  }

  // Default/elite colors
  if (isElite) {
    return { primary: '#ff8f00', secondary: '#ff6f00', accent: '#ffc107', eye: '#ffffff' };
  }
  return { primary: '#c62828', secondary: '#8e0000', accent: '#ff5252', eye: '#ffeb3b' };
}

/**
 * Get item color and shape based on symbol/name
 */
export function getItemStyle(symbol: string, name: string): ItemStyle {
  const lowerName = name.toLowerCase();

  if (symbol === '!' || lowerName.includes('potion')) {
    if (lowerName.includes('health')) {
      return { color: '#ff5252', glowColor: 'rgba(255, 82, 82, 0.5)', shape: 'potion' };
    } else if (lowerName.includes('mana')) {
      return { color: '#448aff', glowColor: 'rgba(68, 138, 255, 0.5)', shape: 'potion' };
    } else if (lowerName.includes('strength')) {
      return { color: '#ff9800', glowColor: 'rgba(255, 152, 0, 0.5)', shape: 'potion' };
    }
    return { color: '#e040fb', glowColor: 'rgba(224, 64, 251, 0.5)', shape: 'potion' };
  } else if (symbol === '?' || lowerName.includes('scroll')) {
    return { color: '#fff9c4', glowColor: 'rgba(255, 249, 196, 0.5)', shape: 'scroll' };
  } else if (symbol === '/' || symbol === '|' || lowerName.includes('sword') || lowerName.includes('weapon')) {
    return { color: '#b0bec5', glowColor: 'rgba(176, 190, 197, 0.5)', shape: 'weapon' };
  } else if (symbol === ']' || symbol === '[' || lowerName.includes('armor') || lowerName.includes('shield')) {
    return { color: '#78909c', glowColor: 'rgba(120, 144, 156, 0.5)', shape: 'armor' };
  } else if (symbol === '=' || lowerName.includes('ring') || lowerName.includes('amulet')) {
    return { color: '#ffd700', glowColor: 'rgba(255, 215, 0, 0.5)', shape: 'ring' };
  } else if (symbol === '%' || lowerName.includes('food') || lowerName.includes('ration')) {
    return { color: '#8d6e63', glowColor: 'rgba(141, 110, 99, 0.5)', shape: 'food' };
  } else if (symbol === '$' || lowerName.includes('gold') || lowerName.includes('coin')) {
    return { color: '#ffd700', glowColor: 'rgba(255, 215, 0, 0.6)', shape: 'gold' };
  } else if (symbol === '*' || lowerName.includes('key')) {
    return { color: '#ffab00', glowColor: 'rgba(255, 171, 0, 0.5)', shape: 'key' };
  }

  // Default
  return { color: '#f1fa8c', glowColor: 'rgba(241, 250, 140, 0.5)', shape: 'default' };
}
