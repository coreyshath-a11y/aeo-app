import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !id.startsWith('sc_')) {
    return NextResponse.json({ error: 'Invalid scan ID' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: scan, error } = await supabase
    .from('scans')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  // If still processing, return status only
  if (scan.status === 'pending' || scan.status === 'processing') {
    return NextResponse.json({
      scanId: scan.id,
      status: scan.status,
      url: scan.url,
    });
  }

  // If failed, return error
  if (scan.status === 'failed') {
    return NextResponse.json({
      scanId: scan.id,
      status: 'failed',
      url: scan.url,
      error: scan.error_message || 'Scan failed',
    });
  }

  // Fetch results
  const { data: results } = await supabase
    .from('scan_results')
    .select('*')
    .eq('scan_id', id)
    .single();

  return NextResponse.json(
    {
      scanId: scan.id,
      status: scan.status,
      url: scan.url,
      totalScore: scan.total_score,
      grade: scan.grade,
      duration: scan.scan_duration_ms,
      createdAt: scan.created_at,
      completedAt: scan.completed_at,
      results: results
        ? {
            entityVerifiability: {
              score: results.entity_verifiability_score,
              signals: results.entity_signals,
            },
            extractabilitySchema: {
              score: results.extractability_schema_score,
              signals: results.schema_signals,
            },
            freshnessMaintenance: {
              score: results.freshness_maintenance_score,
              signals: results.freshness_signals,
            },
            trustRisk: {
              score: results.trust_risk_score,
              signals: results.trust_signals,
            },
            answerabilityCoverage: {
              score: results.answerability_coverage_score,
              signals: results.answerability_signals,
            },
            recommendations: results.recommendations,
            metadata: {
              metaTitle: results.meta_title,
              metaDescription: results.meta_description,
              detectedSchemas: results.detected_schemas,
              napData: results.nap_data,
            },
          }
        : null,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    }
  );
}
