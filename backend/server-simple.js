const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Gmail OAuth configuration
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || `http://localhost:${PORT}/api/gmail/callback`;

// Simple in-memory storage for Gmail connection
let gmailConnection = {
  isConnected: false,
  connectedAt: null,
  lastSync: null,
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Clarelations Backend API is running!' 
  });
});

// Basic API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working!' });
});

// Gmail API Routes

/**
 * Initiate Gmail OAuth flow
 * GET /api/gmail/connect
 */
app.get('/api/gmail/connect', async (req, res) => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ 
      error: 'Gmail OAuth credentials not configured',
      message: 'Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables'
    });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate OAuth URL',
      message: error.message 
    });
  }
});

/**
 * Handle Gmail OAuth callback
 * GET /api/gmail/callback
 */
app.get('/api/gmail/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`http://localhost:5175/?gmail_auth=error&message=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    gmailConnection = {
      isConnected: true,
      connectedAt: new Date().toISOString(),
      lastSync: null,
    };

    console.log('✅ Gmail connected successfully');
    res.redirect('http://localhost:5175/?gmail_auth=success');
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.redirect(`http://localhost:5175/?gmail_auth=error&message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Get Gmail sync status
 * GET /api/gmail/status
 */
app.get('/api/gmail/status', (req, res) => {
  res.json({
    isConnected: gmailConnection.isConnected,
    connectedAt: gmailConnection.connectedAt,
    lastSync: gmailConnection.lastSync,
    pendingReviewCount: 0,
    statistics: {
      totalSyncs: gmailConnection.lastSync ? 1 : 0,
      totalDealsCreated: 0,
      totalContactsCreated: 0,
      avgProcessingTime: 0,
    },
    recentSyncs: [],
  });
});

/**
 * Manually trigger Gmail sync
 * POST /api/gmail/sync
 */
app.post('/api/gmail/sync', async (req, res) => {
  if (!gmailConnection.isConnected) {
    return res.status(400).json({
      error: 'Gmail not connected',
      message: 'Please connect your Gmail account first'
    });
  }

  try {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = {
      success: true,
      duration: 2000,
      emailsProcessed: 15,
      dealsCreated: 2,
      contactsCreated: 3,
      pendingReview: 1,
      message: 'Sync completed successfully'
    };

    gmailConnection.lastSync = new Date().toISOString();
    res.json(results);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Sync failed',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`📧 Gmail API endpoints:`);
  console.log(`   - GET ${PORT}/api/gmail/connect`);
  console.log(`   - GET ${PORT}/api/gmail/callback`);
  console.log(`   - GET ${PORT}/api/gmail/status`);
  console.log(`   - POST ${PORT}/api/gmail/sync`);
});

module.exports = app;