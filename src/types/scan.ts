export type PillarName =
  | 'entity_verifiability'
  | 'extractability_schema'
  | 'freshness_maintenance'
  | 'trust_risk'
  | 'answerability_coverage';

export interface CheckResult {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  maxScore: number;
  details?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'moderate' | 'hard';
  pillar: PillarName;
  pointsRecoverable: number;
  howToFix?: string;
}

export interface ModuleResult {
  score: number;
  maxPoints: number;
  signals: Record<string, unknown>;
  checks: CheckResult[];
  recommendations: Recommendation[];
}

export interface ScanResultData {
  pillarScores: Record<PillarName, ModuleResult>;
  recommendations: Recommendation[];
  metadata: {
    metaTitle: string | null;
    metaDescription: string | null;
    detectedSchemas: string[];
    napData: NAPData;
  };
}

export interface NAPData {
  name: string | null;
  address: string | null;
  phone: string | null;
  source: 'schema' | 'html' | 'both' | 'none';
}

export interface CrawlResult {
  html: string;
  statusCode: number;
  headers: Record<string, string>;
  redirectChain: string[];
  finalUrl: string;
  responseTimeMs: number;
  tlsInfo: TLSInfo | null;
}

export interface TLSInfo {
  valid: boolean;
  issuer: string;
  expiresAt: string;
  protocol: string;
}

export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ScanRecord {
  id: string;
  url: string;
  normalized_url: string;
  status: ScanStatus;
  user_id: string | null;
  total_score: number | null;
  grade: string | null;
  error_message: string | null;
  scan_duration_ms: number | null;
  created_at: string;
  completed_at: string | null;
  ip_address: string | null;
}
