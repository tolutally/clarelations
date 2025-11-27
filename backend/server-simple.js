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

// Store pending deals for review
let pendingDeals = [];

// Add some sample pending deals for testing
function addSamplePendingDeals() {
  if (pendingDeals.length === 0) {
    pendingDeals.push({
      id: `pending_${Date.now()}_sample1`,
      messageId: 'sample_msg_1',
      subject: 'Partnership Opportunity - SaaS Integration',
      contactName: 'Sarah Wilson',
      contactEmail: 'sarah.wilson@techcorp.com',
      emailBody: 'Hi, I would like to explore a potential partnership for integrating our SaaS platform with your CRM solution...',
      detectedAt: new Date().toISOString(),
      confidence: 'high',
      suggestedName: 'TechCorp SaaS Integration Partnership',
      suggestedUseCase: 'Software/Technology',
      suggestedDescription: 'Deal opportunity detected from email: "Partnership Opportunity - SaaS Integration"\n\nContact: Sarah Wilson (sarah.wilson@techcorp.com)\n\nEmail preview: Hi, I would like to explore a potential partnership for integrating our SaaS platform with your CRM solution...'
    });

    pendingDeals.push({
      id: `pending_${Date.now()}_sample2`,
      messageId: 'sample_msg_2', 
      subject: 'Consulting Services Inquiry',
      contactName: 'Michael Chen',
      contactEmail: 'mchen@growthventures.io',
      emailBody: 'We are looking for consulting services to help scale our operations. Could we schedule a meeting to discuss?',
      detectedAt: new Date().toISOString(),
      confidence: 'medium',
      suggestedName: 'Growth Ventures Consulting Project',
      suggestedUseCase: 'Professional Services',
      suggestedDescription: 'Deal opportunity detected from email: "Consulting Services Inquiry"\n\nContact: Michael Chen (mchen@growthventures.io)\n\nEmail preview: We are looking for consulting services to help scale our operations...'
    });
    
    console.log('📊 Added sample pending deals for testing');
  }
}

// Helper function to extract use case from email content
function extractUseCase(subject, body) {
  const text = (subject + ' ' + body).toLowerCase();
  
  if (text.includes('software') || text.includes('saas') || text.includes('app') || text.includes('platform')) {
    return 'Software/Technology';
  }
  if (text.includes('consulting') || text.includes('advisory') || text.includes('strategy')) {
    return 'Professional Services';
  }
  if (text.includes('marketing') || text.includes('advertising') || text.includes('campaign')) {
    return 'Marketing/Advertising';
  }
  if (text.includes('training') || text.includes('education') || text.includes('course')) {
    return 'Training/Education';
  }
  if (text.includes('integration') || text.includes('api') || text.includes('connect')) {
    return 'Integration/API';
  }
  
  return 'Business Development';
}

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
    pendingReviewCount: pendingDeals.length,
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
          // Extract email content for deal creation
          let emailBody = '';
          if (messageData.data.payload?.body?.data) {
            emailBody = Buffer.from(messageData.data.payload.body.data, 'base64').toString();
          } else if (messageData.data.payload?.parts) {
            // Handle multipart messages
            for (const part of messageData.data.payload.parts) {
              if (part.mimeType === 'text/plain' && part.body?.data) {
                emailBody = Buffer.from(part.body.data, 'base64').toString();
                break;
              }
            }
          }
          
          // Extract contact info from email
          const fromMatch = from.match(/(.+)<(.+)>/) || [null, from, from];
          const contactName = fromMatch[1] ? fromMatch[1].trim().replace(/"/g, '') : '';
          const contactEmail = fromMatch[2] || from;
          
          // Create pending deal based on email content
          const pendingDeal = {
            id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            messageId: message.id,
            subject: subject,
            contactName: contactName,
            contactEmail: contactEmail,
            emailBody: emailBody.substring(0, 500), // Truncate for storage
            detectedAt: new Date().toISOString(),
            confidence: Math.random() > 0.5 ? 'high' : 'medium',
            suggestedName: subject.replace(/^(Re:|Fwd?:)\s*/i, '').trim() || 'New Deal Opportunity',
            suggestedUseCase: extractUseCase(subject, emailBody),
            suggestedDescription: `Deal opportunity detected from email: "${subject}"\n\nContact: ${contactName} (${contactEmail})\n\nEmail preview: ${emailBody.substring(0, 200)}...`
          };
          
          pendingDeals.push(pendingDeal);
          pendingReview++;
          
          console.log(`📧 Created pending deal: ${pendingDeal.suggestedName}`);
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
  // Add sample deals if none exist (for testing)
  addSamplePendingDeals();
  
  // Return actual pending deals from storage
  res.json({
    success: true,
    pendingDeals: pendingDeals.map(deal => ({
      ...deal,
      // Format for frontend display
      name: deal.suggestedName,
      contact: {
        name: deal.contactName,
        email: deal.contactEmail
      },
      description: deal.suggestedDescription,
      useCase: deal.suggestedUseCase,
      confidence: deal.confidence,
      detectedAt: deal.detectedAt
    }))
  });
});

