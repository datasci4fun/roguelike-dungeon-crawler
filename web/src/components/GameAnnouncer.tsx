/**
 * GameAnnouncer - Visually hidden aria-live region for screen reader announcements
 *
 * v6.5.1 med-06: Announces important game events to screen reader users
 */
import { useEffect, useRef, useState } from 'react';
import type { GameState, GameEvent } from '../hooks/useGameSocket';
import './GameAnnouncer.css';

interface GameAnnouncerProps {
  gameState: GameState | null;
  events?: GameEvent[];
}

/**
 * Formats game events into readable announcements
 */
function formatEventAnnouncement(event: GameEvent): string | null {
  switch (event.type) {
    case 'damage':
      if (event.source === 'player') {
        return `You dealt ${event.amount} damage to ${event.target}`;
      } else {
        return `${event.source} dealt ${event.amount} damage to you`;
      }

    case 'heal':
      return `Healed for ${event.amount} health`;

    case 'kill':
      return `Defeated ${event.target}`;

    case 'level_up':
      return `Level up! You are now level ${event.level}`;

    case 'item_pickup':
      return `Picked up ${event.item}`;

    case 'ability_used':
      return `Used ability: ${event.ability}`;

    case 'status_applied':
      return `Status effect: ${event.status}`;

    case 'status_removed':
      return `Status effect ended: ${event.status}`;

    default:
      return null;
  }
}

export function GameAnnouncer({ gameState, events = [] }: GameAnnouncerProps) {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const lastTurnRef = useRef<number>(0);
  const lastLevelRef = useRef<number>(0);
  const lastHealthRef = useRef<number>(0);

  // Announce significant game state changes
  useEffect(() => {
    if (!gameState) return;

    const newAnnouncements: string[] = [];

    // Turn change
    if (gameState.turn !== lastTurnRef.current && lastTurnRef.current > 0) {
      // Don't announce every turn - too verbose
    }
    lastTurnRef.current = gameState.turn;

    // Floor change
    if (gameState.dungeon?.level !== lastLevelRef.current && lastLevelRef.current > 0) {
      newAnnouncements.push(`Descended to floor ${gameState.dungeon?.level}`);
    }
    lastLevelRef.current = gameState.dungeon?.level || 0;

    // Critical health warning
    if (gameState.player?.health !== undefined && gameState.player?.max_health) {
      const healthRatio = gameState.player.health / gameState.player.max_health;
      const prevRatio = lastHealthRef.current / gameState.player.max_health;

      // Warn when health drops below 30%
      if (healthRatio <= 0.3 && prevRatio > 0.3) {
        newAnnouncements.push(`Warning: Health critical! ${gameState.player.health} of ${gameState.player.max_health}`);
      }
      lastHealthRef.current = gameState.player.health;
    }

    // Game state announcements
    if (gameState.game_state === 'DEAD') {
      newAnnouncements.push('You have died. Press any key to continue.');
    } else if (gameState.game_state === 'VICTORY') {
      newAnnouncements.push('Victory! You have escaped the dungeon.');
    }

    // Battle state
    if (gameState.battle) {
      if (gameState.battle.is_player_turn) {
        newAnnouncements.push('Your turn. Choose an action.');
      }
    }

    // New lore discovery
    if (gameState.new_lore) {
      newAnnouncements.push(`New lore discovered: ${gameState.new_lore.title}. Press J to read.`);
    }

    if (newAnnouncements.length > 0) {
      setAnnouncements(newAnnouncements);
    }
  }, [
    gameState?.turn,
    gameState?.dungeon?.level,
    gameState?.player?.health,
    gameState?.game_state,
    gameState?.battle?.is_player_turn,
    gameState?.new_lore,
  ]);

  // Announce game events
  useEffect(() => {
    if (events.length === 0) return;

    const eventAnnouncements = events
      .map(formatEventAnnouncement)
      .filter((a): a is string => a !== null);

    if (eventAnnouncements.length > 0) {
      setAnnouncements(eventAnnouncements);
    }
  }, [events]);

  // Clear announcements after they've been read
  useEffect(() => {
    if (announcements.length > 0) {
      const timeout = setTimeout(() => {
        setAnnouncements([]);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [announcements]);

  return (
    <div
      className="game-announcer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Screen reader only - visually hidden */}
      {announcements.map((text, index) => (
        <span key={`${index}-${text}`}>{text} </span>
      ))}
    </div>
  );
}
