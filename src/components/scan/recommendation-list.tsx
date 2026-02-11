import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowUp,
  Minus,
  ArrowDown,
  Zap,
  Wrench,
  HardHat,
} from 'lucide-react';
import type { Recommendation } from '@/types/scan';

interface RecommendationListProps {
  recommendations: Recommendation[];
  showHowToFix?: boolean;
}

export function RecommendationList({
  recommendations,
  showHowToFix = false,
}: RecommendationListProps) {
  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recommendations — your site is looking great!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec, i) => (
        <Card key={rec.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold">{rec.title}</h4>
                  <ImpactBadge impact={rec.impact} />
                  <DifficultyBadge difficulty={rec.difficulty} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {rec.description}
                </p>
                {showHowToFix && rec.howToFix && (
                  <div className="mt-2 rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-medium text-foreground">
                      How to fix:
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {rec.howToFix}
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  +{rec.pointsRecoverable} points possible
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ImpactBadge({ impact }: { impact: Recommendation['impact'] }) {
  const config = {
    high: {
      icon: <ArrowUp className="h-3 w-3" />,
      label: 'High Impact',
      variant: 'default' as const,
    },
    medium: {
      icon: <Minus className="h-3 w-3" />,
      label: 'Medium',
      variant: 'secondary' as const,
    },
    low: {
      icon: <ArrowDown className="h-3 w-3" />,
      label: 'Low',
      variant: 'outline' as const,
    },
  };
  const c = config[impact];
  return (
    <Badge variant={c.variant} className="gap-1 text-[10px]">
      {c.icon}
      {c.label}
    </Badge>
  );
}

function DifficultyBadge({
  difficulty,
}: {
  difficulty: Recommendation['difficulty'];
}) {
  const config = {
    easy: { icon: <Zap className="h-3 w-3" />, label: 'Easy Fix' },
    moderate: { icon: <Wrench className="h-3 w-3" />, label: 'Moderate' },
    hard: { icon: <HardHat className="h-3 w-3" />, label: 'Involved' },
  };
  const c = config[difficulty];
  return (
    <Badge variant="outline" className="gap-1 text-[10px]">
      {c.icon}
      {c.label}
    </Badge>
  );
}
