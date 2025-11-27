-- Add auto_sync_enabled column to gmail_settings table
ALTER TABLE gmail_settings 
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_frequency VARCHAR(20) DEFAULT 'daily';

-- Create gmail_sync_logs table to track sync history
CREATE TABLE IF NOT EXISTS gmail_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  messages_processed INTEGER DEFAULT 0,
  deals_created INTEGER DEFAULT 0,
  deals_updated INTEGER DEFAULT 0,
  contacts_created INTEGER DEFAULT 0,
  contacts_updated INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  error_message TEXT,
  sync_date TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gmail_sync_logs_user_id ON gmail_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_sync_logs_sync_date ON gmail_sync_logs(sync_date);

-- Create gmail_sync_statistics table for aggregated stats
CREATE TABLE IF NOT EXISTS gmail_sync_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  total_syncs INTEGER DEFAULT 0,
  total_messages_processed INTEGER DEFAULT 0,
  total_deals_created INTEGER DEFAULT 0,
  total_deals_updated INTEGER DEFAULT 0,
  total_contacts_created INTEGER DEFAULT 0,
  total_contacts_updated INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  avg_processing_time_ms INTEGER DEFAULT 0,
  last_sync_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to update statistics after each sync
CREATE OR REPLACE FUNCTION update_sync_statistics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO gmail_sync_statistics (
    user_id,
    total_syncs,
    total_messages_processed,
    total_deals_created,
    total_deals_updated,
    total_contacts_created,
    total_contacts_updated,
    total_errors,
    last_sync_date,
    updated_at
  )
  VALUES (
    NEW.user_id,
    1,
    NEW.messages_processed,
    NEW.deals_created,
    NEW.deals_updated,
    NEW.contacts_created,
    NEW.contacts_updated,
    NEW.errors,
    NEW.sync_date,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_syncs = gmail_sync_statistics.total_syncs + 1,
    total_messages_processed = gmail_sync_statistics.total_messages_processed + NEW.messages_processed,
    total_deals_created = gmail_sync_statistics.total_deals_created + NEW.deals_created,
    total_deals_updated = gmail_sync_statistics.total_deals_updated + NEW.deals_updated,
    total_contacts_created = gmail_sync_statistics.total_contacts_created + NEW.contacts_created,
    total_contacts_updated = gmail_sync_statistics.total_contacts_updated + NEW.contacts_updated,
    total_errors = gmail_sync_statistics.total_errors + NEW.errors,
    last_sync_date = NEW.sync_date,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_statistics_update ON gmail_sync_logs;
CREATE TRIGGER sync_statistics_update
  AFTER INSERT ON gmail_sync_logs
  FOR EACH ROW EXECUTE FUNCTION update_sync_statistics();

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE gmail_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_sync_statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust as needed based on your auth setup)
CREATE POLICY "Users can view their own sync logs" ON gmail_sync_logs
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own sync logs" ON gmail_sync_logs
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can view their own sync statistics" ON gmail_sync_statistics
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own sync statistics" ON gmail_sync_statistics
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- For service role, allow all operations (for automated sync)
CREATE POLICY "Service role can access all sync logs" ON gmail_sync_logs
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can access all sync statistics" ON gmail_sync_statistics
  FOR ALL USING (current_setting('role') = 'service_role');