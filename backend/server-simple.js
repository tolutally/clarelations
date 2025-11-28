const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

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

// AI-powered email analysis using OpenAI
async function analyzeEmailWithAI(subject, body, fromEmail) {
  try {
    const prompt = `
You are an AI assistant that classifies incoming emails for CRM deal creation.
Carefully read the email and decide if it represents a *real* business opportunity, and if so, what kind.

Email:
Subject: ${subject}
From: ${fromEmail}
Content:
"""
${body.substring(0, 1000)}
"""

Your job:

1. First decide if this is a **legitimate business opportunity**:
   - Treat as a business opportunity **only if** the sender is:
     - expressing interest in buying, trialing, or evaluating a product/service,
     - requesting a demo or intro call to learn about the product/service,
     - discussing becoming a client, customer, or user,
     - exploring a partnership, integration, or collaboration that could lead to revenue,
     - discussing implementation/onboarding for a new or expanding client.
   - Do **NOT** mark as an opportunity if it is primarily:
     - spam or cold outbound marketing TO us,
     - newsletters, announcements, promotions, general marketing blasts,
     - invoices, receipts, payment confirmations, salary/HR/payroll info,
     - billing/accounting only (no new revenue opportunity),
     - support tickets or bug reports only (no upsell/expansion intent),
     - job applications or recruiting emails,
     - charity/donation/fundraising requests,
     - purely personal or internal team communication.

2. Classify the **interaction type** as one of:
   - "demo_call" – they want a demo, product walkthrough, or intro call to learn about what we offer.
   - "intro_call" – initial conversation to understand fit, exploratory chat without explicit demo language.
   - "partnership_discussion" – exploring partnership, collaboration, integration, reseller, co-marketing, etc.
   - "client_acquisition" – they want to start using/buying the product/service, request pricing, proposal, or contract.
   - "onboarding" – new or recently closed customer discussing setup, training, implementation, or rollout.
   - "renewal_or_expansion" – existing customer discussing renewal, upgrade, expansion, adding seats or new scope.
   - "support_only" – support/issue/bug/technical question with **no sign** of expansion or new revenue.
   - "none" – clearly not a business opportunity (e.g. newsletter, billing, spam, personal).

3. Identify the **business use case** in plain language:
   - A short phrase that describes what they're trying to achieve (e.g. "AI interview analysis", "sales coaching", "HR onboarding automation", "CRM implementation support").

4. Suggest a professional **deal name**:
   - Good format: "<Company or Person> – <Short intent or use case>".
   - If no company, use the person's name or a generic like "Inbound – <use case>".

5. Provide a **confidence level** in your classification:
   - "high" – very clear this *is* or *is not* an opportunity and the type is obvious.
   - "medium" – some signals, but wording is ambiguous or missing context.
   - "low" – unclear intent, very indirect language, or conflicting signals.

6. Extract any **business value** mentioned:
   - Summarize any numbers, scale, or value indicators: budgets, number of users, teams, offices, timelines, or expected impact.
   - If not explicitly stated, leave a concise best-effort guess or say "Not explicitly stated".

7. Briefly explain your reasoning:
   - 1–3 sentences on why you classified it that way (especially why it is/isn't an opportunity and why you chose that interaction type).
   - Be conservative: if the email is mainly informational or administrative, mark it as not an opportunity.

Respond with **JSON only**, no extra text:

{
  "isBusinessOpportunity": boolean,
  "opportunityType": "demo_call" | "intro_call" | "partnership_discussion" | "client_acquisition" | "onboarding" | "renewal_or_expansion" | "support_only" | "none",
  "useCase": "string",
  "dealName": "string",
  "confidence": "high" | "medium" | "low",
  "businessValue": "string",
  "reasoning": "why this is or isn't a real opportunity and why this interaction type fits"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.3
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    // Map the new format to the existing deal creation format
    return {
      isDeal: analysis.isBusinessOpportunity,
      confidence: analysis.confidence,
      dealName: analysis.dealName,
      useCase: analysis.useCase,
      description: `${analysis.opportunityType} opportunity: ${analysis.reasoning}\n\nBusiness Value: ${analysis.businessValue}`,
      companyName: fromEmail.split('@')[1] || 'Unknown Company',
      opportunityType: analysis.opportunityType,
      businessValue: analysis.businessValue
    };
  } catch (error) {
    console.error('🤖 AI analysis error:', error);
    // Fallback to rule-based detection
    return {
      isDeal: true,
      confidence: 'medium',
      dealName: subject.replace(/^(Re:|Fwd?:)\s*/i, '').trim() || 'Business Opportunity',
      useCase: extractUseCase(subject, body),
      description: `Deal opportunity from ${fromEmail}`,
      companyName: fromEmail.split('@')[1] || 'Unknown Company',
      opportunityType: 'intro_call',
      businessValue: 'Not explicitly stated'
    };
  }
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

// Test OpenAI integration endpoint
app.post('/api/test-openai', async (req, res) => {
  const { subject, body, fromEmail } = req.body;
  
  if (!subject || !body || !fromEmail) {
    return res.status(400).json({ 
      error: 'Missing required fields: subject, body, fromEmail' 
    });
  }
  
  try {
    console.log('🤖 Testing OpenAI with:', { subject, fromEmail });
    
    const analysis = await analyzeEmailWithAI(subject, body, fromEmail);
    
    res.json({
      success: true,
      analysis,
      openaiWorking: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ OpenAI test error:', error);
    res.status(500).json({
      success: false,
      error: 'OpenAI integration failed',
      message: error.message,
      openaiWorking: false
    });
  }
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
    for (const message of messages.slice(0, 50)) { // Process first 50 emails
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
          
          console.log(`🤖 Analyzing email with AI: "${subject}"`);
          
          // Use AI to analyze the email
          const aiAnalysis = await analyzeEmailWithAI(subject, emailBody, contactEmail);
          
          if (aiAnalysis.isDeal) {
            // Create pending deal based on AI analysis
            const pendingDeal = {
              id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              messageId: message.id,
              subject: subject,
              contactName: contactName || aiAnalysis.companyName,
              contactEmail: contactEmail,
              emailBody: emailBody.substring(0, 500),
              detectedAt: new Date().toISOString(),
              confidence: aiAnalysis.confidence,
              suggestedName: aiAnalysis.dealName,
              suggestedUseCase: aiAnalysis.useCase,
              suggestedDescription: aiAnalysis.description,
              aiGenerated: true
            };
            
            pendingDeals.push(pendingDeal);
            pendingReview++;
            
            console.log(`📧 AI created pending deal: ${pendingDeal.suggestedName} (${aiAnalysis.confidence} confidence)`);
          } else {
            console.log(`📧 AI determined not a deal: ${subject}`);
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
      console.log('Creating contact for approved deal:', deal.contactName, deal.contactEmail);
      
      // Check if contact already exists
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', deal.contactEmail)
        .single();
      
      if (existingContact) {
        contactId = existingContact.id;
        console.log('Using existing contact:', contactId);
      } else {
        // Create new contact
        const contactData = {
          first_name: deal.contactName.split(' ')[0] || '',
          last_name: deal.contactName.split(' ').slice(1).join(' ') || '',
          email: deal.contactEmail,
          company: deal.contactEmail.split('@')[1] || '',
          source: 'Gmail Integration'
        };
        
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert(contactData)
          .select()
          .single();
        
        if (contactError) {
          console.error('Error creating contact:', contactError);
        } else {
          contactId = newContact.id;
          console.log('Created new contact:', contactId);
        }
      }
    }
    
    // Get the max sort_order for the new stage (cold leads start as 'new')
    const { data: maxSortData } = await supabase
      .from('deals')
      .select('sort_order')
      .eq('stage', 'new')
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = maxSortData && maxSortData.length > 0 
      ? (maxSortData[0].sort_order || 0) + 1 
      : 1;
    
    // Create deal in 'new' stage using Supabase (new deals start here)
    const dealData = {
      contact_id: contactId,
      name: deal.suggestedName,
      use_case: deal.suggestedUseCase,
      stage: 'new', // Gmail-detected deals start in 'new' stage
      signal: 'positive', // Changed from 'Email Detected' to valid signal value
      description: deal.suggestedDescription,
      attachments: null,
      sort_order: nextSortOrder,
      // Store contact details for easy export
      contact_first_name: deal.contactName.split(' ')[0] || null,
      contact_last_name: deal.contactName.split(' ').slice(1).join(' ') || null,
      contact_email: deal.contactEmail,
      contact_company: deal.contactEmail.split('@')[1] || null,
    };
    
    console.log('Creating deal in Supabase:', dealData);
    
    const { data: newDeal, error: dealError } = await supabase
      .from('deals')
      .insert(dealData)
      .select()
      .single();
    
    if (dealError) {
      console.error('Error creating deal:', dealError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create deal in database',
        message: dealError.message 
      });
    }
    
    console.log('✅ Created deal from email in new stage:', newDeal);
    
    // Remove from pending deals
    pendingDeals.splice(dealIndex, 1);
    
    res.json({
      success: true,
      message: 'Deal approved and created successfully in new stage',
      dealId: newDeal.id,
      dealData: newDeal
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