// src/components/search/filter-panel.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { US_STATES, NOTICE_TYPES, SET_ASIDE_OPTIONS } from '@/lib/constants';
import type { SearchParams } from '@/types';

interface FilterPanelProps {
  params: SearchParams;
  onChange: (params: SearchParams) => void;
  onReset: () => void;
  className?: string;
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && <div className="pb-3 space-y-2">{children}</div>}
    </div>
  );
}

export function FilterPanel({ params, onChange, onReset, className }: FilterPanelProps) {
  const hasFilters = !!(
    params.keyword || params.noticeType?.length || params.naicsCodes?.length ||
    params.setAsideTypes?.length || params.state || params.zip ||
    params.postedFrom || params.postedTo || params.deadlineFrom || params.deadlineTo ||
    params.newThisWeek || params.closingSoon || params.smallBusinessSetAside
  );

  const update = (delta: Partial<SearchParams>) =>
    onChange({ ...params, ...delta, page: 1 });

  const toggleArrayItem = (
    key: keyof SearchParams,
    value: string,
    current: string[] | undefined
  ) => {
    const arr = current ?? [];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    update({ [key]: next.length ? next : undefined } as Partial<SearchParams>);
  };

  return (
    <div className={cn('bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </div>
        {hasFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="p-4 space-y-0 overflow-y-auto max-h-[calc(100vh-200px)]">

        {/* Notice Type */}
        <FilterSection title="Notice Type">
          <div className="space-y-1.5">
            {NOTICE_TYPES.map((type) => {
              const checked = params.noticeType?.includes(type) ?? false;
              return (
                <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleArrayItem('noticeType', type, params.noticeType)}
                    className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500/30 focus:ring-2"
                  />
                  <span className={cn(
                    'text-xs transition-colors',
                    checked ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'
                  )}>
                    {type}
                  </span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        {/* Set-Aside */}
        <FilterSection title="Set-Aside Type">
          <div className="space-y-1.5">
            {SET_ASIDE_OPTIONS.map(({ value, label }) => {
              const checked = params.setAsideTypes?.includes(value) ?? false;
              return (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleArrayItem('setAsideTypes', value, params.setAsideTypes)}
                    className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500/30 focus:ring-2"
                  />
                  <span className={cn(
                    'text-xs transition-colors',
                    checked ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'
                  )}>
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        {/* Posted Date */}
        <FilterSection title="Posted Date" defaultOpen={false}>
          <div className="space-y-2">
            <div>
              <label className="label mb-1 block">From</label>
              <input
                type="date"
                value={params.postedFrom ?? ''}
                onChange={(e) => update({ postedFrom: e.target.value || undefined })}
                className="input text-xs"
              />
            </div>
            <div>
              <label className="label mb-1 block">To</label>
              <input
                type="date"
                value={params.postedTo ?? ''}
                onChange={(e) => update({ postedTo: e.target.value || undefined })}
                className="input text-xs"
              />
            </div>
            <button
              onClick={() => update({ newThisWeek: !params.newThisWeek, postedFrom: undefined, postedTo: undefined })}
              className={cn(
                'w-full py-1.5 rounded-lg text-xs font-medium transition-colors border',
                params.newThisWeek
                  ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              )}
            >
              🆕 New This Week
            </button>
          </div>
        </FilterSection>

        {/* Response Deadline */}
        <FilterSection title="Response Deadline" defaultOpen={false}>
          <div className="space-y-2">
            <div>
              <label className="label mb-1 block">Due After</label>
              <input
                type="date"
                value={params.deadlineFrom ?? ''}
                onChange={(e) => update({ deadlineFrom: e.target.value || undefined })}
                className="input text-xs"
              />
            </div>
            <div>
              <label className="label mb-1 block">Due Before</label>
              <input
                type="date"
                value={params.deadlineTo ?? ''}
                onChange={(e) => update({ deadlineTo: e.target.value || undefined })}
                className="input text-xs"
              />
            </div>
            <button
              onClick={() => update({ closingSoon: !params.closingSoon, deadlineFrom: undefined, deadlineTo: undefined })}
              className={cn(
                'w-full py-1.5 rounded-lg text-xs font-medium transition-colors border',
                params.closingSoon
                  ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              )}
            >
              ⏰ Closing in 7 Days
            </button>
          </div>
        </FilterSection>

        {/* NAICS Code */}
        <FilterSection title="NAICS Code" defaultOpen={false}>
          <input
            type="text"
            placeholder="e.g. 541511, 541512"
            value={params.naicsCodes?.join(', ') ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              const codes = raw
                .split(/[,\s]+/)
                .map((s) => s.trim())
                .filter((s) => /^\d{2,6}$/.test(s));
              update({ naicsCodes: codes.length ? codes : undefined });
            }}
            className="input text-xs"
          />
          <p className="text-xs text-zinc-600 mt-1">Separate multiple codes with commas</p>
        </FilterSection>

        {/* Place of Performance */}
        <FilterSection title="Place of Performance" defaultOpen={false}>
          <div className="space-y-2">
            <div>
              <label className="label mb-1 block">State</label>
              <select
                value={params.state ?? ''}
                onChange={(e) => update({ state: e.target.value || undefined })}
                className="input text-xs"
              >
                <option value="">All States</option>
                {Object.entries(US_STATES).map(([code, name]) => (
                  <option key={code} value={code}>{name} ({code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1 block">ZIP Code</label>
              <input
                type="text"
                placeholder="e.g. 46032"
                value={params.zip ?? ''}
                onChange={(e) => update({ zip: e.target.value || undefined })}
                maxLength={5}
                className="input text-xs"
              />
            </div>
          </div>
        </FilterSection>

        {/* Solicitation Number */}
        <FilterSection title="Solicitation Number" defaultOpen={false}>
          <input
            type="text"
            placeholder="e.g. W912HV24R0001"
            value={params.solicitationNumber ?? ''}
            onChange={(e) => update({ solicitationNumber: e.target.value || undefined })}
            className="input text-xs font-mono"
          />
        </FilterSection>

      </div>
    </div>
  );
}
