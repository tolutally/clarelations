-- Add signal_rationale column to deals table to store AI's reasoning for signal determination
ALTER TABLE deals 
ADD COLUMN signal_rationale TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN deals.signal_rationale IS 'AI-generated rationale explaining why the deal signal was set to its current value';
