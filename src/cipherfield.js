/**
 * Shimmering field of cipher glyphs on a canvas that fills its parent —
 * a slow brightness wave drifts across dim hex characters, with rare
 * accent cells. Reads as "encrypted memory at work".
 * Renders a single static frame when the user prefers reduced motion.
 * @param {string} canvasId - id of the target <canvas>
 * @param {{color?: string, accent?: string}} [opts]
 * @returns {() => void} cleanup function
 */
export function initCipherField(canvasId, { color = '#cfaeef', accent = '#4ade80' } = {}) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const GLYPHS = '0123456789abcdef+/=#%&@$';
  const CELL = 18;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let cols = 0;
  let rows = 0;
  let cells = [];
  let t = 0;
  let last = 0;
  let isAnimating = true;

  const randomGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

  const resize = () => {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    cols = Math.ceil(canvas.width / CELL);
    rows = Math.ceil(canvas.height / CELL);
    cells = Array.from({ length: cols * rows }, () => ({
      ch: randomGlyph(),
      hot: Math.random() < 0.012, // rare accent cells
    }));
    // canvas resize clears all state
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  };

  const paint = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = cells[r * cols + c];
        if (Math.random() < 0.02) cell.ch = randomGlyph();
        // slow diagonal brightness wave
        const wave = Math.sin(t * 0.9 + c * 0.35 + r * 0.55) * 0.5 + 0.5;
        ctx.fillStyle = cell.hot ? accent : color;
        ctx.globalAlpha = 0.035 + wave * 0.09 + (cell.hot ? 0.16 : 0);
        ctx.fillText(cell.ch, c * CELL + 3, r * CELL + 13);
      }
    }
    ctx.globalAlpha = 1;
  };

  const animate = now => {
    if (!isAnimating) return;
    requestAnimationFrame(animate);
    if (now - last < 90) return; // ~11fps — calm shimmer, cheap to render
    last = now;
    t += 0.09;
    paint();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      isAnimating = true;
      requestAnimationFrame(animate);
    } else {
      isAnimating = false;
    }
  };

  const handleResize = () => {
    resize();
    if (reduced) paint();
  };

  resize();

  if (reduced) {
    paint();
    isAnimating = false;
  } else {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', handleResize);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('resize', handleResize);
    isAnimating = false;
  };
}
