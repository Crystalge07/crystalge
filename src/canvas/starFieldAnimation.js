/**
 * Background star-field animation — per-star sine drift, decoupled twinkle,
 * and subtle global / mouse parallax. All tunable ranges live in STAR_FIELD_TUNING.
 */

export const STAR_FIELD_TUNING = {
  /** Drift oscillation speed per axis (radians / second). Lower = slower float. */
  DRIFT_SPEED_MIN: 0.12,
  DRIFT_SPEED_MAX: 0.48,

  /** Peak displacement from rest position, in pixels. Keep small for calm motion. */
  DRIFT_RADIUS_MIN: 0.6,
  DRIFT_RADIUS_MAX: 2.8,

  /** Twinkle oscillation speed (radians / second), independent of drift. */
  TWINKLE_SPEED_MIN: 0.9,
  TWINKLE_SPEED_MAX: 3.4,

  /** Radius pulse: base + sin(...) * TWINKLE_SIZE_AMP */
  TWINKLE_SIZE_BASE: 0.72,
  TWINKLE_SIZE_AMP: 0.34,

  /** Opacity pulse uses its own speed/phase so size and brightness don't lock in sync. */
  TWINKLE_ALPHA_SPEED_MIN: 0.7,
  TWINKLE_ALPHA_SPEED_MAX: 2.8,
  TWINKLE_ALPHA_BASE: 0.55,
  TWINKLE_ALPHA_AMP: 0.45,

  /** Very slow whole-field drift (radians / second). */
  GLOBAL_PARALLAX_SPEED: 0.025,
  GLOBAL_PARALLAX_RADIUS_X: 0.8,
  GLOBAL_PARALLAX_RADIUS_Y: 0.5,

  /** Max pixel shift from mouse position (center = 0). */
  MOUSE_PARALLAX_STRENGTH: 2.0,

  /** Lerp factor per frame for smoothing mouse parallax (0–1). */
  MOUSE_PARALLAX_SMOOTH: 0.035,

  /** Depth scales how much drift / parallax each star receives (0–1 multiplier). */
  DEPTH_DRIFT_MIN: 0.35,
  DEPTH_DRIFT_MAX: 1.0,

  /** Star glyph shape: number of points and inner/outer radius ratio. */
  STAR_POINTS: 5,
  STAR_INNER_RATIO: 0.45,
};

const TAU = Math.PI * 2;

