// src/components/opportunities/opportunity-card.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2, Calendar, Clock, MapPin, Tag, ExternalLink,
  Star, StarOff, ChevronRight, AlertCircle, CheckCircle, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { URGENCY_CONFIG } from '@/lib/constants';
import type { EnrichedOpportunity } from '@/types';

interface OpportunityCardProps {
  opportunity: EnrichedOpportunity;
  isFavorited?: boolean;
  onToggleFavorite?: (opp: EnrichedOpportunity) => void;
  fitScore?: number;
}

const SET_ASIDE_COLORS: Record<string, string> = {
  'SBA': 'badge-blue',
  'SBP': 'badge-blue',
  '8A': 'badge-orange',
  '8AN': 'badge-orange',
  'HZC': 'badge-green',
  'HZS': 'badge-green',
  'SDVOSBC': 'badge-yellow',
  'SDVOSBS': 'badge-yellow',
  'WOSB': 'badge-zinc',
  'WOSBSS': 'badge-zinc',
  'EDWOSB': 'badge-zinc',
  'VSB': 'badge-zinc',
};

const NOTICE_TYPE_COLORS: Record<string, string> = {
  'Solicitation': 'badge-blue',
  'Presolicitation': 'badge-zinc',
  'Combined Synopsis/Solicitation': 'badge-blue',
  'Sources Sought': 'badge-yellow',
  'Award Notice': 'badge-green',
  'Special Notice': 'badge-orange',
  'Justification': 'badge-zinc',
};

function UrgencyBadge({ level, days }: { level: EnrichedOpportunity['urgencyLevel']; days?: number }) {
  if (!level) return null;
  const config = URGENCY_CONFIG[level];

  if (level === 'closed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
        <AlertCircle className="w-3 h-3" />
        Closed
      </span>
    );
  }

  const icons = {
    critical: <Timer className="w-3 h-3" />,
    urgent: <Clock className="w-3 h-3" />,
    normal: <Clock className="w-3 h-3" />,
    low: <CheckCircle className="w-3 h-3" />,
  };

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
      config.color, config.bg, config.border
    )}>
      {icons[level as keyof typeof icons]}
      {days !== undefined && days >= 0
        ? days === 0 ? 'Due today' : `${days}d left`
        : config.label}
    </span>
  );
}

function FitScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-green-400 bg-green-500/10 border-green-500/20' :
    score >= 60 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
    'text-zinc-400 bg-zinc-800 border-zinc-700';

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border', color)}>
      <Star className="w-3 h-3" />
      {score}% fit
    </span>
  );
}

export function OpportunityCard({
  opportunity: opp,
  isFavorited,
  onToggleFavorite,
  fitScore,
}: OpportunityCardProps) {
  const [favLoading, setFavLoading] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onToggleFavorite || favLoading) return;
    setFavLoading(true);
    try {
      await onToggleFavorite(opp);
    } finally {
      setFavLoading(false);
    }
  };

  const setAsideBadgeClass = opp.typeOfSetAside
    ? SET_ASIDE_COLORS[opp.typeOfSetAside] ?? 'badge-zinc'
    : null;

  const noticeTypeBadgeClass = NOTICE_TYPE_COLORS[opp.type] ?? 'badge-zinc';

  const isActive = opp.active === 'Yes' && (opp.daysUntilDeadline === undefined || opp.daysUntilDeadline >= 0);

  return (
    <div className={cn(
      'group relative card-hover p-5 transition-all duration-200',
      !isActive && 'opacity-60'
    )}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/opportunities/${opp.noticeId}`}
            className="block group/title"
          >
            <h3 className="font-display font-semibold text-sm text-zinc-100 group-hover/title:text-orange-300 transition-colors line-clamp-2 leading-snug">
              {opp.title}
            </h3>
          </Link>
          {opp.solicitationNumber && (
            <p className="mt-1 text-xs font-mono text-zinc-500">{opp.solicitationNumber}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {fitScore !== undefined && <FitScoreBadge score={fitScore} />}
          <UrgencyBadge level={opp.urgencyLevel} days={opp.daysUntilDeadline} />
          {onToggleFavorite && (
            <button
              onClick={handleFavorite}
              disabled={favLoading}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                isFavorited
                  ? 'text-orange-400 bg-orange-500/10 hover:bg-orange-500/20'
                  : 'text-zinc-600 hover:text-orange-400 hover:bg-zinc-800 opacity-0 group-hover:opacity-100'
              )}
              title={isFavorited ? 'Remove from favorites' : 'Save opportunity'}
            >
              {isFavorited
                ? <Star className="w-4 h-4 fill-current" />
                : <Star className="w-4 h-4" />
              }
            </button>
          )}
        </div>
      </div>

      {/* Badge row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={cn('badge', noticeTypeBadgeClass)}>{opp.type}</span>
        {opp.setAsideLabel && setAsideBadgeClass && (
          <span className={cn('badge', setAsideBadgeClass)}>{opp.setAsideLabel}</span>
        )}
        {opp.naicsCode && (
          <span className="badge badge-zinc">
            <Tag className="w-2.5 h-2.5" />
            {opp.naicsCode}
          </span>
        )}
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {opp.agencyName && (
          <div className="flex items-center gap-1.5 text-zinc-400 col-span-2">
            <Building2 className="w-3 h-3 text-zinc-600 shrink-0" />
            <span className="truncate">{opp.fullParentPathName ?? opp.agencyName}</span>
          </div>
        )}
        {opp.postedDate && (
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Calendar className="w-3 h-3 text-zinc-600 shrink-0" />
            <span>Posted {formatDate(opp.postedDate, 'MMM d')}</span>
          </div>
        )}
        {opp.responseDeadLine && (
          <div className={cn(
            'flex items-center gap-1.5',
            opp.urgencyLevel === 'critical' ? 'text-red-400 font-medium' :
            opp.urgencyLevel === 'urgent' ? 'text-orange-400' : 'text-zinc-500'
          )}>
            <Clock className="w-3 h-3 shrink-0" />
            <span>Due {formatDate(opp.responseDeadLine, 'MMM d, yyyy')}</span>
          </div>
        )}
        {opp.placeOfPerformance && (
          <div className="flex items-center gap-1.5 text-zinc-500 col-span-2">
            <MapPin className="w-3 h-3 text-zinc-600 shrink-0" />
            <span className="truncate">{opp.placeOfPerformance as unknown as string}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
        <Link
          href={`/opportunities/${opp.noticeId}`}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-orange-400 transition-colors"
        >
          View details
          <ChevronRight className="w-3 h-3" />
        </Link>
        <a
          href={opp.samUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          SAM.gov
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
