'use client';

import { useEffect, useRef, useState } from 'react';
import { rand } from '@/lib/rand';

type Dot = { x: number; y: number; c: number; r: number; ph: number; ox: number; oy: number };
type Scene = {
  dots: Dot[];
  pal: string[];
  W: number;
  H: number;
  /** per-dot crystallization, 0 = loose in the cloud, 1 = home */
  cr: Float32Array;
  done: boolean;
  doneAt?: number;
};

const RAD = 130; // cursor reach, px
const STEP = 3.6; // dot grid spacing, px
const HANDOFF_S = 1.4; // wait after "done" before crossfading to the gif

/**
 * Dots from a real picture: darker pixels get more (and bigger) dots, each in
 * that pixel's colour. Built once per canvas size.
 */
function buildScene(img: HTMLImageElement, W: number, H: number): Scene {
  const oc = document.createElement('canvas');
  oc.width = Math.round(W);
  oc.height = Math.round(H);
  const ox = oc.getContext('2d', { willReadFrequently: true })!;
  const sc = Math.max(W / img.width, H / img.height); // cover-fit
  ox.drawImage(img, (W - img.width * sc) / 2, (H - img.height * sc) / 2, img.width * sc, img.height * sc);
  const px = ox.getImageData(0, 0, oc.width, oc.height).data;

  const dots: Dot[] = [];
  const pal: string[] = [];
  const idx: Record<string, number> = {};
  const q = (c: number) => Math.min(255, Math.round(c / 24) * 24); // bucket colours so drawing stays fast
  let k = 0;
  for (let y = 0; y < H; y += STEP) {
    for (let x = 0; x < W; x += STEP) {
      k++;
      const jx = x + (rand(k) - 0.5) * STEP;
      const jy = y + (rand(k + 7e5) - 0.5) * STEP;
      const u = jx / W;
      const v = jy / H;
      // soft oval with a wobbly edge, so the picture melts into the paper
      const edge = Math.hypot((u - 0.5) / 0.5, (v - 0.5) / 0.5) + (Math.sin(u * 23) + Math.sin(v * 31 + u * 7)) * 0.02;
      const fade = Math.min(1, Math.max(0, (1 - edge) / 0.42));
      if (fade <= 0) continue;
      const o =
        (Math.min(oc.height - 1, Math.max(0, Math.round(jy))) * oc.width +
          Math.min(oc.width - 1, Math.max(0, Math.round(jx)))) *
        4;
      const r = px[o];
      const g = px[o + 1];
      const b = px[o + 2];
      const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (rand(k + 23) > (Math.pow(1 - L, 0.8) * 0.95 + 0.04) * fade) continue;
      const key = `rgb(${q(r)},${q(g)},${q(b)})`;
      if (idx[key] === undefined) {
        idx[key] = pal.length;
        pal.push(key);
      }
      // where this dot floats before it crystallizes
      const sa = rand(k + 37) * Math.PI * 2;
      const sd = 18 + rand(k + 41) * 46;
      dots.push({
        x: jx,
        y: jy,
        c: idx[key],
        r: 0.9 + (1 - L) * 1.1,
        ph: rand(k + 31) * 100,
        ox: Math.cos(sa) * sd,
        oy: Math.sin(sa) * sd,
      });
    }
  }
  return { dots, pal, W, H, cr: new Float32Array(dots.length), done: false };
}

const ease = (v: number) => v * v * (3 - 2 * v);

type Props = { src: string; alt: string; width: number; height: number; caption: string };

