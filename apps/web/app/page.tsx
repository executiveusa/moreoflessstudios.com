import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            More-of-Less
            <span className="text-primary"> Studio</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your personal AI studio. Master audio, generate music videos, and create
            cinematic visuals through a single conversational interface.
          </p>
        </div>

        {/* Waveform animation */}
        <div className="flex items-center justify-center gap-1 h-12">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="waveform-bar w-1 bg-primary rounded-full"
              style={{
                height: `${20 + Math.random() * 30}px`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/signup"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-8 text-left">
          {[
            { title: 'Audio Studio', desc: 'Master tracks, separate stems, analyze key & BPM' },
            { title: 'Music Videos', desc: 'AI-generated scenes synced to your music' },
            { title: 'Character Lab', desc: 'Consistent AI characters across all your videos' },
          ].map(({ title, desc }) => (
            <div key={title} className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          English & Español · Open-source AI · No lock-in
        </p>
      </div>
    </main>
  );
}
