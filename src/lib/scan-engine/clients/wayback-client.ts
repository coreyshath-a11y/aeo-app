export interface WaybackData {
  hasCaptures: boolean;
  totalCaptures: number;
  capturesLast12Months: number;
  oldestCapture: string | null;
  newestCapture: string | null;
  error: string | null;
}

const WAYBACK_TIMEOUT_MS = 10_000;

export async function fetchWaybackData(domain: string): Promise<WaybackData> {
  try {
    const now = new Date();
    const yearAgo = new Date(now);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const from = formatWaybackDate(yearAgo);
    const to = formatWaybackDate(now);

    // CDX API: get unique content snapshots from the last 12 months
    const cdxUrl = new URL('https://web.archive.org/cdx/search/cdx');
    cdxUrl.searchParams.set('url', domain);
    cdxUrl.searchParams.set('output', 'json');
    cdxUrl.searchParams.set('fl', 'timestamp');
    cdxUrl.searchParams.set('from', from);
    cdxUrl.searchParams.set('to', to);
    cdxUrl.searchParams.set('collapse', 'digest'); // Only count unique content
    cdxUrl.searchParams.set('limit', '100');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WAYBACK_TIMEOUT_MS);

    const response = await fetch(cdxUrl.href, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AIRI-Scanner/1.0' },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        hasCaptures: false,
        totalCaptures: 0,
        capturesLast12Months: 0,
        oldestCapture: null,
        newestCapture: null,
        error: `Wayback API returned ${response.status}`,
      };
    }

    const data = (await response.json()) as string[][];

    // First row is headers, rest are data
    if (!data || data.length <= 1) {
      return {
        hasCaptures: false,
        totalCaptures: 0,
        capturesLast12Months: 0,
        oldestCapture: null,
        newestCapture: null,
        error: null,
      };
    }

    const timestamps = data.slice(1).map((row) => row[0]);

    return {
      hasCaptures: true,
      totalCaptures: timestamps.length,
      capturesLast12Months: timestamps.length,
      oldestCapture: timestamps[0] || null,
      newestCapture: timestamps[timestamps.length - 1] || null,
      error: null,
    };
  } catch (error) {
    return {
      hasCaptures: false,
      totalCaptures: 0,
      capturesLast12Months: 0,
      oldestCapture: null,
      newestCapture: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function formatWaybackDate(date: Date): string {
  return (
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  );
}
