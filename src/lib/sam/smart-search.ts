// src/lib/sam/smart-search.ts
// Converts plain-language queries to structured SearchParams using OpenAI

import OpenAI from 'openai';
import type { SearchParams, SmartSearchResult } from '@/types';
import { US_STATES } from '@/lib/constants';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a government contracting expert helping small businesses search SAM.gov.
Convert natural language search queries into structured search parameters.

Return ONLY valid JSON matching this schema (no markdown, no explanation):
{
  "params": {
    "keyword": string | null,
    "noticeType": string[] | null,  // ["Solicitation","Sources Sought","Presolicitation","Award Notice","Special Notice","Combined Synopsis/Solicitation"]
    "naicsCodes": string[] | null,   // 6-digit NAICS codes
    "setAsideTypes": string[] | null, // ["small_business","8a","hubzone","sdvosb","wosb","edwosb","veteran"]
    "state": string | null,           // 2-letter state code
    "zip": string | null,
    "closingSoon": boolean | null,    // deadline within 7 days
    "newThisWeek": boolean | null,
    "smallBusinessSetAside": boolean | null,
    "postedFrom": string | null,      // ISO date
    "postedTo": string | null,
    "deadlineTo": string | null,
    "sortBy": "postedDate" | "responseDeadLine" | "relevance" | null
  },
  "explanation": string,  // 1 sentence explaining what you found
  "confidence": number    // 0-1
}

NAICS code mapping examples:
- IT/software/technology → 541511, 541512, 541519
- cybersecurity → 541519, 541512
- construction → 236220, 237310, 238910
- janitorial/cleaning → 561720
- staffing → 561320, 561110
- training → 611430, 611710
- logistics/trucking → 484110, 484121
- healthcare → 621111, 621399, 621112
- consulting → 541611, 541618
- accounting → 541211, 541219
- legal → 541110
- engineering → 541330, 541310
- architecture → 541310
- environmental → 562910, 541620
- food service → 722310, 311999

Set-aside mapping:
- "small business" → small_business
- "8(a)" → 8a
- "HUBZone" → hubzone
- "SDVOSB" or "service-disabled veteran" → sdvosb
- "WOSB" or "woman-owned" → wosb
- "veteran-owned" → veteran

Today is ${new Date().toISOString().split('T')[0]}.`;

export async function parseSmartSearch(
  query: string,
  userProfile?: {
    naicsCodes?: string[];
    certifications?: string[];
    preferredStates?: string[];
  }
): Promise<SmartSearchResult> {
  // Fast path: if query looks like a solicitation number
  if (/^[A-Z0-9\-]{5,25}$/i.test(query.trim()) && !query.includes(' ')) {
    return {
      params: { solicitationNumber: query.trim() },
      explanation: `Searching for solicitation number ${query.trim()}`,
      confidence: 0.95,
    };
  }

  let contextNote = '';
  if (userProfile?.naicsCodes?.length) {
    contextNote += `\nUser's NAICS codes: ${userProfile.naicsCodes.join(', ')}`;
  }
  if (userProfile?.certifications?.length) {
    contextNote += `\nUser's certifications: ${userProfile.certifications.join(', ')}`;
  }
  if (userProfile?.preferredStates?.length) {
    contextNote += `\nUser's preferred states: ${userProfile.preferredStates.join(', ')}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + contextNote },
        { role: 'user', content: query },
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content) as SmartSearchResult;

    // Clean up null values
    const params: SearchParams = {};
    const rawParams = parsed.params as Record<string, unknown>;
    for (const [k, v] of Object.entries(rawParams)) {
      if (v !== null && v !== undefined && v !== false) {
        (params as Record<string, unknown>)[k] = v;
      }
    }

    return {
      params,
      explanation: parsed.explanation ?? 'Search parameters extracted',
      confidence: parsed.confidence ?? 0.7,
    };
  } catch (err) {
    console.error('[smart-search] OpenAI error:', err);
    // Fallback: treat entire query as keyword search
    return {
      params: { keyword: query },
      explanation: `Searching for: ${query}`,
      confidence: 0.5,
    };
  }
}

// Rule-based fallback (no API call needed for common patterns)
export function parseSmartSearchFallback(query: string): SmartSearchResult {
  const params: SearchParams = {};
  const lower = query.toLowerCase();

  // State detection
  for (const [abbr, name] of Object.entries(US_STATES)) {
    if (lower.includes(` in ${name.toLowerCase()}`) || lower.includes(` ${abbr.toLowerCase()} `)) {
      params.state = abbr;
      break;
    }
  }

  // Set-aside detection
  if (lower.includes('small business')) params.smallBusinessSetAside = true;
  if (lower.includes('8(a)') || lower.includes('8a')) {
    params.setAsideTypes = ['8a'];
  }
  if (lower.includes('hubzone')) params.setAsideTypes = [...(params.setAsideTypes ?? []), 'hubzone'];
  if (lower.includes('wosb') || lower.includes('woman-owned')) {
    params.setAsideTypes = [...(params.setAsideTypes ?? []), 'wosb'];
  }
  if (lower.includes('sdvosb') || lower.includes('service-disabled')) {
    params.setAsideTypes = [...(params.setAsideTypes ?? []), 'sdvosb'];
  }

  // Time-based
  if (lower.includes('this week') || lower.includes('new this week')) params.newThisWeek = true;
  if (lower.includes('closing soon') || lower.includes('due soon')) params.closingSoon = true;

  // Notice type
  if (lower.includes('sources sought')) params.noticeType = ['Sources Sought'];
  if (lower.includes('presolicitation')) params.noticeType = ['Presolicitation'];

  // Keyword: strip filter words
  const stopWords = ['in', 'for', 'under', 'small business', 'set-aside', 'closing soon', 'this week'];
  let keyword = query;
  for (const state of Object.values(US_STATES)) {
    keyword = keyword.replace(new RegExp(`\\bin ${state}\\b`, 'gi'), '');
  }
  keyword = keyword.replace(/\$[\d,kmb]+/gi, '').trim();
  if (keyword.length > 2) params.keyword = keyword;

  return {
    params,
    explanation: `Basic search for: ${query}`,
    confidence: 0.4,
  };
}
