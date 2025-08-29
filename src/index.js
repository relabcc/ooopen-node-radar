const sevenDays = 7 * 24 * 60 * 60 * 1000;

module.exports = async (req, res) => {
  const { chartId = '', factors = '{}', result = '{}' } = req.query;
  if (chartId.startsWith('women-power')) {
    const drawWomenPower = require('./women-power');
    const chart = chartId.slice(12);
    const buffer = await drawWomenPower({
      factors: JSON.parse(factors),
      result: JSON.parse(result),
      chartId: chart
    });
    res.setHeader(
      'Cache-Control',
      `public, max-age=${sevenDays}, s-maxage=${sevenDays}`
    );
    res.setHeader('Content-Type', 'image/png');
    return res.send(buffer);
  }
  if (chartId === 'love-color') {
    const getLoveColorCanvas = require('./love-color');
    const buffer = await getLoveColorCanvas({
      result: JSON.parse(result)
    });
    res.setHeader(
      'Cache-Control',
      `public, max-age=${sevenDays}, s-maxage=${sevenDays}`
    );
    res.setHeader('Content-Type', 'image/png');
    return res.send(buffer);
  }
  return res.status(404).send('Not found');
};
