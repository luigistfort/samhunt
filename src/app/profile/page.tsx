// src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Save, Loader2, Plus, X, Check } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { toast } from '@/components/ui/toaster';
import { US_STATES, CERTIFICATION_OPTIONS, POPULAR_NAICS, FEDERAL_AGENCIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { BusinessProfile } from '@/types';

const DEFAULT_PROFILE: Partial<BusinessProfile> = {
  naicsCodes: [],
  certifications: [],
  preferredStates: [],
  targetAgencies: [],
  allowRemote: true,
  preferredNoticeTypes: [],
};

export default function ProfilePage() {
  const { status } = useSession();
  const [profile, setProfile] = useState<Partial<BusinessProfile>>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [naicsInput, setNaicsInput] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.profile) setProfile(data.profile);
      })
      .finally(() => setLoading(false));
  }, [status]);

  const update = (delta: Partial<BusinessProfile>) =>
    setProfile(prev => ({ ...prev, ...delta }));

  const toggleArrayValue = <K extends keyof BusinessProfile>(
    key: K,
    value: string
  ) => {
    const arr = (profile[key] as string[]) ?? [];
    const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
    update({ [key]: next } as any);
  };

  const addNaics = () => {
    const code = naicsInput.trim();
    if (/^\d{2,6}$/.test(code) && !profile.naicsCodes?.includes(code)) {
      update({ naicsCodes: [...(profile.naicsCodes ?? []), code] });
      setNaicsInput('');
    }
  };

  const removeNaics = (code: string) => {
    update({ naicsCodes: (profile.naicsCodes ?? []).filter(c => c !== code) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error();
      toast.success('Profile saved successfully');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) return null;

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="page-title mb-1">Business Profile</h1>
              <p className="text-zinc-500 text-sm">
                Your profile helps personalize search results and enables AI fit analysis.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>

          <div className="space-y-5">
            {/* Basic Info */}
            <div className="card p-6">
              <h2 className="section-title mb-4">Company Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">Company Name</label>
                  <input
                    className="input"
                    placeholder="Acme Solutions LLC"
                    value={profile.companyName ?? ''}
                    onChange={e => update({ companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">UEI (SAM.gov)</label>
                  <input
                    className="input font-mono"
                    placeholder="12-character UEI"
                    value={profile.uei ?? ''}
                    onChange={e => update({ uei: e.target.value })}
                    maxLength={12}
                  />
                </div>
                <div className="col-span-2">
                  <label className="label mb-1.5 block">Company Description</label>
                  <textarea
                    className="input min-h-[80px] resize-none"
                    placeholder="Brief description of your company's capabilities and experience…"
                    value={profile.description ?? ''}
                    onChange={e => update({ description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* NAICS Codes */}
            <div className="card p-6">
              <h2 className="section-title mb-1">NAICS Codes</h2>
              <p className="text-xs text-zinc-500 mb-4">Add the NAICS codes that match your business activities</p>

              {/* Quick add from popular */}
              <div className="flex flex-wrap gap-2 mb-4">
                {POPULAR_NAICS.map(({ code, label }) => {
                  const selected = profile.naicsCodes?.includes(code);
                  return (
                    <button
                      key={code}
                      onClick={() => toggleArrayValue('naicsCodes', code)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        selected
                          ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                      )}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      {code} · {label}
                    </button>
                  );
                })}
              </div>

              {/* Manual entry */}
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Enter NAICS code (e.g. 541511)"
                  value={naicsInput}
                  onChange={e => setNaicsInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNaics()}
                  maxLength={6}
                />
                <button onClick={addNaics} className="btn-secondary shrink-0">
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {profile.naicsCodes && profile.naicsCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.naicsCodes.map(code => (
                    <span key={code} className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-orange-300 font-mono">
                      {code}
                      <button onClick={() => removeNaics(code)} className="hover:text-orange-100 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications */}
            <div className="card p-6">
              <h2 className="section-title mb-1">Certifications</h2>
              <p className="text-xs text-zinc-500 mb-4">Select all that apply to your business</p>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATION_OPTIONS.map(({ value, label }) => {
                  const selected = profile.certifications?.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => toggleArrayValue('certifications', value)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors',
                        selected
                          ? 'bg-orange-500/15 border-orange-500/30 text-orange-300 font-medium'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      )}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Geography */}
            <div className="card p-6">
              <h2 className="section-title mb-4">Geographic Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label mb-1.5 block">Home ZIP Code</label>
                  <input
                    className="input"
                    placeholder="46032"
                    value={profile.homeZip ?? ''}
                    onChange={e => update({ homeZip: e.target.value })}
                    maxLength={5}
                  />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.allowRemote ?? true}
                      onChange={e => update({ allowRemote: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-zinc-700 rounded-full peer peer-checked:bg-orange-500 peer-focus:ring-2 peer-focus:ring-orange-500/30 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                  </label>
                  <span className="text-sm text-zinc-300">Open to remote work</span>
                </div>
              </div>

              <div>
                <label className="label mb-2 block">Preferred States</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(US_STATES).map(([code, name]) => {
                    const selected = profile.preferredStates?.includes(code);
                    return (
                      <button
                        key={code}
                        onClick={() => toggleArrayValue('preferredStates', code)}
                        title={name}
                        className={cn(
                          'py-1.5 rounded text-xs font-medium border transition-colors',
                          selected
                            ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        )}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Contract Preferences */}
            <div className="card p-6">
              <h2 className="section-title mb-4">Contract Preferences</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">Min Contract Value ($)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="25000"
                    value={profile.minContractSize ?? ''}
                    onChange={e => update({ minContractSize: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">Max Contract Value ($)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="5000000"
                    value={profile.maxContractSize ?? ''}
                    onChange={e => update({ maxContractSize: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>
            </div>

            {/* Save button bottom */}
            <div className="flex justify-end pb-4">
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
