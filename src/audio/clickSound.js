const CLICK_SRC = '/sounds/plastic-bubble-click.wav';
/** Mixkit's original is quite loud; keep this a soft tap. */
const CLICK_VOLUME = 0.18;

let template = null;

function getTemplate() {
  if (!template) {
    template = new Audio(CLICK_SRC);
    template.preload = 'auto';
    template.volume = CLICK_VOLUME;
  }
  return template;
}

/** Warm the audio element so the first click isn't delayed. */
export function unlockClickSound() {
  getTemplate();
}

export function playClickSound() {
  try {
    const node = getTemplate().cloneNode();
    node.volume = CLICK_VOLUME;
    const playing = node.play();
    if (playing && typeof playing.catch === 'function') {
      playing.catch(() => {});
    }
  } catch {
    // Autoplay policies or missing audio should never block a click.
  }
}
