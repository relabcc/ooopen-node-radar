const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const WIDTH = 1200;
const HEIGHT = 1860;

const fill = '#C9C4C0';

const minRadius = 577 / 2;
const maxRadius = 825 / 2;
const yOffset = 666;
const degOffset = 30;

const maxValue = 12;

const clearCircle = (ctx, x, y, radius) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.clip();
  ctx.clearRect(x - radius - 1, y - radius - 1, radius * 2 + 2, radius * 2 + 2);
};

const drawScoreLabels = (ctx, data, rScale, options = {}) => {
  const { 
    showScores = false, 
    scoreColor = '#4A90E2',
    fontSize = 20,
    fontFamily = 'Arial'
  } = options;
  
  if (!showScores) return;
  
  const angleSlice = (Math.PI * 2) / data.length;
  
  ctx.save();
  ctx.fillStyle = scoreColor;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  data.forEach((value, i) => {
    const angle = i * angleSlice + (degOffset * Math.PI) / 180;
    // Use the same scale as the radar chart to get the actual endpoint radius
    const dataRadius = rScale(value);
    const radius = dataRadius + 25; // Add offset from the actual data point
    
    // Calculate endpoint position
    const x = Math.cos(angle - Math.PI / 2) * radius;
    const y = Math.sin(angle - Math.PI / 2) * radius;
    
    ctx.save();
    ctx.translate(x, y);
    
    // Rotate text to align with axis, but ensure readability
    let textAngle = angle;
    
    // Flip text if it would be upside down for better readability
    if (textAngle > Math.PI / 2 && textAngle < 3 * Math.PI / 2) {
      textAngle += Math.PI;
    }
    
    ctx.rotate(textAngle);
    ctx.fillText(value.toString(), 0, 0);
    ctx.restore();
  });
  
  ctx.restore();
};

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

const getLoveColorCanvas = async ({ result, showScores = false, scoreColor = '#4A90E2' }) => {
  let data = getChartData(result);

  const angleSlice = (Math.PI * 2) / data.length;

  const { scaleLinear } = await import('d3-scale');
  const { curveCardinalClosed, lineRadial } = await import('d3-shape');
  const rScale = scaleLinear()
    .domain([0, maxValue])
    .range([minRadius, maxRadius]);

  const radarLine = lineRadial()
    .curve(curveCardinalClosed)
    .radius((d) => rScale(d))
    .angle((d, i) => i * angleSlice + (degOffset * Math.PI) / 180);

  const mainCanvas = createCanvas(WIDTH, HEIGHT);
  const mainCtx = mainCanvas.getContext('2d');
  const chartCanvas = createCanvas(WIDTH, HEIGHT);
  const chartCtx = chartCanvas.getContext('2d');

  const bgImage = await loadImage(path.resolve(__dirname, `./love-color.png`));

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

  clearCircle(chartCtx, 0, 0, minRadius);

  // Draw score labels at endpoints
  drawScoreLabels(chartCtx, data, rScale, { showScores, scoreColor });

  mainCtx.drawImage(chartCanvas, 0, 0, WIDTH, HEIGHT);
  mainCtx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  return mainCanvas.toBuffer('image/png');
};

module.exports = getLoveColorCanvas;
