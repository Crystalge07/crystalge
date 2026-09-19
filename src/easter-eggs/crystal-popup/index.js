import spriteUrl from './horizon.gif';

const ENABLED = true;

const WELCOME_TITLE = "welcome to crystal's universe";
const CRYSTAL_WORD = 'crystal';
const QUOTE_FULL = 'what is essential is invisible to the eye — the little prince';
const QUOTE_LINES = [
  'what is essential is invisible to the eye',
  '— the little prince'
];
/**
 * Original standing sprite was 1.5× the welcome title and filled its box.
 * This GIF has empty sky above the figures, so the box is taller to keep
 * the visible scene around that same size.
 */
const HEIGHT_OVER_TITLE = 3.75;
/** Share of the GIF's height that holds the figures (the rest is empty sky). */
const VISIBLE_FRACTION = 0.62;

const INERT_POPUP = {
  isHovering: () => false,
  unlock() {},
  hide() {},
  dispose() {},
  update() { return false; },
  quoteLines: () => [],
  reserveAbove: () => 0,
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
    lineHeight: '1.2',
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

  function wordHit(mouse, typeScale, titleY, titleSize, W, titleLines, pointerFine) {
    const lines = titleLines?.length ? titleLines : [WELCOME_TITLE];
    const lineH = titleSize * 1.08;
    const startY = titleY - (lines.length - 1) * lineH;
    ctx.font = `500 ${titleSize.toFixed(1)}px "Cormorant Garamond", serif`;
    const metrics = ctx.measureText(CRYSTAL_WORD);
    const ascent = metrics.actualBoundingBoxAscent || titleSize * 0.82;
    const descent = metrics.actualBoundingBoxDescent || titleSize * 0.22;
    const wordW = metrics.width;
    const pad = (pointerFine ? 7 : 16) * typeScale;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const idx = line.toLowerCase().indexOf(CRYSTAL_WORD);
      if (idx < 0) continue;
      const lineW = ctx.measureText(line).width;
      const prefixW = ctx.measureText(line.slice(0, idx)).width;
      const left = W / 2 - lineW / 2 + prefixW;
      const baseline = startY + i * lineH;
      if (
        mouse.x >= left - pad &&
        mouse.x <= left + wordW + pad &&
        mouse.y >= baseline - ascent - pad &&
        mouse.y <= baseline + descent + pad
      ) {
        return true;
      }
    }
    return false;
  }

  function horizonYAt(x, earth) {
    const nx = (x - earth.cx) / earth.rx;
    const inside = 1 - nx * nx;
    if (inside <= 0) return earth.H;
    return earth.cy - earth.ry * Math.sqrt(inside);
  }

  return {
    isHovering: () => hovering,

    /** Quote rows that fit maxW in the given canvas font ([] when disabled). */
    quoteLines(font, maxW) {
      ctx.font = font;
      return ctx.measureText(QUOTE_FULL).width <= maxW ? [QUOTE_FULL] : QUOTE_LINES;
    },

    /** Room the figures need above the horizon, so nearby labels can stay clear. */
    reserveAbove: (titleSize) => titleSize * HEIGHT_OVER_TITLE * VISIBLE_FRACTION * 0.95,

    unlock() {},

    hide() {
      hovering = false;
      hideLayer();
    },

    dispose() {
      hideLayer();
      layer.remove();
    },

    update({ mouse, hasPointer, pointerFine, welcomeFade, typeScale, W, titleY, titleSize, titleLines }) {
      hovering = hasPointer && welcomeFade > 0.02 &&
        wordHit(mouse, typeScale, titleY, titleSize, W, titleLines, pointerFine);
      if (!hovering) hideLayer();
      return hovering;
    },

    drawSprite({ W, titleSize, earth }) {
      if (!hovering || !spriteReady) {
        sprite.style.display = 'none';
        return;
      }
      const aspect = sprite.naturalWidth / sprite.naturalHeight;
      let imgH = titleSize * HEIGHT_OVER_TITLE;
      let imgW = imgH * aspect;
      const maxW = W * 0.86;
      if (imgW > maxW && imgW > 0) {
        const s = maxW / imgW;
        imgW *= s;
        imgH *= s;
      }
      const x = W / 2 - imgW / 2;
      const y = horizonYAt(W / 2, earth) - imgH;
      sprite.style.display = 'block';
      sprite.style.left = `${x}px`;
      sprite.style.top = `${y}px`;
      sprite.style.width = `${imgW}px`;
      sprite.style.height = `${imgH}px`;
    },

    drawSillyLine({ welcomeFade, lines, top, size, lineH, skyText }) {
      if (!hovering || welcomeFade <= 0.02 || !lines.length) {
        quote.style.display = 'none';
        return;
      }
      if (quote.childElementCount !== lines.length) {
        quote.replaceChildren(
          ...lines.map((line) => {
            const row = document.createElement('div');
            row.textContent = line;
            return row;
          })
        );
      } else {
        lines.forEach((line, i) => {
          if (quote.children[i].textContent !== line) quote.children[i].textContent = line;
        });
      }

      quote.style.display = 'block';
      quote.style.top = `${top}px`;
      quote.style.fontSize = `${size.toFixed(1)}px`;
      quote.style.lineHeight = `${lineH.toFixed(1)}px`;
      quote.style.color = skyText(welcomeFade * 0.82);
    }
  };
}
