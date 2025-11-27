const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());

// Gmail OAuth configuration
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/api/gmail/callback`;

app.get('/api/gmail/connect', async (req, res) => {
  console.log('Gmail connect endpoint hit');
  
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.log('Missing credentials:', { CLIENT_ID: !!CLIENT_ID, CLIENT_SECRET: !!CLIENT_SECRET });
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

    console.log('Generated auth URL successfully');
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate OAuth URL',
      message: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Test Gmail server running on http://localhost:${PORT}`);
  console.log(`Test: curl http://localhost:${PORT}/api/gmail/connect`);
});