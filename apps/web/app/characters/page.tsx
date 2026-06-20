'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatPanel } from '@/components/layout/ChatPanel';
import { createClient } from '@/lib/supabase/client';
import type { Character } from '@/lib/supabase/types';

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState('');
  const [rules, setRules] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('mol_characters')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setCharacters(data ?? []));
  }, []);

  async function createCharacter(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const continuityRules = rules
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean);

    const { data } = await supabase
      .from('mol_characters')
      .insert({
        user_id: user!.id,
        name,
        appearance,
        continuity_rules: continuityRules,
      })
      .select()
      .single();

    if (data) {
      setCharacters(prev => [data, ...prev]);
      setCreating(false);
      setName('');
      setAppearance('');
      setRules('');
    }
    setSaving(false);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Character Lab</h1>
              <p className="text-muted-foreground mt-1">
                Create characters that stay consistent across all your videos.
              </p>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              New Character
            </button>
          </div>

          {creating && (
            <form onSubmit={createCharacter} className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="font-semibold">Create Character</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="e.g. Luna"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Appearance</label>
                <textarea
                  value={appearance}
                  onChange={e => setAppearance(e.target.value)}
                  rows={3}
                  placeholder="Tall, dark hair, blue eyes, silver jewelry, cyberpunk aesthetic"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Continuity Rules</label>
                <textarea
                  value={rules}
                  onChange={e => setRules(e.target.value)}
                  rows={3}
                  placeholder="One rule per line:&#10;Always wear silver jewelry&#10;Neon-lit environments only&#10;Confident body language"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Create Character'}
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {characters.length === 0 && !creating ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-3">✦</p>
              <p className="text-muted-foreground text-sm">
                No characters yet. Create one to maintain consistent AI personas across your videos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {characters.map(c => (
                <div key={c.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{c.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {c.appearance && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.appearance}</p>
                  )}
                  {Array.isArray(c.continuity_rules) && (c.continuity_rules as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(c.continuity_rules as string[]).slice(0, 3).map((rule, i) => (
                        <span key={i} className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                          {rule}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ChatPanel />
    </div>
  );
}
