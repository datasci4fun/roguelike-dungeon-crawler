/**
 * VictoryGhostLore - Displays legacy-specific lore on the victory summary screen
 * Reinforces the ghost mechanic by matching the cutscene legacy variant
 */

import type { VictoryLegacyId } from './VictoryCutscene';

interface Props {
  legacy: VictoryLegacyId;
}

export function VictoryGhostLore({ legacy }: Props) {
  const { title, body } = (() => {
    switch (legacy) {
      case 'legacy-beacon':
        return {
          title: 'BEACON',
          body:
            'At the edge of torchlight, some will see you— a hand raised, a path revealed. A warning without words.',
        };
      case 'legacy-champion':
        return {
          title: 'CHAMPION',
          body:
            'Where the stone runs red, some will meet you— a blade that does not tire, and a silence that demands proof.',
        };
      case 'legacy-archivist':
        return {
          title: 'ARCHIVIST',
          body:
            'Where walls should be solid, some will find you— perfectly still, guarding a secret for the worthy.',
        };
      default:
        return {
          title: 'YOUR LEGEND REMAINS',
          body:
            'The dungeon remembers its dead… and its victors. Your victory becomes an imprint: guide, trial, or omen.',
        };
    }
  })();

  return (
    <div
      style={{
        marginTop: '12px',
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid rgba(255,215,0,0.35)',
        background: 'rgba(0,0,0,0.55)',
        boxShadow: '0 0 24px rgba(255,215,0,0.15)',
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
