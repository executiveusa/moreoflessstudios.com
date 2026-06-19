'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  accept: Record<string, string[]>;
  label: string;
  onUpload: (file: File, r2Key: string) => void;
  projectId: string;
}

export function FileDropzone({ accept, label, onUpload, projectId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setUploading(true);
      setError('');
      setProgress(10);

      try {
        // 1. Get presigned upload URL from our API
        const res = await fetch('/api/assets/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            projectId,
          }),
        });

        if (!res.ok) throw new Error('Failed to get upload URL');
        const { uploadUrl, r2Key } = await res.json();
        setProgress(30);

        // 2. Upload directly to R2
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadRes.ok) throw new Error('Upload to storage failed');
        setProgress(100);

        onUpload(file, r2Key);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(0), 1000);
      }
    },
    [projectId, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Uploading…</p>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-2xl">↑</p>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {isDragActive ? 'Drop here' : 'Drag & drop or click to browse'}
          </p>
        </div>
      )}

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
}
