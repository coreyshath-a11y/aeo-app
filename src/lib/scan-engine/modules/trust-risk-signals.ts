import type { ModuleResult, CheckResult, Recommendation, CrawlResult } from '@/types/scan';
import { extractHtmlContent } from '../parsers/html-content';
import { fetchCruxData } from '../clients/crux-client';

const MAX_POINTS = 15;

export async function scoreTrustRisk(
  crawlResult: CrawlResult
): Promise<ModuleResult> {
  const { html, headers, finalUrl, tlsInfo } = crawlResult;
  const checks: CheckResult[] = [];
  const recommendations: Recommendation[] = [];

  const content = extractHtmlContent(html, finalUrl);

  // Fetch CrUX data
  let origin: string;
  try {
    origin = new URL(finalUrl).origin;
  } catch {
    origin = finalUrl;
  }
  const cruxData = await fetchCruxData(origin);

  // Check 1: HTTPS with valid TLS (3 pts)
  const httpsValid = finalUrl.startsWith('https://') && (tlsInfo?.valid ?? false);
  const httpsPartial = finalUrl.startsWith('https://');
  checks.push({
    id: 'https_valid',
    label: 'Secure Connection (HTTPS)',
    passed: httpsValid,
    score: httpsValid ? 3 : httpsPartial ? 2 : 0,
    maxScore: 3,
    details: httpsValid
      ? `Valid HTTPS with ${tlsInfo?.protocol || 'TLS'} from ${tlsInfo?.issuer || 'unknown issuer'}`
      : httpsPartial
        ? 'HTTPS is enabled but certificate may have issues'
        : 'Site does not use HTTPS',
  });
  if (!httpsValid) {
    recommendations.push({
      id: 'enable_https',
      title: httpsPartial ? 'Fix Your SSL Certificate' : 'Enable HTTPS',
      description:
        'A secure connection (HTTPS) is a basic trust signal. AI systems strongly prefer secure websites. Without it, your site looks risky.',
      impact: 'high',
      difficulty: httpsPartial ? 'moderate' : 'easy',
      pillar: 'trust_risk',
      pointsRecoverable: 3 - (httpsPartial ? 2 : 0),
      howToFix: httpsPartial
        ? 'Your SSL certificate may be expired or misconfigured. Contact your web host to renew or fix it.'
        : 'Enable HTTPS on your website. Most web hosts offer free SSL certificates through Let\'s Encrypt.',
    });
  }

  // Check 2: Security headers (3 pts, 1 each)
  const securityHeaders = {
    'strict-transport-security': !!headers['strict-transport-security'],
    'x-content-type-options': !!headers['x-content-type-options'],
    'x-frame-options': !!headers['x-frame-options'],
  };
  const secHeaderCount = Object.values(securityHeaders).filter(Boolean).length;
  checks.push({
    id: 'security_headers',
    label: 'Security Headers Present',
    passed: secHeaderCount >= 2,
    score: secHeaderCount,
    maxScore: 3,
    details: `${secHeaderCount}/3 security headers found: ${Object.entries(securityHeaders)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ') || 'none'}`,
  });
  if (secHeaderCount < 3) {
    const missing = Object.entries(securityHeaders)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    recommendations.push({
      id: 'add_security_headers',
      title: 'Add Security Headers',
      description:
        'Security headers protect your visitors and signal to AI that your site is safe. You\'re missing: ' +
        missing.join(', '),
      impact: 'medium',
      difficulty: 'moderate',
      pillar: 'trust_risk',
      pointsRecoverable: 3 - secHeaderCount,
      howToFix:
        'Add security headers to your web server configuration. Your hosting provider may have a setting for this, or you can add them through a CDN like Cloudflare.',
    });
  }

  // Check 3: CrUX LCP (3 pts)
  if (cruxData.hasData && cruxData.lcp && typeof cruxData.lcp.p75 === 'number' && isFinite(cruxData.lcp.p75)) {
    const lcpMs = cruxData.lcp.p75;
    const lcpSec = (lcpMs / 1000).toFixed(1);
    let lcpScore = 0;
    if (lcpMs <= 2500) lcpScore = 3;
    else if (lcpMs <= 4000) lcpScore = 1;

    checks.push({
      id: 'crux_lcp',
      label: 'Page Load Speed (LCP)',
      passed: lcpScore >= 2,
      score: lcpScore,
      maxScore: 3,
      details: `Largest Contentful Paint: ${lcpSec}s (${lcpScore === 3 ? 'Good' : lcpScore === 1 ? 'Needs Improvement' : 'Poor'})`,
    });
    if (lcpScore < 3) {
      recommendations.push({
        id: 'improve_lcp',
        title: 'Speed Up Your Page Load Time',
        description:
          `Your page takes ${lcpSec} seconds to show its main content. Fast-loading sites are trusted more by AI and preferred in search results.`,
        impact: 'high',
        difficulty: 'hard',
        pillar: 'trust_risk',
        pointsRecoverable: 3 - lcpScore,
        howToFix:
          'Optimize images (compress them, use modern formats like WebP), reduce the number of scripts loading on your page, and consider using a CDN.',
      });
    }
  } else {
    // No CrUX data — award neutral score
    checks.push({
      id: 'crux_lcp',
      label: 'Page Load Speed (LCP)',
      passed: true,
      score: 2,
      maxScore: 3,
      details: 'Not enough traffic data to measure (neutral score awarded)',
    });
  }

  // Check 4: CrUX CLS (2 pts)
  if (cruxData.hasData && cruxData.cls && typeof cruxData.cls.p75 === 'number' && isFinite(cruxData.cls.p75)) {
    const clsValue = cruxData.cls.p75;
    let clsScore = 0;
    if (clsValue <= 0.1) clsScore = 2;
    else if (clsValue <= 0.25) clsScore = 1;

    checks.push({
      id: 'crux_cls',
      label: 'Visual Stability (CLS)',
      passed: clsScore >= 1,
      score: clsScore,
      maxScore: 2,
      details: `Cumulative Layout Shift: ${clsValue.toFixed(2)} (${clsScore === 2 ? 'Good' : clsScore === 1 ? 'Needs Improvement' : 'Poor'})`,
    });
    if (clsScore < 2) {
      recommendations.push({
        id: 'improve_cls',
        title: 'Reduce Layout Shifting',
        description:
          'Your page content moves around as it loads, which makes it harder for both visitors and AI to read your content reliably.',
        impact: 'medium',
        difficulty: 'hard',
        pillar: 'trust_risk',
        pointsRecoverable: 2 - clsScore,
        howToFix:
          'Set explicit width and height on images and ads. Avoid inserting content above existing content after the page loads.',
      });
    }
  } else {
    checks.push({
      id: 'crux_cls',
      label: 'Visual Stability (CLS)',
      passed: true,
      score: 1,
      maxScore: 2,
      details: 'Not enough traffic data to measure (neutral score awarded)',
    });
  }

  // Check 5: CrUX INP (2 pts)
  if (cruxData.hasData && cruxData.inp && typeof cruxData.inp.p75 === 'number' && isFinite(cruxData.inp.p75)) {
    const inpMs = cruxData.inp.p75;
    let inpScore = 0;
    if (inpMs <= 200) inpScore = 2;
    else if (inpMs <= 500) inpScore = 1;

    checks.push({
      id: 'crux_inp',
      label: 'Responsiveness (INP)',
      passed: inpScore >= 1,
      score: inpScore,
      maxScore: 2,
      details: `Interaction to Next Paint: ${inpMs}ms (${inpScore === 2 ? 'Good' : inpScore === 1 ? 'Needs Improvement' : 'Poor'})`,
    });
  } else {
    checks.push({
      id: 'crux_inp',
      label: 'Responsiveness (INP)',
      passed: true,
      score: 1,
      maxScore: 2,
      details: 'Not enough traffic data to measure (neutral score awarded)',
    });
  }

  // Check 6: No mixed content (1 pt)
  checks.push({
    id: 'no_mixed_content',
    label: 'No Mixed Content',
    passed: !content.hasMixedContent,
    score: content.hasMixedContent ? 0 : 1,
    maxScore: 1,
    details: content.hasMixedContent
      ? 'Page loads insecure (HTTP) resources on a secure (HTTPS) page'
      : 'No mixed content detected',
  });

  // Check 7: Has privacy policy (1 pt)
  const hasPrivacyLink = content.internalLinks.some(
    (link) =>
      link.toLowerCase().includes('privacy') ||
      link.toLowerCase().includes('policy')
  );
  const bodyHasPrivacy = html.toLowerCase().includes('privacy policy');
  const hasPrivacy = hasPrivacyLink || bodyHasPrivacy;
  checks.push({
    id: 'has_privacy_policy',
    label: 'Privacy Policy Present',
    passed: hasPrivacy,
    score: hasPrivacy ? 1 : 0,
    maxScore: 1,
    details: hasPrivacy
      ? 'Privacy policy link found'
      : 'No privacy policy link found',
  });
  if (!hasPrivacy) {
    recommendations.push({
      id: 'add_privacy_policy',
      title: 'Add a Privacy Policy',
      description:
        'A privacy policy is expected by both visitors and AI. Not having one can make your site look less professional and trustworthy.',
      impact: 'low',
      difficulty: 'easy',
      pillar: 'trust_risk',
      pointsRecoverable: 1,
      howToFix:
        'Create a privacy policy page and link to it from your footer. Free privacy policy generators are available online.',
    });
  }

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);

  return {
    score: totalScore,
    maxPoints: MAX_POINTS,
    signals: {
      httpsValid,
      tlsInfo,
      securityHeaders,
      cruxHasData: cruxData.hasData,
      cruxLcp: cruxData.lcp?.p75 ?? null,
      cruxCls: cruxData.cls?.p75 ?? null,
      cruxInp: cruxData.inp?.p75 ?? null,
      hasMixedContent: content.hasMixedContent,
      hasPrivacyPolicy: hasPrivacy,
    },
    checks,
    recommendations,
  };
}
