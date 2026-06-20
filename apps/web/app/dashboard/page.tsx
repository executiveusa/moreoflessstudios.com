import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatPanel } from '@/components/layout/ChatPanel';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: projects }, { data: recentJobs }] = await Promise.all([
    supabase
      .from('mol_projects')
      .select('id, name, total_cost_usd, created_at, status')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('mol_jobs')
      .select('id, type, status, cost_usd, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const totalSpend = (recentJobs ?? []).reduce((s, j) => s + (j.cost_usd ?? 0), 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl space-y-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back to your studio.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Projects', value: projects?.length ?? 0 },
              { label: 'Recent Jobs', value: recentJobs?.length ?? 0 },
              { label: 'Total Spend', value: `$${totalSpend.toFixed(3)}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card border border-border rounded-lg p-4">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Quick Start
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { href: '/audio', icon: '🎵', title: 'Master Audio', desc: 'Upload & polish your track' },
                { href: '/video', icon: '🎬', title: 'Music Video', desc: 'Generate visuals for your music' },
                { href: '/characters', icon: '✦', title: 'New Character', desc: 'Create a consistent AI character' },
              ].map(({ href, icon, title, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <span className="text-2xl">{icon}</span>
                  <p className="font-medium mt-2">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent projects */}
          {(projects?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Recent Projects
              </h2>
              <div className="space-y-2">
                {projects!.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">
                        ${p.total_cost_usd.toFixed(3)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <ChatPanel />
    </div>
  );
}
