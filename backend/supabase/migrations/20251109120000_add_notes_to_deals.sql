-- Add notes column to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '[]'::jsonb;

-- Add comment to describe the notes structure
COMMENT ON COLUMN deals.notes IS 'Array of note objects with structure: [{id, content, created_at, updated_at, deleted_at, author}]';
