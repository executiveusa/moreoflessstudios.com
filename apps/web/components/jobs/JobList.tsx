'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { JobCard } from './JobCard';
import type { Job } from '@/lib/supabase/types';

interface Props {
  projectId: string;
}

export function JobList({ projectId }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const supabase = createClient();

    // Initial load
    supabase
      .from('jobs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setJobs(data ?? []));

    // Realtime subscription for live updates
    const channel = supabase
      .channel(`jobs:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs', filter: `project_id=eq.${projectId}` },
        payload => {
          if (payload.eventType === 'INSERT') {
            setJobs(prev => [payload.new as Job, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setJobs(prev => prev.map(j => (j.id === payload.new.id ? (payload.new as Job) : j)));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  async function cancelJob(jobId: string) {
    await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
  }

  async function downloadJob(jobId: string) {
    const res = await fetch(`/api/jobs/${jobId}/download`);
    const { url } = await res.json();
    window.open(url, '_blank');
  }

  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No jobs yet.</p>;
  }

  return (
    <div className="space-y-3">
      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          onCancel={cancelJob}
          onDownload={downloadJob}
        />
      ))}
    </div>
  );
}
