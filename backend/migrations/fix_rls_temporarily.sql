-- Temporary fix for RLS issue during development
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily for gmail_sync_logs to allow backend sync operations
ALTER TABLE gmail_sync_logs DISABLE ROW LEVEL SECURITY;

-- Alternatively, create a policy that allows service operations
-- (Re-enable RLS first if you prefer this approach)
-- ALTER TABLE gmail_sync_logs ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow backend sync operations" ON gmail_sync_logs
--   FOR ALL USING (true);

-- Note: In production, you should use SUPABASE_SERVICE_ROLE_KEY instead of disabling RLS