-- Supabase chat_history table setup
-- Run this in your Supabase SQL editor

-- Create the chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  vector BYTEA -- for future vector search
);

-- Create an index on email for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_history_email ON chat_history(email);

-- Create an index on timestamp for faster sorting
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to see only their own chat history
-- You can modify this policy based on your authentication needs
CREATE POLICY "Users can view their own chat history" ON chat_history
  FOR SELECT USING (true); -- For now, allow all reads (you can restrict this later)

CREATE POLICY "Users can insert their own chat history" ON chat_history
  FOR INSERT WITH CHECK (true); -- For now, allow all inserts

-- Optional: Create a function to clean up old chat history
CREATE OR REPLACE FUNCTION cleanup_old_chat_history(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM chat_history 
  WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up old data (uncomment if needed)
-- SELECT cron.schedule('cleanup-chat-history', '0 2 * * *', 'SELECT cleanup_old_chat_history(30);'); 