/**
 * GameOverGhostLore - Displays fate-specific lore on the death summary screen
 * Reinforces the ghost mechanic by matching the cutscene fate variant
 */

import type { DeathFateId } from './GameOverCutscene';

interface Props {
  fate: DeathFateId;
}

export function GameOverGhostLore({ fate }: Props) {
  const { title, body } = (() => {
    switch (fate) {
      case 'fate-echo':
        return {
          title: 'YOUR ECHO REMAINS',
          body:
            'Your last moments may linger here. In another delver\'s run, your echo could appear—repeating your final steps. Some will follow it. Some will survive.',
        };
      case 'fate-hollowed':
        return {
          title: 'HOLLOWED',
          body:
            'The abyss does not waste its dead. If you rise again, it may be as something else—wearing your memory like armor in another player\'s descent.',
        };
      case 'fate-silence':
        return {
          title: 'SILENCE',
          body:
            'Or maybe you simply... end. But even silence leaves a shape. The dungeon remembers where you fell—and that memory can haunt the living.',
        };
      default:
        return {
          title: 'THE DUNGEON REMEMBERS',
          body:
            'Those who die here can leave traces behind. Other players may encounter echoes of the fallen—warnings, lures, or something worse.',
        };
    }
  })();

  return (
    <div
      style={{
        marginTop: '12px',
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid rgba(255,215,0,0.25)',
        background: 'rgba(0,0,0,0.55)',
        boxShadow: '0 0 18px rgba(0,0,0,0.35)',
        maxWidth: 720,
      }}
    >
      <div
        style={{
          color: 'rgba(255,215,0,0.95)',
          fontWeight: 800,
          letterSpacing: '0.12em',
          fontSize: '0.95rem',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.55, fontSize: '0.98rem' }}>
        {body}
      </div>

      <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontStyle: 'italic' }}>
        In another descent, you may be seen again.
      </div>
    </div>
  );
}
