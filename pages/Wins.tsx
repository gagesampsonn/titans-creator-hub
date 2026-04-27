import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import { CreatorWinsWall, type CreatorWinItem } from '../components/CreatorWinsWall';

type WinsPayload = {
  items: CreatorWinItem[];
};

const Wins = () => {
  const [items, setItems] = useState<CreatorWinItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/data/creator-wins.json', { cache: 'force-cache' });
        if (!res.ok) throw new Error(`Could not load wins (${res.status})`);
        const data = (await res.json()) as WinsPayload;
        if (!cancelled) {
          const list = Array.isArray(data.items) ? data.items.filter((x) => x && typeof x.src === 'string') : [];
          setItems(list);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load wins');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-titan-bg">
      <div className="border-b border-titan-border bg-titan-bg/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 sm:py-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium tracking-wide mb-4">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
            Creator wins
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-3">
            The wall of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">real results</span>
          </h1>
          <p className="text-text-secondary text-sm sm:text-base max-w-2xl leading-relaxed">
            Screenshots from Titans creators—GMV, commissions, and milestones. Drop in fifty or more images if you want a long
            scroll; they load lazily so the page stays quick for ad traffic.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 sm:py-14">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        )}

        {items && items.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4 rounded-2xl border border-dashed border-titan-border bg-titan-surface/50">
            <div className="w-14 h-14 rounded-2xl bg-titan-elevated border border-titan-border flex items-center justify-center mb-4">
              <ImageIcon className="text-text-muted" size={28} />
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Add your win screenshots</h2>
            <p className="text-sm text-text-muted max-w-md leading-relaxed mb-2">
              Put image URLs in <code className="text-accent-teal text-xs">public/data/creator-wins.json</code> as{' '}
              <code className="text-accent-teal text-xs">items: [&#123; &quot;src&quot;: &quot;https://…&quot; &#125;]</code>.
              Host files on your CDN or Supabase storage for fast loads.
            </p>
            <p className="text-xs text-text-muted max-w-md">
              Tip: WebP or AVIF, width around 800px, and a CDN cache header keep ad traffic smooth.
            </p>
          </div>
        )}

        {items && items.length > 0 && <CreatorWinsWall items={items} />}

        {items === null && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-titan-surface border border-titan-border aspect-[9/16]" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wins;
