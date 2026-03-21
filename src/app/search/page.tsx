// src/app/search/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { SmartSearchBar } from '@/components/search/smart-search-bar';
import { FilterPanel } from '@/components/search/filter-panel';
import { SearchResults } from '@/components/search/search-results';
import { SlidersHorizontal, X } from 'lucide-react';
import type { EnrichedOpportunity, SearchParams } from '@/types';

const DEFAULT_PARAMS: SearchParams = {
  page: 1,
  limit: 25,
  sortBy: 'postedDate',
};

export default function SearchPage() {
  const [params, setParams] = useState<SearchParams>(DEFAULT_PARAMS);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    opportunities: EnrichedOpportunity[];
    total: number;
    hasMore: boolean;
  }>({ opportunities: [], total: 0, hasMore: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [searched, setSearched] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const runSearch = useCallback(async (p: SearchParams) => {
    setLoading(true);
    setError(undefined);

    try {
      const res = await fetch('/api/opportunities/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Search failed');
      }

      const data = await res.json();
      setResults({
        opportunities: data.opportunities ?? [],
        total: data.total ?? 0,
        hasMore: data.hasMore ?? false,
      });
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((newParams: SearchParams, newQuery: string) => {
    const merged = { ...newParams, page: 1, limit: params.limit, sortBy: params.sortBy };
    setParams(merged);
    setQuery(newQuery);
    runSearch(merged);
  }, [params.limit, params.sortBy, runSearch]);

  const handleParamsChange = useCallback((newParams: SearchParams) => {
    setParams(newParams);
    runSearch(newParams);
  }, [runSearch]);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setQuery('');
    setSearched(false);
    setResults({ opportunities: [], total: 0, hasMore: false });
  }, []);

  // Run initial search on mount
  useEffect(() => {
    runSearch(DEFAULT_PARAMS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilterCount = [
    params.keyword,
    params.noticeType?.length,
    params.naicsCodes?.length,
    params.setAsideTypes?.length,
    params.state,
    params.zip,
    params.postedFrom || params.postedTo,
    params.deadlineFrom || params.deadlineTo,
    params.newThisWeek,
    params.closingSoon,
    params.smallBusinessSetAside,
    params.solicitationNumber,
  ].filter(Boolean).length;

  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top search bar */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm shrink-0">
          <div className="max-w-4xl">
            <SmartSearchBar
              onSearch={handleSearch}
              loading={loading}
              initialQuery={query}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Filter sidebar */}
          {filtersOpen && (
            <div className="w-64 shrink-0 border-r border-zinc-800 overflow-y-auto p-4">
              <FilterPanel
                params={params}
                onChange={handleParamsChange}
                onReset={handleReset}
              />
            </div>
          )}

          {/* Results area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-4xl">
              {/* Filter toggle bar */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {filtersOpen ? 'Hide Filters' : 'Show Filters'}
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs font-medium">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {activeFilterCount > 0 && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear all filters
                  </button>
                )}
              </div>

              <SearchResults
                opportunities={results.opportunities}
                total={results.total}
                page={params.page ?? 1}
                limit={params.limit ?? 25}
                hasMore={results.hasMore}
                loading={loading}
                error={error}
                params={params}
                onParamsChange={handleParamsChange}
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
