// src/lib/scoring/engine.ts
// Weighted relevance scoring for SAM.gov opportunities

import type { EnrichedOpportunity } from '@/types';

export interface ScoringConfig {
  minScore: number;
  preferredNaics: string[];
  preferredPsc: string[];
  preferredStates: string[];
  preferredSetAsides: string[];
  negativeKeywords: string[];
  keywordLibrary: KeywordLibrary;
  matchMode: 'broad' | 'smart' | 'exact';
}

export interface KeywordLibrary {
  name: string;
  exact: string[];
  near: string[];
  related: string[];
  synonyms: string[];
  negative: string[];
}

export interface ScoreResult {
  score: number;
  reasons: ScoreReason[];
  matchedKeywords: string[];
  excluded: boolean;
  excludeReason?: string;
}

export interface ScoreReason {
  rule: string;
  field: string;
  keyword?: string;
  points: number;
}

// ─── Default Security / Surveillance Library ────────────────────────────────

export const SECURITY_LIBRARY: KeywordLibrary = {
  name: 'Security / Access Control / Surveillance',
  exact: [
    'access control installation',
    'video surveillance system',
    'security camera installation',
    'alarm system installation',
    'intrusion detection system',
    'low voltage cabling',
    'alarm monitoring services',
    'badge access system',
  ],
  near: [
    'cctv install',
    'badge reader',
    'card access',
    'camera upgrade',
    'surveillance upgrade',
    'network cabling',
    'structured cabling',
    'access control install',
    'surveillance system install',
    'camera system upgrade',
    'low voltage',
  ],
  related: [
    'physical security',
    'perimeter security',
    'electronic security',
    'intrusion detection',
    'monitoring equipment',
    'security infrastructure',
    'facility security',
    'electronic security services',
    'facility security modernization',
    'public safety systems',
  ],
  synonyms: [
    'security system',
    'surveillance',
    'access control',
    'cctv',
    'camera',
    'alarm',
    'monitoring',
    'security upgrade',
  ],
  negative: [
    'janitorial',
    'landscaping',
    'food service',
    'medical staffing',
    'aircraft',
    'fuel',
    'custodial',
    'legal services',
    'grounds maintenance',
    'food supply',
    'fuel delivery',
    'medical',
  ],
};

// ─── Preset Profiles ─────────────────────────────────────────────────────────

export const PRESET_PROFILES: Record<string, Partial<ScoringConfig>> = {
  'security-installer': {
    preferredNaics: ['561621', '238210', '517311', '541512'],
    preferredPsc: ['58', '70', '61'],
    keywordLibrary: SECURITY_LIBRARY,
    minScore: 12,
  },
  'low-voltage-contractor': {
    preferredNaics: ['238210', '238990', '517311', '561621'],
    preferredPsc: ['61', '58', '36'],
    keywordLibrary: SECURITY_LIBRARY,
    minScore: 10,
  },
  'access-control-specialist': {
    preferredNaics: ['561621', '238210', '541512'],
    preferredPsc: ['58', '70'],
    keywordLibrary: SECURITY_LIBRARY,
    minScore: 15,
  },
  'surveillance-vendor': {
    preferredNaics: ['561621', '334290', '541512'],
    preferredPsc: ['58', '70', '51'],
    keywordLibrary: SECURITY_LIBRARY,
    minScore: 12,
  },
};

// ─── Scoring Weights ─────────────────────────────────────────────────────────

const WEIGHTS = {
  exactPhraseTitle: 15,
  exactPhraseDesc: 12,
  nearExactTitle: 10,
  nearExactDesc: 8,
  synonymTitle: 7,
  synonymDesc: 5,
  relatedTitle: 4,
  relatedDesc: 2,
  naicsMatch: 7,
  pscMatch: 5,
  smallBizSetAside: 4,
  preferredSetAside: 6,
  preferredState: 4,
  postedLastWeek: 3,
  negativeKeyword: -8,
};

// ─── Scoring Engine ───────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function containsPhrase(text: string, phrase: string): boolean {
  return normalize(text).includes(normalize(phrase));
}

