import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildR2Key, getUploadUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { filename, mimeType, sizeBytes, projectId } = await request.json();
  if (!filename || !mimeType || !projectId) {
    return NextResponse.json({ error: 'filename, mimeType, projectId required' }, { status: 400 });
  }

  const MAX_SIZE = 500 * 1024 * 1024; // 500 MB
  if (sizeBytes > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 500 MB limit' }, { status: 413 });
  }

  const r2Key = buildR2Key(user.id, projectId, filename);
  const uploadUrl = await getUploadUrl(r2Key, mimeType);

  return NextResponse.json({ uploadUrl, r2Key });
}
