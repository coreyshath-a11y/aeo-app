export interface CruxData {
  hasData: boolean;
  lcp: MetricData | null; // Largest Contentful Paint (ms)
  cls: MetricData | null; // Cumulative Layout Shift
  inp: MetricData | null; // Interaction to Next Paint (ms)
  error: string | null;
}

export interface MetricData {
  p75: number;
  good: number; // percentage of good experiences
  needsImprovement: number;
  poor: number;
}

const CRUX_API_URL =
  'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

export async function fetchCruxData(origin: string): Promise<CruxData> {
  const apiKey = process.env.CRUX_API_KEY;

  if (!apiKey) {
    return {
      hasData: false,
      lcp: null,
      cls: null,
      inp: null,
      error: 'CrUX API key not configured',
    };
  }

  try {
    const response = await fetch(`${CRUX_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        formFactor: 'PHONE', // Mobile-first
        metrics: [
          'largest_contentful_paint',
          'cumulative_layout_shift',
          'interaction_to_next_paint',
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No data for this origin
        return {
          hasData: false,
          lcp: null,
          cls: null,
          inp: null,
          error: null,
        };
      }
      return {
        hasData: false,
        lcp: null,
        cls: null,
        inp: null,
        error: `CrUX API returned ${response.status}`,
      };
    }

    const data = await response.json();
    const metrics = data.record?.metrics;

    if (!metrics) {
      return {
        hasData: false,
        lcp: null,
        cls: null,
        inp: null,
        error: null,
      };
    }

    return {
      hasData: true,
      lcp: parseMetric(metrics.largest_contentful_paint),
      cls: parseMetric(metrics.cumulative_layout_shift),
      inp: parseMetric(metrics.interaction_to_next_paint),
      error: null,
    };
  } catch (error) {
    return {
      hasData: false,
      lcp: null,
      cls: null,
      inp: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function parseMetric(
  metric: Record<string, unknown> | undefined
): MetricData | null {
  if (!metric) return null;

  const percentiles = metric.percentiles as
    | Record<string, number>
    | undefined;
  const histogram = metric.histogram as
    | Array<{ start: number; end?: number; density: number }>
    | undefined;

  if (!percentiles?.p75 === undefined) return null;

  const good = histogram?.[0]?.density ?? 0;
  const needsImprovement = histogram?.[1]?.density ?? 0;
  const poor = histogram?.[2]?.density ?? 0;

  return {
    p75: percentiles?.p75 ?? 0,
    good: Math.round(good * 100),
    needsImprovement: Math.round(needsImprovement * 100),
    poor: Math.round(poor * 100),
  };
}
