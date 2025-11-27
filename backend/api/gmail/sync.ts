import { Request, Response } from 'express';
import gmailService from '../../backend/services/gmailService';
import { analyzeEmailThread } from '../../backend/services/emailAnalyzer';
import dealExtractor from '../../backend/services/dealExtractor';
import contactManager from '../../backend/services/contactManager';
import { supabase } from '../../lib/supabase';

/**
 * Manually trigger Gmail sync
 * POST /api/gmail/sync
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  console.log('📧 Starting Gmail sync...');

  try {
    // Get stored tokens
    const { data: settings, error: settingsError } = await supabase
      .from('gmail_settings')
      .select('*')
      .eq('user_id', 'default') // TODO: Use actual user ID
      .eq('is_active', true)
      .single();

    if (settingsError || !settings) {
      return res.status(400).json({ 
        error: 'Gmail not connected',
        message: 'Please connect your Gmail account first'
      });
    }

    // Set credentials
    gmailService.setCredentials({
      access_token: settings.access_token,
      refresh_token: settings.refresh_token,
      expiry_date: settings.token_expiry,
    });

    // Fetch messages from last 24 hours
    const messages = await gmailService.fetchRecentEmails();

    console.log(`📨 Found ${messages.length} messages to process`);

    const results = {
      processed: 0,
      dealsCreated: 0,
      dealsUpdated: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      pendingReview: 0,
      rejected: 0,
      errors: 0,
    };

    // Process each message
    for (const msg of messages) {
      try {
        results.processed++;

        // Get full thread
        const thread = await gmailService.fetchThread(msg.threadId);
        
        if (!thread) {
          console.log(`⚠️  Skipping message ${msg.id} - thread not found`);
          continue;
        }
        
        // Analyze email
        const analysis = await analyzeEmailThread(thread as any);
        
        // Process contact (if it's a reply)
        const lastMessage = thread.messages[thread.messages.length - 1];
        const contactResult = await contactManager.processContact(lastMessage, thread);
        
        if (contactResult.action === 'created') results.contactsCreated++;
        if (contactResult.action === 'updated') results.contactsUpdated++;

        // Process deal
        const dealResult = await dealExtractor.processDeal(thread, analysis);
        
        if (dealResult.shouldCreate) results.dealsCreated++;
        else if (!dealResult.shouldCreate && dealResult.confidence >= 6) results.dealsUpdated++;
        if (dealResult.requiresReview) results.pendingReview++;
        if (dealResult.confidence < 6) results.rejected++;

        console.log(`✓ Processed: ${thread.subject} (confidence: ${dealResult.confidence})`);
      } catch (error: any) {
        results.errors++;
        console.error(`✗ Error processing message ${msg.id}:`, error.message);
      }
    }

    // Update sync status
    await supabase
      .from('gmail_sync_status')
      .insert({
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        messages_processed: results.processed,
        deals_created: results.dealsCreated,
        deals_updated: results.dealsUpdated,
        contacts_created: results.contactsCreated,
        contacts_updated: results.contactsUpdated,
        pending_review: results.pendingReview,
        rejected: results.rejected,
        errors: results.errors,
        status: 'completed',
      });

    console.log('✅ Gmail sync completed:', results);

    res.json({
      success: true,
      duration: Date.now() - startTime,
      ...results,
    });
  } catch (error: any) {
    console.error('❌ Gmail sync failed:', error);

    // Log failed sync
    await supabase
      .from('gmail_sync_status')
      .insert({
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        status: 'failed',
        error_message: error.message,
      });

    res.status(500).json({ 
      error: 'Sync failed',
      message: error.message 
    });
  }
}
