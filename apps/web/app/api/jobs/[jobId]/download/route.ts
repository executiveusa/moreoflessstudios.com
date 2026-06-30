import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@/lib/supabase/server';

const s3 = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get job and verify user owns it
  const { data: job, error: jobErr } = await supabase
    .from('mol_jobs')
    .select('*, output_asset:mol_assets!jobs_output_asset_id_fkey(*)')
    .eq('id', params.jobId)
    .eq('user_id', user.id)
    .single();

  if (jobErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (!job.output_asset_id) {
    return NextResponse.json({ error: 'No output ready yet' }, { status: 400 });
  }

  try {
    // Get presigned download URL from R2
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || 'moreofless-media',
        Key: job.output_asset.r2_key,
      }),
      { expiresIn: 3600 } // 1 hour
    );

    return NextResponse.json({
      url,
      filename: job.output_asset.filename,
      size: job.output_asset.size_bytes,
      type: job.output_asset.mime_type,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate download URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
