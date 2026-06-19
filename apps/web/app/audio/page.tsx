'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatPanel } from '@/components/layout/ChatPanel';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { JobList } from '@/components/jobs/JobList';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_PROJECT_ID = 'default'; // Will be dynamic once project selection is added

export default function AudioStudioPage() {
  const [projectId] = useState(DEFAULT_PROJECT_ID);
  const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleUpload(file: File, r2Key: string) {
    setFilename(file.name);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Create asset record
    const { data } = await supabase
      .from('assets')
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

    if (data) setUploadedAssetId(data.id);
  }

  async function submitJob(type: 'audio_master' | 'stem_sep' | 'audio_analyze') {
    if (!uploadedAssetId) return;
    setSubmitting(true);

    try {
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, projectId, inputAssetId: uploadedAssetId }),
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
            <h1 className="text-2xl font-bold">Audio Studio</h1>
            <p className="text-muted-foreground mt-1">
              Upload a track to master it, separate stems, or analyze musical structure.
            </p>
          </div>

          <FileDropzone
            accept={{ 'audio/*': ['.wav', '.mp3', '.flac', '.aiff', '.ogg'] }}
            label="Drop an audio file to get started"
            projectId={projectId}
            onUpload={handleUpload}
          />

          {uploadedAssetId && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm font-medium">✓ Uploaded: {filename}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'audio_master' as const, label: 'Master Audio', desc: 'Normalize loudness, apply EQ & compression' },
                  { type: 'stem_sep' as const, label: 'Separate Stems', desc: 'Isolate vocals, drums, bass, and instruments' },
                  { type: 'audio_analyze' as const, label: 'Analyze Track', desc: 'Detect BPM, key, mood, and structure' },
                ].map(({ type, label, desc }) => (
                  <button
                    key={type}
                    onClick={() => submitJob(type)}
                    disabled={submitting}
                    className="p-4 text-left bg-secondary border border-border rounded-lg hover:border-primary/50 disabled:opacity-50 transition-colors"
                  >
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

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
