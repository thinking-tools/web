// Star particle class
class Star {
  constructor(canvas, ctx, speed) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.speed = speed;

    // Random position (centered coordinate system)
    this.x = Math.random() * this.canvas.width - this.canvas.width / 2;
    this.y = Math.random() * this.canvas.height - this.canvas.height / 2;

    // Previous position for trail effect
    this.px = this.x;
    this.py = this.y;

    // Depth (z-axis)
    this.z = Math.random() * 4;
  }

  update() {
    // Store previous position
    this.px = this.x;
    this.py = this.y;

    // Increase depth
    this.z += this.speed;

    // Move outward from center (perspective effect)
    this.x += this.x * (0.2 * this.speed) * this.z;
    this.y += this.y * (0.2 * this.speed) * this.z;

    // Reset if particle goes off screen
    const margin = 50;
    if (
      this.x > this.canvas.width / 2 + margin ||
      this.x < -this.canvas.width / 2 - margin ||
      this.y > this.canvas.height / 2 + margin ||
      this.y < -this.canvas.height / 2 - margin
    ) {
      this.x = Math.random() * this.canvas.width - this.canvas.width / 2;
      this.y = Math.random() * this.canvas.height - this.canvas.height / 2;
      this.px = this.x;
      this.py = this.y;
      this.z = 0;
    }
  }

  draw() {
    // Line width based on depth (closer = thicker)
    this.ctx.lineWidth = this.z;
    this.ctx.beginPath();
    this.ctx.moveTo(this.x, this.y);
    this.ctx.lineTo(this.px, this.py);
    this.ctx.stroke();
  }
}

/**
 * Warp-speed starfield animation on a canvas that fills its parent element.
 * @param {string} canvasId - id of the target <canvas>
 * @param {string} [color='#cfaeef'] - trail stroke color
 * @returns {() => void} cleanup function
 */
export function initStarField(canvasId, color = '#cfaeef') {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const stars = [];
  let isAnimating = true;

  // Set canvas size
  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    // Reset transform and re-apply (canvas resize clears all state)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    // Re-apply styles (cleared on resize)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.strokeStyle = color;
  }

  resizeCanvas();

  // Create stars
  const starCount = 120;
  const starSpeed = 0.009;

  for (let i = 0; i < starCount; i++) {
    stars.push(new Star(canvas, ctx, starSpeed));
  }

  // Style settings
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Trail fade effect
  ctx.strokeStyle = color;

  // Animation loop
  function animate() {
    // Clear with fade effect (creates trails)
    ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

    // Update and draw each star
    stars.forEach(star => {
      star.update();
      star.draw();
    });

    if (isAnimating) {
      requestAnimationFrame(animate);
    }
  }

  // Handle visibility change
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      isAnimating = true;
      animate();
    } else {
      isAnimating = false;
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Handle window resize
  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // Start animation
  animate();

  // Cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    isAnimating = false;
  };
}
