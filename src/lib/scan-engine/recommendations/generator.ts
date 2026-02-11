import type { PillarName, ModuleResult, Recommendation } from '@/types/scan';

const IMPACT_WEIGHT = { high: 3, medium: 2, low: 1 } as const;

export function generateRecommendations(
  pillarResults: Record<PillarName, ModuleResult>,
  tier: 'free' | 'monitoring' | 'diy' | 'pro' = 'free'
): Recommendation[] {
  // Collect all recommendations from all pillars
  const allRecs = Object.values(pillarResults).flatMap(
    (r) => r.recommendations
  );

  // Sort by impact * points recoverable (highest first)
  const sorted = allRecs.sort((a, b) => {
    const scoreA = a.pointsRecoverable * IMPACT_WEIGHT[a.impact];
    const scoreB = b.pointsRecoverable * IMPACT_WEIGHT[b.impact];
    if (scoreB !== scoreA) return scoreB - scoreA;
    // Secondary sort: easy before hard
    const diffOrder = { easy: 0, moderate: 1, hard: 2 };
    return diffOrder[a.difficulty] - diffOrder[b.difficulty];
  });

  if (tier === 'free') {
    // Free tier: top 5, strip howToFix
    return sorted.slice(0, 5).map((r) => ({
      ...r,
      howToFix: undefined,
    }));
  }

  // Paid tiers: all recommendations with full detail
  return sorted;
}

export function getQuickWins(
  recommendations: Recommendation[]
): Recommendation[] {
  return recommendations.filter(
    (r) => r.difficulty === 'easy' && r.impact !== 'low'
  );
}

export function getTotalRecoverablePoints(
  recommendations: Recommendation[]
): number {
  return recommendations.reduce((sum, r) => sum + r.pointsRecoverable, 0);
}
