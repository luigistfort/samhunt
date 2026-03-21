// src/app/api/opportunities/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSamClient, SamRateLimitError, SamAuthError } from '@/lib/sam/client';
import { cacheGet, cacheSet, buildSearchCacheKey, CACHE_TTL } from '@/lib/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { SearchParams } from '@/types';

const SearchParamsSchema = z.object({
  keyword: z.string().optional(),
  solicitationNumber: z.string().optional(),
  noticeType: z.array(z.string()).optional(),
  postedFrom: z.string().optional(),
  postedTo: z.string().optional(),
  deadlineFrom: z.string().optional(),
  deadlineTo: z.string().optional(),
  naicsCodes: z.array(z.string()).optional(),
  setAsideTypes: z.array(z.string()).optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  newThisWeek: z.boolean().optional(),
  closingSoon: z.boolean().optional(),
  smallBusinessSetAside: z.boolean().optional(),
  sortBy: z.enum(['postedDate', 'responseDeadLine', 'relevance']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(25),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SearchParamsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const params: SearchParams = parsed.data;

    // Check cache
    const cacheKey = buildSearchCacheKey(params);
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true });
    }

    // Call SAM.gov
    const client = getSamClient();
    const results = await client.search(params);

    // Cache the results
    await cacheSet(cacheKey, results, CACHE_TTL.SEARCH_RESULTS);

    // Log search history for authenticated users (fire-and-forget)
    const session = await auth();
    if (session?.user?.id) {
      db.searchHistory
        .create({
          data: {
            userId: session.user.id,
            query: params as object,
            resultCount: results.total,
          },
        })
        .catch(() => {}); // Non-blocking
    }

    return NextResponse.json(results);
  } catch (err) {
    if (err instanceof SamRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof SamAuthError) {
      return NextResponse.json(
        { error: 'SAM.gov API authentication failed. Check your API key.' },
        { status: 500 }
      );
    }
    console.error('[api/opportunities/search]', err);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities from SAM.gov' },
      { status: 500 }
    );
  }
}

// GET version for simple keyword searches from URL
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params: SearchParams = {
    keyword: searchParams.get('q') ?? undefined,
    page: parseInt(searchParams.get('page') ?? '1'),
    limit: parseInt(searchParams.get('limit') ?? '25'),
    state: searchParams.get('state') ?? undefined,
    noticeType: searchParams.get('noticeType')?.split(',') ?? undefined,
    naicsCodes: searchParams.get('naics')?.split(',') ?? undefined,
  };

  return POST(
    new NextRequest(req.url, {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    })
  );
}
