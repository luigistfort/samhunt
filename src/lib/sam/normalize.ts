// src/lib/sam/normalize.ts
// Translates our internal SearchParams to SAM.gov API query parameters

import { addDays, format, startOfWeek, subDays } from 'date-fns';
import type { NormalizedSearchParams, SearchParams } from '@/types';

// SAM.gov notice type codes
export const NOTICE_TYPE_CODES: Record<string, string> = {
  'Solicitation': 'o',
  'Presolicitation': 'p',
  'Combined Synopsis/Solicitation': 'k',
  'Sources Sought': 'r',
  'Award Notice': 'a',
  'Justification': 'u',
  'Intent to Bundle Requirements': 'i',
  'Fair Opportunity / Limited Sources Justification': 'j',
  'Special Notice': 's',
  'Sale of Surplus Property': 'g',
};

// SAM.gov set-aside codes
export const SET_ASIDE_CODES: Record<string, string> = {
  'small_business': 'SBA',
  '8a': '8A',
  '8a_competitive': '8AN',
  'hubzone': 'HZC',
  'hubzone_sole_source': 'HZS',
  'sdvosb': 'SDVOSBC',
  'sdvosb_sole_source': 'SDVOSBS',
  'wosb': 'WOSB',
  'wosb_sole_source': 'WOSBSS',
  'edwosb': 'EDWOSB',
  'edwosb_sole_source': 'EDWOSBSS',
  'veteran': 'VSB',
  'very_small': 'VSA',
};

// Set-aside code to human label
export const SET_ASIDE_LABELS: Record<string, string> = {
  'SBA': 'Small Business',
  'SBP': 'Small Business (Partial)',
  '8A': '8(a) Sole Source',
  '8AN': '8(a) Competitive',
  'HZC': 'HUBZone',
  'HZS': 'HUBZone Sole Source',
  'SDVOSBS': 'SDVOSB Sole Source',
  'SDVOSBC': 'SDVOSB Competitive',
  'WOSB': 'WOSB',
  'WOSBSS': 'WOSB Sole Source',
  'EDWOSB': 'EDWOSB',
  'EDWOSBSS': 'EDWOSB Sole Source',
  'LAS': 'Local Area Set-Aside',
  'IEE': 'Indian Economic Enterprise',
  'ISBEE': 'Indian Small Business Economic Enterprise',
  'BICiv': 'Buy Indian',
  'VSA': 'Very Small Business',
  'VSB': 'Veteran-Owned Small Business',
};

function samDateFormat(dateStr: string): string {
  // Convert ISO to MM/DD/YYYY
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export function normalizeSearchParams(params: SearchParams): NormalizedSearchParams {
  const now = new Date();
  const limit = Math.min(params.limit ?? 25, 100);
  const page = Math.max(params.page ?? 1, 1);
  const offset = (page - 1) * limit;

  const normalized: NormalizedSearchParams = {
    limit,
    offset,
  };

  // Keyword
  if (params.keyword?.trim()) {
    normalized.keyword = params.keyword.trim();
  }

  // Solicitation number
  if (params.solicitationNumber?.trim()) {
    normalized.solicitationNumber = params.solicitationNumber.trim();
  }

  // Notice types (SAM accepts comma-separated codes)
  if (params.noticeType?.length) {
    const codes = params.noticeType
      .map(t => NOTICE_TYPE_CODES[t] ?? t)
      .filter(Boolean);
    if (codes.length) normalized.noticeType = codes.join(',');
  }

  // Posted date range
  if (params.newThisWeek) {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    normalized.postedFrom = format(weekStart, 'MM/dd/yyyy');
    normalized.postedTo = format(now, 'MM/dd/yyyy');
  } else {
    if (params.postedFrom) normalized.postedFrom = samDateFormat(params.postedFrom);
    if (params.postedTo) normalized.postedTo = samDateFormat(params.postedTo);
  }

  // Deadline range
  if (params.closingSoon) {
    normalized.responseDeadLineFrom = format(now, 'MM/dd/yyyy');
    normalized.responseDeadLineTo = format(addDays(now, 7), 'MM/dd/yyyy');
  } else {
    if (params.deadlineFrom) normalized.responseDeadLineFrom = samDateFormat(params.deadlineFrom);
    if (params.deadlineTo) normalized.responseDeadLineTo = samDateFormat(params.deadlineTo);
  }

  // NAICS codes
  if (params.naicsCodes?.length) {
    normalized.naicsCode = params.naicsCodes.join(',');
  }

  // Set-aside
  if (params.smallBusinessSetAside) {
    normalized.typeOfSetAside = 'SBA';
  } else if (params.setAsideTypes?.length) {
    const codes = params.setAsideTypes
      .map(t => SET_ASIDE_CODES[t] ?? t)
      .filter(Boolean);
    if (codes.length) normalized.typeOfSetAside = codes.join(',');
  }

  // Geography
  if (params.state) normalized.state = params.state.toUpperCase();
  if (params.zip) normalized.zip = params.zip;

  // Sort
  if (params.sortBy) {
    const sortMap: Record<string, string> = {
      postedDate: '-postedDate',
      responseDeadLine: 'responseDeadLine',
      relevance: '',
    };
    normalized.sortBy = sortMap[params.sortBy] ?? '';
  }

  return normalized;
}
