-- Add transcript and transcript_summary columns to activities table
-- Migration: add_transcript_to_activities
-- Created: 2025-11-10

ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS transcript_summary TEXT;

-- Add index for better search performance on transcripts
CREATE INDEX IF NOT EXISTS idx_activities_transcript ON activities USING gin(to_tsvector('english', transcript));

-- Add comment
COMMENT ON COLUMN activities.transcript IS 'Full transcript of call or meeting';
COMMENT ON COLUMN activities.transcript_summary IS 'AI-generated summary of transcript for quick context';
