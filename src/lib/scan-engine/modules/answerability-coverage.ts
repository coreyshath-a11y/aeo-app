import type { ModuleResult, CheckResult, Recommendation, CrawlResult } from '@/types/scan';
import { extractHtmlContent } from '../parsers/html-content';
import { extractJsonLd } from '../parsers/schema-jsonld';

const MAX_POINTS = 20;

export async function scoreAnswerabilityCoverage(
  crawlResult: CrawlResult
): Promise<ModuleResult> {
  const { html, finalUrl } = crawlResult;
  const checks: CheckResult[] = [];
  const recommendations: Recommendation[] = [];

  const content = extractHtmlContent(html, finalUrl);
  const schema = extractJsonLd(html);
  const bodyLower = content.bodyText.toLowerCase();

  // Check 1: Has business hours (3 pts)
  const hoursPatterns = [
    /\b(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i,
    /\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*[-–to]+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)/i,
    /open\s+(?:daily|24|hours)/i,
    /business hours/i,
    /hours of operation/i,
  ];
  const hasOpeningHoursSchema =
    schema.localBusiness &&
    (schema.localBusiness.openingHoursSpecification ||
      schema.localBusiness.openingHours);

  const hasHoursInContent = hoursPatterns.some((p) => p.test(content.bodyText));
  const hasHours = !!hasOpeningHoursSchema || hasHoursInContent;

  checks.push({
    id: 'has_business_hours',
    label: 'Business Hours Listed',
    passed: hasHours,
    score: hasHours ? 3 : 0,
    maxScore: 3,
    details: hasHours
      ? hasOpeningHoursSchema
        ? 'Hours found in schema markup and on page'
        : 'Hours found on page'
      : 'No business hours found',
  });
  if (!hasHours) {
    recommendations.push({
      id: 'add_business_hours',
      title: 'Add Your Business Hours',
      description:
        '"What time are you open?" is one of the most common questions people ask AI. If your hours aren\'t on your website, AI can\'t answer — and they\'ll recommend someone who does list them.',
      impact: 'high',
      difficulty: 'easy',
      pillar: 'answerability_coverage',
      pointsRecoverable: 3,
      howToFix:
        'Add your hours of operation to your homepage or contact page. Format them clearly, like "Monday-Friday: 9:00 AM - 5:00 PM".',
    });
  }

  // Check 2: Has pricing info (3 pts)
  const pricingPatterns = [
    /\$\d/,
    /\bpric(?:e|ing|es)\b/i,
    /\bcost(?:s)?\b/i,
    /\brat(?:e|es)\b/i,
    /\bstarting\s+(?:at|from)\b/i,
    /\bper\s+(?:month|hour|session|visit|person)\b/i,
    /\bfree\s+(?:consultation|estimate|quote)\b/i,
  ];
  const hasPricing = pricingPatterns.some((p) => p.test(content.bodyText));

  checks.push({
    id: 'has_pricing_info',
    label: 'Pricing Information',
    passed: hasPricing,
    score: hasPricing ? 3 : 0,
    maxScore: 3,
    details: hasPricing
      ? 'Pricing or cost information found on page'
      : 'No pricing information found',
  });
  if (!hasPricing) {
    recommendations.push({
      id: 'add_pricing_info',
      title: 'Add Pricing Information',
      description:
        '"How much does it cost?" is one of the first things people ask AI. If your prices aren\'t on your site, AI will recommend competitors who do show theirs.',
      impact: 'high',
      difficulty: 'easy',
      pillar: 'answerability_coverage',
      pointsRecoverable: 3,
      howToFix:
        'Add a pricing section or page to your website. Even "Starting at $X" or "Call for a free quote" is better than nothing.',
    });
  }

  // Check 3: Has location info (3 pts)
  const locationPatterns = [
    /\blocated\s+(?:at|in|on)\b/i,
    /\bour\s+(?:location|address|office)\b/i,
    /\bvisit\s+us\b/i,
    /\bget\s+directions\b/i,
    /\bservice\s+area\b/i,
    /\bserving\b/i,
  ];
  const hasLocationSchema =
    schema.localBusiness &&
    schema.localBusiness.address;
  const hasLocationInContent = locationPatterns.some((p) =>
    p.test(content.bodyText)
  );
  const hasLocation = !!hasLocationSchema || hasLocationInContent;

  checks.push({
    id: 'has_location_info',
    label: 'Location Information',
    passed: hasLocation,
    score: hasLocation ? 3 : 0,
    maxScore: 3,
    details: hasLocation
      ? 'Location or service area information found'
      : 'No location information found',
  });
  if (!hasLocation) {
    recommendations.push({
      id: 'add_location_info',
      title: 'Add Your Location or Service Area',
      description:
        'When people ask AI "best [service] near me," your location matters. Without it, AI has no idea where you are.',
      impact: 'high',
      difficulty: 'easy',
      pillar: 'answerability_coverage',
      pointsRecoverable: 3,
      howToFix:
        'Add your physical address or service area to your homepage. Include it in both your schema markup and visible on the page.',
    });
  }

  // Check 4: Has contact methods (2 pts)
  const hasPhone =
    /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(
      content.bodyText
    );
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(
    content.bodyText
  );
  const hasContactForm = /contact\s+(?:us|form)/i.test(bodyLower);
  const contactMethods = [hasPhone, hasEmail, hasContactForm].filter(
    Boolean
  ).length;
  const hasContact = contactMethods >= 1;

  checks.push({
    id: 'has_contact_methods',
    label: 'Contact Methods Available',
    passed: hasContact,
    score: hasContact ? 2 : 0,
    maxScore: 2,
    details: `Found ${contactMethods} contact method(s): ${[hasPhone && 'phone', hasEmail && 'email', hasContactForm && 'contact form'].filter(Boolean).join(', ') || 'none'}`,
  });
  if (!hasContact) {
    recommendations.push({
      id: 'add_contact_info',
      title: 'Add Contact Information',
      description:
        'AI systems need to verify your business is reachable. A phone number, email, or contact form is essential.',
      impact: 'high',
      difficulty: 'easy',
      pillar: 'answerability_coverage',
      pointsRecoverable: 2,
      howToFix:
        'Add your phone number and email address to your website, ideally in the header or footer so it appears on every page.',
    });
  }

  // Check 5: Has FAQ content (3 pts)
  const questionWords = /\b(?:how|what|why|when|where|does|can|is|do|should|will|who)\b/i;
  const headingsWithQuestions = [...content.h2s, ...content.h3s].filter((h) =>
    questionWords.test(h)
  );
  const hasFaqSchema = !!schema.faqPage;
  const hasDetailsSummary =
    html.includes('<details') && html.includes('<summary');
  const hasFaqContent =
    headingsWithQuestions.length >= 2 || hasFaqSchema || hasDetailsSummary;

  checks.push({
    id: 'has_faq_content',
    label: 'FAQ Content Present',
    passed: hasFaqContent,
    score: hasFaqContent ? 3 : headingsWithQuestions.length === 1 ? 1 : 0,
    maxScore: 3,
    details: hasFaqContent
      ? `Found ${headingsWithQuestions.length} question-style headings${hasFaqSchema ? ' (with FAQ schema)' : ''}`
      : 'No FAQ-style content found',
  });
  if (!hasFaqContent) {
    recommendations.push({
      id: 'add_faq_content',
      title: 'Add a FAQ Section',
      description:
        'AI answers are built from questions and answers. A FAQ section on your site gives AI ready-made answers to recommend. This is one of the easiest wins for AI visibility.',
      impact: 'high',
      difficulty: 'easy',
      pillar: 'answerability_coverage',
      pointsRecoverable: 3,
      howToFix:
        'Add a FAQ section to your homepage or create a dedicated FAQ page. Include 5-10 common questions your customers ask, with clear and concise answers.',
    });
  }

  // Check 6: Has service descriptions (3 pts)
  const serviceHeadings = [...content.h2s, ...content.h3s].filter((h) => {
    const lower = h.toLowerCase();
    return (
      lower.includes('service') ||
      lower.includes('what we') ||
      lower.includes('our ') ||
      lower.includes('offer') ||
      lower.includes('product') ||
      lower.includes('solution') ||
      lower.includes('feature') ||
      lower.includes('specialt') ||
      lower.includes('treatment') ||
      lower.includes('package')
    );
  });
  const hasServiceDescriptions = serviceHeadings.length >= 1;

  checks.push({
    id: 'has_service_descriptions',
    label: 'Service Descriptions',
    passed: hasServiceDescriptions,
    score: hasServiceDescriptions ? 3 : 0,
    maxScore: 3,
    details: hasServiceDescriptions
      ? `Found ${serviceHeadings.length} service-related section(s)`
      : 'No clear service or product descriptions found',
  });
  if (!hasServiceDescriptions) {
    recommendations.push({
      id: 'add_service_descriptions',
      title: 'Describe Your Services Clearly',
      description:
        'AI needs to understand what you do to recommend you. Without clear descriptions of your services or products, AI can\'t match you to what people are looking for.',
      impact: 'high',
      difficulty: 'moderate',
      pillar: 'answerability_coverage',
      pointsRecoverable: 3,
      howToFix:
        'Add sections with headings like "Our Services" or "What We Offer" followed by a short description of each service.',
    });
  }

  // Check 7: Content length sufficient (2 pts)
  const sufficient = content.wordCount >= 300;
  checks.push({
    id: 'content_length_sufficient',
    label: 'Enough Content',
    passed: sufficient,
    score: sufficient ? 2 : content.wordCount >= 150 ? 1 : 0,
    maxScore: 2,
    details: `${content.wordCount} words on page (minimum recommended: 300)`,
  });
  if (!sufficient) {
    recommendations.push({
      id: 'add_more_content',
      title: 'Add More Content to Your Page',
      description:
        `Your page has ${content.wordCount} words. AI needs enough content to understand your business. Aim for at least 300 words on your homepage.`,
      impact: 'medium',
      difficulty: 'moderate',
      pillar: 'answerability_coverage',
      pointsRecoverable: 2 - (content.wordCount >= 150 ? 1 : 0),
      howToFix:
        'Expand your homepage content with information about your services, your story, and answers to common questions.',
    });
  }

  // Check 8: Heading structure logical (1 pt)
  const hasH1 = content.h1s.length >= 1;
  const hasSubheadings = content.h2s.length >= 1;
  const logicalStructure = hasH1 && hasSubheadings;

  checks.push({
    id: 'heading_structure',
    label: 'Clear Heading Structure',
    passed: logicalStructure,
    score: logicalStructure ? 1 : 0,
    maxScore: 1,
    details: logicalStructure
      ? `${content.h1s.length} H1, ${content.h2s.length} H2, ${content.h3s.length} H3`
      : `Missing ${!hasH1 ? 'H1 heading' : ''}${!hasH1 && !hasSubheadings ? ' and ' : ''}${!hasSubheadings ? 'subheadings' : ''}`,
  });

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);

  return {
    score: totalScore,
    maxPoints: MAX_POINTS,
    signals: {
      hasHours,
      hasPricing,
      hasLocation,
      contactMethods,
      faqHeadingsCount: headingsWithQuestions.length,
      hasFaqSchema: !!schema.faqPage,
      serviceHeadingsCount: serviceHeadings.length,
      wordCount: content.wordCount,
      h1Count: content.h1s.length,
      h2Count: content.h2s.length,
    },
    checks,
    recommendations,
  };
}
