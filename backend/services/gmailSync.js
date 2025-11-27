import { google } from 'googleapis';
import { supabase as supabaseService, supabaseServiceRole } from '../lib/supabase.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables');
  console.log('💡 Please add OPENAI_API_KEY to your .env.local file');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not found, using anon key (may cause RLS issues)');
  console.log('💡 Consider adding SUPABASE_SERVICE_ROLE_KEY for backend operations');
}

/**
 * Sync Gmail for a specific user
 * @param {string} userId - User ID to sync Gmail for
 * @returns {Promise<Object>} Sync results
 */
export async function syncUserEmails(userId) {
  // Validate userId is a proper UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userId || userId === 'default' || !uuidRegex.test(userId)) {
    throw new Error(`Invalid user ID: ${userId}. Must be a valid UUID format.`);
  }

  console.log(`🔄 Starting Gmail sync for user: ${userId}`);
  
  try {
    // Get user's Gmail settings
    const { data: gmailSettings, error: settingsError } = await supabaseService
      .from('gmail_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (settingsError || !gmailSettings) {
      throw new Error(`No active Gmail connection found for user ${userId}`);
    }

    // Initialize Gmail API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: gmailSettings.access_token,
      refresh_token: gmailSettings.refresh_token,
      expiry_date: gmailSettings.token_expiry
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get messages from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const query = `after:${Math.floor(yesterday.getTime() / 1000)}`;

    console.log(`📧 Fetching emails with query: ${query}`);

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100
    });

    const messages = response.data.messages || [];
    console.log(`📬 Found ${messages.length} messages to process`);

    let processedCount = 0;
    let dealsCreated = 0;
    let dealsUpdated = 0;
    let contactsCreated = 0;
    let pendingDeals = [];
    let errors = 0;

    // Process each message
    for (const message of messages) {
      try {
        const messageDetail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        // Extract email data
        const headers = messageDetail.data.payload.headers;
        const fromHeader = headers.find(h => h.name === 'From');
        const subjectHeader = headers.find(h => h.name === 'Subject');
        const dateHeader = headers.find(h => h.name === 'Date');

        if (fromHeader && subjectHeader) {
          const emailData = {
            messageId: message.id,
            from: fromHeader.value,
            subject: subjectHeader.value,
            date: dateHeader?.value,
            snippet: messageDetail.data.snippet
          };

          // Process the email (this would call your AI analysis)
          const result = await processEmailForDeals(emailData, userId);
          
          processedCount++;
          dealsCreated += result.dealsCreated || 0;
          dealsUpdated += result.dealsUpdated || 0;
          contactsCreated += result.contactsCreated || 0;

          // Collect pending deal if any
          if (result.pendingDeal) {
            pendingDeals.push(result.pendingDeal);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing message ${message.id}:`, error);
        errors++;
      }
    }

    // Update sync statistics
    await updateSyncStatistics(userId, {
      messagesProcessed: processedCount,
      dealsCreated,
      dealsUpdated,
      contactsCreated,
      pendingDeals,
      errors,
      syncDate: new Date().toISOString()
    });

    console.log(`✅ Gmail sync completed for user ${userId}: ${processedCount} processed, ${dealsCreated} deals created`);

    return {
      success: true,
      messagesProcessed: processedCount,
      dealsCreated,
      dealsUpdated,
      contactsCreated,
      pendingDeals,
      errors,
      duration: Date.now() - Date.now() // Will be calculated properly
    };

  } catch (error) {
    console.error(`❌ Gmail sync failed for user ${userId}:`, error);
    
    // Update sync statistics with error
    await updateSyncStatistics(userId, {
      messagesProcessed: 0,
      dealsCreated: 0,
      dealsUpdated: 0,
      contactsCreated: 0,
      errors: 1,
      syncDate: new Date().toISOString(),
      errorMessage: error.message
    });

    throw error;
  }
}

/**
 * Process an email for potential deals using AI analysis
 * @param {Object} emailData - Email data to process
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Processing results
 */
async function processEmailForDeals(emailData, userId) {
  // Validate userId is a proper UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userId || userId === 'default' || !uuidRegex.test(userId)) {
    throw new Error(`Invalid user ID: ${userId}. Must be a valid UUID format.`);
  }

  console.log(`🤖 AI analyzing email: ${emailData.subject}`);
  
  try {
    // Prepare email content for AI analysis
    const emailContent = `Subject: ${emailData.subject}\nFrom: ${emailData.from}\n\n${emailData.snippet || ''}`;
    
    console.log('📧 Email content prepared for AI analysis');
    
    // Create AI prompt using your existing logic
    const prompt = `Analyze this email and extract business deal information:

Email Content: ${emailContent}

Please respond with a valid JSON object only, no other text or formatting. Use this exact format:
{
  "isDeal": boolean,
  "confidence": number between 1-10,
  "dealInfo": {
    "companyName": "string or null",
    "contactName": "string or null", 
    "dealValue": "string or null",
    "dealStage": "string or null"
  },
  "summary": "brief description string"
}

Focus on identifying: sales inquiries, partnership requests, investment opportunities, project proposals, etc.`;

    // Call OpenAI API directly
    console.log('🧠 Calling OpenAI for analysis...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ 
          role: 'system', 
          content: 'You are a business email analyzer. Always respond with valid JSON only, no additional text or formatting.'
        }, {
          role: 'user', 
          content: prompt 
        }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    let analysis;
    try {
      // Clean the response to ensure it's valid JSON
      let cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      
      // Handle cases where AI responds in YAML-like format
      if (cleanResponse.includes('- isDeal:') || cleanResponse.includes('isDeal:') && !cleanResponse.startsWith('{')) {
        console.log('⚠️ AI returned non-JSON format, attempting to convert...');
        
        // Try to parse YAML-like response and convert to JSON
        const lines = cleanResponse.split('\n').map(line => line.trim()).filter(line => line);
        const jsonObj = {};
        let currentSection = null;
        
        for (const line of lines) {
          if (line.startsWith('- isDeal:')) {
            jsonObj.isDeal = line.includes('true');
          } else if (line.startsWith('- confidence:')) {
            jsonObj.confidence = parseInt(line.split(':')[1].trim()) || 5;
          } else if (line.startsWith('- dealInfo:')) {
            jsonObj.dealInfo = {};
            currentSection = 'dealInfo';
          } else if (line.startsWith('- summary:')) {
            jsonObj.summary = line.split(':').slice(1).join(':').trim();
            currentSection = null;
          } else if (currentSection === 'dealInfo' && line.includes(':')) {
            const key = line.replace(/^- /, '').split(':')[0].trim();
            const value = line.split(':').slice(1).join(':').trim();
            if (value && value !== 'N/A' && value !== 'not provided') {
              jsonObj.dealInfo[key] = value;
            }
          }
        }
        
        // Set defaults if missing
        if (!jsonObj.dealInfo) jsonObj.dealInfo = {};
        if (!jsonObj.summary) jsonObj.summary = 'Business document shared';
        
        analysis = jsonObj;
        console.log('✅ Successfully converted YAML-like response to JSON');
      } else {
        // Try to parse as JSON
        analysis = JSON.parse(cleanResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      console.error('Parse error:', parseError.message);
      
      // Fallback: create a basic analysis object
      analysis = {
        isDeal: false,
        confidence: 3,
        dealInfo: {},
        summary: 'Unable to parse AI analysis'
      };
    }

    console.log('🎯 AI Analysis result:', analysis);

    let dealsCreated = 0;
    let dealsUpdated = 0;
    let contactsCreated = 0;

    // Extract contact information from email
    const contactInfo = extractContactFromEmail(emailData);
    
    // Create contact if confidence > 6 and we have contact info
    if (analysis.confidence > 6 && contactInfo) {
      console.log('👤 Creating contact with confidence:', analysis.confidence);
      try {
        // Create contact directly in database instead of importing frontend action
        const contactData = {
          name: contactInfo.name,
          email: contactInfo.email,
          company: analysis.dealInfo?.companyName || contactInfo.company || '',
          source: 'gmail-sync',
          user_id: userId,
          created_at: new Date().toISOString()
        };

        console.log('📞 Contact data:', contactData);
        const { data: newContact, error: contactError } = await supabaseServiceRole
          .from('contacts')
          .insert({
            first_name: contactData.name.split(' ')[0] || '',
            last_name: contactData.name.split(' ').slice(1).join(' ') || '',
            email: contactData.email,
            company: contactData.company,
            acquisition_channel: 'gmail-sync',
            status: 'active',
            tags: ['gmail-auto-import'],
            user_id: contactData.user_id
          })
          .select()
          .single();

        if (contactError) {
          console.error('❌ Error creating contact:', contactError);
        } else {
          contactsCreated = 1;
          console.log('✅ Contact created successfully:', newContact.id);
        }

      } catch (error) {
        console.error('❌ Error creating contact:', error);
      }
    }

    // Store potential deals for manual review in database
    let pendingDeal = null;
    if (analysis.isDeal && analysis.confidence >= 6) {
      pendingDeal = {
        id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId, // Already validated as UUID above
        title: analysis.dealInfo?.dealTitle || `Deal from ${contactInfo?.name || extractNameFromEmail(emailData.from)}`,
        description: analysis.summary || emailData.subject,
        value: analysis.dealInfo?.dealValue || 0,
        stage: analysis.dealInfo?.dealStage || 'qualification',
        source: 'gmail-sync',
        contact_email: contactInfo?.email || extractEmailFromString(emailData.from),
        contact_name: contactInfo?.name || extractNameFromEmail(emailData.from),
        company: analysis.dealInfo?.companyName || contactInfo?.company || '',
        confidence: analysis.confidence,
        email_subject: emailData.subject,
        email_date: emailData.date,
        email_snippet: emailData.snippet,
        created_at: new Date().toISOString(),
        status: 'pending_review'
      };

      try {
        console.log('💾 Storing pending deal for user:', userId);
        console.log('📋 Pending deal data:', {
          id: pendingDeal.id,
          user_id: pendingDeal.user_id,
          title: pendingDeal.title,
          confidence: pendingDeal.confidence
        });
        
        // Store pending deal in database using service role to bypass RLS
        const { error } = await supabaseServiceRole
          .from('pending_deals')
          .insert(pendingDeal);

        if (error) {
          console.error('❌ Error storing pending deal:', error);
        } else {
          console.log('📋 Potential deal stored in database for review:', pendingDeal.title);
        }
      } catch (dbError) {
        console.error('❌ Database error storing pending deal:', dbError);
      }
    }

    return {
      dealsCreated: 0, // No longer auto-creating deals
      dealsUpdated,
      contactsCreated,
      pendingDeal,
      aiAnalysis: analysis
    };

  } catch (error) {
    console.error('❌ Error in AI email processing:', error);
    return { 
      dealsCreated: 0, 
      dealsUpdated: 0, 
      contactsCreated: 0, 
      error: error.message 
    };
  }
}

/**
 * Extract contact information from email headers
 */
function extractContactFromEmail(emailData) {
  const fromEmail = extractEmailFromString(emailData.from);
  const fromName = extractNameFromEmail(emailData.from);
  
  if (!fromEmail || !fromName) return null;
  
  return {
    email: fromEmail,
    name: fromName,
    company: extractCompanyFromEmail(emailData.from) || ''
  };
}

/**
 * Extract email address from "Name <email@domain.com>" format
 */
function extractEmailFromString(fromString) {
  const emailMatch = fromString.match(/<([^>]+)>/);
  return emailMatch ? emailMatch[1] : fromString.includes('@') ? fromString.trim() : null;
}

/**
 * Extract name from "Name <email@domain.com>" format
 */
function extractNameFromEmail(fromString) {
  if (fromString.includes('<')) {
    return fromString.split('<')[0].trim().replace(/"/g, '');
  }
  return fromString.split('@')[0].replace(/[._-]/g, ' ').trim();
}

/**
 * Extract company from email domain
 */
function extractCompanyFromEmail(fromString) {
  const email = extractEmailFromString(fromString);
  if (!email) return '';
  
  const domain = email.split('@')[1];
  if (!domain) return '';
  
  // Skip common email providers
  const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  if (commonProviders.includes(domain)) return '';
  
  // Convert domain to company name
  return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
}

/**
 * Create an activity for a deal
 */
async function createDealActivity(emailData, activityType) {
  try {
    await fetch('http://localhost:5177/actions/createActivity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: activityType,
        title: `Email: ${emailData.subject}`,
        description: emailData.snippet || '',
        date: emailData.date || new Date().toISOString(),
        source: 'gmail-sync'
      })
    });
  } catch (error) {
    console.error('❌ Error creating activity:', error);
  }
}

/**
 * Update sync statistics in the database
 * @param {string} userId - User ID
 * @param {Object} stats - Sync statistics
 */
async function updateSyncStatistics(userId, stats) {
  try {
    console.log('📊 Updating sync statistics for user:', userId);
    
    // Store sync result using service client to bypass RLS
    const { error } = await supabaseServiceRole
      .from('gmail_sync_logs')
      .insert({
        user_id: userId,
        messages_processed: stats.messagesProcessed,
        deals_created: stats.dealsCreated,
        deals_updated: stats.dealsUpdated,
        contacts_created: stats.contactsCreated,
        errors: stats.errors,
        sync_date: stats.syncDate,
        error_message: stats.errorMessage || null
      });

    if (error) {
      console.error('❌ Error storing sync statistics:', error);
    } else {
      console.log('✅ Sync statistics stored successfully');
    }

    // Update last sync time in gmail_settings using service client
    const { error: updateError } = await supabaseServiceRole
      .from('gmail_settings')
      .update({ last_sync: stats.syncDate })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating last sync time:', updateError);
    }

  } catch (error) {
    console.error('❌ Error updating sync statistics:', error);
  }
}

/**
 * Sync Gmail for all users with auto-sync enabled
 * @returns {Promise<Object>} Overall sync results
 */
export async function syncAllUsers() {
  console.log('🔄 Starting automatic Gmail sync for all users');
  
  try {
    // Get all users with active Gmail connections and auto-sync enabled
    const { data: users, error } = await supabaseService
      .from('gmail_settings')
      .select('user_id')
      .eq('is_active', true)
      .eq('auto_sync_enabled', true);

    if (error) {
      throw error;
    }

    if (!users || users.length === 0) {
      console.log('📝 No users with auto-sync enabled found');
      return { success: true, message: 'No users to sync' };
    }

    console.log(`👥 Found ${users.length} users to sync`);

    let totalProcessed = 0;
    let totalDealsCreated = 0;
    let totalContactsCreated = 0;
    let totalErrors = 0;
    let pendingDeals = [];
    const failedUsers = [];

    // Sync each user
    for (const user of users) {
      try {
        const result = await syncUserEmails(user.user_id);
        totalProcessed += result.messagesProcessed;
        totalDealsCreated += result.dealsCreated;
        totalContactsCreated += result.contactsCreated;
        totalErrors += result.errors;

        // Collect pending deals
        if (result.pendingDeals && result.pendingDeals.length > 0) {
          pendingDeals = pendingDeals.concat(result.pendingDeals);
        }
      } catch (error) {
        console.error(`❌ Failed to sync user ${user.user_id}:`, error);
        failedUsers.push(user.user_id);
        totalErrors++;
      }
    }

    console.log(`✅ Automatic sync completed: ${totalProcessed} messages processed, ${totalDealsCreated} deals created`);

    return {
      success: true,
      usersProcessed: users.length,
      totalMessagesProcessed: totalProcessed,
      totalDealsCreated,
      totalContactsCreated,
      totalErrors,
      pendingDeals,
      failedUsers
    };

  } catch (error) {
    console.error('❌ Automatic sync failed:', error);
    throw error;
  }
}