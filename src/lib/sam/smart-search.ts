// src/lib/sam/smart-search.ts
import type { SearchParams, SmartSearchResult } from '@/types';
import { US_STATES } from '@/lib/constants';

const SYSTEM_PROMPT = `You are a government contracting expert helping small businesses search SAM.gov.
Convert natural language search queries into structured search parameters.

Return ONLY valid JSON matching this schema (no markdown, no explanation):
{
  "params": {
    "keyword": string | null,
    "noticeType": string[] | null,
    "naicsCodes": string[] | null,
    "setAsideTypes": string[] | null,
    "state": string | null,
    "zip": string | null,
    "closingSoon": boolean | null,
    "newThisWeek": boolean | null,
    "smallBusinessSetAside": boolean | null,
    "postedFrom": string | null,
    "postedTo": string | null,
    "deadlineTo": string | null,
    "sortBy": "postedDate" | "responseDeadLine" | "relevance" | null
  },
  "explanation": string,
  "confidence": number
}

NAICS code mapping:
- IT/software/technology: 541511, 541512, 541519
- cybersecurity: 541519, 541512
- construction: 236220, 237310, 238910
- janitorial/cleaning: 561720
- staffing: 561320, 561110
- training: 611430, 611710
- logistics/trucking: 484110, 484121
- healthcare: 621111, 621399
- consulting: 541611, 541618
- engineering: 541330, 541310

Set-aside mapping:
- "small business": small_business
- "8(a)": 8a
- "HUBZone": hubzone
- "SDVOSB" or "service-disabled veteran": sdvosb
- "WOSB" or "woman-owned": wosb
- "veteran-owned": veteran

Today is ${new Date().toISOString().split('T')[0]}.`;

export async function parseSmartSearch(
  query: string,
  userProfile?: {
    naicsCodes?: string[];
    certifications?: string[];
    preferredStates?: string[];
  }
): Promise<SmartSearchResult> {
  if (/^[A-Z0-9\-]{5,25}$/i.test(query.trim()) && !query.includes(' ')) {
    return {
      params: { solicitationNumber: query.trim() },
      explanation: `Searching for solicitation number ${query.trim()}`,
      confidence: 0.95,
    };
  }

  let contextNote = '';
  if (userProfile?.naicsCodes?.length) {
    contextNote += `\nUser NAICS: ${userProfile.naicsCodes.join(', ')}`;
  }
  if (userProfile?.certifications?.length) {
    contextNote += `\nUser certifications: ${userProfile.certifications.join(', ')}`;
  }

  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    return {
      params: { keyword: query },
      explanation: `Searching for: ${query}`,
      confidence: 0.5,
    };
  }
}

export function parseSmartSearchFallback(query: string): SmartSearchResult {
  const params: SearchParams = {};
  const lower = query.toLowerCase();

  for (const [abbr, name] of Object.entries(US_STATES)) {
    if (lower.includes(` in ${name.toLowerCase()}`) || lower.includes(` ${abbr.toLowerCase()} `)) {
      params.state = abbr;
      break;
    }
  }

  if (lower.includes('small business')) params.smallBusinessSetAside = true;
  if (lower.includes('8(a)') || lower.includes('8a')) params.setAsideTypes = ['8a'];
  if (lower.includes('hubzone')) params.setAsideTypes = [...(params.setAsideTypes ?? []), 'hubzone'];
  if (lower.includes('wosb') || lower.includes('woman-owned')) params.setAsideTypes = [...(params.setAsideTypes ?? []), 'wosb'];
  if (lower.includes('sdvosb') || lower.includes('service-disabled')) params.setAsideTypes = [...(params.setAsideTypes ?? []), 'sdvosb'];
  if (lower.includes('this week') || lower.includes('new this week')) params.newThisWeek = true;
  if (lower.includes('closing soon') || lower.includes('due soon')) params.closingSoon = true;
  if (lower.includes('sources sought')) params.noticeType = ['Sources Sought'];

  if (query.length > 2) params.keyword = query;

  return {
    params,
    explanation: `Basic search for: ${query}`,
    confidence: 0.4,
  };
}