export function scoreOpportunity(
  opp: EnrichedOpportunity,
  config: ScoringConfig
): ScoreResult {
  const reasons: ScoreReason[] = [];
  const matchedKeywords: string[] = [];
  let score = 0;

  const title = opp.title ?? '';
  const desc = opp.description ?? '';
  const { keywordLibrary: lib, matchMode } = config;

  // ── Negative keyword check ─────────────────────────────────────────────
  const allNegative = [...lib.negative, ...config.negativeKeywords];
  for (const neg of allNegative) {
    if (containsPhrase(title, neg) || containsPhrase(desc, neg)) {
      return {
        score: 0,
        reasons: [{ rule: 'Negative keyword', field: 'title/description', keyword: neg, points: WEIGHTS.negativeKeyword }],
        matchedKeywords: [neg],
        excluded: true,
        excludeReason: `Contains excluded keyword: "${neg}"`,
      };
    }
  }

  // ── Exact phrase matches ───────────────────────────────────────────────
  for (const phrase of lib.exact) {
    if (containsPhrase(title, phrase)) {
      score += WEIGHTS.exactPhraseTitle;
      reasons.push({ rule: 'Exact phrase in title', field: 'title', keyword: phrase, points: WEIGHTS.exactPhraseTitle });
      matchedKeywords.push(phrase);
    } else if (containsPhrase(desc, phrase)) {
      score += WEIGHTS.exactPhraseDesc;
      reasons.push({ rule: 'Exact phrase in description', field: 'description', keyword: phrase, points: WEIGHTS.exactPhraseDesc });
      matchedKeywords.push(phrase);
    }
  }

  // ── Exact-only mode: stop here if no exact matches ────────────────────
  if (matchMode === 'exact' && matchedKeywords.length === 0) {
    return { score: 0, reasons, matchedKeywords, excluded: false };
  }

  // ── Near-exact matches ────────────────────────────────────────────────
  if (matchMode !== 'exact') {
    for (const phrase of lib.near) {
      if (!matchedKeywords.includes(phrase)) {
        if (containsPhrase(title, phrase)) {
          score += WEIGHTS.nearExactTitle;
          reasons.push({ rule: 'Near-exact in title', field: 'title', keyword: phrase, points: WEIGHTS.nearExactTitle });
          matchedKeywords.push(phrase);
        } else if (containsPhrase(desc, phrase)) {
          score += WEIGHTS.nearExactDesc;
          reasons.push({ rule: 'Near-exact in description', field: 'description', keyword: phrase, points: WEIGHTS.nearExactDesc });
          matchedKeywords.push(phrase);
        }
      }
    }
  }

  // ── Synonym matches ───────────────────────────────────────────────────
  if (matchMode === 'broad' || matchMode === 'smart') {
    for (const phrase of lib.synonyms) {
      if (!matchedKeywords.includes(phrase)) {
        if (containsPhrase(title, phrase)) {
          score += WEIGHTS.synonymTitle;
          reasons.push({ rule: 'Synonym in title', field: 'title', keyword: phrase, points: WEIGHTS.synonymTitle });
          matchedKeywords.push(phrase);
        } else if (containsPhrase(desc, phrase)) {
          score += WEIGHTS.synonymDesc;
          reasons.push({ rule: 'Synonym in description', field: 'description', keyword: phrase, points: WEIGHTS.synonymDesc });
          matchedKeywords.push(phrase);
        }
      }
    }
  }

  // ── Related/contextual matches ────────────────────────────────────────
  if (matchMode === 'broad') {
    for (const phrase of lib.related) {
      if (!matchedKeywords.includes(phrase)) {
        if (containsPhrase(title, phrase)) {
          score += WEIGHTS.relatedTitle;
          reasons.push({ rule: 'Related term in title', field: 'title', keyword: phrase, points: WEIGHTS.relatedTitle });
          matchedKeywords.push(phrase);
        } else if (containsPhrase(desc, phrase)) {
          score += WEIGHTS.relatedDesc;
          reasons.push({ rule: 'Related term in description', field: 'description', keyword: phrase, points: WEIGHTS.relatedDesc });
          matchedKeywords.push(phrase);
        }
      }
    }
  }

  // ── NAICS match ───────────────────────────────────────────────────────
  if (opp.naicsCode && config.preferredNaics.length) {
    const isMatch = config.preferredNaics.some(n =>
      opp.naicsCode?.startsWith(n.slice(0, 4))
    );
    if (isMatch) {
      score += WEIGHTS.naicsMatch;
      reasons.push({ rule: 'Preferred NAICS match', field: 'naics', keyword: opp.naicsCode, points: WEIGHTS.naicsMatch });
    }
  }

  // ── PSC match ─────────────────────────────────────────────────────────
  if (opp.classificationCode && config.preferredPsc.length) {
    const isMatch = config.preferredPsc.some(p =>
      opp.classificationCode?.startsWith(p)
    );
    if (isMatch) {
      score += WEIGHTS.pscMatch;
      reasons.push({ rule: 'Preferred PSC match', field: 'psc', keyword: opp.classificationCode, points: WEIGHTS.pscMatch });
    }
  }

  // ── Set-aside ─────────────────────────────────────────────────────────
  if (opp.typeOfSetAside) {
    if (opp.typeOfSetAside === 'SBA') {
      score += WEIGHTS.smallBizSetAside;
      reasons.push({ rule: 'Small business set-aside', field: 'setAside', points: WEIGHTS.smallBizSetAside });
    }
    if (config.preferredSetAsides.includes(opp.typeOfSetAside)) {
      score += WEIGHTS.preferredSetAside;
      reasons.push({ rule: 'Preferred set-aside type', field: 'setAside', keyword: opp.typeOfSetAside, points: WEIGHTS.preferredSetAside });
    }
  }

  // ── Preferred state ───────────────────────────────────────────────────
  if (config.preferredStates.length) {
    const popState = typeof opp.placeOfPerformance === 'string'
      ? opp.placeOfPerformance
      : JSON.stringify(opp.placeOfPerformance ?? '');
    const stateMatch = config.preferredStates.some(s => popState.includes(s));
    if (stateMatch) {
      score += WEIGHTS.preferredState;
      reasons.push({ rule: 'Preferred state match', field: 'placeOfPerformance', points: WEIGHTS.preferredState });
    }
  }

  // ── Recently posted ───────────────────────────────────────────────────
  if (opp.postedDate) {
    const daysSincePosted = (Date.now() - new Date(opp.postedDate).getTime()) / 86400000;
    if (daysSincePosted <= 7) {
      score += WEIGHTS.postedLastWeek;
      reasons.push({ rule: 'Posted in last 7 days', field: 'postedDate', points: WEIGHTS.postedLastWeek });
    }
  }

  return {
    score,
    reasons,
    matchedKeywords,
    excluded: false,
  };
}

export function filterAndScore(
  opportunities: EnrichedOpportunity[],
  config: ScoringConfig
): Array<EnrichedOpportunity & { scoreResult: ScoreResult }> {
  return opportunities
    .map(opp => ({
      ...opp,
      scoreResult: scoreOpportunity(opp, config),
    }))
    .filter(opp => !opp.scoreResult.excluded && opp.scoreResult.score >= config.minScore)
    .sort((a, b) => b.scoreResult.score - a.scoreResult.score);
}
