import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get('projectId');
  let query = supabase.from('mol_jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { type, projectId, inputAssetId, params = {} } = body;

  if (!type || !projectId) {
    return NextResponse.json({ error: 'type and projectId are required' }, { status: 400 });
  }

  // Check budget
  const { data: profile } = await supabase
    .from('mol_profiles')
    .select('budget_usd, monthly_spend_usd')
    .eq('id', user.id)
    .single();

  if (profile && profile.monthly_spend_usd >= profile.budget_usd) {
    return NextResponse.json(
      { error: `Monthly budget of $${profile.budget_usd} reached. Update in settings.` },
      { status: 402 }
    );
  }

  const { data: job, error } = await supabase
    .from('mol_jobs')
    .insert({
      user_id: user.id,
      project_id: projectId,
      type,
      input_asset_id: inputAssetId ?? null,
      params,
      status: 'pending',
      progress: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Dispatch to worker (fire-and-forget)
  const workerUrl = process.env.ACESTEP_API_URL;
  if (workerUrl) {
    fetch(`${workerUrl}/mol/jobs/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.WORKER_API_KEY ?? '' },
      body: JSON.stringify({ jobId: job.id, type, inputAssetId, params }),
    }).catch(() => {});
  }

  return NextResponse.json(job, { status: 201 });
}
