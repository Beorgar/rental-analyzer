-- ============================================
-- RENTAL ANALYZER - SUPABASE DATABASE SCHEMA
-- ============================================

-- Location Research Cache Table
-- Stores tourism research data for each location
-- TTL: 90 days (data refreshes after this period)

CREATE TABLE IF NOT EXISTS location_research (
  id BIGSERIAL PRIMARY KEY,
  city VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  research_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint on city+country combination
  UNIQUE(city, country)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_location_lookup 
ON location_research(city, country);

-- Index for finding expired cache entries
CREATE INDEX IF NOT EXISTS idx_updated_at 
ON location_research(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE location_research ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous read access (for caching lookups)
CREATE POLICY "Allow anonymous read access" 
ON location_research 
FOR SELECT 
USING (true);

-- Policy: Allow service role full access (for cache writes)
CREATE POLICY "Allow service role full access" 
ON location_research 
FOR ALL 
USING (auth.role() = 'service_role');

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_location_research_updated_at
BEFORE UPDATE ON location_research
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SETUP INSTRUCTIONS
-- ============================================
--
-- 1. Go to your Supabase project: https://app.supabase.com/
-- 2. Navigate to SQL Editor
-- 3. Create a new query and paste this entire file
-- 4. Run the query to create the table and indexes
-- 5. Copy your project URL and anon key to .env:
--    - SUPABASE_URL from Project Settings > API
--    - SUPABASE_KEY (anon, public) from Project Settings > API
--
-- ============================================
-- MAINTENANCE
-- ============================================
--
-- Optional: Clean up old cache entries (>90 days)
-- Run this periodically or set up a Supabase cron job:
--
-- DELETE FROM location_research
-- WHERE updated_at < NOW() - INTERVAL '90 days';
--
-- Optional: View cache statistics:
--
-- SELECT 
--   COUNT(*) as total_cached_locations,
--   COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '30 days') as fresh_cache,
--   COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '90 days') as stale_cache,
--   pg_size_pretty(pg_total_relation_size('location_research')) as table_size
-- FROM location_research;
--
