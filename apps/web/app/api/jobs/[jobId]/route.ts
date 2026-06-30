import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: job, error } = await supabase
    .from('mol_jobs')
    .select('*')
    .eq('id', params.jobId)
    .eq('user_id', user.id)
    .single();

  if (error) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  return NextResponse.json(job);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: job, error: getErr } = await supabase
    .from('mol_jobs')
    .select('status')
    .eq('id', params.jobId)
    .eq('user_id', user.id)
    .single();

  if (getErr) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  if (job.status === 'completed' || job.status === 'failed') {
    return NextResponse.json(
      { error: 'Cannot cancel completed or failed job' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('mol_jobs')
    .update({ status: 'cancelled', error: 'Cancelled by user' })
    .eq('id', params.jobId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { error } = await supabase
    .from('mol_jobs')
    .update(body)
    .eq('id', params.jobId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