/** Trace an n-pointed star centred on (x, y) with the given outer radius, point up. */
function traceStar(ctx, x, y, outerRadius) {
  const points = STAR_FIELD_TUNING.STAR_POINTS;
  const innerRadius = outerRadius * STAR_FIELD_TUNING.STAR_INNER_RATIO;
  const step = Math.PI / points;

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + i * step;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Attach per-star animation constants once at creation. Does not mutate input array.
 * @param {Array<{ x: number, y: number, r: number, a: number, depth?: number }>} bgStars
 */
export function prepareStarField(bgStars) {
  const T = STAR_FIELD_TUNING;

  return bgStars.map((s) => {
    const driftRadius = rand(T.DRIFT_RADIUS_MIN, T.DRIFT_RADIUS_MAX);
    const driftAngle = Math.random() * TAU;
    const axisBias = 0.65 + Math.random() * 0.7;

    return {
      x: s.x,
      y: s.y,
      r: s.r,
      a: s.a,
      depth: s.depth ?? 0.5,

      driftSpeedX: rand(T.DRIFT_SPEED_MIN, T.DRIFT_SPEED_MAX),
      driftSpeedY: rand(T.DRIFT_SPEED_MIN, T.DRIFT_SPEED_MAX),
      driftPhaseX: Math.random() * TAU,
      driftPhaseY: Math.random() * TAU,
      driftRadiusX: driftRadius * Math.abs(Math.cos(driftAngle)) * axisBias,
      driftRadiusY: driftRadius * Math.abs(Math.sin(driftAngle)) * axisBias,

      twinkleSpeed: rand(T.TWINKLE_SPEED_MIN, T.TWINKLE_SPEED_MAX),
      twinklePhase: Math.random() * TAU,
      twinkleAlphaSpeed: rand(T.TWINKLE_ALPHA_SPEED_MIN, T.TWINKLE_ALPHA_SPEED_MAX),
      twinkleAlphaPhase: Math.random() * TAU,
    };
  });
}

/** @returns {{ elapsed: number, globalPhase: number, mouseParallax: { x: number, y: number } }} */
export function createStarFieldRuntime() {
  return {
    elapsed: 0,
    globalPhase: Math.random() * TAU,
    mouseParallax: { x: 0, y: 0 },
  };
}

/**
 * Advance time-based state. Call once per frame before drawing.
 * @param {ReturnType<typeof createStarFieldRuntime>} runtime
 * @param {number} deltaTime seconds since last frame
 * @param {{ x: number, y: number }} mouse canvas coordinates
 * @param {number} width
 * @param {number} height
 */
export function tickStarField(runtime, deltaTime, mouse, width, height) {
  const T = STAR_FIELD_TUNING;
  runtime.elapsed += deltaTime;

  const targetX = ((mouse.x / width) - 0.5) * T.MOUSE_PARALLAX_STRENGTH;
  const targetY = ((mouse.y / height) - 0.5) * T.MOUSE_PARALLAX_STRENGTH;
  const smooth = T.MOUSE_PARALLAX_SMOOTH;
  runtime.mouseParallax.x += (targetX - runtime.mouseParallax.x) * smooth;
  runtime.mouseParallax.y += (targetY - runtime.mouseParallax.y) * smooth;
}

function depthFactor(depth) {
  const T = STAR_FIELD_TUNING;
  return T.DEPTH_DRIFT_MIN + depth * (T.DEPTH_DRIFT_MAX - T.DEPTH_DRIFT_MIN);
}

/**
 * Draw background stars with organic drift and twinkle.
 * @param {CanvasRenderingContext2D} ctx
 * @param {ReturnType<typeof prepareStarField>} stars
 * @param {ReturnType<typeof createStarFieldRuntime>} runtime
 * @param {number} width
 * @param {number} height
 */
export function drawStarField(ctx, stars, runtime, width, height, sizeScale = 1) {
  const T = STAR_FIELD_TUNING;
  const t = runtime.elapsed;

  const globalX =
    Math.sin(t * T.GLOBAL_PARALLAX_SPEED + runtime.globalPhase) * T.GLOBAL_PARALLAX_RADIUS_X;
  const globalY =
    Math.cos(t * T.GLOBAL_PARALLAX_SPEED * 0.73 + runtime.globalPhase * 1.17) *
    T.GLOBAL_PARALLAX_RADIUS_Y;

  const parallaxX = globalX + runtime.mouseParallax.x;
  const parallaxY = globalY + runtime.mouseParallax.y;

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const depth = depthFactor(s.depth);

    const driftX = Math.sin(t * s.driftSpeedX + s.driftPhaseX) * s.driftRadiusX;
    const driftY = Math.sin(t * s.driftSpeedY + s.driftPhaseY) * s.driftRadiusY;

    const x = s.x * width + (driftX + parallaxX) * depth;
    const y = s.y * height + (driftY + parallaxY) * depth;

    const sizeTwinkle =
      T.TWINKLE_SIZE_BASE + T.TWINKLE_SIZE_AMP * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
    const alphaTwinkle =
      T.TWINKLE_ALPHA_BASE +
      T.TWINKLE_ALPHA_AMP * Math.sin(t * s.twinkleAlphaSpeed + s.twinkleAlphaPhase);
    const alpha = s.a * alphaTwinkle;

    traceStar(ctx, x, y, s.r * sizeTwinkle * sizeScale);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }
}
