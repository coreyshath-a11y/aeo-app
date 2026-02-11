import type { ModuleResult, CheckResult, Recommendation, CrawlResult } from '@/types/scan';
import { extractJsonLd } from '../parsers/schema-jsonld';
import { extractHtmlContent } from '../parsers/html-content';
import { parseSitemap } from '../parsers/sitemap-parser';
import { parseRobots } from '../parsers/robots-parser';

const MAX_POINTS = 20;

export async function scoreExtractabilitySchema(
  crawlResult: CrawlResult
): Promise<ModuleResult> {
  const { html, finalUrl } = crawlResult;
  const checks: CheckResult[] = [];
  const recommendations: Recommendation[] = [];

  const schema = extractJsonLd(html);
  const content = extractHtmlContent(html, finalUrl);

  // Run sitemap and robots checks in parallel
  const [sitemapData, robotsData] = await Promise.all([
    parseSitemap(finalUrl),
    parseRobots(finalUrl),
  ]);

  // Check 1: Has any JSON-LD (3 pts)
  const hasJsonLd = schema.raw.length > 0;
  checks.push({
    id: 'has_any_jsonld',
    label: 'Structured Data Found',
    passed: hasJsonLd,
    score: hasJsonLd ? 3 : 0,
    maxScore: 3,
    details: hasJsonLd
      ? `Found ${schema.raw.length} structured data block(s): ${schema.types.join(', ')}`
      : 'No JSON-LD structured data found on the page',
  });
  if (!hasJsonLd) {
    recommendations.push({
      id: 'add_structured_data',
      title: 'Add Structured Data to Your Site',
      description:
        'Structured data is like a cheat sheet for AI. It tells machines exactly what your business is, what you offer, and how to find you. Without it, AI has to guess — and it usually skips you.',
      impact: 'high',
      difficulty: 'moderate',
      pillar: 'extractability_schema',
      pointsRecoverable: 3,
      howToFix:
        'Add a JSON-LD script tag to your homepage. At minimum, include Organization or LocalBusiness schema with your business details.',
    });
  }

  // Check 2: Has Breadcrumb schema (2 pts)
  const hasBreadcrumb = !!schema.breadcrumbList;
  checks.push({
    id: 'has_breadcrumb_schema',
    label: 'Breadcrumb Schema',
    passed: hasBreadcrumb,
    score: hasBreadcrumb ? 2 : 0,
    maxScore: 2,
    details: hasBreadcrumb
      ? 'BreadcrumbList schema found'
      : 'No BreadcrumbList schema found',
  });
  if (!hasBreadcrumb) {
    recommendations.push({
      id: 'add_breadcrumb_schema',
      title: 'Add Breadcrumb Schema',
      description:
        'Breadcrumb schema helps AI understand how your pages connect to each other. It makes your site structure clear and easy to navigate.',
      impact: 'low',
      difficulty: 'moderate',
      pillar: 'extractability_schema',
      pointsRecoverable: 2,
      howToFix:
        'Add BreadcrumbList JSON-LD schema that shows the hierarchy of your pages (Home > Services > Specific Service).',
    });
  }

  // Check 3: Has FAQ schema (3 pts)
  const hasFaqSchema = !!schema.faqPage;
  checks.push({
    id: 'has_faq_schema',
    label: 'FAQ Schema',
    passed: hasFaqSchema,
    score: hasFaqSchema ? 3 : 0,
    maxScore: 3,
    details: hasFaqSchema
      ? 'FAQPage schema found'
      : 'No FAQPage schema found',
  });
  if (!hasFaqSchema) {
    recommendations.push({
      id: 'add_faq_schema',
      title: 'Add FAQ Schema Markup',
      description:
        'FAQ schema is one of the most powerful ways to show up in AI answers. When someone asks "How much does X cost?" or "What are your hours?", FAQ schema makes your answers easy for AI to find and cite.',
      impact: 'high',
      difficulty: 'easy',
      pillar: 'extractability_schema',
      pointsRecoverable: 3,
      howToFix:
        'Create a FAQ section on your page with common questions and answers, then wrap it in FAQPage JSON-LD schema markup.',
    });
  }

  // Check 4: Schema parses without errors (2 pts)
  const schemaValid = schema.raw.length === 0 || schema.types.length > 0;
  checks.push({
    id: 'schema_validates',
    label: 'Schema Is Valid',
    passed: schemaValid,
    score: schemaValid ? 2 : 0,
    maxScore: 2,
    details: schemaValid
      ? 'All structured data parsed successfully'
      : 'Some structured data blocks have errors',
  });

  // Check 5: Sitemap exists (2 pts)
  checks.push({
    id: 'has_sitemap',
    label: 'Sitemap Found',
    passed: sitemapData.exists,
    score: sitemapData.exists ? 2 : 0,
    maxScore: 2,
    details: sitemapData.exists
      ? `Sitemap found with ${sitemapData.urlCount} URLs`
      : 'No sitemap.xml found',
  });
  if (!sitemapData.exists) {
    recommendations.push({
      id: 'add_sitemap',
      title: 'Create a Sitemap',
      description:
        'A sitemap is a roadmap of your website. It tells search engines and AI systems where all your pages are and when they were last updated.',
      impact: 'medium',
      difficulty: 'easy',
      pillar: 'extractability_schema',
      pointsRecoverable: 2,
      howToFix:
        'Create a sitemap.xml file and place it at the root of your website. Most website builders (WordPress, Wix, Squarespace) can generate this automatically.',
    });
  }

  // Check 6: robots.txt exists (2 pts)
  checks.push({
    id: 'has_robots_txt',
    label: 'Robots.txt Found',
    passed: robotsData.exists,
    score: robotsData.exists ? 2 : 0,
    maxScore: 2,
    details: robotsData.exists
      ? 'robots.txt found'
      : 'No robots.txt found',
  });

  // Check 7: robots.txt allows AI bots (2 pts)
  const blockedBots = Object.entries(robotsData.allowsAiBots)
    .filter(([, allowed]) => !allowed)
    .map(([bot]) => bot);
  const allowsAiBots = blockedBots.length === 0;
  checks.push({
    id: 'robots_allows_ai_bots',
    label: 'AI Bots Allowed',
    passed: allowsAiBots,
    score: allowsAiBots ? 2 : blockedBots.length <= 2 ? 1 : 0,
    maxScore: 2,
    details: allowsAiBots
      ? 'All major AI bots are allowed to crawl your site'
      : `Blocked bots: ${blockedBots.join(', ')}`,
  });
  if (!allowsAiBots) {
    recommendations.push({
      id: 'unblock_ai_bots',
      title: 'Allow AI Bots to Read Your Site',
      description:
        `Your robots.txt is blocking AI systems (${blockedBots.join(', ')}) from reading your site. If AI can't read your content, it can't recommend you.`,
      impact: 'high',
      difficulty: 'easy',
      pillar: 'extractability_schema',
      pointsRecoverable: 2 - (blockedBots.length <= 2 ? 1 : 0),
      howToFix:
        'Edit your robots.txt file to remove blocks on GPTBot, Google-Extended, CCBot, anthropic-ai, and PerplexityBot. If you didn\'t add these blocks intentionally, your web host or security plugin may have.',
    });
  }

  // Check 8: Has canonical tag (2 pts)
  checks.push({
    id: 'has_canonical',
    label: 'Canonical Tag Present',
    passed: content.hasCanonical,
    score: content.hasCanonical ? 2 : 0,
    maxScore: 2,
    details: content.hasCanonical
      ? `Canonical URL: ${content.canonicalUrl}`
      : 'No canonical tag found',
  });

  // Check 9: Meta description exists (1 pt)
  const hasMetaDesc = !!content.metaDescription;
  checks.push({
    id: 'meta_description_exists',
    label: 'Meta Description Present',
    passed: hasMetaDesc,
    score: hasMetaDesc ? 1 : 0,
    maxScore: 1,
    details: hasMetaDesc
      ? `Meta description: "${content.metaDescription!.slice(0, 80)}..."`
      : 'No meta description found',
  });

  // Check 10: Meta description quality (1 pt)
  const descLength = content.metaDescription?.length ?? 0;
  const metaDescQuality = descLength >= 50 && descLength <= 160;
  checks.push({
    id: 'meta_description_quality',
    label: 'Meta Description Length',
    passed: metaDescQuality,
    score: metaDescQuality ? 1 : 0,
    maxScore: 1,
    details: hasMetaDesc
      ? `${descLength} characters (ideal: 50-160)`
      : 'No meta description to evaluate',
  });
  if (hasMetaDesc && !metaDescQuality) {
    recommendations.push({
      id: 'fix_meta_description',
      title: 'Improve Your Meta Description',
      description:
        `Your meta description is ${descLength} characters. Aim for 50-160 characters for the best results in search and AI answers.`,
      impact: 'low',
      difficulty: 'easy',
      pillar: 'extractability_schema',
      pointsRecoverable: 1,
      howToFix:
        'Write a concise description of your business (50-160 characters) that answers the question "What does this business do?"',
    });
  }

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);

  return {
    score: totalScore,
    maxPoints: MAX_POINTS,
    signals: {
      schemaTypes: schema.types,
      sitemapExists: sitemapData.exists,
      sitemapUrlCount: sitemapData.urlCount,
      robotsExists: robotsData.exists,
      blockedBots,
      hasCanonical: content.hasCanonical,
      metaDescLength: descLength,
    },
    checks,
    recommendations,
  };
}
