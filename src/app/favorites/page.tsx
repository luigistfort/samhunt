// src/app/favorites/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Star, ExternalLink, Trash2, Clock, Tag, Building2, MapPin, SearchX } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { FavoriteOpportunity } from '@/types';

export default function FavoritesPage() {
  const { status } = useSession();
  const [favorites, setFavorites] = useState<FavoriteOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/favorites')
      .then(r => r.json())
      .then(d => setFavorites(d.favorites ?? []))
      .finally(() => setLoading(false));
  }, [status]);

  const removeFavorite = async (noticeId: string) => {
    setFavorites(prev => prev.filter(f => f.noticeId !== noticeId));
    await fetch('/api/favorites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noticeId }),
    });
  };

  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return null;
    return Math.floor((new Date(deadline).getTime() - Date.now()) / 86400000);
  };

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="page-title flex items-center gap-3 mb-1">
              <Star className="w-7 h-7 text-orange-400" />
              Saved Opportunities
            </h1>
            <p className="text-zinc-500 text-sm">
              {loading ? 'Loading…' : `${favorites.length} saved`}
            </p>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="card p-5 h-32 shimmer" />
              ))}
            </div>
          )}

          {!loading && favorites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <SearchX className="w-6 h-6 text-zinc-500" />
              </div>
              <h3 className="font-display font-bold text-zinc-100 mb-2">No saved opportunities</h3>
              <p className="text-sm text-zinc-500 mb-6 max-w-xs">
                When you star opportunities in search results, they'll appear here.
              </p>
              <Link href="/search" className="btn-primary">
                Search Opportunities
              </Link>
            </div>
          )}

          <div className="space-y-3">
            {favorites.map(fav => {
              const daysLeft = getDaysLeft(fav.responseDeadLine);
              const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
              const isClosed = daysLeft !== null && daysLeft < 0;

              return (
                <div key={fav.id} className={cn('group card-hover p-5', isClosed && 'opacity-60')}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/opportunities/${fav.noticeId}`}
                        className="font-display font-semibold text-sm text-zinc-100 hover:text-orange-300 transition-colors line-clamp-2"
                      >
                        {fav.title}
                      </Link>
                      {fav.solicitationNumber && (
                        <p className="text-xs font-mono text-zinc-500 mt-0.5">{fav.solicitationNumber}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {fav.fitScore !== undefined && (
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full border',
                          fav.fitScore >= 80 ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                          fav.fitScore >= 60 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                          'text-zinc-400 bg-zinc-800 border-zinc-700'
                        )}>
                          {fav.fitScore}% fit
                        </span>
                      )}
                      {daysLeft !== null && daysLeft >= 0 && (
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full border',
                          isUrgent
                            ? 'text-red-400 bg-red-500/10 border-red-500/20'
                            : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                        )}>
                          {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                        </span>
                      )}
                      {isClosed && (
                        <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                          Closed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500 mb-3">
                    {fav.agencyName && (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-zinc-600" />
                        {fav.agencyName}
                      </span>
                    )}
                    {fav.naicsCode && (
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-zinc-600" />
                        {fav.naicsCode}
                      </span>
                    )}
                    {fav.responseDeadLine && (
                      <span className={cn('flex items-center gap-1.5', isUrgent && 'text-red-400')}>
                        <Clock className="w-3 h-3" />
                        Due {formatDate(fav.responseDeadLine)}
                      </span>
                    )}
                    {fav.placeOfPerformance && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-zinc-600" />
                        {fav.placeOfPerformance}
                      </span>
                    )}
                  </div>

                  {fav.aiSummary && (
                    <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-800/50 rounded-lg p-3 mb-3 border border-zinc-800">
                      {fav.aiSummary.slice(0, 200)}{fav.aiSummary.length > 200 ? '…' : ''}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                    <Link
                      href={`/opportunities/${fav.noticeId}`}
                      className="text-xs text-zinc-500 hover:text-orange-400 transition-colors"
                    >
                      View details →
                    </Link>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={fav.samUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        SAM.gov
                      </a>
                      <button
                        onClick={() => removeFavorite(fav.noticeId)}
                        className="flex items-center gap-1 text-xs text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
