'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolResult?: { type: string; jobId?: string; message?: string };
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your More-of-Less agent. Tell me what you'd like to create — \"master my audio\", \"make a music video\", or \"separate my stems\".",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      });

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply, toolResult: data.toolResult },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleVoice() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const form = new FormData();
      form.append('audio', blob, 'recording.webm');

      const res = await fetch('/api/agent/transcribe', { method: 'POST', body: form });
      const { text } = await res.json();
      if (text) sendMessage(text);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  return (
    <aside className="w-80 min-h-screen bg-card border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">Studio Agent</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Powered by Claude</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              }`}
            >
              {msg.content}
              {msg.toolResult && (
                <div className="mt-2 text-xs opacity-80 border-t border-white/10 pt-1">
                  ✓ {msg.toolResult.message ?? `Job created: ${msg.toolResult.jobId}`}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-lg px-3 py-2 text-sm text-muted-foreground">
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Ask your agent…"
            className="flex-1 px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={toggleVoice}
            title={recording ? 'Stop recording' : 'Voice input'}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              recording ? 'bg-destructive border-destructive text-white' : 'border-border hover:bg-secondary'
            }`}
          >
            {recording ? '⬛' : '🎤'}
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            →
          </button>
        </div>
      </div>
    </aside>
  );
}
