-- Gmail Settings Table
CREATE TABLE IF NOT EXISTS gmail_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry BIGINT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Gmail Sync Status Table
CREATE TABLE IF NOT EXISTS gmail_sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  messages_processed INTEGER DEFAULT 0,
  deals_created INTEGER DEFAULT 0,
  deals_updated INTEGER DEFAULT 0,
  contacts_created INTEGER DEFAULT 0,
  contacts_updated INTEGER DEFAULT 0,
  pending_review INTEGER DEFAULT 0,
  rejected INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('running', 'completed', 'failed')) DEFAULT 'running',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gmail Review Queue Table (for confidence 6-8)
CREATE TABLE IF NOT EXISTS gmail_review_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  confidence_score DECIMAL(3,1) CHECK (confidence_score >= 6 AND confidence_score <= 8),
  analysis JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thread_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_gmail_sync_status_started_at ON gmail_sync_status(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_gmail_review_queue_status ON gmail_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_gmail_review_queue_created_at ON gmail_review_queue(created_at DESC);

-- Add notes column to deals if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'deals' AND column_name = 'notes'
  ) THEN
    ALTER TABLE deals ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Add source column to deals if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'deals' AND column_name = 'source'
  ) THEN
    ALTER TABLE deals ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;
END $$;

-- Add source column to contacts if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'source'
  ) THEN
    ALTER TABLE contacts ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;
END $$;

-- Add last_contacted_at to contacts if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'last_contacted_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN last_contacted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;
