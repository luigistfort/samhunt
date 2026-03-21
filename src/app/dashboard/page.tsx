// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard, Search, Star, TrendingUp, Clock,
  ExternalLink, Trash2, Play, ArrowRight
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { CardSkeleton } from '@/components/ui/skeleton';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import type { FavoriteOpportunity, SavedSearch } from '@/types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState<FavoriteOpportunity[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    Promise.all([
      fetch('/api/favorites').then(r => r.json()),
      fetch('/api/saved-searches').then(r => r.json()),
    ]).then(([favData, searchData]) => {
      setFavorites(favData.favorites ?? []);
      setSavedSearches(searchData.searches ?? []);
    }).finally(() => setLoading(false));
  }, [status]);

  const deleteSavedSearch = async (id: string) => {
    await fetch('/api/saved-searches', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  };

  const removeFavorite = async (noticeId: string) => {
    await fetch('/api/favorites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noticeId }),
    });
    setFavorites(prev => prev.filter(f => f.noticeId !== noticeId));
  };

  if (status === 'loading') return null;

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="page-title mb-1">
              Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-zinc-500">Your contracting dashboard</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Saved Opportunities', value: favorites.length, icon: Star, color: 'text-orange-400' },
              { label: 'Saved Searches', value: savedSearches.length, icon: Search, color: 'text-blue-400' },
              {
                label: 'Closing This Week',
                value: favorites.filter(f => {
                  if (!f.responseDeadLine) return false;
                  const diff = Math.floor((new Date(f.responseDeadLine).getTime() - Date.now()) / 86400000);
                  return diff >= 0 && diff <= 7;
                }).length,
                icon: Clock,
                color: 'text-red-400',
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="label">{label}</span>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Saved Searches */}
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <h2 className="section-title flex items-center gap-2">
                  <Search className="w-4 h-4 text-zinc-500" />
                  Saved Searches
                </h2>
                <Link href="/search" className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1">
                  New search <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-zinc-800">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-zinc-800 rounded shimmer" />)}
                  </div>
                ) : savedSearches.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-sm">
                    <Search className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                    No saved searches yet
                  </div>
                ) : (
                  savedSearches.map(search => (
                    <div key={search.id} className="flex items-center gap-3 px-5 py-3 group hover:bg-zinc-800/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{search.name}</p>
                        <p className="text-xs text-zinc-500">
                          {search.lastRunAt ? formatRelativeDate(search.lastRunAt) : 'Never run'}
                          {search.resultCount !== undefined && ` · ${search.resultCount} results`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={{
                            pathname: '/search',
                            query: { saved: search.id },
                          }}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
                          title="Run search"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => deleteSavedSearch(search.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Saved Opportunities */}
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <h2 className="section-title flex items-center gap-2">
                  <Star className="w-4 h-4 text-zinc-500" />
                  Saved Opportunities
                </h2>
                <Link href="/favorites" className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-zinc-800">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-800 rounded shimmer" />)}
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-sm">
                    <Star className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                    No saved opportunities yet
                  </div>
                ) : (
                  favorites.slice(0, 6).map(fav => {
                    const daysLeft = fav.responseDeadLine
                      ? Math.floor((new Date(fav.responseDeadLine).getTime() - Date.now()) / 86400000)
                      : null;
                    const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

                    return (
                      <div key={fav.id} className="flex items-start gap-3 px-5 py-3 group hover:bg-zinc-800/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/opportunities/${fav.noticeId}`}
                            className="text-sm font-medium text-zinc-200 hover:text-orange-300 transition-colors line-clamp-1"
                          >
                            {fav.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-zinc-500">{fav.agencyName}</span>
                            {daysLeft !== null && daysLeft >= 0 && (
                              <span className={`text-xs ${isUrgent ? 'text-red-400' : 'text-zinc-500'}`}>
                                · {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                              </span>
                            )}
                            {daysLeft !== null && daysLeft < 0 && (
                              <span className="text-xs text-zinc-600">· Closed</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={fav.samUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-200 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => removeFavorite(fav.noticeId)}
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
