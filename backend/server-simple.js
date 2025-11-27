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
  tokens: null,
  userEmail: null,
  userProfile: null
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
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
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
    oauth2Client.setCredentials(tokens);
    
    // Get user profile information
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    // Get user email from the Gmail profile (more reliable than People API)
    const primaryEmail = profile.data.emailAddress || 'unknown@gmail.com';
    
    gmailConnection = {
      isConnected: true,
      connectedAt: new Date().toISOString(),
      lastSync: null,
      tokens: tokens,
      userEmail: primaryEmail,
      userProfile: {
        emailAddress: profile.data.emailAddress,
        messagesTotal: profile.data.messagesTotal,
        threadsTotal: profile.data.threadsTotal
      }
    };

    console.log('✅ Gmail connected successfully for:', primaryEmail);
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
  if (!gmailConnection.isConnected || !gmailConnection.tokens) {
    return res.status(400).json({
      error: 'Gmail not connected',
      message: 'Please connect your Gmail account first'
    });
  }

  try {
    const startTime = Date.now();
    console.log('🔄 Starting Gmail sync...');
    
    // Set up authenticated Gmail client
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );
    oauth2Client.setCredentials(gmailConnection.tokens);
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Get recent messages (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const query = `after:${Math.floor(oneWeekAgo.getTime() / 1000)}`;
    
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50
    });
    
    const messages = listResponse.data.messages || [];
    let emailsProcessed = 0;
    let dealsCreated = 0;
    let contactsCreated = 0;
    let pendingReview = 0;
    
    console.log(`📧 Found ${messages.length} recent messages to process`);
    
    // Process each message
    for (const message of messages.slice(0, 10)) { // Process first 10 for demo
      try {
        const messageData = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        
        const headers = messageData.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const to = headers.find(h => h.name === 'To')?.value || '';
        
        // Simple business email detection
        const isBusinessEmail = (
          subject.toLowerCase().includes('meeting') ||
          subject.toLowerCase().includes('proposal') ||
          subject.toLowerCase().includes('contract') ||
          subject.toLowerCase().includes('quote') ||
          subject.toLowerCase().includes('deal') ||
          from.includes('@') && !from.includes('@gmail.com') &&
          !from.includes('@yahoo.com') && !from.includes('@outlook.com')
        );
        
        if (isBusinessEmail) {
          // Simulate deal/contact creation
          if (Math.random() > 0.7) {
            dealsCreated++;
          } else if (Math.random() > 0.5) {
            contactsCreated++;
          } else {
            pendingReview++;
          }
        }
        
        emailsProcessed++;
        
        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (messageError) {
        console.error('Error processing message:', messageError.message);
      }
    }
    
    const duration = Date.now() - startTime;
    
    const results = {
      success: true,
      duration,
      emailsProcessed,
      dealsCreated,
      contactsCreated,
      pendingReview,
      message: `Sync completed successfully. Processed ${emailsProcessed} emails.`
    };

    gmailConnection.lastSync = new Date().toISOString();
    
    console.log('✅ Gmail sync completed:', results);
    res.json(results);
  } catch (error) {
    console.error('❌ Gmail sync error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Sync failed',
      message: error.message 
    });
  }
});

/**
 * Get pending deals for review
 * GET /api/gmail/pending-deals
 */
app.get('/api/gmail/pending-deals', (req, res) => {
  // Return empty array for now - this would normally fetch from database
  res.json({
    success: true,
    pendingDeals: []
  });
});

/**
 * Approve a pending deal
 * POST /api/gmail/approve-deal
 */
app.post('/api/gmail/approve-deal', (req, res) => {
  const { pendingDeal } = req.body;
  
  // Simulate deal approval
  res.json({
    success: true,
    message: 'Deal approved and created successfully',
    dealId: 'new-deal-' + Date.now()
  });
});

/**
 * Reject a pending deal
 * POST /api/gmail/reject-deal
 */
app.post('/api/gmail/reject-deal', (req, res) => {
  const { pendingDealId } = req.body;
  
  // Simulate deal rejection
  res.json({
    success: true,
    message: 'Deal rejected successfully'
  });
});

/**
 * Disconnect Gmail account
 * POST /api/gmail/disconnect
 */
app.post('/api/gmail/disconnect', (req, res) => {
  // Reset connection state
  gmailConnection = {
    isConnected: false,
    connectedAt: null,
    lastSync: null,
  };
  
  console.log('✅ Gmail account disconnected');
  res.json({
    success: true,
    message: 'Gmail account disconnected successfully'
  });
});

/**
 * Get connected Gmail accounts
 * GET /api/gmail/accounts
 */
app.get('/api/gmail/accounts', (req, res) => {
  // For now, return single account or empty array
  const accounts = gmailConnection.isConnected ? [{
    id: 'primary',
    email: gmailConnection.userEmail || 'unknown@gmail.com',
    connectedAt: gmailConnection.connectedAt,
    isPrimary: true,
    lastSync: gmailConnection.lastSync
  }] : [];
  
  res.json({
    success: true,
    accounts,
    canAddMore: accounts.length < 5 // Allow up to 5 accounts
  });
});

/**
 * Connect additional Gmail account
 * GET /api/gmail/connect-additional
 */
app.get('/api/gmail/connect-additional', async (req, res) => {
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
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    // Add additional account parameter to distinguish from primary connection
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: 'additional_account' // This helps identify additional account flow
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating OAuth URL for additional account:', error);
    res.status(500).json({ 
      error: 'Failed to generate OAuth URL',
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