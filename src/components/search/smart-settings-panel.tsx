// src/components/search/smart-settings-panel.tsx
'use client';

import { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, Plus, X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScoringConfig, KeywordLibrary } from '@/lib/scoring/engine';
import { SECURITY_LIBRARY, PRESET_PROFILES } from '@/lib/scoring/engine';

interface SmartSettingsPanelProps {
  config: ScoringConfig;
  onChange: (config: ScoringConfig) => void;
}

const PRESETS = [
  { key: 'security-installer', label: 'Security Installer' },
  { key: 'low-voltage-contractor', label: 'Low Voltage Contractor' },
  { key: 'access-control-specialist', label: 'Access Control Specialist' },
  { key: 'surveillance-vendor', label: 'Surveillance / CCTV Vendor' },
];

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) {
      onChange([...values, v]);
      setInput('');
    }
  };

  return (
    <div>
      <label className="label mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300">
            {v}
            <button onClick={() => onChange(values.filter(x => x !== v))} className="text-zinc-500 hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1 text-xs"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button onClick={add} className="btn-secondary shrink-0 py-1.5 px-2.5">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function SmartSettingsPanel({ config, onChange }: SmartSettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'scoring' | 'keywords' | 'filters'>('scoring');

  const update = (delta: Partial<ScoringConfig>) => onChange({ ...config, ...delta });

  const updateLibrary = (delta: Partial<KeywordLibrary>) =>
    update({ keywordLibrary: { ...config.keywordLibrary, ...delta } });

  const applyPreset = (key: string) => {
    const preset = PRESET_PROFILES[key];
    if (preset) onChange({ ...config, ...preset });
  };

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <Settings className="w-4 h-4 text-orange-400" />
          Smart Match Settings
          {config.matchMode !== 'broad' && (
            <span className="badge badge-orange">{config.matchMode}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>

      {open && (
        <div className="border-t border-zinc-800 fade-in">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            {(['scoring', 'keywords', 'filters'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2.5 text-xs font-medium capitalize transition-colors',
                  activeTab === tab
                    ? 'text-orange-300 border-b-2 border-orange-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {/* Scoring tab */}
            {activeTab === 'scoring' && (
              <>
                {/* Preset profiles */}
                <div>
                  <label className="label mb-2 block">Quick Presets</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map(p => (
                      <button
                        key={p.key}
                        onClick={() => applyPreset(p.key)}
                        className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 text-left transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Match mode */}
                <div>
                  <label className="label mb-2 block">Match Mode</label>
                  <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
                    {(['broad', 'smart', 'exact'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => update({ matchMode: mode })}
                        className={cn(
                          'flex-1 py-2 text-xs font-medium capitalize transition-colors border-r border-zinc-700 last:border-0',
                          config.matchMode === mode
                            ? 'bg-orange-500/15 text-orange-300'
                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1.5">
                    {config.matchMode === 'broad' && 'Shows related terms and synonyms'}
                    {config.matchMode === 'smart' && 'Weighted scoring with synonyms'}
                    {config.matchMode === 'exact' && 'Only direct phrase matches'}
                  </p>
                </div>

                {/* Min score */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label">Minimum Score</label>
                    <span className="text-sm font-bold text-orange-400">{config.minScore}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={config.minScore}
                    onChange={e => update({ minScore: parseInt(e.target.value) })}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-600 mt-0.5">
                    <span>Show all (0)</span>
                    <span>Strict (40)</span>
                  </div>
                </div>

                {/* NAICS */}
                <TagInput
                  label="Preferred NAICS Codes"
                  values={config.preferredNaics}
                  onChange={v => update({ preferredNaics: v })}
                  placeholder="e.g. 561621"
                />

                {/* PSC */}
                <TagInput
                  label="Preferred PSC Codes"
                  values={config.preferredPsc}
                  onChange={v => update({ preferredPsc: v })}
                  placeholder="e.g. 58"
                />

                {/* States */}
                <TagInput
                  label="Preferred States"
                  values={config.preferredStates}
                  onChange={v => update({ preferredStates: v })}
                  placeholder="e.g. IN, OH"
                />
              </>
            )}

            {/* Keywords tab */}
            {activeTab === 'keywords' && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-300">{config.keywordLibrary.name}</p>
                  <button
                    onClick={() => updateLibrary(SECURITY_LIBRARY)}
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Load Security Library
                  </button>
                </div>

                <TagInput
                  label="Exact Phrases (+15/+12)"
                  values={config.keywordLibrary.exact}
                  onChange={v => updateLibrary({ exact: v })}
                  placeholder="access control installation"
                />
                <TagInput
                  label="Near-Exact (+10/+8)"
                  values={config.keywordLibrary.near}
                  onChange={v => updateLibrary({ near: v })}
                  placeholder="cctv install"
                />
                <TagInput
                  label="Synonyms (+7/+5)"
                  values={config.keywordLibrary.synonyms}
                  onChange={v => updateLibrary({ synonyms: v })}
                  placeholder="surveillance"
                />
                <TagInput
                  label="Related Terms (+4/+2)"
                  values={config.keywordLibrary.related}
                  onChange={v => updateLibrary({ related: v })}
                  placeholder="physical security"
                />
              </>
            )}

            {/* Filters tab */}
            {activeTab === 'filters' && (
              <TagInput
                label="Negative Keywords (-8)"
                values={config.keywordLibrary.negative}
                onChange={v => updateLibrary({ negative: v })}
                placeholder="janitorial, landscaping..."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
