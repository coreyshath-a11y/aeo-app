-- Scan cache: prevents re-scanning same URL within TTL
CREATE TABLE public.scan_cache (
  normalized_url TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES public.scans(id),
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX idx_scan_cache_expires ON public.scan_cache(expires_at);

ALTER TABLE public.scan_cache ENABLE ROW LEVEL SECURITY;

-- Cache is readable by everyone (to check before scanning)
CREATE POLICY "Cache is readable"
  ON public.scan_cache FOR SELECT
  USING (true);

-- Service role can upsert cache
CREATE POLICY "Service role can manage cache"
  ON public.scan_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update cache"
  ON public.scan_cache FOR UPDATE
  USING (true)
  WITH CHECK (true);
