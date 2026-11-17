'use client';

import { useEffect, useRef } from 'react';

type Pt = { x: number; y: number; t: number; d: number };

const LIFE_MS = 650; // how long a bit of trail lingers
const MAX_PTS = 90;
// the cursor's hotspot is the front of woodstock's face; start the trail from his middle instead
const OFFSET_X = 15;
const OFFSET_Y = 2;
const SMOOTH_PASSES = 3; // rounds of corner-cutting, so the path flows instead of zig-zagging

type SPt = { x: number; y: number; t: number };

/** Chaikin corner-cutting: each pass replaces every corner with two points a quarter of the way in. */
function smooth(src: SPt[]): SPt[] {
  let p = src;
  for (let k = 0; k < SMOOTH_PASSES && p.length > 2; k++) {
    const out: SPt[] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i];
      const b = p[i + 1];
      out.push(
        { x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25, t: a.t * 0.75 + b.t * 0.25 },
        { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75, t: a.t * 0.25 + b.t * 0.75 },
      );
    }
    out.push(p[p.length - 1]); // keep the newest point under the cursor
    p = out;
  }
  return p;
}

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
      const sp = smooth(pts);
      // dash offsets are measured back from the total distance travelled, so dashes near
      // the bird stay put instead of crawling as old points drop off the tail
      const offs = new Float32Array(sp.length);
      offs[sp.length - 1] = dist;
      for (let i = sp.length - 1; i > 0; i--) {
        offs[i - 1] = offs[i] - Math.hypot(sp[i].x - sp[i - 1].x, sp[i].y - sp[i - 1].y);
      }
      // one short stroke per segment so each can fade with its age (eased, so the tail goes quickly)
      for (let i = 1; i < sp.length; i++) {
        const a = sp[i - 1];
        const b = sp[i];
        const life = Math.max(0, 1 - (now - b.t) / LIFE_MS);
        g.globalAlpha = life * life * 0.85;
        g.lineDashOffset = offs[i - 1];
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
