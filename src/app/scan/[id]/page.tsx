import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { PILLAR_MAX_POINTS, PILLAR_LABELS } from '@/lib/constants/scoring';
import { getScoreInterpretation } from '@/lib/scan-engine/scoring/thresholds';
import { getDomain } from '@/lib/utils/url';
import { formatDuration } from '@/lib/utils/formatting';
import { ScoreDial } from '@/components/scan/score-dial';
import { PillarCard } from '@/components/scan/pillar-card';
import { RecommendationList } from '@/components/scan/recommendation-list';
import { ExternalLink, Clock, Link2 } from 'lucide-react';
import type { PillarName, Recommendation } from '@/types/scan';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: scan } = await supabase
    .from('scans')
    .select('url, total_score, grade')
    .eq('id', id)
    .single();

  if (!scan) return { title: 'Scan Not Found' };

  return {
    title: `${getDomain(scan.url)} scored ${scan.total_score}/100 (${scan.grade})`,
    description: `AI Visibility Score for ${getDomain(scan.url)}: ${scan.total_score}/100. See the full breakdown and recommendations.`,
  };
}

export default async function ScanResultsPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: scan } = await supabase
    .from('scans')
    .select('*')
    .eq('id', id)
    .single();

  if (!scan || scan.status !== 'completed') {
    notFound();
  }

  const { data: results } = await supabase
    .from('scan_results')
    .select('*')
    .eq('scan_id', id)
    .single();

  if (!results) {
    notFound();
  }

  const interpretation = getScoreInterpretation(scan.total_score);
  const domain = getDomain(scan.url);

  const pillarData: {
    key: PillarName;
    name: string;
    score: number;
    maxScore: number;
  }[] = [
    {
      key: 'entity_verifiability',
      name: PILLAR_LABELS.entity_verifiability,
      score: results.entity_verifiability_score,
      maxScore: PILLAR_MAX_POINTS.entity_verifiability,
    },
    {
      key: 'extractability_schema',
      name: PILLAR_LABELS.extractability_schema,
      score: results.extractability_schema_score,
      maxScore: PILLAR_MAX_POINTS.extractability_schema,
    },
    {
      key: 'freshness_maintenance',
      name: PILLAR_LABELS.freshness_maintenance,
      score: results.freshness_maintenance_score,
      maxScore: PILLAR_MAX_POINTS.freshness_maintenance,
    },
    {
      key: 'trust_risk',
      name: PILLAR_LABELS.trust_risk,
      score: results.trust_risk_score,
      maxScore: PILLAR_MAX_POINTS.trust_risk,
    },
    {
      key: 'answerability_coverage',
      name: PILLAR_LABELS.answerability_coverage,
      score: results.answerability_coverage_score,
      maxScore: PILLAR_MAX_POINTS.answerability_coverage,
    },
  ];

  const recommendations = (results.recommendations || []) as Recommendation[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <ScoreDial score={scan.total_score} grade={scan.grade} />
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
          {interpretation.headline}
        </h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          {interpretation.description}
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            {domain}
          </span>
          {scan.scan_duration_ms && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Scanned in {formatDuration(scan.scan_duration_ms)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            Shareable link
          </span>
        </div>
      </div>

      {/* Pillar Breakdown */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Score Breakdown</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your AI visibility is measured across 5 key areas.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillarData.map((p) => (
            <PillarCard
              key={p.key}
              pillarKey={p.key}
              name={p.name}
              score={p.score}
              maxScore={p.maxScore}
            />
          ))}
        </div>
      </section>

      {/* Recommendations */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Top Things to Fix</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These changes will have the biggest impact on your AI visibility.
          Sorted by importance.
        </p>
        <div className="mt-4">
          <RecommendationList recommendations={recommendations} />
        </div>
      </section>

      {/* Upsell */}
      <section className="mt-10 rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
        <h3 className="text-lg font-semibold">Want step-by-step fix instructions?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Upgrade to get detailed how-to guides for every recommendation, monthly
          rescans to track your progress, and priority support.
        </p>
        <a
          href="/pricing"
          className="mt-4 inline-flex items-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          See Plans — Starting at $8/month
        </a>
      </section>
    </div>
  );
}
