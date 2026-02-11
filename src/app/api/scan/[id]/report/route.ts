import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PILLAR_MAX_POINTS, PILLAR_LABELS, PILLAR_DESCRIPTIONS } from '@/lib/constants/scoring';
import { getScoreInterpretation } from '@/lib/scan-engine/scoring/thresholds';
import type { PillarName } from '@/types/scan';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createAdminClient();

  const { data: scan } = await supabase
    .from('scans')
    .select('*')
    .eq('id', id)
    .single();

  if (!scan || scan.status !== 'completed') {
    return NextResponse.json(
      { error: 'Scan not found or not complete' },
      { status: 404 }
    );
  }

  const { data: results } = await supabase
    .from('scan_results')
    .select('*')
    .eq('scan_id', id)
    .single();

  if (!results) {
    return NextResponse.json(
      { error: 'Scan results not found' },
      { status: 404 }
    );
  }

  const interpretation = getScoreInterpretation(scan.total_score);

  const pillarMap: Record<
    PillarName,
    { scoreField: string; signalField: string }
  > = {
    entity_verifiability: {
      scoreField: 'entity_verifiability_score',
      signalField: 'entity_signals',
    },
    extractability_schema: {
      scoreField: 'extractability_schema_score',
      signalField: 'schema_signals',
    },
    freshness_maintenance: {
      scoreField: 'freshness_maintenance_score',
      signalField: 'freshness_signals',
    },
    trust_risk: {
      scoreField: 'trust_risk_score',
      signalField: 'trust_signals',
    },
    answerability_coverage: {
      scoreField: 'answerability_coverage_score',
      signalField: 'answerability_signals',
    },
  };

  const pillars = Object.entries(pillarMap).map(
    ([key, { scoreField, signalField }]) => {
      const pillarName = key as PillarName;
      const score =
        (results as Record<string, unknown>)[scoreField] as number;
      const maxScore = PILLAR_MAX_POINTS[pillarName];

      return {
        name: PILLAR_LABELS[pillarName],
        key: pillarName,
        score,
        maxScore,
        percentage: Math.round((score / maxScore) * 100),
        description: PILLAR_DESCRIPTIONS[pillarName],
        signals: (results as Record<string, unknown>)[signalField],
      };
    }
  );

  return NextResponse.json(
    {
      meta: {
        scanId: scan.id,
        url: scan.url,
        scannedAt: scan.completed_at || scan.created_at,
        duration: scan.scan_duration_ms,
        grade: scan.grade,
        totalScore: scan.total_score,
        interpretation,
      },
      pillars,
      recommendations: results.recommendations || [],
      metadata: {
        metaTitle: results.meta_title,
        metaDescription: results.meta_description,
        detectedSchemas: results.detected_schemas,
        napData: results.nap_data,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    }
  );
}
