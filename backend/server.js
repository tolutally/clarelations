const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import Gmail API routes
const gmailConnect = require('./api/gmail/connect.js');
const gmailCallback = require('./api/gmail/callback.js');
const gmailSync = require('./api/gmail/sync.js');
const gmailStatus = require('./api/gmail/status.js');

// Gmail routes
app.get('/api/gmail/connect', (req, res) => {
  gmailConnect.default(req, res);
});

app.get('/api/gmail/callback', (req, res) => {
  gmailCallback.default(req, res);
});

app.post('/api/gmail/sync', (req, res) => {
  gmailSync.default(req, res);
});

app.get('/api/gmail/status', (req, res) => {
  gmailStatus.default(req, res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Gmail API server running on http://localhost:${PORT}`);
  console.log(`📧 Gmail connect endpoint: http://localhost:${PORT}/api/gmail/connect`);
  console.log(`📊 Gmail status endpoint: http://localhost:${PORT}/api/gmail/status`);
});

module.exports = app;