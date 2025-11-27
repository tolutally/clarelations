const { supabase } = require('../../lib/supabase');

/**
 * Get Gmail sync status and statistics
 * GET /api/gmail/status
 */
exports.default = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if Gmail is connected
    const { data: settings } = await supabase
      .from('gmail_settings')
      .select('*')
      .eq('user_id', 'default') // TODO: Use actual user ID
      .eq('is_active', true)
      .single();

    const isConnected = !!settings;

    // Get last sync status
    const { data: lastSync } = await supabase
      .from('gmail_sync_status')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    // Get recent sync history (last 10)
    const { data: recentSyncs } = await supabase
      .from('gmail_sync_status')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    // Get pending review count
    const { count: pendingReviewCount } = await supabase
      .from('gmail_review_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Calculate statistics
    const stats = {
      totalSyncs: recentSyncs?.length || 0,
      totalDealsCreated: recentSyncs?.reduce((sum, s) => sum + (s.deals_created || 0), 0) || 0,
      totalContactsCreated: recentSyncs?.reduce((sum, s) => sum + (s.contacts_created || 0), 0) || 0,
      avgProcessingTime: recentSyncs?.length 
        ? recentSyncs.reduce((sum, s) => sum + (s.duration_ms || 0), 0) / recentSyncs.length
        : 0,
    };

    res.json({
      isConnected,
      connectedAt: settings?.connected_at || null,
      lastSync: lastSync ? {
        startedAt: lastSync.started_at,
        completedAt: lastSync.completed_at,
        duration: lastSync.duration_ms,
        messagesProcessed: lastSync.messages_processed,
        dealsCreated: lastSync.deals_created,
        dealsUpdated: lastSync.deals_updated,
        contactsCreated: lastSync.contacts_created,
        contactsUpdated: lastSync.contacts_updated,
        pendingReview: lastSync.pending_review,
        rejected: lastSync.rejected,
        errors: lastSync.errors,
        status: lastSync.status,
        errorMessage: lastSync.error_message,
      } : null,
      pendingReviewCount: pendingReviewCount || 0,
      statistics: stats,
      recentSyncs: recentSyncs?.map(sync => ({
        startedAt: sync.started_at,
        status: sync.status,
        dealsCreated: sync.deals_created,
        duration: sync.duration_ms,
      })) || [],
    });
  } catch (error) {
    console.error('Error fetching Gmail status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch status',
      message: error.message 
    });
  }
};