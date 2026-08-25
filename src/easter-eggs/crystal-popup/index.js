import spriteUrl from './crystal.png';
import musicUrl from './clown-circus-music.mp3';

const WELCOME_TITLE = "welcome to crystal's universe";
const CRYSTAL_WORD = 'crystal';
const SILLY_LINE = 'we could all use a bit more silly in our lives, and smile more';
const RISE_SECONDS = 5;
/** Original easter egg was 1.5× the title; this is 2× that. */
const HEIGHT_OVER_TITLE = 3;
const MUSIC_VOLUME = 0.16;

/**
 * Self-contained Crystal-on-the-horizon easter egg.
 * All popup assets and behavior live in this folder so the effect can be
 * removed by deleting it and the thin hooks in constellationCanvas.js.
 */
export function createCrystalPopup(ctx) {
  const sprite = new Image();
  let spriteReady = false;
  sprite.onload = () => { spriteReady = true; };
  sprite.src = spriteUrl;

  const music = new Audio(musicUrl);
  music.loop = true;
  music.preload = 'auto';
  music.volume = MUSIC_VOLUME;

  let hovering = false;
  let rise = 0;
  let wantMusic = false;

  function stopMusic() {
    wantMusic = false;
    if (!music.paused) music.pause();
    try {
      music.currentTime = 0;
    } catch {
      // Some browsers throw if currentTime is set before metadata loads.
    }
  }

  function startMusic() {
    wantMusic = true;
    music.muted = false;
    music.volume = MUSIC_VOLUME;
    if (!music.paused) return;
    const playing = music.play();
    if (playing && typeof playing.catch === 'function') {
      playing.catch(() => {});
    }
  }

  function unlock() {
    // play() has to run inside a click/tap so later hover-play is allowed.
    const shouldKeep = wantMusic;
    if (!shouldKeep) music.muted = true;
    const playing = music.play();
    if (playing && typeof playing.then === 'function') {
      playing.then(() => {
        music.muted = false;
        if (!wantMusic) {
          music.pause();
          try { music.currentTime = 0; } catch { /* ignore */ }
        }
      }).catch(() => {
        music.muted = false;
      });
    } else {
      music.muted = false;
    }
  }

  const onGestureUnlock = () => { unlock(); };
  window.addEventListener('pointerdown', onGestureUnlock);

  function wordHit(mouse, typeScale, titleY, titleSize, W) {
    ctx.font = `500 ${titleSize.toFixed(1)}px "Cormorant Garamond", serif`;
    const fullW = ctx.measureText(WELCOME_TITLE).width;
    const prefixW = ctx.measureText('welcome to ').width;
    const wordW = ctx.measureText(CRYSTAL_WORD).width;
    const left = W / 2 - fullW / 2 + prefixW;
    const metrics = ctx.measureText(CRYSTAL_WORD);
    const ascent = metrics.actualBoundingBoxAscent || titleSize * 0.82;
    const descent = metrics.actualBoundingBoxDescent || titleSize * 0.22;
    const pad = 7 * typeScale;
    return (
      mouse.x >= left - pad &&
      mouse.x <= left + wordW + pad &&
      mouse.y >= titleY - ascent - pad &&
      mouse.y <= titleY + descent + pad
    );
  }

  function horizonYAt(x, earth) {
    const nx = (x - earth.cx) / earth.rx;
    const inside = 1 - nx * nx;
    if (inside <= 0) return earth.H;
    return earth.cy - earth.ry * Math.sqrt(inside);
  }

  return {
    isHovering: () => hovering,

    unlock,

    hide() {
      hovering = false;
      rise = 0;
      stopMusic();
    },

    dispose() {
      window.removeEventListener('pointerdown', onGestureUnlock);
      stopMusic();
      music.removeAttribute('src');
      music.load();
    },

    update({ dt, mouse, hasPointer, pointerFine, welcomeFade, typeScale, W, titleY, titleSize }) {
      hovering = hasPointer && pointerFine && welcomeFade > 0.02 &&
        wordHit(mouse, typeScale, titleY, titleSize, W);
      if (hovering) {
        rise = Math.min(1, rise + dt / RISE_SECONDS);
        startMusic();
      } else {
        if (rise > 0 || wantMusic) stopMusic();
        rise = 0;
      }
      return hovering;
    },

    drawSprite({ W, titleSize, earth }) {
      if (!spriteReady || rise <= 0) return;
      const imgH = titleSize * HEIGHT_OVER_TITLE;
      const imgW = imgH * (sprite.naturalWidth / sprite.naturalHeight);
      const x = W / 2 - imgW / 2;
      const y = horizonYAt(W / 2, earth) - imgH * rise;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, earth.H);
      ctx.ellipse(earth.cx, earth.cy, earth.rx, earth.ry, 0, 0, Math.PI * 2);
      ctx.clip('evenodd');
      ctx.drawImage(sprite, x, y, imgW, imgH);
      ctx.restore();
    },

    drawSillyLine({ welcomeFade, typeScale, W, titleY, subtitleY, titleSize, skyText }) {
      if (rise <= 0 || welcomeFade <= 0.02) return;
      const size = 27 * typeScale;

      ctx.font = `500 ${titleSize.toFixed(1)}px "Cormorant Garamond", serif`;
      const titleMetrics = ctx.measureText(WELCOME_TITLE);
      const titleAscent = titleMetrics.actualBoundingBoxAscent || titleSize * 0.82;
      const titleDescent = titleMetrics.actualBoundingBoxDescent || titleSize * 0.22;

      ctx.font = `500 ${size.toFixed(1)}px "Cormorant Garamond", serif`;
      const subMetrics = ctx.measureText('have fun exploring the stars!');
      const subAscent = subMetrics.actualBoundingBoxAscent || size * 0.82;
      const visualGap = (subtitleY - subAscent) - (titleY + titleDescent);

      const maxW = W * 0.92;
      const naturalW = ctx.measureText(SILLY_LINE).width;
      if (naturalW > maxW && naturalW > 0) {
        ctx.font = `500 ${(size * (maxW / naturalW)).toFixed(1)}px "Cormorant Garamond", serif`;
      }
      const sillyMetrics = ctx.measureText(SILLY_LINE);
      const sillyDescent = sillyMetrics.actualBoundingBoxDescent || size * 0.22;
      const y = titleY - titleAscent - sillyDescent - visualGap;

      ctx.fillStyle = skyText(welcomeFade * 0.82);
      ctx.fillText(SILLY_LINE, W / 2, y);
    }
  };
}
