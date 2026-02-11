import * as cheerio from 'cheerio';

export interface HtmlContentData {
  title: string | null;
  metaDescription: string | null;
  h1s: string[];
  h2s: string[];
  h3s: string[];
  bodyText: string;
  wordCount: number;
  internalLinks: string[];
  externalLinks: string[];
  hasCanonical: boolean;
  canonicalUrl: string | null;
  hasMixedContent: boolean;
  ogSiteName: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}

export function extractHtmlContent(
  html: string,
  pageUrl: string
): HtmlContentData {
  const $ = cheerio.load(html);

  // Remove script, style, noscript
  $('script, style, noscript').remove();

  const title = $('title').text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() || null;

  const h1s = $('h1')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h2s = $('h2')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h3s = $('h3')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // Extract links
  let pageOrigin: string;
  try {
    pageOrigin = new URL(pageUrl).origin;
  } catch {
    pageOrigin = '';
  }

  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
    try {
      const resolved = new URL(href, pageUrl).href;
      if (resolved.startsWith(pageOrigin)) {
        internalLinks.push(resolved);
      } else {
        externalLinks.push(resolved);
      }
    } catch {
      // Invalid URL — skip
    }
  });

  // Canonical
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
  const hasCanonical = !!canonicalUrl;

  // Mixed content: check for http:// resources on https:// pages
  let hasMixedContent = false;
  if (pageUrl.startsWith('https://')) {
    const httpResources = $(
      'img[src^="http://"], script[src^="http://"], link[href^="http://"]'
    );
    hasMixedContent = httpResources.length > 0;
  }

  // OG tags
  const ogSiteName =
    $('meta[property="og:site_name"]').attr('content')?.trim() || null;
  const ogTitle =
    $('meta[property="og:title"]').attr('content')?.trim() || null;
  const ogDescription =
    $('meta[property="og:description"]').attr('content')?.trim() || null;

  return {
    title,
    metaDescription,
    h1s,
    h2s,
    h3s,
    bodyText,
    wordCount,
    internalLinks: [...new Set(internalLinks)],
    externalLinks: [...new Set(externalLinks)],
    hasCanonical,
    canonicalUrl,
    hasMixedContent,
    ogSiteName,
    ogTitle,
    ogDescription,
  };
}
