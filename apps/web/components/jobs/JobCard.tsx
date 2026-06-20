'use client';

import type { Job } from '@/lib/supabase/types';

const STATUS_COLORS: Record<Job['status'], string> = {
  pending: 'text-yellow-400',
  processing: 'text-blue-400',
  completed: 'text-green-400',
  failed: 'text-red-400',
  cancelled: 'text-muted-foreground',
};

const JOB_LABELS: Record<Job['type'], string> = {
  audio_master: 'Audio Mastering',
  stem_sep: 'Stem Separation',
  audio_analyze: 'Audio Analysis',
  music_gen: 'Music Generation',
  video_gen: 'Video Generation',
  image_gen: 'Image Generation',
  clip_extract: 'Clip Extraction',
  caption_gen: 'Caption Writing',
};

interface Props {
  job: Job;
  onCancel?: (id: string) => void;
  onDownload?: (jobId: string) => void;
}

export function JobCard({ job, onCancel, onDownload }: Props) {
  const statusColor = STATUS_COLORS[job.status];
  const label = JOB_LABELS[job.type];
  const elapsed = job.completed_at
    ? Math.round((new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()) / 1000)
    : null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className={`text-xs mt-0.5 ${statusColor} capitalize`}>{job.status}</p>
        </div>
        <div className="text-right">
          {job.cost_usd > 0 && (
            <p className="text-xs text-muted-foreground">${job.cost_usd.toFixed(3)}</p>
          )}
          {elapsed && <p className="text-xs text-muted-foreground">{elapsed}s</p>}
        </div>
      </div>

      {job.status === 'processing' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Processing…</span>
            <span>{job.progress}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {job.status === 'failed' && job.error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded p-2">{job.error}</p>
      )}

      <div className="flex gap-2">
        {job.status === 'completed' && onDownload && (
          <button
            onClick={() => onDownload(job.id)}
            className="flex-1 text-xs py-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
          >
            Download
          </button>
        )}
        {(job.status === 'pending' || job.status === 'processing') && onCancel && (
          <button
            onClick={() => onCancel(job.id)}
            className="flex-1 text-xs py-1.5 border border-border rounded hover:bg-secondary transition-colors text-muted-foreground"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
