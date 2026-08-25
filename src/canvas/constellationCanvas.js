import gsap from 'gsap';
import { createSceneData } from '../data/constellationData.js';
import { playClickSound, unlockClickSound } from '../audio/clickSound.js';
import {
  prepareStarField,
  createStarFieldRuntime,
  tickStarField,
  drawStarField
} from './starFieldAnimation.js';
import { createCrystalPopup } from '../easter-eggs/crystal-popup/index.js';

/**
 * Initializes the constellation canvas animation and interaction loop.
 * Animation runs outside React's render cycle via requestAnimationFrame.
 *
 * Motion rules of the house:
 *  - every visual state is a continuous value smoothed toward a target, never a branch;
 *  - every easing step is scaled by real delta time, so 60Hz and 120Hz look identical;
 *  - all text is drawn in screen space so it never blurs or balloons with the camera.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ isDetailOpen: () => boolean, onShowCard: (con: object, item: object) => void, onHideCard: () => void }} callbacks
 * @returns {() => void} cleanup function
 */
export function initConstellationCanvas(canvas, callbacks) {
  const ctx = canvas.getContext('2d');

  const REF_W = 1400;
  const REF_H = 900;
  const BASE_HIT_RADIUS = 198;
  const ZOOM_SCALE = 2.2;
  const SPREAD = 1.22;
  const SKY_TEXT_OPACITY = 0.88;
  const WELCOME_TITLE = "welcome to crystal's universe";
  const STAR_R_LABELED = 9.5;
  const STAR_R_PLAIN = 5.8;
  const STAR_R_REVEAL = 3;
  /** Vertical arms run this much longer than horizontal ones. */
  const STAR_STRETCH = 1.2;
  const INTRO_DURATION = 1.5;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- easing */

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (v) => { const c = clamp01(v); return c * c * (3 - 2 * c); };
  const easeOutCubic = (v) => 1 - Math.pow(1 - clamp01(v), 3);

  /**
   * Frame-rate independent approach. `tau` is roughly the seconds it takes to
   * close 63% of the remaining gap, so the feel stays identical at any fps.
   */
  const approach = (current, target, tau, dt) =>
    current + (target - current) * (1 - Math.exp(-dt / tau));

  function skyText(alpha = 1) {
    return `rgba(255, 255, 255, ${SKY_TEXT_OPACITY * clamp01(alpha)})`;
  }

  /**
   * Trace a four-armed sparkle as a subpath (the caller owns beginPath/fill, so
   * several sparkles can be filled as one union without double-compositing).
   *
   * Each arm is a pair of quadratic curves whose control point sits close to the
   * centre — that pinch is what tapers the arms to fine points and reads as a
   * twinkle rather than a polygon.
   */
  function traceSparkle(x, y, radius, rotation, waist, stretch) {
    const base = -Math.PI / 2 + rotation;
    const armRadius = (i) => radius * (i % 2 === 0 ? stretch : 1 / stretch);
    const tipAt = (i) => {
      const a = base + (i * Math.PI) / 2;
      const r = armRadius(i);
      return { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r };
    };

    const start = tipAt(0);
    ctx.moveTo(start.x, start.y);
    for (let i = 0; i < 4; i++) {
      const next = tipAt(i + 1);
      const valley = base + (i * Math.PI) / 2 + Math.PI / 4;
      const cpR = radius * waist;
      ctx.quadraticCurveTo(
        x + Math.cos(valley) * cpR,
        y + Math.sin(valley) * cpR,
        next.x,
        next.y
      );
    }
    ctx.closePath();
  }

  /** Canvas letter-spacing is recent; degrade quietly where it is missing. */
  const hasTracking = 'letterSpacing' in ctx;
  function setTracking(value) {
    if (hasTracking) ctx.letterSpacing = value;
  }

  /* ------------------------------------------------------------------ scene */

  let W = window.innerWidth;
  let H = window.innerHeight;
  let layoutScale = 1;
  let typeScale = 1;

  const { bgStars, CONSTELLATIONS } = createSceneData();
  const starField = prepareStarField(bgStars);
  const starRuntime = createStarFieldRuntime();

  CONSTELLATIONS.forEach((con) => {
    con.hoverT = 0;
    con.dimT = 0;
    con.proxT = 0;
  });

  /** Design-space geometry with inter-constellation spread already applied. */
  const designCentroid = (() => {
    const all = CONSTELLATIONS.flatMap((con) => con.designStars);
    return {
      x: all.reduce((s, p) => s + p.x, 0) / all.length,
      y: all.reduce((s, p) => s + p.y, 0) / all.length
    };
  })();

  const designBox = (() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    CONSTELLATIONS.forEach((con) => {
      const cx = con.designStars.reduce((s, p) => s + p.x, 0) / con.designStars.length;
      const cy = con.designStars.reduce((s, p) => s + p.y, 0) / con.designStars.length;
      con.designOffset = {
        x: (cx - designCentroid.x) * SPREAD,
        y: cy - designCentroid.y
      };
      con.designLocal = con.designStars.map((p) => ({ x: p.x - cx, y: p.y - cy }));
      con.designLocal.forEach((p) => {
        const x = con.designOffset.x + p.x;
        const y = con.designOffset.y + p.y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    });
    return { w: maxX - minX, h: maxY - minY };
  })();

  /* ------------------------------------------------------------ background */

  let skyGradient = null;
  let horizonGradient = null;
  let atmosphereGradients = [];
  const ATMOSPHERE_RINGS = 45;
  let earthCX = 0, earthCY = 0, earthRX = 0, earthRY = 0;

  function positionConstellations() {
    const originX = W * 0.5;
    const originY = H * 0.42;

    CONSTELLATIONS.forEach((con) => {
      con.stars = con.designLocal.map((p) => ({
        x: originX + (con.designOffset.x + p.x) * layoutScale,
        y: originY + (con.designOffset.y + p.y) * layoutScale
      }));
      con.cx = con.stars.reduce((s, p) => s + p.x, 0) / con.stars.length;
      con.cy = con.stars.reduce((s, p) => s + p.y, 0) / con.stars.length;
      con.nameX = con.cx;
      con.nameY = Math.max(...con.stars.map((p) => p.y)) + 34 * layoutScale;
      con.hitRadius = BASE_HIT_RADIUS * layoutScale;
    });
  }

  function buildGradients() {
    skyGradient = ctx.createLinearGradient(0, 0, 0, H);
    skyGradient.addColorStop(0, '#01040b');
    skyGradient.addColorStop(0.25, '#020610');
    skyGradient.addColorStop(0.5, '#040914');
    skyGradient.addColorStop(0.7, '#06101f');
    skyGradient.addColorStop(0.85, '#08122a');
    skyGradient.addColorStop(1, '#020712');

    horizonGradient = ctx.createLinearGradient(W * 0.05, 0, W * 0.95, 0);
    horizonGradient.addColorStop(0, 'rgba(255,255,255,0)');
    horizonGradient.addColorStop(0.15, 'rgba(230,220,255,0.65)');
    horizonGradient.addColorStop(0.5, 'rgba(255,253,255,0.95)');
    horizonGradient.addColorStop(0.85, 'rgba(230,220,255,0.65)');
    horizonGradient.addColorStop(1, 'rgba(255,255,255,0)');

    // One gradient per ring, built once per resize instead of 45 per frame.
    atmosphereGradients = Array.from({ length: ATMOSPHERE_RINGS }, (_, i) => {
      const fade = 1 - i / ATMOSPHERE_RINGS;
      const al = fade * fade * 0.11;
      const g = ctx.createLinearGradient(W * 0.05, 0, W * 0.95, 0);
      g.addColorStop(0, 'rgba(52,72,164,0)');
      g.addColorStop(0.12, `rgba(74,96,198,${al * 0.55})`);
      g.addColorStop(0.5, `rgba(102,124,224,${al * 1.02})`);
      g.addColorStop(0.88, `rgba(74,96,198,${al * 0.55})`);
      g.addColorStop(1, 'rgba(52,72,164,0)');
      return g;
    });
  }

  function setupCanvas() {
    W = Math.max(320, window.innerWidth);
    H = Math.max(420, window.innerHeight);

    // Fit the whole sky inside the viewport instead of overflowing small ones.
    const fit = Math.min((W * 0.9) / designBox.w, (H * 0.58) / designBox.h);
    layoutScale = Math.min(1.25, Math.max(0.34, fit));
    typeScale = Math.min(1.18, Math.max(0.78, Math.min(W / REF_W, H / REF_H)));

    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    earthCX = W / 2;
    earthCY = H + 1860;
    earthRX = W * 2.2;
    earthRY = 2000;

    buildGradients();
    positionConstellations();
  }
  setupCanvas();

  /* ------------------------------------------------------- line shimmer */

  function initLineTweens() {
    CONSTELLATIONS.forEach((con) => {
      con.edgesMeta.forEach((line) => {
        if (reduceMotion) {
          line.alpha = 0.6;
          line.glow = 0.3;
          line.flowCenter = 0.5;
          return;
        }
        gsap.to(line, {
          alpha: 0.8,
          duration: gsap.utils.random(2, 4),
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: gsap.utils.random(0, 2)
        });
        gsap.to(line, {
          glow: gsap.utils.random(0.28, 0.42),
          duration: gsap.utils.random(2.2, 4.4),
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: gsap.utils.random(0, 2)
        });
        gsap.to(line, {
          flowCenter: gsap.utils.random(0.18, 0.82),
          duration: gsap.utils.random(5.5, 9),
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: gsap.utils.random(0, 2)
        });
      });
    });
  }
  initLineTweens();

  /* ------------------------------------------------------ shooting stars */

  const shootingStars = [];

  function spawnShootingStar(delayMin = 2, delayMax = 10) {
    const entryType = Math.random();
    let angle, startX, startY;
    if (entryType < 0.34) {
      angle = Math.PI / 4 + (Math.random() - 0.5) * 0.35;
      startX = Math.random() * W;
      startY = -40 - Math.random() * (H * 0.12);
    } else if (entryType < 0.67) {
      angle = Math.PI / 6 + (Math.random() - 0.5) * 0.35;
      startX = -40 - Math.random() * (W * 0.08);
      startY = Math.random() * (H * 0.55);
    } else {
      angle = (5 * Math.PI) / 6 + (Math.random() - 0.5) * 0.35;
      startX = W + 40 + Math.random() * (W * 0.08);
      startY = Math.random() * (H * 0.55);
    }
    const speed = 420 + Math.random() * 300;
    shootingStars.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
      age: -(delayMin + Math.random() * (delayMax - delayMin)),
      life: 0.7 + Math.random() * 0.55,
      tail: 70 + Math.random() * 60
    });
  }

  if (!reduceMotion) {
    for (let i = 0; i < 3; i++) spawnShootingStar(i * 2.4, 10 + i * 2.5);
  }

  function drawShootingStars(dt) {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const m = shootingStars[i];
      m.age += dt;
      if (m.age < 0) continue;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      const p = m.age / m.life;
      const offscreen = m.x < -260 || m.x > W + 260 || m.y < -260 || m.y > H * 0.9;
      if (p >= 1 || offscreen) {
        shootingStars.splice(i, 1);
        spawnShootingStar(3.5, 11);
        continue;
      }
      const alpha = Math.sin(Math.PI * p) * 0.55;
      const tx = m.x - m.dirX * m.tail;
      const ty = m.y - m.dirY * m.tail;
      const g = ctx.createLinearGradient(tx, ty, m.x, m.y);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.35, `rgba(206,216,255,${alpha * 0.35})`);
      g.addColorStop(1, `rgba(255,255,255,${alpha})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
    }
  }

  function drawBg(dt) {
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, W, H);

    tickStarField(starRuntime, dt, mouse, W, H);
    drawStarField(ctx, starField, starRuntime, W, H, layoutScale);

    drawShootingStars(dt);

    ctx.beginPath();
    ctx.ellipse(earthCX, earthCY, earthRX, earthRY, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#05040e';
    ctx.fill();

    ctx.lineWidth = 4.5;
    for (let i = 0; i < ATMOSPHERE_RINGS; i++) {
      const ex = i * 3.8;
      ctx.strokeStyle = atmosphereGradients[i];
      ctx.beginPath();
      ctx.ellipse(earthCX, earthCY, earthRX + ex, earthRY + ex, 0, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }

    ctx.strokeStyle = horizonGradient;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(earthCX, earthCY, earthRX, earthRY, 0, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  }

  /* ----------------------------------------------------- interaction state */

  let hoveredConstellation = -1;
  let activeConstellation = -1;
  let targetZoom = 0;
  let zoomRaw = 0;
  let zoomEase = 0;
  let mouse = { x: W * 0.5, y: H * 0.5 };
  let hasPointer = false;
  let pointerFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let cam = { scale: 1, tx: 0, ty: 0 };
  let cursorStyle = 'default';
  const crystalPopup = createCrystalPopup(ctx);

  const cursorRibbon = [];
  const MAX_RIBBON_POINTS = 44;
  const MAX_RIBBON_LENGTH = 195;
  const RIBBON_TAU = 0.026;
  let ribbonTarget = { x: W * 0.5, y: H * 0.5 };
  let ribbonAlpha = 0;

  const getScreenXY = (x, y) => ({ x: x * cam.scale + cam.tx, y: y * cam.scale + cam.ty });
  const getWorldXY = (x, y) => ({ x: (x - cam.tx) / cam.scale, y: (y - cam.ty) / cam.scale });

  function welcomeTitleSize() {
    return 46 * typeScale;
  }

  function welcomeTitleY() {
    return H - 78 * typeScale + (1 - introT) * 10;
  }

  function welcomeSubtitleY() {
    return H - 40 * typeScale + (1 - introT) * 10;
  }

  function welcomeFadeNow() {
    return introT * (activeConstellation !== -1 ? 1 - smoothstep(zoomEase / 0.45) : 1);
  }

  function updatePointer(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (W / r.width);
    mouse.y = (e.clientY - r.top) * (H / r.height);
    ribbonTarget.x = mouse.x;
    ribbonTarget.y = mouse.y;
    if (!hasPointer) {
      hasPointer = true;
      cursorRibbon.length = 0;
    }
  }

  function updateHover() {
    if (activeConstellation !== -1) return;
    hoveredConstellation = -1;
    let best = Infinity;
    for (let i = 0; i < CONSTELLATIONS.length; i++) {
      const con = CONSTELLATIONS[i];
      const d = Math.hypot(mouse.x - con.cx, mouse.y - con.cy);
      if (d < con.hitRadius && d < best) {
        best = d;
        hoveredConstellation = i;
      }
    }
  }

  function onPointerMove(e) {
    updatePointer(e);
    updateHover();
  }

  function onPointerDown(e) {
    // Touch and pen get no hover pass, so resolve the target on contact.
    updatePointer(e);
    updateHover();
    unlockClickSound();
    crystalPopup.unlock();
  }

  function onPointerLeave() {
    if (activeConstellation === -1) hoveredConstellation = -1;
    hasPointer = false;
    crystalPopup.hide();
  }

  function onClick() {
    if (callbacks.isDetailOpen()) return;

    if (activeConstellation === -1) {
      if (hoveredConstellation !== -1) {
        playClickSound();
        activeConstellation = hoveredConstellation;
        targetZoom = 1;
        hoveredConstellation = -1;
        callbacks.onHideCard();
      }
      return;
    }

    const con = CONSTELLATIONS[activeConstellation];
    const settled = zoomEase > 0.5;

    if (settled) {
      let hit = null;
      let bestDist = Infinity;
      const reach = 46 * typeScale;
      con.items.forEach((item) => {
        const sp = getScreenXY(con.stars[item.star].x, con.stars[item.star].y);
        const d = Math.hypot(mouse.x - sp.x, mouse.y - sp.y);
        if (d < reach && d < bestDist) {
          bestDist = d;
          hit = item;
        }
      });
      if (hit) {
        playClickSound();
        callbacks.onShowCard(con, hit);
        return;
      }
    }

    const world = getWorldXY(mouse.x, mouse.y);
    if (Math.hypot(world.x - con.cx, world.y - con.cy) > con.hitRadius * 1.35) {
      playClickSound();
      targetZoom = 0;
    }
    callbacks.onHideCard();
  }

  function onKeyDown(e) {
    if (e.key !== 'Escape') return;
    if (callbacks.isDetailOpen()) {
      callbacks.onHideCard();
      return;
    }
    if (activeConstellation !== -1 || targetZoom > 0) {
      targetZoom = 0;
      callbacks.onHideCard();
    }
  }

  /* -------------------------------------------------------------- ribbon */

  function updateRibbon(dt) {
    const k = 1 - Math.exp(-dt / RIBBON_TAU);

    if (cursorRibbon.length === 0) {
      for (let i = 0; i < MAX_RIBBON_POINTS; i++) {
        cursorRibbon.push({ x: ribbonTarget.x, y: ribbonTarget.y });
      }
    }

    cursorRibbon[0].x += (ribbonTarget.x - cursorRibbon[0].x) * k;
    cursorRibbon[0].y += (ribbonTarget.y - cursorRibbon[0].y) * k;
    for (let i = 1; i < cursorRibbon.length; i++) {
      cursorRibbon[i].x += (cursorRibbon[i - 1].x - cursorRibbon[i].x) * k;
      cursorRibbon[i].y += (cursorRibbon[i - 1].y - cursorRibbon[i].y) * k;
    }

    let length = 0;
    let keepCount = cursorRibbon.length;
    for (let i = 1; i < cursorRibbon.length; i++) {
      length += Math.hypot(
        cursorRibbon[i].x - cursorRibbon[i - 1].x,
        cursorRibbon[i].y - cursorRibbon[i - 1].y
      );
      if (length > MAX_RIBBON_LENGTH) {
        keepCount = i + 1;
        break;
      }
    }
    if (keepCount < cursorRibbon.length) cursorRibbon.splice(keepCount);
    while (cursorRibbon.length < MAX_RIBBON_POINTS) {
      const tail = cursorRibbon[cursorRibbon.length - 1];
      cursorRibbon.push({ x: tail.x, y: tail.y });
    }
  }

  function drawRibbon() {
    if (ribbonAlpha < 0.01 || cursorRibbon.length <= 2) return;
    const head = cursorRibbon[0];
    const tail = cursorRibbon[cursorRibbon.length - 1];
    const gradient = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
    gradient.addColorStop(0, `rgba(226,228,236,${0.74 * ribbonAlpha})`);
    gradient.addColorStop(1, 'rgba(178,182,204,0)');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    for (let i = 1; i < cursorRibbon.length - 1; i += 2) {
      const next = Math.min(i + 2, cursorRibbon.length - 1);
      ctx.quadraticCurveTo(
        cursorRibbon[i].x,
        cursorRibbon[i].y,
        (cursorRibbon[i].x + cursorRibbon[next].x) * 0.5,
        (cursorRibbon[i].y + cursorRibbon[next].y) * 0.5
      );
    }
    ctx.lineTo(tail.x, tail.y);
    ctx.stroke();
  }

  /* ---------------------------------------------------------------- intro */

  let fontsSettled = false;
  let sceneStart = null;
  let introT = 0;
  const fontTimer = window.setTimeout(() => { fontsSettled = true; }, 900);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { fontsSettled = true; });
  } else {
    fontsSettled = true;
  }

  /* ----------------------------------------------------------------- loop */

  let animationFrameId = null;
  let lastTs = null;

  function loop(ts) {
    const now = ts * 0.001;
    // Clamped so a backgrounded tab or a long paint catches up in one step
    // instead of teleporting, while a genuinely slow device still keeps pace.
    const dt = lastTs === null ? 1 / 60 : Math.min(0.12, Math.max(0.0005, now - lastTs));
    lastTs = now;

    if (fontsSettled && sceneStart === null) sceneStart = now;
    introT = sceneStart === null ? 0 : easeOutCubic((now - sceneStart) / INTRO_DURATION);

    zoomRaw = approach(zoomRaw, targetZoom, 0.26, dt);
    if (targetZoom === 0 && zoomRaw < 0.004) {
      zoomRaw = 0;
      activeConstellation = -1;
    }
    zoomEase = smoothstep(zoomRaw);
    // Stars ease down a touch when zoomed, so they don't overpower the labels.
    const zoomStarScale = lerp(1, 0.8, zoomEase);

    if (activeConstellation !== -1) {
      const focus = CONSTELLATIONS[activeConstellation];
      const focusTargetY = focus.name === 'Experiences' ? H * 0.5 : H * 0.45;
      cam.scale = lerp(1, ZOOM_SCALE, zoomEase);
      cam.tx = lerp(0, W / 2 - focus.cx * ZOOM_SCALE, zoomEase);
      cam.ty = lerp(0, focusTargetY - focus.cy * ZOOM_SCALE, zoomEase);
    } else {
      cam.scale = 1;
      cam.tx = 0;
      cam.ty = 0;
    }

    const welcomeFade = welcomeFadeNow();
    const titleSize = welcomeTitleSize();
    const titleY = welcomeTitleY();
    const subtitleY = welcomeSubtitleY();
    crystalPopup.update({
      dt,
      mouse,
      hasPointer,
      pointerFine,
      welcomeFade,
      typeScale,
      W,
      titleY,
      titleSize
    });

    const wantsPointer =
      (activeConstellation === -1 && hoveredConstellation !== -1) || crystalPopup.isHovering();
    const nextCursor = wantsPointer ? 'pointer' : 'default';
    if (nextCursor !== cursorStyle) {
      cursorStyle = nextCursor;
      canvas.style.cursor = nextCursor;
    }

    ribbonAlpha = approach(
      ribbonAlpha,
      !reduceMotion && pointerFine && hasPointer ? 1 : 0,
      0.18,
      dt
    );
    if (!reduceMotion && pointerFine) updateRibbon(dt);

    drawBg(dt);

    /* ---- constellations: geometry inside the camera, text in screen space */

    ctx.save();
    ctx.translate(cam.tx, cam.ty);
    ctx.scale(cam.scale, cam.scale);

    const textPasses = [];

    CONSTELLATIONS.forEach((con, ci) => {
      const isActive = activeConstellation === ci;
      const reveal = isActive ? smoothstep((zoomEase - 0.32) / 0.5) : 0;

      // Every state below is a smoothed scalar, so nothing pops on hover.
      con.hoverT = approach(
        con.hoverT,
        activeConstellation === -1 && hoveredConstellation === ci ? 1 : 0,
        0.14,
        dt
      );
      con.dimT = approach(
        con.dimT,
        activeConstellation === -1 && hoveredConstellation !== -1 && hoveredConstellation !== ci ? 1 : 0,
        0.2,
        dt
      );

      const conScreen = getScreenXY(con.cx, con.cy);
      const rawProximity = clamp01(
        1 - Math.hypot(mouse.x - conScreen.x, mouse.y - conScreen.y) / (260 * typeScale)
      );
      con.proxT = approach(con.proxT, hasPointer ? rawProximity : 0, 0.12, dt);

      const introFade = smoothstep((introT - ci * 0.07) / 0.55);
      const zoomFade = isActive || activeConstellation === -1 ? 1 : 1 - zoomEase;
      const presence = introFade * zoomFade * lerp(1, 0.42, con.dimT);
      if (presence < 0.004) return;

      const starGain = presence * (1 + con.proxT * 0.18 + con.hoverT * 0.3);
      const lineGain = presence * (1 + con.proxT * 0.24 + con.hoverT * 1.05);

      con.edges.forEach(([a, b], ei) => {
        const sa = con.stars[a];
        const sb = con.stars[b];
        const meta = con.edgesMeta[ei];
        const flowCenter = meta.flowCenter;
        const left = Math.max(0, flowCenter - 0.33);
        const right = Math.min(1, flowCenter + 0.33);
        const lineAlpha = meta.alpha * lineGain;

        const lg = ctx.createLinearGradient(sa.x, sa.y, sb.x, sb.y);
        const core = lineAlpha + (meta.glow + 0.24 * con.hoverT) * presence;
        lg.addColorStop(0, `rgba(188,194,214,${lineAlpha})`);
        lg.addColorStop(left, `rgba(188,194,214,${lineAlpha * 0.9})`);
        lg.addColorStop(flowCenter, `rgba(246,248,255,${core})`);
        lg.addColorStop(right, `rgba(188,194,214,${lineAlpha * 0.9})`);
        lg.addColorStop(1, `rgba(188,194,214,${lineAlpha})`);
        ctx.strokeStyle = lg;
        ctx.lineWidth = (1.2 + 0.35 * con.hoverT + 0.15 * reveal) / Math.max(1, cam.scale * 0.62);

        const midX = (sa.x + sb.x) * 0.5;
        const midY = (sa.y + sb.y) * 0.5;
        const edx = sb.x - sa.x;
        const edy = sb.y - sa.y;
        const elen = Math.hypot(edx, edy) || 1;
        const wobble = reduceMotion
          ? 0
          : Math.sin(now * meta.wobbleSpeed + meta.wobblePhase) * meta.wobbleAmp * layoutScale;
        ctx.beginPath();
        ctx.moveTo(sa.x, sa.y);
        ctx.quadraticCurveTo(
          midX + (-edy / elen) * wobble,
          midY + (edx / elen) * wobble,
          sb.x,
          sb.y
        );
        ctx.stroke();
      });

      con.stars.forEach((s, si) => {
        const isLabeled = con.labeledStars.includes(si);
        const isItemStar = con.items.some((item) => item.star === si);
        const twinkle = isLabeled && !reduceMotion
          ? 0.9 + 0.1 * Math.sin(now * 2.2 + si * 1.7 + ci * 0.9)
          : 1;
        const outer =
          ((isLabeled ? STAR_R_LABELED : STAR_R_PLAIN) +
            (isItemStar ? STAR_R_REVEAL * reveal : 0)) *
          layoutScale *
          twinkle *
          zoomStarScale;

        if (isLabeled) {
          const glowR = (20 + 7 * reveal) * layoutScale * zoomStarScale;
          const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
          glow.addColorStop(0, `rgba(180,205,255,${0.48 * starGain * twinkle})`);
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // A star is as opaque as its constellation is present, so the lines
        // running beneath it never show through the body. The twinkle lives in
        // the size and the glow rather than in this fill.
        ctx.fillStyle = `rgba(225,235,255,${clamp01(starGain)})`;

        // A whisper of rotation keeps the arms from looking stamped on.
        const spin = reduceMotion ? 0 : Math.sin(now * 0.5 + si * 2.1 + ci) * 0.06;
        const core = outer * 0.17;

        ctx.beginPath();
        traceSparkle(s.x, s.y, outer, spin, 0.17, STAR_STRETCH);
        if (isLabeled) {
          // A second sparkle turned 45° gives the bright ones eight points.
          traceSparkle(s.x, s.y, outer * 0.5, spin + Math.PI / 4, 0.22, 1);
        }
        // Round core: seats the arms together and hides the line ends that
        // would otherwise poke out through the pinched valleys.
        ctx.moveTo(s.x + core, s.y);
        ctx.arc(s.x, s.y, core, 0, Math.PI * 2);
        ctx.fill();
      });

      textPasses.push({ con, ci, isActive, reveal, presence });
    });

    ctx.restore();

    crystalPopup.drawSprite({
      W,
      titleSize,
      earth: { cx: earthCX, cy: earthCY, rx: earthRX, ry: earthRY, H }
    });

    /* ---- text pass: crisp, unscaled, positions lerped instead of jumped */

    ctx.textAlign = 'center';

    textPasses.forEach(({ con, isActive, reveal, presence }) => {
      const rest = getScreenXY(con.nameX, con.nameY);
      const landedX = W / 2;
      const landedY = H - 82 * typeScale;
      const t = isActive ? zoomEase : 0;

      const x = lerp(rest.x, landedX, t);
      const y = lerp(rest.y, landedY, t);
      const size = lerp(23, 34, t) * typeScale;

      setTracking(`${lerp(0.12, 0.22, t).toFixed(3)}em`);
      ctx.font = `500 ${size.toFixed(1)}px "Cormorant Garamond", serif`;
      ctx.fillStyle = skyText(presence);
      ctx.fillText(con.name.toLowerCase(), x, y);
      setTracking('0em');

      if (reveal <= 0.01) return;
      ctx.font = `500 ${(21 * typeScale).toFixed(1)}px "Cormorant Garamond", serif`;
      ctx.fillStyle = skyText(reveal * presence);
      // Clear the star's topmost point, which grows with both zoom and reveal.
      const pointReach =
        (STAR_R_LABELED + STAR_R_REVEAL * reveal) *
        STAR_STRETCH *
        layoutScale *
        cam.scale *
        zoomStarScale;
      con.items.forEach((item) => {
        if (!item.label) return;
        const sp = getScreenXY(con.stars[item.star].x, con.stars[item.star].y);
        // Labels settle downward into place as they fade in.
        ctx.fillText(
          item.label.toLowerCase(),
          sp.x,
          sp.y - pointReach - (13 + 8 * (1 - reveal)) * typeScale
        );
      });
    });

    // Clear the welcome block early: the section title is travelling into that
    // same spot, and the two must never share it.
    if (welcomeFade > 0.02) {
      crystalPopup.drawSillyLine({
        welcomeFade,
        typeScale,
        W,
        titleY,
        subtitleY,
        titleSize,
        skyText
      });
      ctx.font = `500 ${titleSize.toFixed(1)}px "Cormorant Garamond", serif`;
      ctx.fillStyle = skyText(welcomeFade);
      ctx.fillText(WELCOME_TITLE, W / 2, titleY);
      ctx.font = `500 ${(27 * typeScale).toFixed(1)}px "Cormorant Garamond", serif`;
      ctx.fillStyle = skyText(welcomeFade * 0.82);
      ctx.fillText(
        'have fun exploring the stars!',
        W / 2,
        subtitleY
      );
    }

    const hintFade = smoothstep((zoomEase - 0.5) / 0.45);
    if (hintFade > 0.02) {
      setTracking('0.18em');
      ctx.font = `500 ${(15 * typeScale).toFixed(1)}px "Cormorant Garamond", serif`;
      ctx.fillStyle = `rgba(255,255,255,${0.4 * hintFade})`;
      ctx.fillText(
        pointerFine ? 'click a star  ·  esc to return' : 'tap a star  ·  tap outside to return',
        W / 2,
        H - 44 * typeScale
      );
      setTracking('0em');
    }

    drawRibbon();

    animationFrameId = requestAnimationFrame(loop);
  }

  /* -------------------------------------------------------------- wiring */

  const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const onPointerQueryChange = (e) => { pointerFine = e.matches; };
  if (pointerQuery.addEventListener) {
    pointerQuery.addEventListener('change', onPointerQueryChange);
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointercancel', onPointerLeave);
  canvas.addEventListener('click', onClick);
  window.addEventListener('resize', setupCanvas);
  window.addEventListener('orientationchange', setupCanvas);
  window.addEventListener('keydown', onKeyDown);

  animationFrameId = requestAnimationFrame(loop);

  return () => {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    window.clearTimeout(fontTimer);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('pointercancel', onPointerLeave);
    canvas.removeEventListener('click', onClick);
    window.removeEventListener('resize', setupCanvas);
    window.removeEventListener('orientationchange', setupCanvas);
    window.removeEventListener('keydown', onKeyDown);
    if (pointerQuery.removeEventListener) {
      pointerQuery.removeEventListener('change', onPointerQueryChange);
    }
    gsap.killTweensOf(CONSTELLATIONS.flatMap((con) => con.edgesMeta));
    crystalPopup.dispose();
  };
}
