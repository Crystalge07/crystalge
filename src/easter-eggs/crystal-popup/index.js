import spriteUrl from './horizon.gif';

const ENABLED = true;

const WELCOME_TITLE = "welcome to crystal's universe";
const CRYSTAL_WORD = 'crystal';
const SILLY_LINE = 'what is essential is invisible to the eye — the little prince';
/**
 * Original standing sprite was 1.5× the welcome title and filled its box.
 * This GIF has empty sky above the figures, so the box is taller to keep
 * the visible scene around that same size.
 */
const HEIGHT_OVER_TITLE = 3.75;

const INERT_POPUP = {
  isHovering: () => false,
  unlock() {},
  hide() {},
  dispose() {},
  update() { return false; },
  drawSprite() {},
  drawSillyLine() {}
};

/**
 * Self-contained Crystal-on-the-horizon easter egg.
 * All popup assets and behavior live in this folder so the effect can be
 * removed by deleting it and the thin hooks in constellationCanvas.js.
 */
export function createCrystalPopup(ctx) {
  if (!ENABLED) return INERT_POPUP;

  const canvas = ctx.canvas;
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'absolute',
    inset: '0',
    overflow: 'hidden',
    pointerEvents: 'none'
  });

  const sprite = document.createElement('img');
  sprite.src = spriteUrl;
  sprite.alt = '';
  sprite.draggable = false;
  Object.assign(sprite.style, {
    position: 'absolute',
    display: 'none',
    userSelect: 'none'
  });
  layer.appendChild(sprite);

  const quote = document.createElement('div');
  quote.textContent = SILLY_LINE;
  Object.assign(quote.style, {
    position: 'absolute',
    left: '50%',
    display: 'none',
    transform: 'translateX(-50%)',
    fontFamily: '"Cormorant Garamond", serif',
    fontWeight: '500',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    maxWidth: '92%',
    pointerEvents: 'none'
  });
  layer.appendChild(quote);

  canvas.insertAdjacentElement('afterend', layer);

  let hovering = false;
  let spriteReady = sprite.complete && sprite.naturalWidth > 0;
  sprite.addEventListener('load', () => { spriteReady = true; });

  function hideLayer() {
    sprite.style.display = 'none';
    quote.style.display = 'none';
  }

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

    unlock() {},

    hide() {
      hovering = false;
      hideLayer();
    },

    dispose() {
      hideLayer();
      layer.remove();
    },

    update({ mouse, hasPointer, pointerFine, welcomeFade, typeScale, W, titleY, titleSize }) {
      hovering = hasPointer && pointerFine && welcomeFade > 0.02 &&
        wordHit(mouse, typeScale, titleY, titleSize, W);
      if (!hovering) hideLayer();
      return hovering;
    },

    drawSprite({ W, titleSize, earth }) {
      if (!hovering || !spriteReady) {
        sprite.style.display = 'none';
        return;
      }
      const imgH = titleSize * HEIGHT_OVER_TITLE;
      const imgW = imgH * (sprite.naturalWidth / sprite.naturalHeight);
      const x = W / 2 - imgW / 2;
      const y = horizonYAt(W / 2, earth) - imgH;
      sprite.style.display = 'block';
      sprite.style.left = `${x}px`;
      sprite.style.top = `${y}px`;
      sprite.style.width = `${imgW}px`;
      sprite.style.height = `${imgH}px`;
    },

    drawSillyLine({ welcomeFade, typeScale, W, titleY, subtitleY, titleSize, skyText }) {
      if (!hovering || welcomeFade <= 0.02) {
        quote.style.display = 'none';
        return;
      }
      const size = 27 * typeScale;

      ctx.font = `500 ${titleSize.toFixed(1)}px "Cormorant Garamond", serif`;
      const titleMetrics = ctx.measureText(WELCOME_TITLE);
      const titleAscent = titleMetrics.actualBoundingBoxAscent || titleSize * 0.82;
      const titleDescent = titleMetrics.actualBoundingBoxDescent || titleSize * 0.22;

      ctx.font = `500 ${size.toFixed(1)}px "Cormorant Garamond", serif`;
      const subMetrics = ctx.measureText('have fun exploring the stars!');
      const subAscent = subMetrics.actualBoundingBoxAscent || size * 0.82;
      const visualGap = (subtitleY - subAscent) - (titleY + titleDescent);

      let fontSize = size;
      const maxW = W * 0.92;
      const naturalW = ctx.measureText(SILLY_LINE).width;
      if (naturalW > maxW && naturalW > 0) {
        fontSize = size * (maxW / naturalW);
        ctx.font = `500 ${fontSize.toFixed(1)}px "Cormorant Garamond", serif`;
      }
      const sillyMetrics = ctx.measureText(SILLY_LINE);
      const sillyAscent = sillyMetrics.actualBoundingBoxAscent || fontSize * 0.82;
      const sillyDescent = sillyMetrics.actualBoundingBoxDescent || fontSize * 0.22;
      const y = titleY - titleAscent - sillyDescent - visualGap;

      quote.style.display = 'block';
      quote.style.top = `${y - sillyAscent}px`;
      quote.style.fontSize = `${fontSize.toFixed(1)}px`;
      quote.style.color = skyText(welcomeFade * 0.82);
    }
  };
}
