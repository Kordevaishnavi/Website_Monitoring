-- Create the websites table
CREATE TABLE IF NOT EXISTS websites (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations (adjust as needed for your security requirements)
-- CREATE POLICY "Allow all operations on websites" ON websites FOR ALL USING (true);

-- Insert some sample data (optional)
INSERT INTO websites (url) VALUES 
  ('https://google.com'),
  ('https://github.com'),
  ('https://stackoverflow.com'),
  ('https://vercel.com'),
  ('https://supabase.com')
ON CONFLICT (url) DO NOTHING;
