// src/components/ai/ai-assistant.tsx
'use client';

import { useState } from 'react';
import {
  Sparkles, Loader2, ChevronDown, ChevronUp, Target,
  AlertTriangle, CheckCircle2, ArrowRight, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIOpportunitySummary, EnrichedOpportunity } from '@/types';
import { useSession } from 'next-auth/react';

interface AiAssistantProps {
  opportunity: EnrichedOpportunity;
  className?: string;
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-green-400' :
    score >= 60 ? 'text-yellow-400' :
    score >= 40 ? 'text-orange-400' : 'text-red-400';

  const label =
    score >= 80 ? 'Strong Fit' :
    score >= 60 ? 'Possible Fit' :
    score >= 40 ? 'Marginal Fit' : 'Poor Fit';

  return (
    <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
      <div className="relative w-16 h-16 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#27272a" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9155"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score} ${100 - score}`}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <span className={cn('absolute inset-0 flex items-center justify-center text-sm font-bold font-display', color)}>
          {score}
        </span>
      </div>
      <div>
        <p className={cn('font-display font-bold text-base', color)}>{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">Based on your business profile</p>
      </div>
    </div>
  );
}

function ResultSection({ result }: { result: AIOpportunitySummary }) {
  return (
    <div className="space-y-4 fade-in">
      {/* Fit Score */}
      {result.fitScore !== undefined && <ScoreRing score={result.fitScore} />}

      {/* Summary */}
      <div>
        <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Summary</h4>
        <p className="text-sm text-zinc-300 leading-relaxed">{result.summary}</p>
      </div>

      {/* Fit Reasons */}
      {result.fitReasons?.length ? (
        <div>
          <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            <Star className="w-3 h-3 inline mr-1" />Fit Analysis
          </h4>
          <ul className="space-y-1.5">
            {result.fitReasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Key Requirements */}
      {result.keyRequirements.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            <Target className="w-3 h-3 inline mr-1" />Key Requirements
          </h4>
          <ul className="space-y-1.5">
            {result.keyRequirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {result.risks.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            <AlertTriangle className="w-3 h-3 inline mr-1" />Risks & Challenges
          </h4>
          <ul className="space-y-1.5">
            {result.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Value estimate */}
      {result.estimatedValue && (
        <div className="px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <span className="text-xs text-zinc-500">Estimated Value: </span>
          <span className="text-sm font-medium text-zinc-200">{result.estimatedValue}</span>
        </div>
      )}

      {/* Next Steps */}
      {result.nextSteps.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            <ArrowRight className="w-3 h-3 inline mr-1" />Recommended Next Steps
          </h4>
          <ol className="space-y-1.5">
            {result.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="w-5 h-5 rounded-full bg-orange-500/15 text-orange-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export function AiAssistant({ opportunity, className }: AiAssistantProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIOpportunitySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'explain' | 'fit' | null>(null);
  const [expanded, setExpanded] = useState(true);

  const hasProfile = !!session?.user;

  const runAnalysis = async (action: 'explain' | 'fit') => {
    if (!process.env.NEXT_PUBLIC_AI_ENABLED && action === 'fit' && !hasProfile) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveAction(action);
    setExpanded(true);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noticeId: opportunity.noticeId,
          action,
          opportunityData: opportunity,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Analysis failed');
      }

      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h3 className="font-display font-bold text-sm text-zinc-100">AI Assistant</h3>
        </div>
        {result && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => runAnalysis('explain')}
          disabled={loading}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-r border-zinc-800',
            activeAction === 'explain' && !loading
              ? 'text-orange-300 bg-orange-500/10'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
          )}
        >
          {loading && activeAction === 'explain' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Explain This
        </button>
        <button
          onClick={() => runAnalysis('fit')}
          disabled={loading || !session}
          title={!session ? 'Sign in and complete your profile to use this feature' : undefined}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
            activeAction === 'fit' && !loading
              ? 'text-orange-300 bg-orange-500/10'
              : !session
                ? 'text-zinc-600 cursor-not-allowed'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
          )}
        >
          {loading && activeAction === 'fit' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Target className="w-3.5 h-3.5" />
          )}
          Good Fit for Me?
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {!result && !loading && !error && (
          <p className="text-sm text-zinc-500 text-center py-4">
            Click an action above to get AI-powered insights about this opportunity.
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
            <p className="text-sm text-zinc-400">
              {activeAction === 'explain' ? 'Reading the opportunity…' : 'Analyzing fit against your profile…'}
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {result && expanded && !loading && (
          <ResultSection result={result} />
        )}

        {result && !expanded && !loading && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Show results ↓
          </button>
        )}
      </div>
    </div>
  );
}
