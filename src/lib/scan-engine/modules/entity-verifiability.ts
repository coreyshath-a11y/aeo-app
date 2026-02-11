import type { ModuleResult, CheckResult, Recommendation, CrawlResult } from '@/types/scan';
import { extractJsonLd } from '../parsers/schema-jsonld';
import {
  extractNAPFromHtml,
  extractNAPFromSchema,
  napConsistencyCheck,
} from '../parsers/nap-extractor';
import { geocodeAddress } from '../clients/nominatim-client';

const MAX_POINTS = 25;

export async function scoreEntityVerifiability(
  crawlResult: CrawlResult
): Promise<ModuleResult> {
  const { html } = crawlResult;
  const checks: CheckResult[] = [];
  const recommendations: Recommendation[] = [];

  // Parse schema and NAP
  const schema = extractJsonLd(html);
  const entitySchema = schema.localBusiness || schema.organization;
  const htmlNap = extractNAPFromHtml(html);
  const schemaNap = extractNAPFromSchema(entitySchema);

  // Check 1: Organization or LocalBusiness schema present (5 pts)
  const hasEntitySchema = !!(schema.localBusiness || schema.organization);
  checks.push({
    id: 'has_entity_schema',
    label: 'Business Schema Markup Found',
    passed: hasEntitySchema,
    score: hasEntitySchema ? 5 : 0,
    maxScore: 5,
    details: hasEntitySchema
      ? `Found ${schema.localBusiness ? 'LocalBusiness' : 'Organization'} schema`
      : 'No Organization or LocalBusiness schema markup found',
  });
  if (!hasEntitySchema) {
    recommendations.push({
      id: 'add_entity_schema',
      title: 'Add Business Schema Markup',
      description:
        'AI systems use schema markup to understand who you are. Adding Organization or LocalBusiness schema helps AI confidently identify and recommend your business.',
      impact: 'high',
      difficulty: 'moderate',
      pillar: 'entity_verifiability',
      pointsRecoverable: 5,
      howToFix:
        'Add a JSON-LD script tag to your homepage with your business name, address, phone number, and type. You can use Google\'s Structured Data Markup Helper to generate the code.',
    });
  }

  // Check 2: Schema has name (3 pts)
  const hasSchemaName = schemaNap.names.length > 0;
  checks.push({
    id: 'schema_has_name',
    label: 'Business Name in Schema',
    passed: hasSchemaName,
    score: hasSchemaName ? 3 : 0,
    maxScore: 3,
    details: hasSchemaName
      ? `Found business name: "${schemaNap.names[0]}"`
      : 'No business name found in schema markup',
  });
  if (!hasSchemaName && hasEntitySchema) {
    recommendations.push({
      id: 'add_schema_name',
      title: 'Add Business Name to Schema',
      description:
        'Your schema markup exists but is missing your business name. AI needs this to identify you.',
      impact: 'high',
      difficulty: 'easy',
      pillar: 'entity_verifiability',
      pointsRecoverable: 3,
      howToFix:
        'Add a "name" property to your Organization or LocalBusiness schema with your official business name.',
    });
  }

  // Check 3: Schema has address (3 pts)
  const hasSchemaAddress = schemaNap.addresses.length > 0;
  checks.push({
    id: 'schema_has_address',
    label: 'Address in Schema',
    passed: hasSchemaAddress,
    score: hasSchemaAddress ? 3 : 0,
    maxScore: 3,
    details: hasSchemaAddress
      ? `Found address in schema`
      : 'No address found in schema markup',
  });
  if (!hasSchemaAddress) {
    recommendations.push({
      id: 'add_schema_address',
      title: 'Add Your Address to Schema',
      description:
        'AI systems use your address to recommend you for local searches. Without it, you may be invisible for "near me" queries.',
      impact: 'high',
      difficulty: 'easy',
      pillar: 'entity_verifiability',
      pointsRecoverable: 3,
      howToFix:
        'Add a "address" property with streetAddress, addressLocality, addressRegion, and postalCode to your schema.',
    });
  }

  // Check 4: Schema has phone (2 pts)
  const hasSchemaPhone = schemaNap.phones.length > 0;
  checks.push({
    id: 'schema_has_phone',
    label: 'Phone Number in Schema',
    passed: hasSchemaPhone,
    score: hasSchemaPhone ? 2 : 0,
    maxScore: 2,
    details: hasSchemaPhone
      ? `Found phone number in schema`
      : 'No phone number found in schema markup',
  });
  if (!hasSchemaPhone) {
    recommendations.push({
      id: 'add_schema_phone',
      title: 'Add Phone Number to Schema',
      description:
        'A phone number in your schema markup helps AI verify your business is real and contactable.',
      impact: 'medium',
      difficulty: 'easy',
      pillar: 'entity_verifiability',
      pointsRecoverable: 2,
      howToFix:
        'Add a "telephone" property to your schema markup with your main business phone number.',
    });
  }

  // Check 5: NAP consistency between schema and HTML (4 pts)
  const consistency = napConsistencyCheck(htmlNap, schemaNap);
  const consistencyScore =
    (consistency.nameMatch ? 1 : 0) +
    (consistency.phoneMatch ? 1 : 0) +
    (consistency.addressMatch ? 2 : 0);
  const napPassed = consistencyScore >= 3;
  checks.push({
    id: 'nap_consistency',
    label: 'NAP Consistency',
    passed: napPassed,
    score: consistencyScore,
    maxScore: 4,
    details: `Name ${consistency.nameMatch ? 'matches' : 'mismatch'}, Phone ${consistency.phoneMatch ? 'matches' : 'mismatch'}, Address ${consistency.addressMatch ? 'matches' : 'mismatch'}`,
  });
  if (!napPassed) {
    recommendations.push({
      id: 'fix_nap_consistency',
      title: 'Fix Name/Address/Phone Inconsistencies',
      description:
        'Your business details in the schema markup don\'t match what\'s shown on your page. AI systems see this as untrustworthy.',
      impact: 'high',
      difficulty: 'easy',
      pillar: 'entity_verifiability',
      pointsRecoverable: 4 - consistencyScore,
      howToFix:
        'Make sure your business name, address, and phone number are exactly the same in your schema markup and on your visible web page.',
    });
  }

  // Check 6: Address validates via Nominatim (3 pts)
  let addressValidates = false;
  const addressToCheck =
    schemaNap.addresses[0] || htmlNap.addresses[0] || '';
  if (addressToCheck) {
    const geocodeResult = await geocodeAddress(addressToCheck);
    addressValidates = geocodeResult.found;
  }
  checks.push({
    id: 'address_validates',
    label: 'Address Validates on Map',
    passed: addressValidates,
    score: addressValidates ? 3 : 0,
    maxScore: 3,
    details: addressValidates
      ? 'Address successfully found on map'
      : addressToCheck
        ? 'Address could not be verified on map'
        : 'No address found to verify',
  });
  if (!addressValidates && addressToCheck) {
    recommendations.push({
      id: 'fix_address',
      title: 'Verify Your Address Format',
      description:
        'Your address couldn\'t be found on a map. This may mean it\'s formatted incorrectly or incomplete.',
      impact: 'medium',
      difficulty: 'easy',
      pillar: 'entity_verifiability',
      pointsRecoverable: 3,
      howToFix:
        'Use a standard address format: "123 Main Street, City, ST 12345". Make sure it matches your actual Google Maps listing.',
    });
  }

  // Check 7: Has sameAs links (3 pts)
  const sameAsLinks: string[] = [];
  if (entitySchema && Array.isArray(entitySchema.sameAs)) {
    sameAsLinks.push(
      ...entitySchema.sameAs.filter((l: unknown) => typeof l === 'string')
    );
  } else if (entitySchema && typeof entitySchema.sameAs === 'string') {
    sameAsLinks.push(entitySchema.sameAs);
  }
  const hasSameAs = sameAsLinks.length >= 2;
  checks.push({
    id: 'has_sameas_links',
    label: 'Social Profile Links in Schema',
    passed: hasSameAs,
    score: hasSameAs ? 3 : sameAsLinks.length === 1 ? 1 : 0,
    maxScore: 3,
    details: `Found ${sameAsLinks.length} social profile link(s) in schema`,
  });
  if (!hasSameAs) {
    recommendations.push({
      id: 'add_sameas_links',
      title: 'Link Your Social Profiles in Schema',
      description:
        'Adding links to your social media profiles (Facebook, Instagram, Yelp, etc.) in your schema helps AI verify you\'re a real, active business.',
      impact: 'medium',
      difficulty: 'easy',
      pillar: 'entity_verifiability',
      pointsRecoverable: 3 - (sameAsLinks.length === 1 ? 1 : 0),
      howToFix:
        'Add a "sameAs" property to your schema with an array of URLs to your social media profiles and business directory listings.',
    });
  }

  // Check 8: sameAs links resolve (2 pts)
  let sameAsResolve = false;
  if (sameAsLinks.length > 0) {
    const resolveResults = await Promise.allSettled(
      sameAsLinks.slice(0, 4).map(async (link: string) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
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
    const resolved = resolveResults.filter(
      (r) => r.status === 'fulfilled' && r.value
    ).length;
    sameAsResolve = resolved >= 2;
  }
  checks.push({
    id: 'sameas_links_resolve',
    label: 'Social Links Are Active',
    passed: sameAsResolve,
    score: sameAsResolve ? 2 : 0,
    maxScore: 2,
    details: sameAsResolve
      ? 'Social profile links are active and reachable'
      : 'Social profile links could not be verified',
  });

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);

  return {
    score: totalScore,
    maxPoints: MAX_POINTS,
    signals: {
      schemaTypes: schema.types,
      htmlNap: {
        nameCount: htmlNap.names.length,
        addressCount: htmlNap.addresses.length,
        phoneCount: htmlNap.phones.length,
      },
      schemaNap: {
        names: schemaNap.names,
        hasAddress: hasSchemaAddress,
        hasPhone: hasSchemaPhone,
      },
      napConsistency: consistency,
      addressValidated: addressValidates,
      sameAsCount: sameAsLinks.length,
      sameAsResolve,
    },
    checks,
    recommendations,
  };
}
