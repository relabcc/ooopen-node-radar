const express = require('express');

const handler = require('./src');

const app = express();
const port = process.env.PORT || 8000;

// Root route uses src/index.js to handle response
app.get('/', handler);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
