// halftone-sky.js
// one canvas renderer for both views of the site (D2 style):
//   mode 'home' → all constellations + dome horizon + comet cursor + 1 shooting star
//   mode 'zoom' → one constellation up close, camera pushes in on load, one star can be "selected"
// everything is drawn as halftone dots: each grid cell gets a brightness, dot size = brightness
// no dependencies, works in plain js / react / next (call it from a useEffect)

// fallback shapes in 0..1 screen coords (x, y). swap these for your real star positions
const DEFAULT_HOME = [
  { p: [[.055,.63],[.10,.40],[.18,.25],[.275,.34],[.255,.57],[.155,.50]], e: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,1],[5,0]], s: [.8,.7,.9,1,.8,.6] }, // about
  { p: [[.39,.28],[.485,.24],[.545,.38],[.625,.52],[.445,.61],[.52,.67]], e: [[0,4],[4,1],[1,2],[2,3],[3,4],[2,5],[5,3]], s: [.9,1,.6,1,1,.6] },    // experiences
  { p: [[.71,.36],[.805,.30],[.905,.38],[.955,.47],[.855,.60],[.74,.65]], e: [[0,1],[1,2],[2,4],[4,3],[0,4],[0,5]], s: [.8,.9,.7,.8,.7,.6] }        // projects
];

