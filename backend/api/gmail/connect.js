const { google } = require('googleapis');

const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:5173/api/gmail/callback';
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

/**
 * Initiate Gmail OAuth flow
 * GET /api/gmail/connect
 */
exports.default = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      prompt: 'consent', // Force to get refresh token
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate OAuth URL',
      message: error.message 
    });
  }
};