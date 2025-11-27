import cron from 'node-cron';
import { syncAllUsers } from '../services/gmailSync.js';

/**
 * Initialize and start all scheduled jobs
 */
export function initializeScheduledJobs() {
  console.log('⏰ Initializing scheduled jobs...');

  // Daily Gmail sync at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🌅 Daily Gmail sync started at', new Date().toISOString());
    
    try {
      const result = await syncAllUsers();
      console.log('✅ Daily Gmail sync completed:', result);
    } catch (error) {
      console.error('❌ Daily Gmail sync failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  // Weekly cleanup job (optional) - runs every Sunday at 3:00 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('🧹 Weekly cleanup started at', new Date().toISOString());
    
    try {
      await cleanupOldSyncLogs();
      console.log('✅ Weekly cleanup completed');
    } catch (error) {
      console.error('❌ Weekly cleanup failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('✅ Scheduled jobs initialized');
  console.log('📅 Daily Gmail sync: Every day at 2:00 AM UTC');
  console.log('🧹 Weekly cleanup: Every Sunday at 3:00 AM UTC');
}

/**
 * Cleanup old sync logs (older than 30 days)
 */
async function cleanupOldSyncLogs() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('gmail_sync_logs')
      .delete()
      .lt('sync_date', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('❌ Error cleaning up sync logs:', error);
    } else {
      console.log('🗑️ Old sync logs cleaned up successfully');
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

/**
 * Get status of scheduled jobs
 */
export function getScheduledJobsStatus() {
  const tasks = cron.getTasks();
  
  return {
    totalJobs: tasks.size,
    jobs: [
      {
        name: 'Daily Gmail Sync',
        schedule: '0 2 * * *',
        description: 'Syncs Gmail for all users daily at 2:00 AM UTC',
        status: 'active'
      },
      {
        name: 'Weekly Cleanup',
        schedule: '0 3 * * 0',
        description: 'Cleans up old sync logs every Sunday at 3:00 AM UTC',
        status: 'active'
      }
    ]
  };
}