export default function Crystallize({ src, alt, width, height, caption }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [gif, setGif] = useState(false);

  useEffect(() => {
    // reduced motion: skip the effect and show the picture straight away
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true);
      setGif(true);
      return;
    }
    const cv = cvRef.current;
    if (!cv) return;
    const g = cv.getContext('2d');
    if (!g) {
      setRevealed(true);
      setGif(true);
      return;
    }

    let mx = -999;
    let my = -999;
    const at = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    const away = () => {
      mx = -999;
      my = -999;
    };
    cv.addEventListener('pointermove', at);
    cv.addEventListener('pointerdown', at);
    cv.addEventListener('pointerleave', away);
    cv.addEventListener('pointercancel', away);

    let img: HTMLImageElement | null = null;
    let scene: Scene | null = null;
    let raf = 0;
    let stopped = false;
    let visible = true;
    let last = 0;

    const im = new Image();
    im.onload = () => {
      img = im;
      scene = null;
    };
    im.onerror = () => {
      stopped = true;
      setRevealed(true);
      setGif(true);
    };
    im.src = src;

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(cv);

    const draw = (t: number, f: number) => {
      if (!img) return;
      const dpr = window.devicePixelRatio || 1;
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      if (!W || !H) return;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
      }
      if (!scene || scene.W !== W || scene.H !== H) scene = buildScene(img, W, H);
      const S = scene;
      const cr = S.cr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);

      if (!S.done) {
        // until it's fully formed, anything you're not touching slowly loosens back into the cloud
        const fall = 0.006 * f;
        for (let i = 0; i < cr.length; i++) if (cr[i] > 0) cr[i] = Math.max(0, cr[i] - fall);
      }
      // crystallize: dots under the cursor ease home
      if (mx > -900) {
        for (let i = 0; i < S.dots.length; i++) {
          if (cr[i] >= 1) continue;
          const d = S.dots[i];
          if (Math.abs(d.x - mx) < RAD && Math.abs(d.y - my) < RAD) {
            const qq = 1 - Math.hypot(d.x - mx, d.y - my) / RAD;
            if (qq > 0) cr[i] = Math.min(1, cr[i] + qq * 0.5 * f);
          }
        }
      }
      // once most of it is done, the rest settles in on its own
      if (!S.done) {
        let sum = 0;
        let n = 0;
        for (let i = 0; i < cr.length; i += 50, n++) sum += cr[i];
        if (n && sum / n > 0.3) {
          S.done = true;
          S.doneAt = t;
          setRevealed(true);
        }
      }
      if (S.done) {
        const up = 0.05 * f;
        for (let i = 0; i < cr.length; i++) if (cr[i] < 1) cr[i] = Math.min(1, cr[i] + up);
        if (t - (S.doneAt ?? t) > HANDOFF_S) {
          // every dot is home by now, so this last frame matches the gif; stop animating
          stopped = true;
          setGif(true);
        }
      }

      // one path per colour keeps ~15k dots fast
      const paths = S.pal.map(() => new Path2D());
      for (let i = 0; i < S.dots.length; i++) {
        const d = S.dots[i];
        const v = cr[i];
        const r = d.r * (0.65 + 0.35 * v);
        // drifting loose in its cloud, sliding home as it crystallizes
        const e = 1 - ease(v);
        const w = Math.sin(t * 0.5 + d.ph) * 6 * e;
        const x = d.x + (d.ox + w) * e;
        const y = d.y + (d.oy + Math.cos(t * 0.4 + d.ph) * 6) * e;
        const p = paths[d.c];
        p.moveTo(x + r, y);
        p.arc(x, y, r, 0, Math.PI * 2);
      }
      for (let i = 0; i < S.pal.length; i++) {
        g.fillStyle = S.pal[i];
        g.fill(paths[i]);
      }
    };

    const t0 = performance.now();
    const loop = (now: number) => {
      if (stopped) return;
      // per-frame rates are tuned for 60fps; scale so 120hz screens feel the same
      const f = last ? Math.min(3, ((now - last) / 1000) * 60) : 1;
      last = now;
      if (visible) draw((now - t0) / 1000, f);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      cv.removeEventListener('pointermove', at);
      cv.removeEventListener('pointerdown', at);
      cv.removeEventListener('pointerleave', away);
      cv.removeEventListener('pointercancel', away);
    };
  }, [src]);

  return (
    <figure className="art">
      <div className="art-frame" style={{ aspectRatio: `${width} / ${height}` }}>
        {/* plain <img>: next/image would strip the gif's animation */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={width} height={height} style={{ opacity: gif ? 1 : 0 }} />
        <canvas ref={cvRef} aria-hidden="true" style={{ opacity: gif ? 0 : 1 }} />
      </div>
      <figcaption style={{ opacity: revealed ? 0 : 1 }} aria-hidden={revealed}>
        {caption}
      </figcaption>
    </figure>
  );
}
