'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatPanel } from '@/components/layout/ChatPanel';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { JobList } from '@/components/jobs/JobList';
import { createClient } from '@/lib/supabase/client';

const STYLES = ['Cyberpunk', 'Cinematic', 'Abstract', 'Anime', 'Realistic', 'Retro'];
const DEFAULT_PROJECT_ID = 'default';

export default function VideoPage() {
  const [projectId] = useState(DEFAULT_PROJECT_ID);
  const [audioAssetId, setAudioAssetId] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [style, setStyle] = useState('Cinematic');
  const [submitting, setSubmitting] = useState(false);

  async function handleAudioUpload(file: File, r2Key: string) {
    setFilename(file.name);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
      .from('mol_assets')
      .insert({
        project_id: projectId,
        user_id: user!.id,
        type: 'audio',
        r2_key: r2Key,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      })
      .select('id')
      .single();

    if (data) setAudioAssetId(data.id);
  }

  async function generateVideo() {
    if (!audioAssetId) return;
    setSubmitting(true);
    try {
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video_gen',
          projectId,
          inputAssetId: audioAssetId,
          params: { style, provider: 'falai' },
        }),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl space-y-8">
          <div>
            <h1 className="text-2xl font-bold">Music Video</h1>
            <p className="text-muted-foreground mt-1">
              Upload your track and generate a cinematic music video with AI.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold mb-3">1. Upload Audio</h2>
              <FileDropzone
                accept={{ 'audio/*': ['.wav', '.mp3', '.flac', '.aiff'] }}
                label="Drop your audio track here"
                projectId={projectId}
                onUpload={handleAudioUpload}
              />
              {audioAssetId && (
                <p className="text-sm text-green-400 mt-2">✓ {filename}</p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-3">2. Choose Visual Style</h2>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      style === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateVideo}
              disabled={!audioAssetId || submitting}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Queuing…' : 'Generate Music Video'}
            </button>

            <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground space-y-1">
              <p>• Analyzes your track&apos;s BPM, key, and energy</p>
              <p>• Plans 3–5 scenes matching the song structure</p>
              <p>• Generates each scene via fal.ai LTX-Video</p>
              <p>• Stitches and syncs to audio via FFmpeg</p>
              <p>• Typical cost: ~$1.50–3.00 per 3-minute video</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Recent Jobs
            </h2>
            <JobList projectId={projectId} />
          </div>
        </div>
      </main>

      <ChatPanel />
    </div>
  );
}
