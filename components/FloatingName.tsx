import type { CSSProperties } from 'react';
import { rand } from '@/lib/rand';

/**
 * Every letter tumbles in from somewhere different, then holds still until
 * hovered. Offsets come from a repeatable hash, so server and client markup match.
 */
export default function FloatingName({ text, italic = [0, 8] }: { text: string; italic?: number[] }) {
  return (
    <h1 aria-label={text}>
      {text.split('').map((ch, i) => {
        const style = {
          '--sx': `${Math.round((rand(i + 60) - 0.5) * 520)}px`,
          '--sy': `${Math.round((rand(i + 70) - 0.5) * 260)}px`,
          '--sr': `${Math.round((rand(i + 80) - 0.5) * 220)}deg`,
          '--in-delay': `${(i * 0.06).toFixed(2)}s`,
        } as CSSProperties;
        return (
          <span key={i} aria-hidden="true" className={italic.includes(i) ? 'fl it' : 'fl'} style={style}>
            {ch}
          </span>
        );
      })}
    </h1>
  );
}
