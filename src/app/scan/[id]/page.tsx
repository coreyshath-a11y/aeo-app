import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { PILLAR_MAX_POINTS, PILLAR_LABELS } from '@/lib/constants/scoring';
import { getScoreInterpretation } from '@/lib/scan-engine/scoring/thresholds';
import { getDomain } from '@/lib/utils/url';
import { formatDuration } from '@/lib/utils/formatting';
import { ScoreDial } from '@/components/scan/score-dial';
import { PillarCard } from '@/components/scan/pillar-card';
import { RecommendationList } from '@/components/scan/recommendation-list';
import {
  ExternalLink,
  Clock,
  Link2,
  Lock,
  Sparkles,
  ArrowRight,
  UserPlus,
} from 'lucide-react';
import type { PillarName, Recommendation } from '@/types/scan';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

type UserTier = 'anonymous' | 'free' | 'monitor' | 'diy' | 'pro';

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
  const admin = createAdminClient();

  const { data: scan } = await admin
    .from('scans')
    .select('*')
    .eq('id', id)
    .single();

  if (!scan || scan.status !== 'completed') {
    notFound();
  }

  const { data: results } = await admin
    .from('scan_results')
    .select('*')
    .eq('scan_id', id)
    .single();

  if (!results) {
    notFound();
  }

  // Determine user tier
  let tier: UserTier = 'anonymous';
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await admin
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single();

      tier = (profile?.tier as UserTier) || 'free';
    }
  } catch {
    // Not authenticated
  }

  const isPaid = ['monitor', 'diy', 'pro'].includes(tier);
  const isFree = tier === 'free';
  const isAnonymous = tier === 'anonymous';

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

  const allRecommendations = (results.recommendations || []) as Recommendation[];

  // Gate content based on tier
  const visibleRecommendations = isAnonymous
    ? allRecommendations.slice(0, 3)
    : isFree
      ? allRecommendations.slice(0, 5)
      : allRecommendations;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Score Header — always visible */}
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

      {/* Pillar Breakdown — scores always visible */}
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

      {/* Anonymous CTA — Create Account */}
      {isAnonymous && (
        <section className="mt-8 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-xl font-bold">
              See your full report
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Create a free account to unlock your complete AI visibility breakdown,
              detailed signal analysis, and personalized recommendations.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/signup?redirect=/scan/${id}`}
                className="flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/login?redirect=/scan/${id}`}
                className="flex items-center justify-center rounded-md border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Sign In
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No credit card required. Takes 30 seconds.
            </p>
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          {isAnonymous ? 'Top Things to Fix' : 'Recommendations'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAnonymous
            ? 'Here are 3 of your top issues. Create an account to see them all.'
            : isFree
              ? 'Your top 5 recommendations. Upgrade for step-by-step fix guides.'
              : 'All your recommendations with step-by-step fix instructions.'}
        </p>
        <div className="mt-4">
          {isAnonymous ? (
            // Anonymous: titles only, no descriptions
            <div className="space-y-3">
              {visibleRecommendations.map((rec, i) => (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{rec.title}</span>
                </div>
              ))}
              {allRecommendations.length > 3 && (
                <div className="relative overflow-hidden rounded-lg border border-dashed border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>
                      +{allRecommendations.length - 3} more recommendations
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Free: full descriptions, no howToFix
            // Paid: full descriptions + howToFix
            <RecommendationList
              recommendations={visibleRecommendations}
              showHowToFix={isPaid}
            />
          )}
        </div>

        {/* Free user: locked recommendations teaser */}
        {isFree && allRecommendations.length > 5 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              +{allRecommendations.length - 5} more recommendations available
              with an upgraded plan
            </span>
          </div>
        )}
      </section>

      {/* howToFix locked for free users */}
      {isFree && (
        <section className="mt-8 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-3 text-lg font-bold">
              Unlock step-by-step fix guides
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Get detailed instructions for every recommendation, monthly rescans
              to track progress, and email alerts when your score changes.
            </p>
            <Link
              href="/pricing"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Upgrade — Starting at $8/month
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Paid users: full report, no upsell needed */}
      {isPaid && (
        <section className="mt-8 rounded-lg border border-border/40 bg-muted/20 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This is your complete AI visibility report. Bookmark this page to
            come back anytime, or{' '}
            <Link href="/dashboard" className="text-primary hover:text-primary/80">
              visit your dashboard
            </Link>{' '}
            to run another scan.
          </p>
        </section>
      )}
    </div>
  );
}
