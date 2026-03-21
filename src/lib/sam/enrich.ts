// src/lib/sam/enrich.ts
// Adds computed/display fields to raw SAM.gov opportunities

import { differenceInDays, parseISO, isValid } from 'date-fns';
import type { EnrichedOpportunity, SamOpportunity } from '@/types';
import { SET_ASIDE_LABELS } from './normalize';

export function enrichOpportunity(opp: SamOpportunity): EnrichedOpportunity {
  const now = new Date();

  // Days until deadline
  let daysUntilDeadline: number | undefined;
  let urgencyLevel: EnrichedOpportunity['urgencyLevel'] = 'normal';

  if (opp.responseDeadLine) {
    const deadline = parseISO(opp.responseDeadLine);
    if (isValid(deadline)) {
      daysUntilDeadline = differenceInDays(deadline, now);
      if (daysUntilDeadline < 0) urgencyLevel = 'closed';
      else if (daysUntilDeadline <= 3) urgencyLevel = 'critical';
      else if (daysUntilDeadline <= 7) urgencyLevel = 'urgent';
      else if (daysUntilDeadline <= 30) urgencyLevel = 'normal';
      else urgencyLevel = 'low';
    }
  }

  // Agency name - SAM returns path like "DEPT OF DEFENSE.ARMY.CORPS OF ENGINEERS"
  const agencyName = opp.fullParentPathName
    ? opp.fullParentPathName.split('.')[0].trim()
    : undefined;

  // Set-aside human label
  const setAsideLabel = opp.typeOfSetAside
    ? SET_ASIDE_LABELS[opp.typeOfSetAside] ?? opp.typeOfSetAsideDescription ?? opp.typeOfSetAside
    : undefined;

  // Build SAM.gov UI URL
  const samUrl =
    opp.uiLink ??
    `https://sam.gov/opp/${opp.noticeId}/view`;

  // Place of performance string
  const pop = opp.placeOfPerformance;
  const popStr = pop
    ? [pop.city?.name, pop.state?.name ?? pop.state?.code, pop.country?.name]
        .filter(Boolean)
        .join(', ')
    : undefined;

  return {
    ...opp,
    daysUntilDeadline,
    urgencyLevel,
    agencyName,
    setAsideLabel,
    samUrl,
    placeOfPerformance: popStr as any,
  };
}

// Compute a profile fit score (0-100) for a given opportunity
export function computeFitScore(
  opp: EnrichedOpportunity,
  profile: {
    naicsCodes: string[];
    certifications: string[];
    preferredStates: string[];
    targetAgencies: string[];
    minContractSize?: number;
    maxContractSize?: number;
  }
): { score: number; reasons: string[] } {
  let score = 50; // Base score
  const reasons: string[] = [];

  // NAICS match (+30 pts)
  if (opp.naicsCode && profile.naicsCodes.length) {
    const isMatch = profile.naicsCodes.some(
      n => opp.naicsCode?.startsWith(n.slice(0, 4))
    );
    if (isMatch) {
      score += 30;
      reasons.push(`NAICS ${opp.naicsCode} matches your profile`);
    } else {
      score -= 10;
    }
  }

  // Set-aside match (+20 pts)
  if (opp.typeOfSetAside && profile.certifications.length) {
    const certMap: Record<string, string[]> = {
      '8A': ['8a'],
      '8AN': ['8a'],
      'HZC': ['hubzone'],
      'HZS': ['hubzone'],
      'WOSB': ['wosb'],
      'WOSBSS': ['wosb'],
      'EDWOSB': ['wosb', 'edwosb'],
      'SDVOSBC': ['sdvosb'],
      'SDVOSBS': ['sdvosb'],
      'SBA': ['small_business'],
      'VSB': ['veteran'],
    };
    const requiredCerts = certMap[opp.typeOfSetAside] ?? [];
    const hasMatch = requiredCerts.some(c => profile.certifications.includes(c));
    if (hasMatch) {
      score += 20;
      reasons.push(`Set-aside matches your ${opp.setAsideLabel} certification`);
    } else if (requiredCerts.length > 0) {
      score -= 20;
      reasons.push(`Set-aside requires certification you may not have`);
    }
  }

  // State preference match (+10 pts)
  if (profile.preferredStates.length) {
    const stateCode = typeof opp.placeOfPerformance === 'object'
      ? (opp.placeOfPerformance as any)?.state?.code
      : undefined;
    if (stateCode && profile.preferredStates.includes(stateCode)) {
      score += 10;
      reasons.push(`Located in ${stateCode}, one of your preferred states`);
    }
  }

  // Agency match (+10 pts)
  if (opp.agencyName && profile.targetAgencies.length) {
    const isMatch = profile.targetAgencies.some(a =>
      opp.agencyName?.toLowerCase().includes(a.toLowerCase())
    );
    if (isMatch) {
      score += 10;
      reasons.push(`${opp.agencyName} is one of your target agencies`);
    }
  }

  // Active opportunity check
  if (opp.active !== 'Yes' || (opp.daysUntilDeadline !== undefined && opp.daysUntilDeadline < 0)) {
    score -= 30;
    reasons.push('Opportunity has closed');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons,
  };
}
