// src/components/search/search-results.tsx
'use client';

import { useState, useCallback } from 'react';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Loader2,
  SearchX, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn, pluralize } from '@/lib/utils';
import { OpportunityCard } from '@/components/opportunities/opportunity-card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import type { EnrichedOpportunity, SearchParams } from '@/types';

interface SearchResultsProps {
  opportunities: EnrichedOpportunity[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  loading: boolean;
  error?: string;
  params: SearchParams;
  onParamsChange: (p: SearchParams) => void;
}

type SortKey = 'postedDate' | 'responseDeadLine' | 'relevance';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'postedDate', label: 'Newest First' },
  { value: 'responseDeadLine', label: 'Deadline Soon' },
  { value: 'relevance', label: 'Relevance' },
];

export function SearchResults({
  opportunities,
  total,
  page,
  limit,
  hasMore,
  loading,
  error,
  params,
  onParamsChange,
}: SearchResultsProps) {
  const { favoritedNoticeIds, addFavorite, removeFavorite } = useAppStore();
  const [favoritingId, setFavoritingId] = useState<string | null>(null);
  const totalPages = Math.ceil(total / limit);

  const handleToggleFavorite = useCallback(async (opp: EnrichedOpportunity) => {
    const isFav = favoritedNoticeIds.has(opp.noticeId);
    setFavoritingId(opp.noticeId);

    try {
      if (isFav) {
        removeFavorite(opp.noticeId);
        await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noticeId: opp.noticeId }),
        });
      } else {
        addFavorite(opp.noticeId);
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noticeId: opp.noticeId,
            title: opp.title,
            agencyName: opp.agencyName,
            noticeType: opp.type,
            postedDate: opp.postedDate,
            responseDeadLine: opp.responseDeadLine,
            naicsCode: opp.naicsCode,
            setAside: opp.typeOfSetAside,
            placeOfPerformance: typeof opp.placeOfPerformance === 'string'
              ? opp.placeOfPerformance : undefined,
            samUrl: opp.samUrl,
            solicitationNumber: opp.solicitationNumber,
          }),
        });
      }
    } catch {
      // Revert optimistic update
      if (isFav) addFavorite(opp.noticeId);
      else removeFavorite(opp.noticeId);
    } finally {
      setFavoritingId(null);
    }
  }, [favoritedNoticeIds, addFavorite, removeFavorite]);

  const setSort = (sortBy: SortKey) => {
    onParamsChange({ ...params, sortBy, page: 1 });
  };

  const setPage = (p: number) => {
    onParamsChange({ ...params, page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="font-display font-bold text-zinc-100 mb-2">Search Failed</h3>
        <p className="text-sm text-zinc-500 max-w-sm">{error}</p>
      </div>
    );
  }

  // ── Loading skeleton
  if (loading && opportunities.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2">
          <div className="h-4 w-32 bg-zinc-800 rounded shimmer" />
          <div className="h-8 w-40 bg-zinc-800 rounded shimmer" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // ── Empty state
  if (!loading && total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <SearchX className="w-6 h-6 text-zinc-500" />
        </div>
        <h3 className="font-display font-bold text-zinc-100 mb-2">No Results Found</h3>
        <p className="text-sm text-zinc-500 max-w-sm">
          Try broadening your search, removing some filters, or using different keywords.
        </p>
      </div>
    );
  }

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-400">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
              Loading…
            </span>
          ) : (
            <>
              <span className="text-zinc-200 font-medium">{total.toLocaleString()}</span>
              {' '}{pluralize(total, 'opportunity', 'opportunities')}
              {total > 0 && (
                <span className="text-zinc-600 ml-1">
                  (showing {startItem}–{endItem})
                </span>
              )}
            </>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
          <div className="flex">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={cn(
                  'px-3 py-1.5 text-xs transition-colors first:rounded-l-lg last:rounded-r-lg border-y border-r first:border-l',
                  params.sortBy === opt.value
                    ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className={cn('space-y-3 transition-opacity', loading && 'opacity-60 pointer-events-none')}>
        {opportunities.map((opp, i) => (
          <div
            key={opp.noticeId}
            className="fade-in"
            style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
          >
            <OpportunityCard
              opportunity={opp}
              isFavorited={favoritedNoticeIds.has(opp.noticeId)}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1 || loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
                if (i === 6) pageNum = totalPages;
                if (i === 5) return <span key="e1" className="text-zinc-600 px-1">…</span>;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
                if (i === 0) pageNum = 1;
                if (i === 1) return <span key="e1" className="text-zinc-600 px-1">…</span>;
              } else {
                if (i === 0) pageNum = 1;
                else if (i === 1) return <span key="e1" className="text-zinc-600 px-1">…</span>;
                else if (i === 5) return <span key="e2" className="text-zinc-600 px-1">…</span>;
                else if (i === 6) pageNum = totalPages;
                else pageNum = page + i - 3;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'w-8 h-8 text-xs font-medium rounded-lg transition-colors',
                    page === pageNum
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasMore || loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
