# ChartService Documentation

## Overview

The `ChartService` is a unified drawing service that centralizes common functionality for radar chart generation across all chart types in the ooopen-node-radar application. It was designed to improve maintainability, reduce code duplication, and provide a consistent API for chart drawing operations.

## Architecture

### Before Refactoring
- Three separate modules: `intelle.js`, `love-color.js`, `women-power.js`
- Each module contained duplicated code for:
  - Canvas creation and management
  - Score label drawing
  - D3 radar chart setup
  - Image loading and background handling
- Total duplicated code: ~150 lines across modules

### After Refactoring
- Single `ChartService` class with common functionality
- Individual modules focus on chart-specific configuration and data processing
- Reduced duplication while maintaining 100% backward compatibility
- Enhanced extensibility for future chart types

## API Reference

### ChartService Class

#### Constructor
```javascript
const chartService = new ChartService();
```
Creates a new instance with an empty image cache.

#### Methods

##### `drawScoreLabels(ctx, data, rScale, options = {})`
Draws score labels at radar chart endpoints with configurable styling.

**Parameters:**
- `ctx` (CanvasRenderingContext2D): Canvas context for drawing
- `data` (Array): Array of numeric values for the chart
- `rScale` (Function): D3 scale function for radius mapping
- `options` (Object): Configuration options

**Options:**
```javascript
{
  showScores: false,        // Whether to show score labels
  scoreColor: '#4A90E2',    // Label text color
  fontSize: 20,             // Font size in pixels
  fontFamily: 'Arial',      // Font family name
  fontWeight: 'normal',     // Font weight (normal, bold, etc.)
  angleOffset: 0,           // Angle offset in radians
  radiusOffset: 25          // Distance from data point in pixels
}
```

##### `clearCircle(ctx, x, y, radius)`
Creates a circular clear area in the canvas (used for inner chart holes).

**Parameters:**
- `ctx` (CanvasRenderingContext2D): Canvas context
- `x` (Number): Center X coordinate
- `y` (Number): Center Y coordinate  
- `radius` (Number): Circle radius in pixels

##### `loadImageCached(imagePath)`
Loads an image with caching to improve performance.

**Parameters:**
- `imagePath` (String): Absolute path to image file

**Returns:** Promise<Image> - Cached image object

##### `createCanvasPair(width, height)`
Creates a pair of canvases for composition-based drawing.

**Parameters:**
- `width` (Number): Canvas width in pixels
- `height` (Number): Canvas height in pixels

**Returns:**
```javascript
{
  mainCanvas: Canvas,      // Primary canvas for final output
  mainCtx: Context2D,      // Main canvas context
  chartCanvas: Canvas,     // Overlay canvas for chart elements
  chartCtx: Context2D      // Chart canvas context
}
```

##### `setupRadarChart(data, config)`
Sets up D3 radar chart components with proper scaling.

**Parameters:**
- `data` (Array): Chart data array
- `config` (Object): Radar chart configuration

**Config Options:**
```javascript
{
  maxValue: 50,            // Maximum data value
  minRadius: 0,            // Minimum radius (inner hole)
  maxRadius: 354,          // Maximum radius
  angleOffset: 0           // Starting angle offset in radians
}
```

**Returns:**
```javascript
{
  rScale: Function,        // D3 scale function for radius
  radarLine: Function,     // D3 line generator for radar shape
  angleSlice: Number       // Angle between each data point
}
```

##### `registerFontSafe(fontPath, fontFamily)`
Safely registers a custom font, ignoring errors if registration fails.

**Parameters:**
- `fontPath` (String): Absolute path to font file
- `fontFamily` (String): Font family name to register

## Usage Examples

### Basic Chart Creation
```javascript
const ChartService = require('./chart-service');

async function createChart(data) {
  const chartService = new ChartService();
  
  // Setup radar chart
  const { rScale, radarLine } = await chartService.setupRadarChart(data, {
    maxValue: 50,
    maxRadius: 300
  });
  
  // Create canvases
  const { mainCanvas, mainCtx, chartCtx } = chartService.createCanvasPair(800, 600);
  
  // Draw radar shape
  chartCtx.beginPath();
  const radar = radarLine.context(chartCtx);
  radar(data);
  chartCtx.stroke();
  
  // Add score labels
  chartService.drawScoreLabels(chartCtx, data, rScale, {
    showScores: true,
    scoreColor: '#333',
    fontSize: 16
  });
  
  return mainCanvas.toBuffer('image/png');
}
```

### Adding Image Backgrounds
```javascript
async function createChartWithBackground(data, backgroundPath) {
  const chartService = new ChartService();
  
  // Load background image (cached automatically)
  const bgImage = await chartService.loadImageCached(backgroundPath);
  
  const { mainCanvas, mainCtx, chartCtx } = chartService.createCanvasPair(
    bgImage.width, 
    bgImage.height
  );
  
  // Draw background
  mainCtx.drawImage(bgImage, 0, 0);
  
  // ... draw chart on chartCtx ...
  
  // Composite final image
  mainCtx.drawImage(chartCanvas, 0, 0);
  
  return mainCanvas.toBuffer('image/png');
}
```

## Integration Guide

### For New Chart Types

1. **Create your chart module** (e.g., `new-chart.js`):
```javascript
const ChartService = require('./chart-service');

const getNewChart = async (options) => {
  const chartService = new ChartService();
  
  // Your chart-specific configuration
  const config = {
    maxValue: options.maxValue || 100,
    maxRadius: 400,
    // ... other config
  };
  
  // Use service for common operations
  const { rScale, radarLine } = await chartService.setupRadarChart(data, config);
  const { mainCanvas, mainCtx, chartCtx } = chartService.createCanvasPair(800, 600);
  
  // Your specific drawing logic here
  
  return mainCanvas.toBuffer('image/png');
};

module.exports = getNewChart;
```

2. **Add to main router** (`index.js`):
```javascript
if (chartId === 'new-chart') {
  const getNewChart = require('./new-chart');
  const buffer = await getNewChart({ result: JSON.parse(result) });
  // ... set headers and send response
}
```

### For Existing Chart Modifications

The service provides a stable API, so modifications to chart-specific logic can be made in individual modules without affecting the shared functionality.

## Performance Considerations

- **Image Caching**: Background images are cached automatically to avoid repeated file I/O
- **Canvas Reuse**: Consider reusing ChartService instances for multiple charts in the same request
- **Font Registration**: Custom fonts are registered once per service instance

## Testing

All chart modules have been tested to ensure backward compatibility:
- API responses remain identical
- Generated images maintain the same visual quality
- Performance characteristics are preserved or improved

## Migration Notes

The refactoring maintains 100% backward compatibility:
- All existing API endpoints work unchanged
- Chart output is visually identical
- No breaking changes to client code

## Future Enhancements

The unified service architecture enables:
- Easy addition of new chart types
- Consistent styling across all charts
- Shared performance optimizations
- Centralized configuration management