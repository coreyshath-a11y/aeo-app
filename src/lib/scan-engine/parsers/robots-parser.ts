import robotsParser from 'robots-parser';

export interface RobotsData {
  exists: boolean;
  allowsCrawlers: boolean;
  allowsAiBots: Record<string, boolean>;
  sitemapUrls: string[];
  raw: string;
  error: string | null;
}

const ROBOTS_TIMEOUT_MS = 5000;

const AI_BOT_USER_AGENTS = [
  'GPTBot',
  'Google-Extended',
  'CCBot',
  'anthropic-ai',
  'PerplexityBot',
  'Bytespider',
];

export async function parseRobots(baseUrl: string): Promise<RobotsData> {
  const robotsUrl = new URL('/robots.txt', baseUrl).href;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ROBOTS_TIMEOUT_MS);

    const response = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AIRI-Scanner/1.0' },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        exists: false,
        allowsCrawlers: true, // No robots.txt = allow all
        allowsAiBots: Object.fromEntries(
          AI_BOT_USER_AGENTS.map((bot) => [bot, true])
        ),
        sitemapUrls: [],
        raw: '',
        error: `HTTP ${response.status}`,
      };
    }

    const raw = await response.text();
    const robots = robotsParser(robotsUrl, raw);

    // Check if general crawlers are allowed
    const allowsCrawlers = robots.isAllowed(baseUrl, '*') ?? true;

    // Check each AI bot
    const allowsAiBots: Record<string, boolean> = {};
    for (const bot of AI_BOT_USER_AGENTS) {
      allowsAiBots[bot] = robots.isAllowed(baseUrl, bot) ?? true;
    }

    // Extract sitemap URLs
    const sitemapUrls = robots.getSitemaps();

    return {
      exists: true,
      allowsCrawlers,
      allowsAiBots,
      sitemapUrls,
      raw,
      error: null,
    };
  } catch (error) {
    return {
      exists: false,
      allowsCrawlers: true,
      allowsAiBots: Object.fromEntries(
        AI_BOT_USER_AGENTS.map((bot) => [bot, true])
      ),
      sitemapUrls: [],
      raw: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
