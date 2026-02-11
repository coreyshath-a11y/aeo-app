import type { PillarName } from '@/types/scan';

export const PILLAR_MAX_POINTS: Record<PillarName, number> = {
  entity_verifiability: 25,
  extractability_schema: 20,
  freshness_maintenance: 20,
  trust_risk: 15,
  answerability_coverage: 20,
};

export const PILLAR_LABELS: Record<PillarName, string> = {
  entity_verifiability: 'Entity Verifiability',
  extractability_schema: 'Extractability & Schema',
  freshness_maintenance: 'Freshness & Maintenance',
  trust_risk: 'Trust & Risk Signals',
  answerability_coverage: 'Answerability Coverage',
};

export const PILLAR_DESCRIPTIONS: Record<PillarName, string> = {
  entity_verifiability:
    'Can AI systems verify who you are? This checks whether your business name, address, and phone number are consistent and machine-readable.',
  extractability_schema:
    'Can AI systems easily read your website? This checks for structured data markup that helps machines understand your content.',
  freshness_maintenance:
    'Does your website look active and maintained? AI systems prefer sources that are regularly updated.',
  trust_risk:
    'Is your website secure and fast? This checks for security best practices and real-world performance.',
  answerability_coverage:
    'Does your website answer the questions people actually ask? This checks whether your content covers common queries about your business.',
};

export const GRADE_THRESHOLDS = [
  { min: 90, grade: 'A+', label: 'Excellent' },
  { min: 80, grade: 'A', label: 'Great' },
  { min: 70, grade: 'B+', label: 'Good' },
  { min: 60, grade: 'B', label: 'Above Average' },
  { min: 50, grade: 'C+', label: 'Average' },
  { min: 40, grade: 'C', label: 'Below Average' },
  { min: 30, grade: 'D', label: 'Poor' },
  { min: 0, grade: 'F', label: 'Needs Attention' },
] as const;

export const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-emerald-500',
  A: 'text-emerald-500',
  'B+': 'text-green-500',
  B: 'text-lime-500',
  'C+': 'text-yellow-500',
  C: 'text-orange-500',
  D: 'text-red-400',
  F: 'text-red-600',
};
