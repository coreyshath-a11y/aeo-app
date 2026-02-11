import type { PillarName, ModuleResult, ScanResultData } from '@/types/scan';
import { crawl } from './crawler';
import { extractHtmlContent } from './parsers/html-content';
import { extractJsonLd } from './parsers/schema-jsonld';
import { extractNAPFromSchema } from './parsers/nap-extractor';
import { scoreEntityVerifiability } from './modules/entity-verifiability';
import { scoreExtractabilitySchema } from './modules/extractability-schema';
import { scoreFreshnessMaintenance } from './modules/freshness-maintenance';
import { scoreTrustRisk } from './modules/trust-risk-signals';
import { scoreAnswerabilityCoverage } from './modules/answerability-coverage';
import { calculateTotalScore } from './scoring/calculator';
import { generateRecommendations } from './recommendations/generator';
import { createAdminClient } from '@/lib/supabase/admin';

export async function runScan(
  scanId: string,
  url: string
): Promise<void> {
  const supabase = createAdminClient();
  const startTime = Date.now();

  // Update status to processing
  await supabase
    .from('scans')
    .update({ status: 'processing' })
    .eq('id', scanId);

  try {
    // Step 1: Crawl the URL
    const crawlResult = await crawl(url);

    if (crawlResult.statusCode >= 400) {
      throw new Error(
        `Website returned error ${crawlResult.statusCode}. The page may not exist or may be blocking our scanner.`
      );
    }

    // Step 2: Run all 5 pillar modules in parallel
    const [
      entityResult,
      extractabilityResult,
      freshnessResult,
      trustResult,
      answerabilityResult,
    ] = await Promise.all([
      scoreEntityVerifiability(crawlResult),
      scoreExtractabilitySchema(crawlResult),
      scoreFreshnessMaintenance(crawlResult),
      scoreTrustRisk(crawlResult),
      scoreAnswerabilityCoverage(crawlResult),
    ]);

    const pillarResults: Record<PillarName, ModuleResult> = {
      entity_verifiability: entityResult,
      extractability_schema: extractabilityResult,
      freshness_maintenance: freshnessResult,
      trust_risk: trustResult,
      answerability_coverage: answerabilityResult,
    };

    // Step 3: Calculate total score
    const { totalScore, grade } = calculateTotalScore(pillarResults);

    // Step 4: Generate recommendations
    const recommendations = generateRecommendations(pillarResults, 'free');

    // Step 5: Extract metadata
    const content = extractHtmlContent(crawlResult.html, crawlResult.finalUrl);
    const schema = extractJsonLd(crawlResult.html);
    const entitySchema = schema.localBusiness || schema.organization;
    const schemaNap = extractNAPFromSchema(entitySchema);

    const metadata: ScanResultData['metadata'] = {
      metaTitle: content.title,
      metaDescription: content.metaDescription,
      detectedSchemas: schema.types,
      napData: {
        name: schemaNap.names[0] || null,
        address: schemaNap.addresses[0] || null,
        phone: schemaNap.phones[0] || null,
        source: entitySchema
          ? 'schema'
          : schemaNap.names.length > 0
            ? 'html'
            : 'none',
      },
    };

    const scanDurationMs = Date.now() - startTime;

    // Step 6: Save results to database
    await supabase.from('scan_results').insert({
      scan_id: scanId,
      entity_verifiability_score: entityResult.score,
      extractability_schema_score: extractabilityResult.score,
      freshness_maintenance_score: freshnessResult.score,
      trust_risk_score: trustResult.score,
      answerability_coverage_score: answerabilityResult.score,
      entity_signals: entityResult.signals,
      schema_signals: extractabilityResult.signals,
      freshness_signals: freshnessResult.signals,
      trust_signals: trustResult.signals,
      answerability_signals: answerabilityResult.signals,
      detected_schemas: schema.types,
      nap_data: metadata.napData,
      meta_title: content.title,
      meta_description: content.metaDescription,
      recommendations: recommendations,
    });

    // Step 7: Update scan status
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        total_score: totalScore,
        grade,
        scan_duration_ms: scanDurationMs,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    // Step 8: Update cache
    const { data: scanData } = await supabase
      .from('scans')
      .select('normalized_url')
      .eq('id', scanId)
      .single();

    if (scanData?.normalized_url) {
      await supabase.from('scan_cache').upsert(
        {
          normalized_url: scanData.normalized_url,
          scan_id: scanId,
          cached_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        { onConflict: 'normalized_url' }
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    await supabase
      .from('scans')
      .update({
        status: 'failed',
        error_message: errorMessage,
        scan_duration_ms: Date.now() - startTime,
      })
      .eq('id', scanId);

    throw error;
  }
}
