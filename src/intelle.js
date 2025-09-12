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

const RESULT_KEYS_1 = [
  'bFvA8r',
  'psaC-r',
  '-1OG2g',
  'v9lAGL',
  'wzwkeT',
  'slXqQ7',
  'n8WFDI',
  '9UNOSA',
  'mkvcta',
  'ockkuf'
];

const RESULT_KEYS_2 = [
  '_Ia9CU',
  'g90ksj',
  'fNJ8fm',
  'Ov2l9G',
  'JtBa2H',
  'Fb2dGK',
  'OixAU4',
  'lgeHpP',
  'n3UJTR',
  'I19Po6'
];

// Helper mapping by chart id (string)
const RESULT_KEYS_BY_CHART = {
  '1': RESULT_KEYS_1,
  '2': RESULT_KEYS_2
};
// Extract numeric chart data from result, ordering by predefined key list when available
const getChartDataFromResult = (result, chartId) => {
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

  // If scores is an object: map by predefined key list for chartId if available, else by object value order
  if (result.scores && typeof result.scores === 'object') {
    const keyList = RESULT_KEYS_BY_CHART[String(chartId)] || null;
    if (keyList) {
      const mappedByChart = keyList.map((k) => {
        const v = result.scores[k];
        return typeof v === 'number' ? v : Number(v) || 0;
      });
      return mappedByChart;
    }
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
  scoreColor = '#325591',
  scoreFontSize = 40,
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
  let data = getChartDataFromResult(result, chartId);

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
    fontWeight: '500',
    angleOffset: angleOffsetRad,
    radiusOffset: 30
  });

  // Composite onto main
  mainCtx.drawImage(chartCanvas, 0, 0, WIDTH, HEIGHT);

  return mainCanvas.toBuffer('image/png');
};

module.exports = getIntelleCanvas;
