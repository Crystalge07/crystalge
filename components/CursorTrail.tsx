'use client';

import { useEffect, useRef } from 'react';

type Pt = { x: number; y: number; t: number; d: number };

const LIFE_MS = 1100; // how long a bit of trail lingers
const MAX_PTS = 160;
// the cursor's hotspot is the front of woodstock's face; start the trail from his middle instead
const OFFSET_X = 15;
const OFFSET_Y = 2;

/**
 * A dashed flight path that follows the mouse and fades out behind it, like
 * woodstock's trail in the strip. Mouse only; skipped for touch and reduced motion.
 */
export default function CursorTrail() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const g = cv.getContext('2d');
    if (!g) return;

    let pts: Pt[] = [];
    let dist = 0; // total distance travelled, so dashes stay put instead of crawling
    let raf = 0;
    let ink = '#1d2340';

    const size = () => {
      const dpr = window.devicePixelRatio || 1;
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || ink;
    };
    size();

    const draw = () => {
      raf = 0;
      const now = performance.now();
      pts = pts.filter((p) => now - p.t < LIFE_MS);
      g.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (pts.length < 2) {
        pts = pts.slice(-1);
        return;
      }
      g.lineWidth = 2;
      g.lineCap = 'round';
      g.setLineDash([7, 8]);
      g.strokeStyle = ink;
      // one short stroke per segment so each can fade with its age;
      // the dash offset carries on from the distance travelled so the pattern stays continuous
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const age = (now - b.t) / LIFE_MS;
        g.globalAlpha = Math.max(0, 1 - age) * 0.85;
        g.lineDashOffset = a.d;
        g.beginPath();
        g.moveTo(a.x, a.y);
        g.lineTo(b.x, b.y);
        g.stroke();
      }
      g.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const x = e.clientX + OFFSET_X;
      const y = e.clientY + OFFSET_Y;
      const last = pts[pts.length - 1];
      if (last) {
        const step = Math.hypot(x - last.x, y - last.y);
        if (step < 3) return; // ignore jitter
        dist += step;
      }
      pts.push({ x, y, t: performance.now(), d: dist });
      if (pts.length > MAX_PTS) pts.shift();
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const onLeave = () => {
      pts = [];
      g.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', size);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', size);
    };
  }, []);

  return <canvas ref={ref} className="cursor-trail" aria-hidden="true" />;
}
