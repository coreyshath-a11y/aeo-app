import type { PillarName, ModuleResult } from '@/types/scan';
import { scoreToGrade } from '@/lib/utils/formatting';

export interface ScoreResult {
  totalScore: number;
  grade: string;
  pillarScores: Record<
    PillarName,
    { score: number; maxPoints: number; percentage: number }
  >;
}

export function calculateTotalScore(
  pillarResults: Record<PillarName, ModuleResult>
): ScoreResult {
  const pillarScores = {} as ScoreResult['pillarScores'];
  let totalScore = 0;

  for (const [key, result] of Object.entries(pillarResults)) {
    const pillarName = key as PillarName;
    const percentage =
      result.maxPoints > 0
        ? Math.round((result.score / result.maxPoints) * 100)
        : 0;

    pillarScores[pillarName] = {
      score: result.score,
      maxPoints: result.maxPoints,
      percentage,
    };

    totalScore += result.score;
  }

  // Clamp to 0-100
  totalScore = Math.max(0, Math.min(100, totalScore));

  return {
    totalScore,
    grade: scoreToGrade(totalScore),
    pillarScores,
  };
}
