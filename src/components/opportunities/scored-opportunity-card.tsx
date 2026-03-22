// src/components/opportunities/scored-opportunity-card.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2, Calendar, Clock, MapPin, Tag, ExternalLink,
  Star, ChevronRight, ChevronDown, ChevronUp, Zap, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { URGENCY_CONFIG } from '@/lib/constants';
import type { EnrichedOpportunity } from '@/types';
import type { ScoreResult } from '@/lib/scoring/engine';

interface ScoredOpportunityCardProps {
  opportunity: EnrichedOpportunity;
  scoreResult?: ScoreResult;
  isFavorited?: boolean;
  onToggleFavorite?: (opp: EnrichedOpportunity) => void;
  showDebug?: boolean;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 30 ? 'bg-green-500/15 text-green-400 border-green-500/30' :
    score >= 20 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
    score >= 12 ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
    'bg-zinc-800 text-zinc-500 border-zinc-700';

  const label =
    score >= 30 ? 'Strong Match' :
    score >= 20 ? 'Good Match' :
    score >= 12 ? 'Possible Match' : 'Low Match';

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', color)}>
      <Zap className="w-3 h-3" />
      {score} · {label}
    </span>
  );
}

export function ScoredOpportunityCard({
  opportunity: opp,
  scoreResult,
  isFavorited,
  onToggleFavorite,
  showDebug = false,
}: ScoredOpportunityCardProps) {
  const [showWhy, setShowWhy] = useState(false);
  const urgencyConfig = opp.urgencyLevel ? URGENCY_CONFIG[opp.urgencyLevel] : null;

  return (
    <div className="group card-hover p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link href={`/opportunities/${opp.noticeId}`} className="group/title">
            <h3 className="font-display font-semibold text-sm text-zinc-100 group-hover/title:text-orange-300 transition-colors line-clamp-2 leading-snug">
              {opp.title}
            </h3>
          </Link>
          {opp.solicitationNumber && (
            <p className="mt-0.5 text-xs font-mono text-zinc-500">{opp.solicitationNumber}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {scoreResult && <ScoreBadge score={scoreResult.score} />}
          {urgencyConfig && opp.urgencyLevel !== 'closed' && opp.daysUntilDeadline !== undefined && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full border font-medium',
              urgencyConfig.color, urgencyConfig.bg, urgencyConfig.border
            )}>
              {opp.daysUntilDeadline === 0 ? 'Due today' : `${opp.daysUntilDeadline}d left`}
            </span>
          )}
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.preventDefault(); onToggleFavorite(opp); }}
              className={cn(
                'p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100',
                isFavorited ? 'text-orange-400 bg-orange-500/10 opacity-100' : 'text-zinc-600 hover:text-orange-400 hover:bg-zinc-800'
              )}
            >
              <Star className={cn('w-4 h-4', isFavorited && 'fill-current')} />
            </button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="badge badge-blue">{opp.type}</span>
        {opp.setAsideLabel && <span className="badge badge-orange">{opp.setAsideLabel}</span>}
        {opp.naicsCode && (
          <span className="badge badge-zinc">
            <Tag className="w-2.5 h-2.5" />
            {opp.naicsCode}
          </span>
        )}
        {opp.classificationCode && (
          <span className="badge badge-zinc">PSC: {opp.classificationCode}</span>
        )}
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {opp.agencyName && (
          <div className="flex items-center gap-1.5 text-zinc-400 col-span-2">
            <Building2 className="w-3 h-3 text-zinc-600 shrink-0" />
            <span className="truncate">{opp.fullParentPathName ?? opp.agencyName}</span>
          </div>
        )}
        {opp.postedDate && (
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Calendar className="w-3 h-3 text-zinc-600 shrink-0" />
            Posted {formatDate(opp.postedDate, 'MMM d')}
          </div>
        )}
        {opp.responseDeadLine && (
          <div className={cn(
            'flex items-center gap-1.5',
            opp.urgencyLevel === 'critical' ? 'text-red-400 font-medium' :
            opp.urgencyLevel === 'urgent' ? 'text-orange-400' : 'text-zinc-500'
          )}>
            <Clock className="w-3 h-3 shrink-0" />
            Due {formatDate(opp.responseDeadLine, 'MMM d, yyyy')}
          </div>
        )}
        {opp.placeOfPerformance && (
          <div className="flex items-center gap-1.5 text-zinc-500 col-span-2">
            <MapPin className="w-3 h-3 text-zinc-600 shrink-0" />
            <span className="truncate">{opp.placeOfPerformance as unknown as string}</span>
          </div>
        )}
      </div>

      {/* Why it matched */}
      {scoreResult && scoreResult.matchedKeywords.length > 0 && (
        <div>
          <button
            onClick={() => setShowWhy(!showWhy)}
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            <Zap className="w-3 h-3" />
            Why this matched ({scoreResult.matchedKeywords.length} signals)
            {showWhy ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showWhy && (
            <div className="mt-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 space-y-1.5 fade-in">
              {scoreResult.reasons.slice(0, showDebug ? 999 : 5).map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-xs">
                  <div className="flex items-start gap-1.5">
                    <span className="text-zinc-600 mt-0.5">•</span>
                    <span className="text-zinc-300">
                      <span className="text-zinc-400">{r.rule}</span>
                      {r.keyword && <span className="ml-1 font-mono text-orange-300/80">"{r.keyword}"</span>}
                      <span className="ml-1 text-zinc-500">in {r.field}</span>
                    </span>
                  </div>
                  <span className={cn(
                    'font-mono font-bold shrink-0',
                    r.points > 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {r.points > 0 ? '+' : ''}{r.points}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-1 border-t border-zinc-700 text-xs font-bold">
                <span className="text-zinc-400">Total Score</span>
                <span className="text-orange-400">{scoreResult.score}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        <Link href={`/opportunities/${opp.noticeId}`} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-orange-400 transition-colors">
          View details <ChevronRight className="w-3 h-3" />
        </Link>
        <a
          href={opp.samUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          SAM.gov <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
