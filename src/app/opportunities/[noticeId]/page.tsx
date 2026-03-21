// src/app/opportunities/[noticeId]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, Building2, Calendar, Clock,
  MapPin, Tag, FileText, Phone, Mail
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AiAssistant } from '@/components/ai/ai-assistant';
import { getSamClient } from '@/lib/sam/client';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { URGENCY_CONFIG } from '@/lib/constants';
import { SET_ASIDE_LABELS } from '@/lib/sam/normalize';

interface PageProps {
  params: { noticeId: string };
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const client = getSamClient();
    const opp = await client.getOpportunity(params.noticeId);
    return {
      title: opp?.title ?? 'Opportunity',
      description: `${opp?.type} · ${opp?.agencyName} · Due ${formatDate(opp?.responseDeadLine)}`,
    };
  } catch {
    return { title: 'Opportunity' };
  }
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  let opp;
  try {
    const client = getSamClient();
    opp = await client.getOpportunity(params.noticeId);
  } catch {
    opp = null;
  }

  if (!opp) notFound();

  const urgencyConfig = opp.urgencyLevel ? URGENCY_CONFIG[opp.urgencyLevel] : null;
  const setAsideLabel = opp.typeOfSetAside
    ? SET_ASIDE_LABELS[opp.typeOfSetAside] ?? opp.typeOfSetAsideDescription
    : null;

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Back nav */}
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header card */}
              <div className="card p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="font-display font-bold text-xl text-zinc-100 leading-snug">
                      {opp.title}
                    </h1>
                    {opp.solicitationNumber && (
                      <p className="mt-1 text-sm font-mono text-zinc-500">{opp.solicitationNumber}</p>
                    )}
                  </div>
                  <a
                    href={opp.samUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View on SAM.gov
                  </a>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="badge badge-blue">{opp.type}</span>
                  {setAsideLabel && (
                    <span className="badge badge-orange">{setAsideLabel}</span>
                  )}
                  {opp.naicsCode && (
                    <span className="badge badge-zinc">
                      <Tag className="w-3 h-3" />
                      NAICS {opp.naicsCode}
                    </span>
                  )}
                  {urgencyConfig && opp.urgencyLevel !== 'closed' && (
                    <span className={cn(
                      'badge',
                      urgencyConfig.color, urgencyConfig.bg,
                    )}>
                      <Clock className="w-3 h-3" />
                      {opp.daysUntilDeadline === 0
                        ? 'Due today'
                        : opp.daysUntilDeadline !== undefined && opp.daysUntilDeadline > 0
                          ? `${opp.daysUntilDeadline} days left`
                          : 'Closed'}
                    </span>
                  )}
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {opp.fullParentPathName && (
                    <div className="col-span-2">
                      <p className="label mb-1">Agency</p>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Building2 className="w-4 h-4 text-zinc-500 shrink-0" />
                        {opp.fullParentPathName}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="label mb-1">Posted</p>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      {formatDate(opp.postedDate)}
                    </div>
                  </div>
                  {opp.responseDeadLine && (
                    <div>
                      <p className="label mb-1">Response Deadline</p>
                      <div className={cn(
                        'flex items-center gap-2',
                        opp.urgencyLevel === 'critical' ? 'text-red-300 font-medium' :
                        opp.urgencyLevel === 'urgent' ? 'text-orange-300' : 'text-zinc-300'
                      )}>
                        <Clock className="w-4 h-4 text-zinc-500" />
                        {formatDate(opp.responseDeadLine, 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  )}
                  {opp.archiveDate && (
                    <div>
                      <p className="label mb-1">Archive Date</p>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        {formatDate(opp.archiveDate)}
                      </div>
                    </div>
                  )}
                  {opp.placeOfPerformance && (
                    <div className="col-span-2">
                      <p className="label mb-1">Place of Performance</p>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                        {opp.placeOfPerformance as unknown as string}
                      </div>
                    </div>
                  )}
                  {opp.classificationCode && (
                    <div>
                      <p className="label mb-1">PSC Code</p>
                      <span className="text-zinc-300 font-mono">{opp.classificationCode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {opp.description && (
                <div className="card p-6">
                  <h2 className="flex items-center gap-2 section-title mb-4">
                    <FileText className="w-4 h-4 text-zinc-500" />
                    Description
                  </h2>
                  <div
                    className="prose prose-sm prose-invert max-w-none text-zinc-300 text-sm leading-relaxed
                      [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1"
                    dangerouslySetInnerHTML={{
                      __html: opp.description
                        .replace(/\n/g, '<br/>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    }}
                  />
                </div>
              )}

              {/* Point of Contact */}
              {opp.pointOfContact && opp.pointOfContact.length > 0 && (
                <div className="card p-6">
                  <h2 className="section-title mb-4">Points of Contact</h2>
                  <div className="space-y-4">
                    {opp.pointOfContact.map((poc, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                          {poc.fullName?.[0] ?? '?'}
                        </div>
                        <div className="text-sm">
                          {poc.fullName && <p className="font-medium text-zinc-200">{poc.fullName}</p>}
                          {poc.title && <p className="text-zinc-400">{poc.title}</p>}
                          {poc.email && (
                            <a href={`mailto:${poc.email}`} className="flex items-center gap-1 text-orange-400 hover:text-orange-300 mt-1 transition-colors">
                              <Mail className="w-3 h-3" />
                              {poc.email}
                            </a>
                          )}
                          {poc.phone && (
                            <p className="flex items-center gap-1 text-zinc-400 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {poc.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional links */}
              {opp.additionalInfoLink && (
                <div className="card p-6">
                  <h2 className="section-title mb-3">Additional Information</h2>
                  <a
                    href={opp.additionalInfoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {opp.additionalInfoLink}
                  </a>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <AiAssistant opportunity={opp} />

              {/* Quick facts */}
              <div className="card p-4">
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Quick Facts</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Notice ID</span>
                    <span className="font-mono text-xs text-zinc-300">{opp.noticeId.slice(0, 12)}…</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Active</span>
                    <span className={opp.active === 'Yes' ? 'text-green-400' : 'text-red-400'}>
                      {opp.active === 'Yes' ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  {opp.baseType && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Base Type</span>
                      <span className="text-zinc-300">{opp.baseType}</span>
                    </div>
                  )}
                  {opp.archiveType && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Archive Type</span>
                      <span className="text-zinc-300">{opp.archiveType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
