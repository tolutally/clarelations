import cron from 'node-cron';
import { supabase } from '../../lib/supabase';
import gmailService from './gmailService';
import { analyzeEmailThread } from './emailAnalyzer';
import dealExtractor from './dealExtractor';
import contactManager from './contactManager';

/**
 * Gmail Sync Cron Job
 * Runs every 24 hours to sync emails and extract deals
 */
export class GmailSyncScheduler {
  private cronJob: any = null;

  /**
   * Start the cron job (runs every 24 hours at 2 AM)
   */
  start() {
    // Cron syntax: minute hour day month weekday
    // '0 2 * * *' = Every day at 2:00 AM
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      console.log('⏰ Starting scheduled Gmail sync...');
      await this.runSync();
    }, {
      timezone: 'America/New_York', // Adjust to your timezone
    });

    console.log('✅ Gmail sync scheduler started (runs daily at 2 AM)');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 Gmail sync scheduler stopped');
    }
  }

  /**
   * Run sync manually (can be triggered by API)
   */
  async runSync(): Promise<{
    success: boolean;
    duration: number;
    processed: number;
    dealsCreated: number;
    dealsUpdated: number;
    contactsCreated: number;
    contactsUpdated: number;
    pendingReview: number;
    rejected: number;
    errors: number;
  }> {
    const startTime = Date.now();
    console.log('📧 Starting Gmail sync...');

    const results = {
      success: false,
      duration: 0,
      processed: 0,
      dealsCreated: 0,
      dealsUpdated: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      pendingReview: 0,
      rejected: 0,
      errors: 0,
    };

    try {
      // Get stored tokens
      const { data: settings, error: settingsError } = await supabase
        .from('gmail_settings')
        .select('*')
        .eq('user_id', 'default') // TODO: Support multiple users
        .eq('is_active', true)
        .single();

      if (settingsError || !settings) {
        console.log('⚠️  Gmail not connected, skipping sync');
        return results;
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

      results.success = true;
      results.duration = Date.now() - startTime;

      // Update sync status
      await supabase
        .from('gmail_sync_status')
        .insert({
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: results.duration,
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
    } catch (error: any) {
      console.error('❌ Gmail sync failed:', error);
      results.errors++;
      results.duration = Date.now() - startTime;

      // Log failed sync
      await supabase
        .from('gmail_sync_status')
        .insert({
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: results.duration,
          status: 'failed',
          error_message: error.message,
        });
    }

    return results;
  }
}

// Export singleton instance
export default new GmailSyncScheduler();
