-- Scan results: detailed breakdown per scan
CREATE TABLE public.scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id TEXT NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,

  -- Pillar scores
  entity_verifiability_score SMALLINT NOT NULL DEFAULT 0,
  extractability_schema_score SMALLINT NOT NULL DEFAULT 0,
  freshness_maintenance_score SMALLINT NOT NULL DEFAULT 0,
  trust_risk_score SMALLINT NOT NULL DEFAULT 0,
  answerability_coverage_score SMALLINT NOT NULL DEFAULT 0,

  -- Raw signal data (JSONB for flexibility)
  entity_signals JSONB NOT NULL DEFAULT '{}',
  schema_signals JSONB NOT NULL DEFAULT '{}',
  freshness_signals JSONB NOT NULL DEFAULT '{}',
  trust_signals JSONB NOT NULL DEFAULT '{}',
  answerability_signals JSONB NOT NULL DEFAULT '{}',

  -- Extracted metadata
  detected_schemas JSONB DEFAULT '[]',
  nap_data JSONB DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,

  -- Recommendations
  recommendations JSONB NOT NULL DEFAULT '[]',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_scan_result UNIQUE (scan_id)
);

CREATE INDEX idx_scan_results_scan_id ON public.scan_results(scan_id);

ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;

-- Results follow scan visibility
CREATE POLICY "Scan results are readable for completed scans"
  ON public.scan_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = scan_results.scan_id
      AND scans.status = 'completed'
    )
  );

-- Service role can insert
CREATE POLICY "Service role can insert results"
  ON public.scan_results FOR INSERT
  WITH CHECK (true);
