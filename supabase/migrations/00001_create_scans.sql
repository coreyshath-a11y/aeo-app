-- Create scan_status enum
CREATE TYPE scan_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Scans table: tracks every scan request
CREATE TABLE public.scans (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  status scan_status NOT NULL DEFAULT 'pending',
  user_id UUID,
  total_score SMALLINT,
  grade TEXT,
  error_message TEXT,
  scan_duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  ip_address TEXT,
  is_rescan BOOLEAN NOT NULL DEFAULT false,
  parent_scan_id TEXT REFERENCES public.scans(id)
);

-- Indexes
CREATE INDEX idx_scans_normalized_url ON public.scans(normalized_url);
CREATE INDEX idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX idx_scans_status ON public.scans(status) WHERE status IN ('pending', 'processing');

-- Row Level Security
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Anyone can read completed scans (shareable results)
CREATE POLICY "Completed scans are readable"
  ON public.scans FOR SELECT
  USING (status = 'completed');

-- Anyone can insert a scan (anon or auth)
CREATE POLICY "Anyone can create a scan"
  ON public.scans FOR INSERT
  WITH CHECK (true);
