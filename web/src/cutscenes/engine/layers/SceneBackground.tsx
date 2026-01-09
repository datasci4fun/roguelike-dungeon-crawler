/**
 * SceneBackground - Layered parallax background for cutscene scenes
 */

import type { SceneBackgroundProps } from '../types';
import './SceneBackground.scss';

export function SceneBackground({ config, fadeState }: SceneBackgroundProps) {
  const { type, parallax = true, animate = true } = config;

  const classNames = [
    'scene-background',
    `scene-${type}`,
    `fade-${fadeState}`,
    parallax ? 'parallax-enabled' : '',
    animate ? 'animate-enabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      <div className="bg-layer bg-far" />
      <div className="bg-layer bg-mid" />
      <div className="bg-layer bg-near" />
    </div>
  );
}
