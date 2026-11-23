'use client';

import { useState } from 'react';

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** small line under the picture */
  caption?: string;
  /** an extra layer (same size as the art): shows while hovered, and stays on once clicked */
  overlay?: { src: string; alt: string };
};

/** The pinned picture, with an optional layer that shows on hover and toggles on click. */
export default function HeroArt({ src, alt, width, height, caption, overlay }: Props) {
  const [pinned, setPinned] = useState(false);
  const toggle = () => setPinned((p) => !p);

  return (
    <figure className="art">
      <div
        className={`art-frame${overlay ? ' has-overlay' : ''}${pinned ? ' pinned' : ''}`}
        style={{ aspectRatio: `${width} / ${height}` }}
        {...(overlay && {
          role: 'button',
          tabIndex: 0,
          'aria-pressed': pinned,
          'aria-label': 'toggle thought bubble',
          onClick: toggle,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle();
            }
          },
        })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="art-img" src={src} alt={alt} width={width} height={height} />
        {overlay && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="art-overlay" src={overlay.src} alt={overlay.alt} width={width} height={height} />
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