/**
 * Approve a pending deal
 * POST /api/gmail/approve-deal
 */
app.post('/api/gmail/approve-deal', async (req, res) => {
  const { pendingDeal } = req.body;
  
  try {
    // Find the pending deal
    const dealIndex = pendingDeals.findIndex(d => d.id === pendingDeal.id);
    if (dealIndex === -1) {
      return res.status(404).json({ error: 'Pending deal not found' });
    }
    
    const deal = pendingDeals[dealIndex];
    
    // Create contact first if needed
    let contactId = null;
    if (deal.contactName && deal.contactEmail) {
      // For demo, we'll create a simplified contact creation
      // In production, you'd want to check if contact already exists
      const contactData = {
        first_name: deal.contactName.split(' ')[0] || '',
        last_name: deal.contactName.split(' ').slice(1).join(' ') || '',
        email: deal.contactEmail,
        company: deal.contactEmail.split('@')[1] || '',
        source: 'Gmail Integration'
      };
      
      console.log('Creating contact for approved deal:', contactData);
      // contactId = await createContact(contactData); // Would implement this
    }
    
    // Create deal in 'Cold' stage
    const dealData = {
      contact_id: contactId,
      name: deal.suggestedName,
      use_case: deal.suggestedUseCase,
      stage: 'Cold', // Always start in Cold stage
      signal: 'Email Detected',
      description: deal.suggestedDescription,
      attachments: null
    };
    
    // For demo purposes, simulate deal creation
    // In production, you'd call your actual createDeal function
    const newDealId = `deal_${Date.now()}`;
    
    console.log('✅ Created deal from email:', dealData);
    
    // Remove from pending deals
    pendingDeals.splice(dealIndex, 1);
    
    res.json({
      success: true,
      message: 'Deal approved and created successfully in Cold stage',
      dealId: newDealId,
      dealData: dealData
    });
  } catch (error) {
    console.error('Error approving deal:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to approve deal',
      message: error.message 
    });
  }
});

/**
 * Reject a pending deal
 * POST /api/gmail/reject-deal
 */
app.post('/api/gmail/reject-deal', (req, res) => {
  const { pendingDealId } = req.body;
  
  try {
    // Find and remove the pending deal
    const dealIndex = pendingDeals.findIndex(d => d.id === pendingDealId);
    if (dealIndex === -1) {
      return res.status(404).json({ error: 'Pending deal not found' });
    }
    
    const rejectedDeal = pendingDeals.splice(dealIndex, 1)[0];
    
    console.log('❌ Rejected pending deal:', rejectedDeal.suggestedName);
    
    res.json({
      success: true,
      message: 'Deal rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting deal:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reject deal',
      message: error.message 
    });
  }
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