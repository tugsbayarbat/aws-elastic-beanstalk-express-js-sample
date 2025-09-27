const express = require('express');
const app = express();
const port = 8081;

app.get('/', (req, res) => res.send('Hello World!'));

// Only start the server if this file is run directly, not when imported by tests
if (require.main === module) {
    app.listen(port);
    console.log(`App running on http://localhost:${port}`);
}

module.exports = app;
