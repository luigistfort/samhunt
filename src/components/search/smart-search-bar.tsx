// src/components/search/smart-search-bar.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { Search, Sparkles, Loader2, X, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type { SearchParams } from '@/types';

interface SmartSearchBarProps {
  onSearch: (params: SearchParams, query: string) => void;
  loading?: boolean;
  initialQuery?: string;
}

const EXAMPLE_QUERIES = [
  'IT support services in Indiana for small business',
  'cybersecurity consulting under $500k SDVOSB',
  'construction contracts closing this week',
  'logistics and transportation HUBZone set-aside',
  'staffing services for federal agencies in Virginia',
  'sources sought for cloud migration 8(a)',
];

const QUICK_FILTERS = [
  { label: '🆕 New This Week', params: { newThisWeek: true } },
  { label: '⏰ Closing Soon', params: { closingSoon: true } },
  { label: '🏢 Small Biz Set-Aside', params: { smallBusinessSetAside: true } },
  { label: '🔍 Sources Sought', params: { noticeType: ['Sources Sought'] } },
  { label: '📋 Solicitations', params: { noticeType: ['Solicitation'] } },
];

export function SmartSearchBar({ onSearch, loading, initialQuery = '' }: SmartSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [parsing, setParsing] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { recentSearches, addRecentSearch } = useAppStore();

  const handleSmartSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setParsing(true);
    setShowSuggestions(false);
    setExplanation(null);

    try {
      const res = await fetch('/api/search/smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      const params: SearchParams = { ...data.params, page: 1 };
      setExplanation(data.explanation ?? null);
      addRecentSearch(q, params);
      onSearch(params, q);
    } catch {
      // Fallback: use as keyword
      const params: SearchParams = { keyword: q, page: 1 };
      onSearch(params, q);
    } finally {
      setParsing(false);
    }
  }, [onSearch, addRecentSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSmartSearch(query);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleQuickFilter = (params: Partial<SearchParams>) => {
    const merged: SearchParams = { ...params, page: 1 };
    setQuery('');
    setExplanation(null);
    onSearch(merged, '');
  };

  const handleRecentSearch = (item: { query: string; params: SearchParams }) => {
    setQuery(item.query);
    setShowSuggestions(false);
    onSearch({ ...item.params, page: 1 }, item.query);
  };

  const handleExample = (example: string) => {
    setQuery(example);
    setShowSuggestions(false);
    handleSmartSearch(example);
  };

  const isActive = parsing || loading;
  const showDropdown = showSuggestions && !isActive;

  return (
    <div className="w-full space-y-3">
      {/* Main input */}
      <div className="relative">
        <div
          className={cn(
            'flex items-center gap-3 bg-zinc-900 border rounded-xl px-4 py-3 transition-all duration-200',
            showDropdown
              ? 'border-orange-500/60 ring-2 ring-orange-500/20 rounded-b-none'
              : 'border-zinc-700 focus-within:border-orange-500/60 focus-within:ring-2 focus-within:ring-orange-500/20'
          )}
        >
          {isActive ? (
            <Loader2 className="w-5 h-5 text-orange-400 shrink-0 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-zinc-500 shrink-0" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length > 0) setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder='Try "IT support in Indiana under $500k for small business"'
            className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 text-sm focus:outline-none"
          />

          <div className="flex items-center gap-2 shrink-0">
            {query && (
              <button
                onClick={() => { setQuery(''); setExplanation(null); }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => query.trim() && handleSmartSearch(query)}
              disabled={isActive || !query.trim()}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                query.trim() && !isActive
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              )}
            >
              <Sparkles className="w-3 h-3" />
              {parsing ? 'Parsing…' : 'Search'}
            </button>
          </div>
        </div>

        {/* Dropdown suggestions */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 bg-zinc-900 border border-zinc-700 border-t-zinc-800 rounded-b-xl shadow-2xl overflow-hidden">
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="p-3 border-b border-zinc-800">
                <p className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Recent
                </p>
                <div className="space-y-1">
                  {recentSearches.slice(0, 4).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecentSearch(item)}
                      className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <Clock className="w-3 h-3 text-zinc-600 shrink-0" />
                      <span className="text-sm text-zinc-300 truncate">{item.query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Example queries */}
            <div className="p-3">
              <p className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Try these
              </p>
              <div className="space-y-1">
                {EXAMPLE_QUERIES.slice(0, 4).map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => handleExample(ex)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-orange-400/60 shrink-0" />
                    <span className="text-sm text-zinc-400 truncate">{ex}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI explanation pill */}
      {explanation && !isActive && (
        <div className="flex items-start gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg fade-in">
          <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-300">{explanation}</p>
        </div>
      )}

      {/* Quick filter chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => handleQuickFilter(f.params)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-full text-xs text-zinc-300 hover:text-zinc-100 transition-all whitespace-nowrap"
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}
