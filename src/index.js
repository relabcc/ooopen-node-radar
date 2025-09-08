const sevenDays = 7 * 24 * 60 * 60 * 1000;

module.exports = async (req, res) => {
  const { 
    chartId = '', 
    factors = '{}', 
    result = '{}',
    showScores = 'false',
    scoreColor = '#4A90E2',
    scoreFontSize = '20',
    scoreFontFamily = 'Arial'
  } = req.query;
  
  const showScoresBool = showScores === 'true';
  
  if (chartId.startsWith('women-power')) {
    const drawWomenPower = require('./women-power');
    const chart = chartId.slice(12);
    const buffer = await drawWomenPower({
      factors: JSON.parse(factors),
      result: JSON.parse(result),
      chartId: chart,
      showScores: showScoresBool,
      scoreColor,
      scoreFontSize: parseInt(scoreFontSize) || 18,
      scoreFontFamily
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
      result: JSON.parse(result),
      showScores: showScoresBool,
      scoreColor,
      scoreFontSize: parseInt(scoreFontSize) || 20,
      scoreFontFamily
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