export function createHalftoneSky(canvas, opts = {}) {
  const o = {
    mode: 'home',          // 'home' | 'zoom'
    accent: '#9db8ff',     // dot color
    bright: '#f5f7ff',     // color for the hottest dots (star cores)
    bg: '#060a14',         // sky color
    cell: 7,               // grid size in px, bigger = chunkier dots
    constellations: DEFAULT_HOME, // zoom mode only uses constellations[0]
    ...opts
  };

  let raf = null, t0 = performance.now();
  let mx = -9999, my = -9999;  // cursor, -9999 = not on the canvas
  let trail = [];              // recent cursor spots for the comet tail
  let selected = -1;           // zoom mode: index of the star whose card is open
  let buf = null;              // brightness per grid cell, reused every frame

  // reduced motion → draw one still frame, skip the loop
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cheap repeatable 0..1 noise per cell, so the same cells are stars every frame
  const hash = (i) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
  const ease = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);

  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
    trail.push({ x: mx, y: my, t: performance.now() / 1000 });
  };
  const onLeave = () => { mx = -9999; my = -9999; };
  // listen on window so the comet still works when the cursor is over your labels/buttons
  window.addEventListener('mousemove', onMove);
  document.addEventListener('mouseleave', onLeave);

  function draw(t) {
    const dpr = window.devicePixelRatio || 1, W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    // keep the backing store sharp on retina + after resizes
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalAlpha = 1; g.fillStyle = o.bg; g.fillRect(0, 0, W, H);

    const S = o.cell, cols = Math.ceil(W / S), rows = Math.ceil(H / S), n = cols * rows;
    if (!buf || buf.length !== n) buf = new Float32Array(n);
    const B = buf, zoom = o.mode === 'zoom';

    const z = zoom ? ease(t / 1.4) : 1; // zoom-in progress, 1 = done (home is always "done")
    // dome horizon: big circle whose top sits at 82% height. in zoom it rises up as you push in
    const R = W * 1.1, pcx = W / 2, pcy = H * (0.82 + (1 - z) * 0.3) + R;

    // 1. background: faint drifting nebula + twinkling stars + dome rim + glow above it
    for (let j = 0; j < rows; j++) {
      const y = j * S + S / 2;
      for (let i = 0; i < cols; i++) {
        const x = i * S + S / 2, idx = j * cols + i;
        const k = zoom ? 0.6 + 0.4 * z : 1; // nebula stretches while the camera pushes in
        const zx = (x - W / 2) / k, zy = (y - H / 2) / k;
        const v = (Math.sin(zx * .011 + t * .35) + Math.sin(zy * .017 - t * .27) + Math.sin((zx - zy) * .007 + t * .2)) / 3;
        let b = v > 0 ? v * v * .2 : 0;
        const hr = hash(idx);
        if (hr > .989) { const h2 = hash(idx * 7.31 + 3); b += .28 + .18 * Math.sin(t * (1.2 + h2 * 2.2) + h2 * 628); } // each star gets its own speed + phase
        const d = Math.hypot(x - pcx, y - pcy) - R;   // distance to the dome edge
        if (d < 0) { b = 0; if (d > -45) b += (1 + d / 45) * .8; else if (hr > .9) b += .1; } // even rim, faint texture inside
        else if (d < 80) { const q = 1 - d / 80; b += q * q * .4; }                            // soft glow above the rim
        B[idx] = b;
      }
    }
    const add = (x, y, v) => { const i = Math.floor(x / S), j = Math.floor(y / S); if (i >= 0 && j >= 0 && i < cols && j < rows) B[j * cols + i] += v; };

    // 2. constellations
    const list = zoom ? [o.constellations[0]] : o.constellations;
    list.forEach((c, ci) => {
      let pts = c.p.map((p) => [p[0] * W, p[1] * H]);
      if (zoom) { const k = 0.35 + 0.65 * z; pts = pts.map((p) => [W / 2 + (p[0] - W / 2) * k, H * .48 + (p[1] - H * .48) * k]); } // stars fly out from the middle

      // home: hovering near a constellation lights it up
      let boost = 1;
      if (!zoom && mx > -999) {
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        pts.forEach((p) => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
        if (mx > x0 - 40 && mx < x1 + 40 && my > y0 - 40 && my < y1 + 40) boost = 1.8;
      }

      // lines: dotted, and they bow side to side like a plucked string (ends pinned to the stars)
      c.e.forEach((e, ei) => {
        const a = pts[e[0]], b = pts[e[1]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
        const sway = (zoom ? 9 : 6) * Math.sin(t * 1.1 + ei * .8 + ci * 1.9); // px the middle drifts
        const steps = Math.max(1, Math.floor(L / S));
        for (let q = 0; q <= steps; q++) {
          if (q % 3 === 2) continue; // skip every 3rd dot → dotted look
          const bow = sway * Math.sin(Math.PI * q / steps);
          add(a[0] + dx * q / steps - dy / L * bow, a[1] + dy * q / steps + dx / L * bow, (zoom ? .5 : .45) * boost);
        }
      });

      // stars: soft glow + 4-point flare that only pops at the peak of each flicker
      pts.forEach((p, pi) => {
        const pulse = .8 + .2 * Math.sin(t * 1.8 + pi * 1.3 + ci * 2.1);
        const sel = zoom && pi === selected ? 1.6 : 1;            // the open card's star stays bright
        const s = (c.s ? c.s[pi] : 1) * pulse * boost * sel * (zoom ? 0.6 + 0.4 * z : 1);
        const flare = pulse > .9 || sel > 1;
        const RR = zoom ? 9 : 6, sig = S * (zoom ? 1.8 : 1.3), reach = S * (zoom ? 8 : 5);
        const ic = Math.floor(p[0] / S), jc = Math.floor(p[1] / S);
        for (let dj = -RR; dj <= RR; dj++) for (let di = -RR; di <= RR; di++) {
          const x = (ic + di) * S + S / 2, y = (jc + dj) * S + S / 2, ddx = x - p[0], ddy = y - p[1], d = Math.hypot(ddx, ddy);
          let v = s * (zoom ? 1.5 : 1.4) * Math.exp(-(d * d) / (2 * sig * sig));
          if (flare && (Math.abs(ddx) < S * .6 || Math.abs(ddy) < S * .6)) v += s * (zoom ? .8 : .7) * Math.max(0, 1 - d / reach);
          add(x, y, v);
        }
      });
    });

    // 3. one shooting star every ~8s, only visible for a short slice of the cycle
    const ph = (t % 8) / 8;
    if (ph < .16) {
      const u = ph / .16, ddx = .45 * W, ddy = .2 * H, L = Math.hypot(ddx, ddy);
      const hx = W * .08 + ddx * u, hy = H * .06 + ddy * u;
      for (let k = 0; k < 28; k++) add(hx - ddx / L * k * S, hy - ddy / L * k * S, 1.1 * (1 - k / 28) * (1 - u * .6));
    }

    // 4. cursor comet: bright head + tail that fades out over 0.6s
    const now = performance.now() / 1000;
    while (trail.length && now - trail[0].t > .6) trail.shift();
    for (let m = 1; m < trail.length; m++) {
      const p0 = trail[m - 1], p1 = trail[m], st = Math.max(1, Math.ceil(Math.hypot(p1.x - p0.x, p1.y - p0.y) / (S * .6)));
      for (let u = 0; u < st; u++) {
        const f = u / st, life = Math.max(0, 1 - (now - (p0.t + (p1.t - p0.t) * f)) / .6);
        add(p0.x + (p1.x - p0.x) * f, p0.y + (p1.y - p0.y) * f, .95 * life * life);
      }
    }
    if (mx > -999) for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { const d = Math.hypot(di, dj) * S; add(mx + di * S, my + dj * S, 1.3 * Math.exp(-(d * d) / (2 * S * S))); }

    // 5. render: three passes so we only switch fill color 3x per frame
    const passes = [[.08, .35, o.accent, .45], [.35, .75, o.accent, .85], [.75, 99, o.bright, 1]];
    passes.forEach(([lo, hi, color, alpha]) => {
      g.beginPath();
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const b = B[j * cols + i]; if (b < lo || b >= hi) continue;
        const r = Math.min(1, b) * S * .58; if (r < .6) continue; // dot radius = brightness
        const x = i * S + S / 2, y = j * S + S / 2; g.moveTo(x + r, y); g.arc(x, y, r, 0, 6.2832);
      }
      g.globalAlpha = alpha; g.fillStyle = color; g.fill();
    });
    g.globalAlpha = 1;
  }

  const loop = (now) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
  if (still) draw(10); else raf = requestAnimationFrame(loop);

  return {
    setSelected(i) { selected = i; if (still) draw(10); },           // zoom: pass -1 to clear
    setMode(mode, constellations) {                                  // switch views without a new canvas
      o.mode = mode; if (constellations) o.constellations = constellations;
      t0 = performance.now();                                        // restarts the zoom-in
      if (still) draw(10);
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    }
  };
}
