import { XMLParser } from 'fast-xml-parser';

export interface SitemapData {
  exists: boolean;
  urlCount: number;
  lastModDates: string[];
  mostRecentMod: string | null;
  error: string | null;
}

const SITEMAP_TIMEOUT_MS = 8000;

export async function parseSitemap(baseUrl: string): Promise<SitemapData> {
  const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SITEMAP_TIMEOUT_MS);

    const response = await fetch(sitemapUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AIRI-Scanner/1.0',
        Accept: 'application/xml, text/xml, */*',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        exists: false,
        urlCount: 0,
        lastModDates: [],
        mostRecentMod: null,
        error: `HTTP ${response.status}`,
      };
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      isArray: (name) => name === 'url' || name === 'sitemap',
    });

    const parsed = parser.parse(xml);

    // Handle both sitemap index and regular sitemap
    const urls: Array<{ lastmod?: string }> = [];

    if (parsed.urlset?.url) {
      urls.push(...parsed.urlset.url);
    } else if (parsed.sitemapindex?.sitemap) {
      // Sitemap index — report the index-level lastmod dates
      for (const sm of parsed.sitemapindex.sitemap) {
        if (sm.lastmod) {
          urls.push({ lastmod: sm.lastmod });
        }
      }
    }

    const lastModDates = urls
      .map((u) => u.lastmod)
      .filter((d): d is string => !!d)
      .sort()
      .reverse();

    return {
      exists: true,
      urlCount: urls.length,
      lastModDates: lastModDates.slice(0, 20), // Keep top 20
      mostRecentMod: lastModDates[0] || null,
      error: null,
    };
  } catch (error) {
    return {
      exists: false,
      urlCount: 0,
      lastModDates: [],
      mostRecentMod: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
