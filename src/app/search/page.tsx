// src/app/search/page.tsx
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { SmartSearchBar } from '@/components/search/smart-search-bar';
import { FilterPanel } from '@/components/search/filter-panel';
import { SmartSettingsPanel } from '@/components/search/smart-settings-panel';
import { ScoredOpportunityCard } from '@/components/opportunities/scored-opportunity-card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { SlidersHorizontal, X, Zap, ChevronLeft, ChevronRight, SearchX, AlertTriangle, Loader2 } from 'lucide-react';
import { cn, pluralize } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { filterAndScore, SECURITY_LIBRARY } from '@/lib/scoring/engine';
import type { EnrichedOpportunity, SearchParams } from '@/types';
import type { ScoringConfig } from '@/lib/scoring/engine';

const DEFAULT_PARAMS: SearchParams = { page: 1, limit: 25, sortBy: 'postedDate' };

const DEFAULT_SCORING: ScoringConfig = {
  minScore: 0,
  preferredNaics: [],
  preferredPsc: [],
  preferredStates: [],
  preferredSetAsides: [],
  negativeKeywords: [],
  keywordLibrary: SECURITY_LIBRARY,
  matchMode: 'smart',
};

type SortOption = 'score' | 'postedDate' | 'responseDeadLine';

