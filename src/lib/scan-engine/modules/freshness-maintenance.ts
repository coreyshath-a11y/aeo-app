import type { ModuleResult, CheckResult, Recommendation, CrawlResult } from '@/types/scan';
import { extractHtmlContent } from '../parsers/html-content';
import { parseSitemap } from '../parsers/sitemap-parser';
import { fetchWaybackData } from '../clients/wayback-client';
import { getDomain } from '@/lib/utils/url';

const MAX_POINTS = 20;

export async function scoreFreshnessMaintenance(
  crawlResult: CrawlResult
): Promise<ModuleResult> {
  const { html, finalUrl } = crawlResult;
  const checks: CheckResult[] = [];
  const recommendations: Recommendation[] = [];

  const content = extractHtmlContent(html, finalUrl);
  const domain = getDomain(finalUrl);

  // Run external checks in parallel
  const [waybackData, sitemapData] = await Promise.all([
    fetchWaybackData(domain),
    parseSitemap(finalUrl),
  ]);

  // Check 1: Wayback has captures (2 pts)
  checks.push({
    id: 'wayback_has_captures',
    label: 'Site Has History',
    passed: waybackData.hasCaptures,
    score: waybackData.hasCaptures ? 2 : 0,
    maxScore: 2,
    details: waybackData.hasCaptures
      ? `Found ${waybackData.totalCaptures} archived version(s) in the last year`
      : 'No archived versions found in the last year',
  });

  // Check 2: Wayback change frequency (5 pts)
  let changeFreqScore = 0;
  if (waybackData.capturesLast12Months >= 12) changeFreqScore = 5;
  else if (waybackData.capturesLast12Months >= 6) changeFreqScore = 3;
  else if (waybackData.capturesLast12Months >= 2) changeFreqScore = 1;

  checks.push({
    id: 'wayback_change_frequency',
    label: 'Update Frequency',
    passed: changeFreqScore >= 3,
    score: changeFreqScore,
    maxScore: 5,
    details: `${waybackData.capturesLast12Months} unique content changes detected in the last 12 months`,
  });
  if (changeFreqScore < 3) {
    recommendations.push({
      id: 'improve_update_frequency',
      title: 'Update Your Website More Often',
      description:
        'AI systems prefer websites that are actively maintained. Your site appears to rarely change, which signals to AI that the information might be outdated.',
      impact: 'high',
      difficulty: 'moderate',
      pillar: 'freshness_maintenance',
      pointsRecoverable: 5 - changeFreqScore,
      howToFix:
        'Aim to update your website content at least once per month. Add blog posts, update your FAQ, refresh service descriptions, or post news about your business.',
    });
  }

  // Check 3: Sitemap has recent lastmod (4 pts)
  let sitemapFreshnessScore = 0;
  if (sitemapData.mostRecentMod) {
    const lastModDate = new Date(sitemapData.mostRecentMod);
    const now = new Date();
    const daysSinceMod = Math.floor(
      (now.getTime() - lastModDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceMod <= 30) sitemapFreshnessScore = 4;
    else if (daysSinceMod <= 90) sitemapFreshnessScore = 2;

    checks.push({
      id: 'sitemap_recent_lastmod',
      label: 'Sitemap Shows Recent Updates',
      passed: sitemapFreshnessScore >= 2,
      score: sitemapFreshnessScore,
      maxScore: 4,
      details: `Most recent sitemap update: ${daysSinceMod} day(s) ago`,
    });
  } else {
    checks.push({
      id: 'sitemap_recent_lastmod',
      label: 'Sitemap Shows Recent Updates',
      passed: false,
      score: 0,
      maxScore: 4,
      details: sitemapData.exists
        ? 'Sitemap exists but has no lastmod dates'
        : 'No sitemap found to check freshness',
    });
  }
  if (sitemapFreshnessScore < 2) {
    recommendations.push({
      id: 'update_sitemap_lastmod',
      title: 'Keep Your Sitemap Up to Date',
      description:
        'Your sitemap doesn\'t show recent updates. This tells AI systems your site hasn\'t changed lately, making them less likely to use your content.',
      impact: 'medium',
      difficulty: 'easy',
      pillar: 'freshness_maintenance',
      pointsRecoverable: 4 - sitemapFreshnessScore,
      howToFix:
        'Make sure your sitemap.xml includes <lastmod> dates and that they update when you change pages. Most CMS platforms handle this automatically.',
    });
  }

  // Check 4: No broken internal links (4 pts)
  let brokenLinkScore = 0;
  const samplesToCheck = content.internalLinks.slice(0, 10);
  let workingLinks = 0;

  if (samplesToCheck.length > 0) {
    const linkResults = await Promise.allSettled(
      samplesToCheck.map(async (link) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(link, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow',
          });
          return res.ok;
        } finally {
          clearTimeout(timeout);
        }
      })
    );

    workingLinks = linkResults.filter(
      (r) => r.status === 'fulfilled' && r.value
    ).length;

    const total = samplesToCheck.length;
    if (workingLinks === total) brokenLinkScore = 4;
    else if (workingLinks >= total * 0.8) brokenLinkScore = 3;
    else if (workingLinks >= total * 0.5) brokenLinkScore = 1;
  } else {
    brokenLinkScore = 2; // No links to check — neutral score
  }

  checks.push({
    id: 'no_broken_links',
    label: 'Internal Links Working',
    passed: brokenLinkScore >= 3,
    score: brokenLinkScore,
    maxScore: 4,
    details:
      samplesToCheck.length > 0
        ? `${workingLinks}/${samplesToCheck.length} sampled internal links are working`
        : 'No internal links found to check',
  });
  if (brokenLinkScore < 3 && samplesToCheck.length > 0) {
    recommendations.push({
      id: 'fix_broken_links',
      title: 'Fix Broken Links on Your Site',
      description:
        'Some links on your website lead to pages that don\'t exist. Broken links make your site look abandoned and untrustworthy to AI.',
      impact: 'medium',
      difficulty: 'moderate',
      pillar: 'freshness_maintenance',
      pointsRecoverable: 4 - brokenLinkScore,
      howToFix:
        'Check all the links on your website and fix or remove any that lead to error pages. Tools like "Broken Link Checker" can help you find them.',
    });
  }

  // Check 5: Copyright year is current (2 pts)
  const currentYear = new Date().getFullYear();
  const copyrightRegex =
    /(?:copyright|&copy;|\u00A9|©)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/i;
  const copyrightMatch = html.match(copyrightRegex);
  const copyrightYear = copyrightMatch ? parseInt(copyrightMatch[1]) : null;
  const copyrightCurrent =
    copyrightYear !== null &&
    (copyrightYear === currentYear || copyrightYear === currentYear - 1);

  checks.push({
    id: 'copyright_year_current',
    label: 'Copyright Year Current',
    passed: copyrightCurrent,
    score: copyrightCurrent ? 2 : 0,
    maxScore: 2,
    details: copyrightYear
      ? `Copyright year: ${copyrightYear}`
      : 'No copyright year found',
  });
  if (!copyrightCurrent) {
    recommendations.push({
      id: 'update_copyright_year',
      title: 'Update Your Copyright Year',
      description:
        copyrightYear
          ? `Your footer shows ${copyrightYear}. An outdated copyright year is the first thing that tells AI (and visitors) your site might be abandoned.`
          : 'No copyright year was found in your footer. Adding one shows your site is actively maintained.',
      impact: 'low',
      difficulty: 'easy',
      pillar: 'freshness_maintenance',
      pointsRecoverable: 2,
      howToFix: `Update the copyright year in your website footer to ${currentYear}. Better yet, set it to update automatically each year.`,
    });
  }

  // Check 6: Content has recent dates (3 pts)
  const dateRegex =
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(\d{4})|(\d{4})-\d{2}-\d{2}/gi;
  const dateMatches = html.match(dateRegex) || [];
  const recentDates = dateMatches.filter((d) => {
    const yearMatch = d.match(/(\d{4})/);
    if (!yearMatch) return false;
    const year = parseInt(yearMatch[1]);
    return year >= currentYear - 1;
  });
  const hasRecentDates = recentDates.length > 0;

  checks.push({
    id: 'page_has_dates',
    label: 'Content Has Recent Dates',
    passed: hasRecentDates,
    score: hasRecentDates ? 3 : 0,
    maxScore: 3,
    details: hasRecentDates
      ? `Found ${recentDates.length} date(s) from ${currentYear - 1}-${currentYear}`
      : 'No recent dates found in content',
  });
  if (!hasRecentDates) {
    recommendations.push({
      id: 'add_recent_dates',
      title: 'Add Dates to Your Content',
      description:
        'Your website doesn\'t show any recent dates. Adding "last updated" dates or blog post dates shows AI that your information is current.',
      impact: 'medium',
      difficulty: 'easy',
      pillar: 'freshness_maintenance',
      pointsRecoverable: 3,
      howToFix:
        'Add a "Last updated" date to your important pages (services, pricing, FAQ). Consider adding a blog or news section with dated posts.',
    });
  }

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);

  return {
    score: totalScore,
    maxPoints: MAX_POINTS,
    signals: {
      waybackCaptures: waybackData.capturesLast12Months,
      sitemapMostRecentMod: sitemapData.mostRecentMod,
      brokenLinksFound: samplesToCheck.length - workingLinks,
      linksChecked: samplesToCheck.length,
      copyrightYear,
      recentDatesFound: recentDates.length,
    },
    checks,
    recommendations,
  };
}
