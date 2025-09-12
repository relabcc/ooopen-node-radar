const { createCanvas, loadImage, registerFont } = require('canvas');

/**
 * Unified Chart Drawing Service
 * Centralizes common drawing functionality for radar charts
 */
class ChartService {
  constructor() {
    // Cache for loaded images to improve performance
    this.imageCache = new Map();
  }

  /**
   * Common score label drawing function
   * Used by all chart types with slight variations
   */
  drawScoreLabels(ctx, data, rScale, options = {}) {
    const {
      showScores = false,
      scoreColor = '#4A90E2',
      fontSize = 20,
      fontFamily = 'Arial',
      fontWeight = 'normal',
      angleOffset = 0,
      radiusOffset = 25
    } = options;

    if (!showScores) return;

    const angleSlice = (Math.PI * 2) / data.length;

    ctx.save();
    ctx.fillStyle = scoreColor;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    data.forEach((value, i) => {
      const angle = i * angleSlice + angleOffset;
      const dataRadius = rScale(value);
      const radius = dataRadius + radiusOffset;

      const x = Math.cos(angle - Math.PI / 2) * radius;
      const y = Math.sin(angle - Math.PI / 2) * radius;

      ctx.save();
      ctx.translate(x, y);

      let textAngle = angle;
      if (textAngle > Math.PI / 2 && textAngle < (3 * Math.PI) / 2) {
        textAngle += Math.PI; // keep text upright
      }
      ctx.rotate(textAngle);
      ctx.fillText(value?.toString?.() ?? String(value), 0, 0);
      ctx.restore();
    });

    ctx.restore();
  }

  /**
   * Common clear circle function for inner holes
   */
  clearCircle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.clip();
    ctx.clearRect(x - radius - 1, y - radius - 1, radius * 2 + 2, radius * 2 + 2);
  }

  /**
   * Load image with caching
   */
  async loadImageCached(imagePath) {
    if (this.imageCache.has(imagePath)) {
      return this.imageCache.get(imagePath);
    }
    
    const image = await loadImage(imagePath);
    this.imageCache.set(imagePath, image);
    return image;
  }

  /**
   * Create canvas pair (main + chart canvas for composition)
   */
  createCanvasPair(width, height) {
    const mainCanvas = createCanvas(width, height);
    const mainCtx = mainCanvas.getContext('2d');
    const chartCanvas = createCanvas(width, height);
    const chartCtx = chartCanvas.getContext('2d');

    return {
      mainCanvas,
      mainCtx,
      chartCanvas,
      chartCtx
    };
  }

  /**
   * Setup D3 radar chart components
   */
  async setupRadarChart(data, config) {
    const { scaleLinear } = await import('d3-scale');
    const { curveCardinalClosed, lineRadial } = await import('d3-shape');

    const {
      maxValue,
      minRadius = 0,
      maxRadius,
      angleOffset = 0
    } = config;

    const angleSlice = (Math.PI * 2) / data.length;

    const rScale = scaleLinear()
      .domain([0, maxValue])
      .range([minRadius, maxRadius]);

    const radarLine = lineRadial()
      .curve(curveCardinalClosed)
      .radius((d) => rScale(d))
      .angle((d, i) => i * angleSlice + angleOffset);

    return {
      rScale,
      radarLine,
      angleSlice
    };
  }

  /**
   * Register custom font safely
   */
  registerFontSafe(fontPath, fontFamily) {
    try {
      registerFont(fontPath, { family: fontFamily });
    } catch {
      // Silently ignore font registration errors
      // Canvas may already have the font or registration may be unsupported
    }
  }
}

module.exports = ChartService;