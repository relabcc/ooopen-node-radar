const path = require('path');
const { createCanvas } = require('canvas');
const ChartService = require('./chart-service');

// No factor usage for intelle; data comes only from `result`

// Chart config from request
const CENTER = { x: 600, y: 787 };
const MAX_DIAMETER = 708; // px
const MAX_RADIUS = MAX_DIAMETER / 2; // 354

// Styling
const FILL_COLOR = '#AADCFA';
const STROKE_COLOR = '#325591';
const LINE_WIDTH = 1;

// Value range: min 0, max 50
const MAX_VALUE = 50;

// Data extraction from `result` only
const DIMENSIONS = 10;

const getChartDataFromResult = (result) => {
  if (!result) return [];
  // Prefer explicit arrays if provided
  if (Array.isArray(result.values)) {
    const arr = result.values.filter((v) => typeof v === 'number');
    return arr.length >= DIMENSIONS ? arr.slice(0, DIMENSIONS) : arr.concat(Array(Math.max(0, DIMENSIONS - arr.length)).fill(0));
  }
  if (Array.isArray(result.scores)) {
    const arr = result.scores.filter((v) => typeof v === 'number');
    return arr.length >= DIMENSIONS ? arr.slice(0, DIMENSIONS) : arr.concat(Array(Math.max(0, DIMENSIONS - arr.length)).fill(0));
  }

  // If scores is an object and orders array is provided, map by orders
  if (result.scores && typeof result.scores === 'object') {
    if (Array.isArray(result.orders) && result.orders.length >= DIMENSIONS) {
      const mapped = result.orders.slice(0, DIMENSIONS).map((k) => Number(result.scores[k]) || 0);
      return mapped;
    }
    // Fallback: use numeric values in object iteration order
    const nums = Object.values(result.scores).filter((v) => typeof v === 'number');
    return nums.length >= DIMENSIONS ? nums.slice(0, DIMENSIONS) : nums.concat(Array(Math.max(0, DIMENSIONS - nums.length)).fill(0));
  }
  return Array(DIMENSIONS).fill(0);
};

// Main entry
const getIntelleCanvas = async ({
  result,
  chartId = '1',
  showScores = false,
  scoreColor = '#4A90E2',
  scoreFontSize = 20,
  scoreFontFamily = 'Ropa Sans'
}) => {
  const chartService = new ChartService();
  
  // Register custom font once (silent if registration fails)
  chartService.registerFontSafe(
    path.resolve(__dirname, './fonts/RopaSans-Regular.ttf'),
    'Ropa Sans'
  );

  // Load background image first to size the canvas exactly
  const bgImage = await chartService.loadImageCached(
    path.resolve(__dirname, `./intelle-${chartId}.jpg`)
  );
  const WIDTH = bgImage.width || 1200;
  const HEIGHT = bgImage.height || 1844;

  // Data
  let data = getChartDataFromResult(result);

  if (!Array.isArray(data) || data.length === 0) {
    // Graceful fallback: nothing to draw, just return background
    const blankCanvas = createCanvas(WIDTH, HEIGHT);
    const blankCtx = blankCanvas.getContext('2d');
    blankCtx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
    return blankCanvas.toBuffer('image/png');
  }

  const degOffset = 18;
  const angleOffsetRad = (degOffset * Math.PI) / 180;

  // Setup radar chart components using service
  const { rScale, radarLine } = await chartService.setupRadarChart(data, {
    maxValue: MAX_VALUE,
    minRadius: 0,
    maxRadius: MAX_RADIUS,
    angleOffset: angleOffsetRad
  });

  // Create canvas pair
  const { mainCanvas, mainCtx, chartCanvas, chartCtx } = chartService.createCanvasPair(WIDTH, HEIGHT);

  // Draw background first
  mainCtx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  // Move to radar center
  chartCtx.translate(CENTER.x, CENTER.y);

  // Draw filled polygon
  chartCtx.beginPath();
  const radar = radarLine.context(chartCtx);
  radar(data);
  chartCtx.closePath();
  chartCtx.fillStyle = FILL_COLOR;
  // Fill with 50% opacity without affecting stroke/labels
  chartCtx.save();
  chartCtx.globalAlpha = 0.5;
  chartCtx.fill();
  chartCtx.restore();

  // Stroke outline
  chartCtx.lineWidth = LINE_WIDTH;
  chartCtx.strokeStyle = STROKE_COLOR;
  chartCtx.stroke();

  // Labels using service
  chartService.drawScoreLabels(chartCtx, data, rScale, {
    showScores,
    scoreColor,
    fontSize: scoreFontSize,
    fontFamily: scoreFontFamily,
    fontWeight: 'normal',
    angleOffset: angleOffsetRad,
    radiusOffset: 25
  });

  // Composite onto main
  mainCtx.drawImage(chartCanvas, 0, 0, WIDTH, HEIGHT);

  return mainCanvas.toBuffer('image/png');
};

module.exports = getIntelleCanvas;
