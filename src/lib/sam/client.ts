// src/lib/sam/client.ts
// SAM.gov Contract Opportunities API Client
// Docs: https://open.gsa.gov/api/opportunities-api/

import type {
  SearchParams,
  NormalizedSearchParams,
  SamSearchResponse,
  EnrichedOpportunity,
} from '@/types';
import { normalizeSearchParams } from './normalize';
import { enrichOpportunity } from './enrich';

const SAM_API_BASE = 'https://api.sam.gov/opportunities/v2/search';
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export class SamApiClient {
  private apiKey: string;
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly rateLimit = 450; // Stay safely under 500/day

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('SAM.gov API key is required');
    this.apiKey = apiKey;
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000; // 24 hours
    if (now - this.windowStart > windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    if (this.requestCount >= this.rateLimit) {
      throw new SamRateLimitError(
        `Daily rate limit reached (${this.rateLimit} requests). Try again tomorrow.`
      );
    }
    this.requestCount++;
  }

  private buildQueryString(params: NormalizedSearchParams): string {
    const query: Record<string, string> = {
      api_key: this.apiKey,
      limit: String(Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT)),
      offset: String(params.offset ?? 0),
      postedFrom: params.postedFrom ?? this.defaultPostedFrom(),
    };

    if (params.keyword) query['q'] = params.keyword;
    if (params.solicitationNumber) query['solnum'] = params.solicitationNumber;
    if (params.noticeType) query['ptype'] = params.noticeType;
    if (params.postedTo) query['postedTo'] = params.postedTo;
    if (params.responseDeadLineFrom) query['rdlfrom'] = params.responseDeadLineFrom;
    if (params.responseDeadLineTo) query['rdlto'] = params.responseDeadLineTo;
    if (params.naicsCode) query['naics'] = params.naicsCode;
    if (params.typeOfSetAside) query['typeOfSetAside'] = params.typeOfSetAside;
    if (params.state) query['state'] = params.state;
    if (params.zip) query['zip'] = params.zip;
    if (params.organizationId) query['organizationId'] = params.organizationId;
    if (params.sortBy) query['sortBy'] = params.sortBy;

    return new URLSearchParams(query).toString();
  }

  private defaultPostedFrom(): string {
    // Default to last 90 days
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return this.formatDate(d);
  }

  private formatDate(date: Date): string {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  async search(params: SearchParams): Promise<{
    opportunities: EnrichedOpportunity[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    this.checkRateLimit();

    const normalized = normalizeSearchParams(params);
    const qs = this.buildQueryString(normalized);
    const url = `${SAM_API_BASE}?${qs}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'SAMHunt/1.0 (government-contract-search)',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      });
    } catch (err) {
      throw new SamNetworkError(
        `Failed to reach SAM.gov API: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') ?? '60';
      throw new SamRateLimitError(
        `SAM.gov rate limit exceeded. Retry after ${retryAfter} seconds.`
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new SamAuthError('SAM.gov API key is invalid or expired.');
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new SamApiError(
        `SAM.gov API error ${response.status}: ${body.slice(0, 200)}`
      );
    }

    const data: SamSearchResponse = await response.json();
    const limit = normalized.limit ?? DEFAULT_LIMIT;
    const offset = normalized.offset ?? 0;
    const page = Math.floor(offset / limit) + 1;

    const opportunities = (data.opportunitiesData ?? []).map(enrichOpportunity);

    return {
      opportunities,
      total: data.totalRecords ?? 0,
      page,
      limit,
      hasMore: offset + opportunities.length < (data.totalRecords ?? 0),
    };
  }

  async getOpportunity(noticeId: string): Promise<EnrichedOpportunity | null> {
    this.checkRateLimit();

    const url = `https://api.sam.gov/opportunities/v2/search?api_key=${this.apiKey}&noticeid=${noticeId}&limit=1`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 600 },
    });

    if (!response.ok) return null;

    const data: SamSearchResponse = await response.json();
    const opp = data.opportunitiesData?.[0];
    return opp ? enrichOpportunity(opp) : null;
  }
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class SamApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SamApiError';
  }
}

export class SamRateLimitError extends SamApiError {
  constructor(message: string) {
    super(message);
    this.name = 'SamRateLimitError';
  }
}

export class SamAuthError extends SamApiError {
  constructor(message: string) {
    super(message);
    this.name = 'SamAuthError';
  }
}

export class SamNetworkError extends SamApiError {
  constructor(message: string) {
    super(message);
    this.name = 'SamNetworkError';
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _client: SamApiClient | null = null;

export function getSamClient(): SamApiClient {
  if (!_client) {
    const key = process.env.SAM_GOV_API_KEY;
    if (!key) {
      throw new Error(
        'SAM_GOV_API_KEY environment variable is not set. ' +
        'Get your API key at https://sam.gov/profile/details'
      );
    }
    _client = new SamApiClient(key);
  }
  return _client;
}
