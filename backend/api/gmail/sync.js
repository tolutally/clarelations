const { supabase } = require('../../lib/supabase');

/**
 * Manually trigger Gmail sync (simplified version)
 * POST /api/gmail/sync
 */
exports.default = async function handler(req, res) {
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
      .eq('user_id', 'default')
      .eq('is_active', true)
      .single();

    if (settingsError || !settings) {
      return res.status(400).json({ 
        error: 'Gmail not connected',
        message: 'Please connect your Gmail account first'
      });
    }

    // Simulate sync for now (TODO: implement actual Gmail processing)
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

    console.log('✅ Gmail sync completed (simulated):', results);

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

    res.json({
      success: true,
      duration: Date.now() - startTime,
      message: 'Sync completed (simulated)',
      ...results,
    });
  } catch (error) {
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
};