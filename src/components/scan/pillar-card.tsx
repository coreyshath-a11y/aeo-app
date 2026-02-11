import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Fingerprint,
  Code2,
  RefreshCw,
  ShieldCheck,
  MessageCircleQuestion,
} from 'lucide-react';
import type { PillarName } from '@/types/scan';

interface PillarCardProps {
  pillarKey: PillarName;
  name: string;
  score: number;
  maxScore: number;
}

const PILLAR_ICONS: Record<PillarName, React.ReactNode> = {
  entity_verifiability: <Fingerprint className="h-5 w-5" />,
  extractability_schema: <Code2 className="h-5 w-5" />,
  freshness_maintenance: <RefreshCw className="h-5 w-5" />,
  trust_risk: <ShieldCheck className="h-5 w-5" />,
  answerability_coverage: <MessageCircleQuestion className="h-5 w-5" />,
};

function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-emerald-500';
  if (percentage >= 60) return 'text-lime-500';
  if (percentage >= 40) return 'text-yellow-500';
  if (percentage >= 20) return 'text-orange-500';
  return 'text-red-500';
}

function getBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-emerald-500';
  if (percentage >= 60) return 'bg-lime-500';
  if (percentage >= 40) return 'bg-yellow-500';
  if (percentage >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

export function PillarCard({
  pillarKey,
  name,
  score,
  maxScore,
}: PillarCardProps) {
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">
            {PILLAR_ICONS[pillarKey]}
          </span>
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
            {score}
          </span>
          <span className="text-sm text-muted-foreground">/ {maxScore}</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${getBarColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{percentage}%</p>
      </CardContent>
    </Card>
  );
}
