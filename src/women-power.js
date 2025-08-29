const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const handleFactorTags = (tags) =>
  tags &&
  (Array.isArray(tags)
    ? tags
    : Object.entries(tags).map(([key, tag]) => ({ key, ...tag })));

const WIDTH = 1200;
const HEIGHT = 1844;

const colors = {
  darkRed: '#80514C',
  gradient: ['#A83A31', '#E8CAC4']
};

const innerRadius = [0, 335];
const chartRadius = [406, 502];
const yOffset = [810, 820];
const degOffset = [14.5, 45];

const maxValues = [15, 3];

const clearCircle = (ctx, x, y, radius) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.clip();
  ctx.clearRect(x - radius - 1, y - radius - 1, radius * 2 + 2, radius * 2 + 2);
};

const getChart1Data = (factors, result) => {
  const orders = [
    '目標力',
    '影響力',
    '恆毅力',
    '生活力',
    '知性力',
    '幸福力',
    '自信力',
    '品牌力',
    '營運力',
    '財務力',
    '驅動力',
    '聯盟力'
  ];
  let labels = [];
  const flattenTags = Object.entries(factors).reduce(
    (all, [factorId, { label, tags }]) => {
      if (label === '能力') {
        const factorTags = handleFactorTags(tags);
        labels = labels.concat(factorTags.map(({ label }) => label));
        return all.concat(factorTags.map(({ key }) => `${factorId}:${key}`));
      }
      return all;
    },
    []
  );
  const labelIndex = labels.reduce((all, label, index) => {
    all[label] = index;
    return all;
  }, {});
  const scores = flattenTags.map((tag) => result.scores[tag] || 0);
  return orders.map((label) => scores[labelIndex[label]] || 0)
};

const getChart2Data = (factors, result) => {
  const flattenTags = Object.entries(factors).reduce(
    (all, [factorId, { label, tags }]) => {
      if (label === '環境') {
        return all.concat(
          handleFactorTags(tags).map(({ key }) => `${factorId}:${key}`)
        );
      }
      return all;
    },
    []
  );
  return flattenTags.map((tag) => result.scores[tag] || 0);
};

const getCanvasResult = async ({ factors, result, chartId = '1' }) => {
  const maxRadius = chartRadius[chartId - 1];
  const minRadius = innerRadius[chartId - 1];
  const maxValue = maxValues[chartId - 1];
  const offset = (WIDTH / 2 - maxRadius) / 2;

  let data = [];
  if (chartId === '1') {
    data = getChart1Data(factors, result);
  }
  if (chartId === '2') {
    data = getChart2Data(factors, result);
  }

  const angleSlice = (Math.PI * 2) / data.length;

  const { scaleLinear } = await import('d3-scale');
  const { curveCardinalClosed, lineRadial } = await import('d3-shape');
  const rScale = scaleLinear()
    .domain([0, maxValue])
    .range([minRadius, maxRadius]);

  const radarLine = lineRadial()
    .curve(curveCardinalClosed)
    .radius((d) => rScale(d))
    .angle((d, i) => i * angleSlice + (degOffset[chartId - 1] * Math.PI) / 180);

  const mainCanvas = createCanvas(WIDTH, HEIGHT);
  const mainCtx = mainCanvas.getContext('2d');
  const chartCanvas = createCanvas(WIDTH, HEIGHT);
  const chartCtx = chartCanvas.getContext('2d');

  const bgImage = await loadImage(
    path.resolve(__dirname, `./chart-${chartId}.png`)
  );

  mainCtx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  chartCtx.translate(WIDTH / 2, yOffset[chartId - 1]);
  chartCtx.globalAlpha = 0.6;

  chartCtx.beginPath();
  const grd = chartCtx.createLinearGradient(
    offset,
    offset,
    maxRadius - offset,
    maxRadius - offset
  );
  grd.addColorStop(0, colors.gradient[0]);
  grd.addColorStop(0.38, colors.gradient[0]);
  grd.addColorStop(1, colors.gradient[1]);

  const radar = radarLine.context(chartCtx);
  radar(data);

  chartCtx.closePath();
  chartCtx.fillStyle = grd;

  chartCtx.fill();

  if (chartId === '2') {
    clearCircle(chartCtx, 0, 0, minRadius);
  }

  mainCtx.drawImage(chartCanvas, 0, 0, WIDTH, HEIGHT);

  return mainCanvas.toBuffer('image/png');
};

module.exports = getCanvasResult;
