import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const audioFile = formData.get('audio') as File;
  if (!audioFile) return NextResponse.json({ error: 'No audio file' }, { status: 400 });

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVENLABS_API_KEY) {
    // Fallback: return empty so UI can handle gracefully
    return NextResponse.json({ text: '' });
  }

  const body = new FormData();
  body.append('audio', audioFile);
  body.append('model_id', 'scribe_v1');

  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    body,
  });

  if (!res.ok) return NextResponse.json({ text: '' });
  const data = await res.json();
  return NextResponse.json({ text: data.text ?? '' });
}
