const path = require('path');
const ChartService = require('./chart-service');

const WIDTH = 1200;
const HEIGHT = 1860;

const fill = '#C9C4C0';

const minRadius = 577 / 2;
const maxRadius = 825 / 2;
const yOffset = 666;
const degOffset = 30;

const maxValue = 12;

const orders = [
  'EEkWTo', // 柔棉粉
  'MIgPHf', // 熾焰紅
  '7X_gnx', // 醇蜜紅
  '6VsSRV', // 暖磚紅
  'QAHco5', // 絢爛紅
  'WAi_8M' // 霓光粉
];

const getChartData = (result) => {
  if (result.scores) {
    return orders.map((key) => result.scores[key]);
  }
  return Array.from(
    {
      length: 6
    },
    (_, i) => i % maxValue
  );
};

const getLoveColorCanvas = async ({ 
  result, 
  showScores = false, 
  scoreColor = '#4A90E2',
  scoreFontSize = 20,
  scoreFontFamily = 'Arial'
}) => {
  const chartService = new ChartService();
  let data = getChartData(result);

  const angleOffsetRad = (degOffset * Math.PI) / 180;

  // Setup radar chart components using service
  const { rScale, radarLine } = await chartService.setupRadarChart(data, {
    maxValue: maxValue,
    minRadius: minRadius,
    maxRadius: maxRadius,
    angleOffset: angleOffsetRad
  });

  // Create canvas pair
  const { mainCanvas, mainCtx, chartCanvas, chartCtx } = chartService.createCanvasPair(WIDTH, HEIGHT);

  const bgImage = await chartService.loadImageCached(path.resolve(__dirname, `./love-color.png`));

  // fill background
  mainCtx.fillStyle = '#EFE9DA';
  mainCtx.fillRect(0, 0, WIDTH, HEIGHT);

  chartCtx.translate(WIDTH / 2, yOffset);

  chartCtx.beginPath();
  chartCtx.fillStyle = fill;
  const radar = radarLine.context(chartCtx);
  radar(data);

  chartCtx.closePath();

  chartCtx.fill();

  chartService.clearCircle(chartCtx, 0, 0, minRadius);

  // Draw score labels at endpoints using service
  chartService.drawScoreLabels(chartCtx, data, rScale, { 
    showScores, 
    scoreColor, 
    fontSize: scoreFontSize, 
    fontFamily: scoreFontFamily,
    fontWeight: 'bold',
    angleOffset: angleOffsetRad,
    radiusOffset: 25
  });

  mainCtx.drawImage(chartCanvas, 0, 0, WIDTH, HEIGHT);
  mainCtx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  return mainCanvas.toBuffer('image/png');
};

module.exports = getLoveColorCanvas;
