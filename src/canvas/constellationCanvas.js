import { createSceneData } from '../data/constellationData.js';
import { playClickSound, unlockClickSound } from '../audio/clickSound.js';
import { createCrystalPopup } from '../easter-eggs/crystal-popup/index.js';

/**
 * Text + interaction layer for the constellation map.
 *
 * The sky itself (stars, lines, horizon, shooting star, cursor comet) is drawn
 * by halftone-sky.js on a separate canvas behind this one. This module owns the
 * layout, hit areas, camera, labels and click handling, and reports the real
 * star positions to that renderer through `callbacks.onSkyChange` so the dots
 * always sit exactly where the labels and hit areas are.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   isDetailOpen: () => boolean,
 *   onShowCard: (con: object, item: object) => void,
 *   onHideCard: () => void,
 *   onSkyChange?: (mode: 'home' | 'zoom', constellations: object[]) => void
 * }} callbacks
 * @returns {() => void} cleanup function
 */
export function initConstellationCanvas(canvas, callbacks) {
  const ctx = canvas.getContext('2d');

  const REF_W = 1400;
  const REF_H = 900;
  const BASE_HIT_RADIUS = 198;
  const ZOOM_SCALE = 2.2;
  const SPREAD = 1.22;
  /** Design-space room under a cluster for its section name. */
  const NAME_CLEARANCE = 52;
  const CLUSTER_GAP = 32;
  /** On phones only: drawn size relative to the stacked-layout fit. */
  const CLUSTER_SCALE = 0.75;
  const WELCOME_TITLE = "welcome to crystal's universe";

  /* --------------------------------------------------------------- styling */

  const MONO = '"Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  const DISPLAY = `Doto, ${MONO}`;
  const SKY_HEX = '#060a14';
  const LABEL_RGB = [201, 214, 242]; // #c9d6f2
  const HEAD_RGB = [242, 245, 255]; // #f2f5ff
  const MUTED_RGB = [143, 163, 201]; // #8fa3c9
  const HEADING_PX = 32;
  const ZOOM_TITLE_PX = 28;
  const LABEL_PX = 13;
  const SUBTITLE_PX = 12;
  const BACK_PX = 13;
  const HEADING_TRACKING_EM = 0.04;
  const LABEL_TRACKING_EM = 0.08;
  /** Heading baseline distance from the bottom edge. */
  const HEADING_BOTTOM = 56;
  /** Subtitle / back-link baseline distance from the bottom edge. */
  const FOOT_BOTTOM = 30;
  /** Zoomed star labels wait this long after the push-in starts. */
  const LABEL_DELAY = 1.2;
  /** The one text entrance used everywhere: fade in while rising this far. */
  const POP_DURATION = 0.35;
  const POP_RISE = 8;
  const POP_OUT_TAU = 0.06;
  const INTRO_DELAY = 0.15;
  const RETURN_DELAY = 0.2;
  const ZOOM_TITLE_DELAY = 0.6;
  /** Footer line (subtitle / back hint) follows its title by this much. */
  const FOOT_STAGGER = 0.08;
  /** halftone-sky.js puts its dome horizon's apex at this share of the height. */
  const HORIZON_FRAC = 0.82;
  const HORIZON_R_OVER_W = 1.1;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- easing */

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (v) => { const c = clamp01(v); return c * c * (3 - 2 * c); };

  /**
   * Frame-rate independent approach. `tau` is roughly the seconds it takes to
   * close 63% of the remaining gap, so the feel stays identical at any fps.
   */
  const approach = (current, target, tau, dt) =>
    current + (target - current) * (1 - Math.exp(-dt / tau));

  const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${clamp01(a)})`;
  const mixRgba = (c0, c1, t, a) =>
    rgba([0, 1, 2].map((i) => Math.round(lerp(c0[i], c1[i], t))), a);
  const monoFont = (size, weight = 400) => `${weight} ${size.toFixed(1)}px ${MONO}`;
  const displayFont = (size) => `700 ${size.toFixed(1)}px ${DISPLAY}`;

  /** Canvas letter-spacing is recent; degrade quietly where it is missing. */
  const hasTracking = 'letterSpacing' in ctx;
  function setTracking(value) {
    if (hasTracking) ctx.letterSpacing = value;
  }

  /**
   * Letter-spacing is also added after the last glyph, which nudges centered
   * text left by half a step. `shiftX` puts it back on the true center.
   */
  let shiftX = 0;
  function useType(font, size, trackingEm) {
    ctx.font = font;
    setTracking(`${trackingEm}em`);
    shiftX = hasTracking ? (trackingEm * size) / 2 : 0;
  }

  /**
   * Shared entrance: once `want` turns on, wait `delay`, then fade in while
   * rising POP_RISE px. Turning off fades out quickly in place.
   */
  const makePop = () => ({ on: false, at: 0, alpha: 0, rise: POP_RISE });
  function updatePop(pop, want, clock, dt, delay) {
    if (want && !pop.on) pop.at = clock + delay;
    pop.on = want;
    if (want) {
      const elapsed = clock - pop.at;
      const p = reduceMotion ? (elapsed >= 0 ? 1 : 0) : smoothstep(elapsed / POP_DURATION);
      pop.alpha = p;
      pop.rise = POP_RISE * (1 - p);
    } else {
      pop.alpha = approach(pop.alpha, 0, POP_OUT_TAU, dt);
      if (pop.alpha < 0.005) pop.alpha = 0;
    }
  }

  /* ------------------------------------------------------------------ scene */

  let W = window.innerWidth;
  let H = window.innerHeight;
  let layoutScale = 1;
  let typeScale = 1;
  let portraitStack = false;
  let safeTop = 0;
  let safeBottom = 0;
  let originX = 0;
  let originY = 0;

  const { CONSTELLATIONS } = createSceneData();

  CONSTELLATIONS.forEach((con) => {
    con.dimT = 0;
    con.hoverT = 0;
    con.namePop = makePop();
  });

  /** Design-space geometry with inter-constellation spread already applied. */
  const designCentroid = (() => {
    const all = CONSTELLATIONS.flatMap((con) => con.designStars);
    return {
      x: all.reduce((s, p) => s + p.x, 0) / all.length,
      y: all.reduce((s, p) => s + p.y, 0) / all.length
    };
  })();

  CONSTELLATIONS.forEach((con) => {
    const cx = con.designStars.reduce((s, p) => s + p.x, 0) / con.designStars.length;
    const cy = con.designStars.reduce((s, p) => s + p.y, 0) / con.designStars.length;
    con.designOffset = {
      x: (cx - designCentroid.x) * SPREAD,
      y: cy - designCentroid.y
    };
    con.designLocal = con.designStars.map((p) => ({ x: p.x - cx, y: p.y - cy }));
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    con.designLocal.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    con.localBox = { minX, maxX, minY, maxY };
    con.layoutOffset = { x: con.designOffset.x, y: con.designOffset.y };
  });

  /* ---------------------------------------------------------------- layout */

  let horizon = { cx: 0, cy: 0, rx: 0, ry: 0, H: 0 };
  const SUBTITLE = 'have fun exploring the stars!';
  const crystalPopup = createCrystalPopup(ctx);
  /** Welcome text block geometry, rebuilt on every resize (see computeWelcome). */
  let welcome = null;

  function readSafeInset(varName) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    const value = parseFloat(raw);
    return Number.isFinite(value) ? value : 0;
  }

  function useVerticalStack(w, h) {
    return h > w && w < 860;
  }

  function wrapText(text, maxWidth) {
    const words = String(text).split(/\s+/).filter(Boolean);
    if (words.length === 0) return [''];
    const lines = [];
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const next = `${line} ${words[i]}`;
      if (ctx.measureText(next).width <= maxWidth) line = next;
      else {
        lines.push(line);
        line = words[i];
      }
    }
    lines.push(line);
    return lines;
  }

  /** Like wrapText, but evens out line lengths (CSS `text-wrap: balance`). */
  function wrapBalanced(text, maxWidth) {
    const lines = wrapText(text, maxWidth);
    if (lines.length < 2) return lines;
    let lo = 0;
    let hi = maxWidth;
    let best = lines;
    while (hi - lo > 2) {
      const mid = (lo + hi) / 2;
      const tryLines = wrapText(text, mid);
      if (tryLines.length === lines.length && widestLine(tryLines) <= mid) {
        best = tryLines;
        hi = mid;
      } else {
        lo = mid;
      }
    }
    return best;
  }

  /**
   * `halo` paints a thin sky-colored outline first, so dotted constellation
   * lines pass behind the text instead of through it.
   */
  function fillLines(lines, x, lastBaselineY, lineHeight, maxWidth, halo = false) {
    const start = lastBaselineY - (lines.length - 1) * lineHeight;
    const cx = x + shiftX;
    for (let i = 0; i < lines.length; i++) {
      const y = start + i * lineHeight;
      if (halo) strokeHalo(lines[i], cx, y, maxWidth);
      if (maxWidth) ctx.fillText(lines[i], cx, y, maxWidth);
      else ctx.fillText(lines[i], cx, y);
    }
  }

  function strokeHalo(text, x, y, maxWidth) {
    const fill = ctx.fillStyle;
    const m = /rgba\([^)]*,\s*([\d.]+)\)$/.exec(fill);
    ctx.save();
    ctx.globalAlpha = m ? Number(m[1]) : 1;
    ctx.strokeStyle = SKY_HEX;
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    if (maxWidth) ctx.strokeText(text, x, y, maxWidth);
    else ctx.strokeText(text, x, y);
    ctx.restore();
  }

  function measureLayoutBox(includeNames) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    CONSTELLATIONS.forEach((con) => {
      con.designLocal.forEach((p) => {
        const x = con.layoutOffset.x + p.x;
        const y = con.layoutOffset.y + p.y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
      if (includeNames) {
        const nameY = con.layoutOffset.y + con.localBox.maxY + NAME_CLEARANCE;
        if (nameY > maxY) maxY = nameY;
      }
    });
    return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
  }

  function layoutOffsets() {
    if (!portraitStack) {
      CONSTELLATIONS.forEach((con) => {
        con.layoutOffset = { x: con.designOffset.x, y: con.designOffset.y };
      });
      return measureLayoutBox(false);
    }

    CONSTELLATIONS.forEach((con, i) => {
      const boxMidX = (con.localBox.minX + con.localBox.maxX) / 2;
      if (i === 0) {
        con.layoutOffset = { x: -boxMidX, y: 0 };
        return;
      }
      const prev = CONSTELLATIONS[i - 1];
      const prevBottom = prev.layoutOffset.y + prev.localBox.maxY + NAME_CLEARANCE;
      con.layoutOffset = {
        x: -boxMidX,
        y: prevBottom + CLUSTER_GAP - con.localBox.minY
      };
    });

    const raw = measureLayoutBox(true);
    const midY = (raw.minY + raw.maxY) / 2;
    CONSTELLATIONS.forEach((con) => {
      con.layoutOffset.y -= midY;
    });
    return measureLayoutBox(true);
  }

  function positionConstellations() {
    CONSTELLATIONS.forEach((con) => {
      con.stars = con.designLocal.map((p) => ({
        x: originX + (con.layoutOffset.x + p.x) * layoutScale,
        y: originY + (con.layoutOffset.y + p.y) * layoutScale
      }));
      con.cx = con.stars.reduce((s, p) => s + p.x, 0) / con.stars.length;
      con.cy = con.stars.reduce((s, p) => s + p.y, 0) / con.stars.length;
      con.nameX = portraitStack ? originX : con.cx;
      con.nameY = Math.max(...con.stars.map((p) => p.y)) + (portraitStack ? 26 : 34) * layoutScale;
      con.hitRadius = BASE_HIT_RADIUS * layoutScale;
    });
  }

  function widestLine(lines) {
    return lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
  }

  /**
   * Lays the welcome block (quote / title / subtitle) out against the bottom
   * edge: title baseline ~56px up, subtitle under it, quote above it.
   */
  function computeWelcome() {
    const maxW = Math.max(120, W - 32);

    let titleSize = HEADING_PX;
    const breakTitle = portraitStack || W < 560;
    setTracking(`${HEADING_TRACKING_EM}em`);
    const buildTitle = () => {
      ctx.font = displayFont(titleSize);
      return breakTitle ? ['welcome to', "crystal's universe"] : wrapText(WELCOME_TITLE, maxW);
    };
    let titleLines = buildTitle();
    const titleW = widestLine(titleLines);
    if (titleW > maxW) {
      titleSize *= maxW / titleW;
      titleLines = buildTitle();
    }
    setTracking('0em');

    const titleLineH = titleSize * 1.15;
    const titleLastBase = H - HEADING_BOTTOM - safeBottom;
    const titleFirstBase = titleLastBase - (titleLines.length - 1) * titleLineH;
    const titleTop = titleFirstBase - titleSize * 0.75;

    const subSize = SUBTITLE_PX;
    ctx.font = monoFont(subSize);
    const subLines = wrapText(SUBTITLE, maxW);
    const subLineH = subSize * 1.4;
    const subLastBase = H - FOOT_BOTTOM - safeBottom;

    const quoteSize = SUBTITLE_PX;
    const quoteLines = crystalPopup.quoteLines(monoFont(quoteSize), maxW);
    const quoteLineH = quoteSize * 1.4;
    let quoteBoxTop = 0;
    if (quoteLines.length) {
      const qLast = titleTop - quoteSize * 0.9;
      const qFirst = qLast - (quoteLines.length - 1) * quoteLineH;
      quoteBoxTop = qFirst - ((quoteLineH - 1.21 * quoteSize) / 2 + 0.92 * quoteSize);
    }

    return {
      titleSize, titleLines, titleLineH, titleLastBase,
      subSize, subLines, subLineH, subLastBase,
      quoteSize, quoteLines, quoteLineH, quoteBoxTop,
      apexY: H * HORIZON_FRAC
    };
  }

  function setupCanvas() {
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = document.documentElement.clientHeight || window.innerHeight;
    W = Math.max(280, Math.round(vw));
    H = Math.max(280, Math.round(vh));

    safeTop = readSafeInset('--sat');
    safeBottom = readSafeInset('--sab');
    portraitStack = useVerticalStack(W, H);
    typeScale = Math.min(
      1.18,
      Math.max(portraitStack ? 0.66 : 0.78, Math.min(W / REF_W, H / REF_H))
    );

    welcome = computeWelcome();
    const skyBox = layoutOffsets();
    const topInset = Math.max(H * (portraitStack ? 0.05 : 0.08), 22 + safeTop);
    // Constellations stay clear of the horizon and the popup figures on it.
    const skyFloor = welcome.apexY - crystalPopup.reserveAbove(welcome.titleSize);
    const availW = W * (portraitStack ? 0.86 : 0.9);
    const spaceH = Math.max(60, skyFloor - topInset - (portraitStack ? 0 : 44));
    const availH = portraitStack ? spaceH : Math.min(H * 0.58, spaceH);
    const fit = Math.min(availW / Math.max(1, skyBox.w), availH / Math.max(1, skyBox.h));
    layoutScale = Math.min(portraitStack ? 1.05 : 1.25, Math.max(0.15, fit));
    if (portraitStack) layoutScale *= CLUSTER_SCALE;

    originX = W * 0.5;
    originY = portraitStack || availH < H * 0.58 ? topInset + availH * 0.5 : H * 0.42;

    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Same dome halftone-sky.js draws, so the popup figures stand on it.
    const R = W * HORIZON_R_OVER_W;
    horizon = { cx: W / 2, cy: welcome.apexY + R, rx: R, ry: R, H };

    positionConstellations();
    syncSky();
  }

  /* ----------------------------------------------------- interaction state */

  let hoveredConstellation = -1;
  let activeConstellation = -1;
  let targetZoom = 0;
  let zoomRaw = 0;
  let zoomEase = 0;
  const welcomePop = makePop();
  const subtitlePop = makePop();
  const zoomTitlePop = makePop();
  const hintPop = makePop();
  const starLabelPop = makePop();
  let homeShownOnce = false;
  let mouse = { x: W * 0.5, y: H * 0.5 };
  let hasPointer = false;
  let pointerFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let cam = { scale: 1, tx: 0, ty: 0 };
  let cursorStyle = 'default';

  const getScreenXY = (x, y) => ({ x: x * cam.scale + cam.tx, y: y * cam.scale + cam.ty });
  const getWorldXY = (x, y) => ({ x: (x - cam.tx) / cam.scale, y: (y - cam.ty) / cam.scale });

  const welcomeTitleSize = () => welcome.titleSize;
  const welcomeTitleLines = () => welcome.titleLines;

  function enterZoomFor(con) {
    const boxW = Math.max(40, (con.localBox.maxX - con.localBox.minX) * layoutScale);
    const boxH = Math.max(40, (con.localBox.maxY - con.localBox.minY) * layoutScale);
    const fit = Math.min((W * 0.84) / boxW, (H * (portraitStack ? 0.5 : 0.55)) / boxH);
    return Math.min(ZOOM_SCALE, Math.max(1.2, fit));
  }

  /** Where the camera settles when `con` is fully zoomed in. */
  function zoomCameraFor(con) {
    const scale = enterZoomFor(con);
    const focusTargetY = portraitStack
      ? H * 0.44
      : (con.name === 'Experiences' ? H * 0.5 : H * 0.45);
    return { scale, tx: W / 2 - con.cx * scale, ty: focusTargetY - con.cy * scale };
  }

  /* ------------------------------------------------------ halftone bridge */

  let lastSkyKey = '';

  /** Star positions in the 0..1 viewport fractions halftone-sky.js expects. */
  function toSkyConstellation(con, camera) {
    const round = (v) => Math.round(v * 10000) / 10000;
    return {
      p: con.stars.map((s) => [
        round((s.x * camera.scale + camera.tx) / W),
        round((s.y * camera.scale + camera.ty) / H)
      ]),
      e: con.edges.map(([a, b]) => [a, b]),
      s: con.stars.map((_, i) => (con.labeledStars.includes(i) ? 1 : 0.7))
    };
  }

  function syncSky() {
    if (!callbacks.onSkyChange) return;
    const zoomed = activeConstellation !== -1 && targetZoom === 1;
    const mode = zoomed ? 'zoom' : 'home';
    const list = zoomed
      ? [toSkyConstellation(CONSTELLATIONS[activeConstellation], zoomCameraFor(CONSTELLATIONS[activeConstellation]))]
      : CONSTELLATIONS.map((con) => toSkyConstellation(con, { scale: 1, tx: 0, ty: 0 }));
    // setMode restarts the renderer's clock, so only call it on a real change.
    const key = `${mode}|${JSON.stringify(list)}`;
    if (key === lastSkyKey) return;
    lastSkyKey = key;
    callbacks.onSkyChange(mode, list);
  }

  /* ----------------------------------------------------------- pointer */

  function updatePointer(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (W / r.width);
    mouse.y = (e.clientY - r.top) * (H / r.height);
    if (!hasPointer) hasPointer = true;
  }

  function stackedHitDistance(con, x, y) {
    const pad = 30 * layoutScale;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    con.stars.forEach((s) => {
      if (s.x < minX) minX = s.x;
      if (s.x > maxX) maxX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.y > maxY) maxY = s.y;
    });
    minX -= pad;
    maxX += pad;
    minY -= pad;
    maxY = Math.max(maxY, con.nameY) + 16 * layoutScale;
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      return Math.hypot(x - con.cx, y - con.cy);
    }
    let best = Infinity;
    const starReach = 48 * layoutScale;
    con.stars.forEach((s) => {
      const d = Math.hypot(x - s.x, y - s.y);
      if (d < starReach && d < best) best = d;
    });
    return best;
  }

  function updateHover() {
    if (activeConstellation !== -1) return;
    hoveredConstellation = -1;
    let best = Infinity;
    for (let i = 0; i < CONSTELLATIONS.length; i++) {
      const con = CONSTELLATIONS[i];
      let d;
      if (portraitStack) {
        d = stackedHitDistance(con, mouse.x, mouse.y);
      } else {
        d = Math.hypot(mouse.x - con.cx, mouse.y - con.cy);
        if (d >= con.hitRadius) d = Infinity;
      }
      if (d < best) {
        best = d;
        hoveredConstellation = i;
      }
    }
    if (!Number.isFinite(best)) hoveredConstellation = -1;
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

  function onPointerUp(e) {
    if (e.pointerType === 'mouse') return;
    hasPointer = false;
    crystalPopup.hide();
  }

  function zoomOut() {
    targetZoom = 0;
    syncSky();
  }

  /** The zoomed constellation's item whose star is under (x, y), or null. */
  function starHitAt(x, y) {
    if (activeConstellation === -1) return null;
    const con = CONSTELLATIONS[activeConstellation];
    let hit = null;
    let bestDist = Infinity;
    const reach = pointerFine ? 46 * typeScale : Math.max(52, 44 * typeScale);
    con.items.forEach((item) => {
      const sp = getScreenXY(con.stars[item.star].x, con.stars[item.star].y);
      const d = Math.hypot(x - sp.x, y - sp.y);
      if (d < reach && d < bestDist) {
        bestDist = d;
        hit = item;
      }
    });
    return hit;
  }

  function onClick() {
    if (callbacks.isDetailOpen()) return;
    // Re-resolve in case pointerleave cleared hover between finger-up and click.
    updateHover();

    if (activeConstellation === -1) {
      if (hoveredConstellation !== -1) {
        playClickSound();
        activeConstellation = hoveredConstellation;
        targetZoom = 1;
        hoveredConstellation = -1;
        callbacks.onHideCard();
        syncSky();
      }
      return;
    }

    const con = CONSTELLATIONS[activeConstellation];
    const settled = zoomEase > 0.5;

    if (settled) {
      const hit = starHitAt(mouse.x, mouse.y);
      if (hit) {
        playClickSound();
        callbacks.onShowCard(con, hit);
        return;
      }
    }

    const world = getWorldXY(mouse.x, mouse.y);
    const exitMul = portraitStack ? 1.08 : 1.35;
    if (Math.hypot(world.x - con.cx, world.y - con.cy) > con.hitRadius * exitMul) {
      playClickSound();
      zoomOut();
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
      zoomOut();
      callbacks.onHideCard();
    }
  }

  function onWindowScroll() {
    if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
  }

  function onTouchMove(e) {
    if (e.target.closest?.('#detailPanel')) return;
    e.preventDefault();
  }

  /* ---------------------------------------------------------------- intro */

  let disposed = false;
  let fontsSettled = false;
  const settleFonts = () => {
    if (disposed) return;
    fontsSettled = true;
    setupCanvas();
  };
  const fontTimer = window.setTimeout(settleFonts, 900);
  if (document.fonts && document.fonts.load) {
    // Canvas text doesn't request web fonts on its own, so ask for them.
    Promise.all([
      document.fonts.load(displayFont(HEADING_PX)),
      document.fonts.load(monoFont(LABEL_PX, 400))
    ])
      .catch(() => {})
      .then(settleFonts);
  } else {
    fontsSettled = true;
  }

  setupCanvas();

  /* ----------------------------------------------------------------- loop */

  let animationFrameId = null;
  let lastTs = null;

  function loop(ts) {
    const now = ts * 0.001;
    // Clamped so a backgrounded tab or a long paint catches up in one step
    // instead of teleporting, while a genuinely slow device still keeps pace.
    const dt = lastTs === null ? 1 / 60 : Math.min(0.12, Math.max(0.0005, now - lastTs));
    lastTs = now;
    const clock = performance.now() / 1000;

    zoomRaw = approach(zoomRaw, targetZoom, 0.26, dt);
    if (targetZoom === 0 && zoomRaw < 0.004) {
      zoomRaw = 0;
      activeConstellation = -1;
    }
    zoomEase = smoothstep(zoomRaw);

    if (activeConstellation !== -1) {
      const target = zoomCameraFor(CONSTELLATIONS[activeConstellation]);
      cam.scale = lerp(1, target.scale, zoomEase);
      cam.tx = lerp(0, target.tx, zoomEase);
      cam.ty = lerp(0, target.ty, zoomEase);
    } else {
      cam.scale = 1;
      cam.tx = 0;
      cam.ty = 0;
    }

    /* ---- every piece of text enters with the same pop (see updatePop) */

    const zoomedIn = targetZoom === 1 && activeConstellation !== -1;
    const atHome = fontsSettled && targetZoom === 0;
    const firstVisit = !homeShownOnce;
    updatePop(welcomePop, atHome, clock, dt, firstVisit ? INTRO_DELAY : RETURN_DELAY + 0.1);
    updatePop(subtitlePop, atHome, clock, dt, (firstVisit ? INTRO_DELAY : RETURN_DELAY + 0.1) + FOOT_STAGGER);
    CONSTELLATIONS.forEach((con, ci) => {
      const delay = firstVisit ? INTRO_DELAY + 0.25 + ci * 0.12 : RETURN_DELAY + ci * 0.06;
      updatePop(con.namePop, atHome, clock, dt, delay);
    });
    if (atHome) homeShownOnce = true;
    updatePop(zoomTitlePop, zoomedIn, clock, dt, ZOOM_TITLE_DELAY);
    updatePop(hintPop, zoomedIn, clock, dt, ZOOM_TITLE_DELAY + FOOT_STAGGER);
    updatePop(starLabelPop, zoomedIn, clock, dt, LABEL_DELAY);

    const welcomeFade = welcomePop.alpha;
    const titleSize = welcomeTitleSize();
    const titleY = welcome.titleLastBase + welcomePop.rise;
    const subtitleY = welcome.subLastBase + subtitlePop.rise;
    crystalPopup.update({
      dt,
      mouse,
      hasPointer,
      pointerFine,
      welcomeFade,
      typeScale,
      W,
      titleY,
      titleSize,
      titleLines: welcomeTitleLines()
    });

    const wantsPointer =
      (activeConstellation === -1 && hoveredConstellation !== -1) ||
      (activeConstellation !== -1 && zoomEase > 0.5 && starHitAt(mouse.x, mouse.y) !== null) ||
      crystalPopup.isHovering();
    const nextCursor = wantsPointer ? 'pointer' : 'default';
    if (nextCursor !== cursorStyle) {
      cursorStyle = nextCursor;
      canvas.style.cursor = nextCursor;
    }

    // The sky lives on the halftone canvas underneath; this layer is text only.
    ctx.clearRect(0, 0, W, H);

    crystalPopup.drawSprite({ W, titleSize, earth: horizon });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    CONSTELLATIONS.forEach((con, ci) => {
      const isActive = activeConstellation === ci;
      const hovered = activeConstellation === -1 && hoveredConstellation === ci;

      con.dimT = approach(
        con.dimT,
        activeConstellation === -1 && hoveredConstellation !== -1 && !hovered ? 1 : 0,
        0.2,
        dt
      );
      con.hoverT = approach(con.hoverT, hovered ? 1 : 0, 0.14, dt);

      const name = con.name.toLowerCase();

      // Home name: pinned to the home layout, pops up under its cluster.
      const homeAlpha = con.namePop.alpha * lerp(1, 0.42, con.dimT);
      if (homeAlpha > 0.01) {
        useType(monoFont(LABEL_PX), LABEL_PX, LABEL_TRACKING_EM);
        ctx.fillStyle = mixRgba(LABEL_RGB, HEAD_RGB, con.hoverT, homeAlpha);
        fillLines([name], con.nameX, con.nameY + con.namePop.rise, 0, 0, true);
      }

      if (!isActive) return;

      if (zoomTitlePop.alpha > 0.01) {
        useType(displayFont(ZOOM_TITLE_PX), ZOOM_TITLE_PX, HEADING_TRACKING_EM);
        ctx.fillStyle = rgba(HEAD_RGB, zoomTitlePop.alpha);
        ctx.fillText(name, W / 2 + shiftX, welcome.titleLastBase + zoomTitlePop.rise, W - 32);
      }

      if (starLabelPop.alpha > 0.01) {
        useType(monoFont(LABEL_PX), LABEL_PX, LABEL_TRACKING_EM);
        ctx.fillStyle = rgba(LABEL_RGB, starLabelPop.alpha);
        const labelMax = portraitStack ? Math.min(W * 0.34, 150) : 240;
        const labelLine = LABEL_PX * 1.35;
        // Clear the halftone star's glow, which is ~30px across when zoomed.
        const lift = 36 - starLabelPop.rise;
        const placed = [];
        const overlaps = (r) => placed.some((q) =>
          r.x0 < q.x1 + 6 && r.x1 > q.x0 - 6 && r.y0 < q.y1 + 4 && r.y1 > q.y0 - 4);
        con.items.forEach((item) => {
          if (!item.label) return;
          // While leaving, hold the last zoomed spot so labels fade, not slide.
          if (zoomedIn || !item.labelAt) {
            item.labelAt = getScreenXY(con.stars[item.star].x, con.stars[item.star].y);
          }
          const sp = item.labelAt;
          const lines = wrapBalanced(item.label.toLowerCase(), labelMax);
          // Monospace runs wide; keep edge stars' labels on screen.
          const half = Math.min(labelMax, widestLine(lines)) / 2;
          const edge = 12;
          const x = Math.min(W - edge - half, Math.max(edge + half, sp.x));
          const blockH = (lines.length - 1) * labelLine + LABEL_PX;
          const rectAt = (lastBase) => ({
            x0: x - half, x1: x + half, y0: lastBase - blockH, y1: lastBase + 3
          });
          // Above the star by default; below it if that collides with a neighbour.
          let base = sp.y - lift;
          let rect = rectAt(base);
          if (overlaps(rect)) {
            const below = sp.y + lift + blockH - LABEL_PX * 0.2;
            const alt = rectAt(below);
            if (!overlaps(alt)) { base = below; rect = alt; }
          }
          placed.push(rect);
          fillLines(lines, x, base, labelLine, labelMax, true);
        });
      }
    });

    if (welcomeFade > 0.01) {
      crystalPopup.drawSillyLine({
        welcomeFade,
        lines: welcome.quoteLines,
        top: welcome.quoteBoxTop + welcomePop.rise,
        size: welcome.quoteSize,
        lineH: welcome.quoteLineH,
        skyText: (a) => rgba(MUTED_RGB, a / 0.82)
      });
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      useType(displayFont(welcome.titleSize), welcome.titleSize, HEADING_TRACKING_EM);
      ctx.fillStyle = rgba(HEAD_RGB, welcomeFade);
      fillLines(welcome.titleLines, W / 2, titleY, welcome.titleLineH);
    }
    if (subtitlePop.alpha > 0.01) {
      useType(monoFont(welcome.subSize), welcome.subSize, 0);
      ctx.fillStyle = rgba(MUTED_RGB, subtitlePop.alpha);
      fillLines(welcome.subLines, W / 2, subtitleY, welcome.subLineH);
    }

    if (hintPop.alpha > 0.01) {
      useType(monoFont(BACK_PX), BACK_PX, LABEL_TRACKING_EM);
      ctx.fillStyle = rgba(MUTED_RGB, hintPop.alpha);
      const hint = pointerFine ? 'click a star  ·  esc to return' : 'tap a star  ·  tap outside to return';
      const hintY = H - FOOT_BOTTOM - safeBottom + hintPop.rise;
      fillLines(wrapText(hint, W - 32), W / 2, hintY, BACK_PX * 1.35, W - 32);
    }
    useType(ctx.font, 0, 0);

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
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointercancel', onPointerLeave);
  canvas.addEventListener('click', onClick);
  window.addEventListener('resize', setupCanvas);
  window.addEventListener('orientationchange', setupCanvas);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('scroll', onWindowScroll, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  const resizeHost = canvas.parentElement || canvas;
  const layoutObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => setupCanvas())
    : null;
  if (layoutObserver) layoutObserver.observe(resizeHost);

  animationFrameId = requestAnimationFrame(loop);

  return () => {
    disposed = true;
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    window.clearTimeout(fontTimer);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('pointercancel', onPointerLeave);
    canvas.removeEventListener('click', onClick);
    window.removeEventListener('resize', setupCanvas);
    window.removeEventListener('orientationchange', setupCanvas);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('scroll', onWindowScroll);
    document.removeEventListener('touchmove', onTouchMove);
    if (layoutObserver) layoutObserver.disconnect();
    if (pointerQuery.removeEventListener) {
      pointerQuery.removeEventListener('change', onPointerQueryChange);
    }
    crystalPopup.dispose();
  };
}