export default function SearchPage() {
  const [params, setParams] = useState<SearchParams>(DEFAULT_PARAMS);
  const [query, setQuery] = useState('');
  const [rawResults, setRawResults] = useState<EnrichedOpportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>(DEFAULT_SCORING);
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [showDebug, setShowDebug] = useState(false);
  const { favoritedNoticeIds, addFavorite, removeFavorite } = useAppStore();

  const scoredResults = useMemo(() => {
    if (scoringConfig.minScore === 0 && scoringConfig.keywordLibrary.exact.length === 0) {
      return rawResults.map(opp => ({ ...opp, scoreResult: undefined }));
    }
    return filterAndScore(rawResults, scoringConfig);
  }, [rawResults, scoringConfig]);

  const sortedResults = useMemo(() => {
    const items = [...scoredResults];
    if (sortBy === 'score') return items.sort((a, b) => ((b as any).scoreResult?.score ?? 0) - ((a as any).scoreResult?.score ?? 0));
    if (sortBy === 'responseDeadLine') return items.sort((a, b) => {
      const da = a.responseDeadLine ? new Date(a.responseDeadLine).getTime() : Infinity;
      const db = b.responseDeadLine ? new Date(b.responseDeadLine).getTime() : Infinity;
      return da - db;
    });
    return items.sort((a, b) => {
      const da = a.postedDate ? new Date(a.postedDate).getTime() : 0;
      const db = b.postedDate ? new Date(b.postedDate).getTime() : 0;
      return db - da;
    });
  }, [scoredResults, sortBy]);

  const runSearch = useCallback(async (p: SearchParams) => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch('/api/opportunities/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Search failed');
      const data = await res.json();
      setRawResults(data.opportunities ?? []);
      setTotal(data.total ?? 0);
      setHasMore(data.hasMore ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((newParams: SearchParams, newQuery: string) => {
    const merged = { ...newParams, page: 1, limit: params.limit };
    setParams(merged); setQuery(newQuery); runSearch(merged);
  }, [params.limit, runSearch]);

  const handleParamsChange = useCallback((newParams: SearchParams) => {
    setParams(newParams); runSearch(newParams);
  }, [runSearch]);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS); setQuery(''); setRawResults([]); setTotal(0);
  }, []);

  const handleToggleFavorite = useCallback(async (opp: EnrichedOpportunity) => {
    const isFav = favoritedNoticeIds.has(opp.noticeId);
    if (isFav) {
      removeFavorite(opp.noticeId);
      await fetch('/api/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noticeId: opp.noticeId }) });
    } else {
      addFavorite(opp.noticeId);
      await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noticeId: opp.noticeId, title: opp.title, agencyName: opp.agencyName, noticeType: opp.type, postedDate: opp.postedDate, responseDeadLine: opp.responseDeadLine, naicsCode: opp.naicsCode, setAside: opp.typeOfSetAside, samUrl: opp.samUrl, solicitationNumber: opp.solicitationNumber }) });
    }
  }, [favoritedNoticeIds, addFavorite, removeFavorite]);

  useEffect(() => { runSearch(DEFAULT_PARAMS); }, []); // eslint-disable-line

  const activeFilterCount = [params.keyword, params.noticeType?.length, params.naicsCodes?.length, params.setAsideTypes?.length, params.state, params.zip, params.postedFrom || params.postedTo, params.newThisWeek, params.closingSoon, params.smallBusinessSetAside].filter(Boolean).length;
  const page = params.page ?? 1;
  const totalPages = Math.ceil(total / (params.limit ?? 25));
  const setPage = (p: number) => { const next = { ...params, page: p }; setParams(next); runSearch(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm shrink-0">
          <div className="max-w-4xl">
            <SmartSearchBar onSearch={handleSearch} loading={loading} initialQuery={query} />
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {filtersOpen && (
            <div className="w-72 shrink-0 border-r border-zinc-800 overflow-y-auto p-4 space-y-4">
              <FilterPanel params={params} onChange={handleParamsChange} onReset={handleReset} />
              <SmartSettingsPanel config={scoringConfig} onChange={setScoringConfig} />
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-4xl">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => setFiltersOpen(!filtersOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 transition-colors">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {filtersOpen ? 'Hide' : 'Filters'}
                    {activeFilterCount > 0 && <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs">{activeFilterCount}</span>}
                  </button>
                  {activeFilterCount > 0 && <button onClick={handleReset} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"><X className="w-3 h-3" /> Clear</button>}
                  <button onClick={() => setShowDebug(!showDebug)} className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors', showDebug ? 'text-orange-400 bg-orange-500/10' : 'text-zinc-600 hover:text-zinc-400')}>
                    <Zap className="w-3 h-3" /> Debug
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <><span className="text-zinc-200 font-medium">{sortedResults.length}</span> {pluralize(sortedResults.length, 'result')}</>}
                  </span>
                  <div className="flex border border-zinc-700 rounded-lg overflow-hidden">
                    {([{ value: 'score', label: 'Best Match' }, { value: 'postedDate', label: 'Newest' }, { value: 'responseDeadLine', label: 'Deadline' }] as const).map(opt => (
                      <button key={opt.value} onClick={() => setSortBy(opt.value)} className={cn('px-2.5 py-1.5 text-xs transition-colors border-r border-zinc-700 last:border-0', sortBy === opt.value ? 'bg-orange-500/15 text-orange-300' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200')}>{opt.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {loading && rawResults.length === 0 && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}</div>}
              {error && <div className="flex flex-col items-center py-24 text-center"><AlertTriangle className="w-8 h-8 text-red-400 mb-3" /><p className="text-zinc-300">{error}</p></div>}
              {!loading && !error && sortedResults.length === 0 && rawResults.length > 0 && (
                <div className="flex flex-col items-center py-16 text-center">
                  <Zap className="w-8 h-8 text-zinc-600 mb-3" />
                  <p className="text-zinc-300 font-medium mb-1">No results above score threshold</p>
                  <p className="text-sm text-zinc-500 mb-4">{rawResults.length} results found but none scored above {scoringConfig.minScore}.</p>
                  <button onClick={() => setScoringConfig(c => ({ ...c, minScore: 0 }))} className="btn-secondary text-xs">Show all {rawResults.length} results</button>
                </div>
              )}
              {!loading && !error && rawResults.length === 0 && <div className="flex flex-col items-center py-24 text-center"><SearchX className="w-8 h-8 text-zinc-600 mb-3" /><p className="text-zinc-300">No results found</p></div>}

              <div className={cn('space-y-3', loading && 'opacity-60 pointer-events-none')}>
                {sortedResults.map((opp, i) => (
                  <div key={opp.noticeId} className="fade-in" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                    <ScoredOpportunityCard opportunity={opp} scoreResult={(opp as any).scoreResult} isFavorited={favoritedNoticeIds.has(opp.noticeId)} onToggleFavorite={handleToggleFavorite} showDebug={showDebug} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button onClick={() => setPage(page - 1)} disabled={page <= 1 || loading} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-100 disabled:opacity-40 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /> Prev</button>
                  <span className="text-xs text-zinc-500">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(page + 1)} disabled={!hasMore || loading} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-100 disabled:opacity-40 transition-colors">Next <ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
