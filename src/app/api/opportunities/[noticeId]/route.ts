import { NextRequest, NextResponse } from 'next/server';
import { getSamClient } from '@/lib/sam/client';
import { cacheGet, cacheSet, buildOpportunityCacheKey, CACHE_TTL } from '@/lib/cache';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ noticeId: string }> }
) {
  const { noticeId } = await context.params;
  if (!noticeId) {
    return NextResponse.json({ error: 'noticeId is required' }, { status: 400 });
  }
  const cacheKey = buildOpportunityCacheKey(noticeId);
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json({ opportunity: cached, fromCache: true });
  }
  try {
    const client = getSamClient();
    const opportunity = await client.getOpportunity(noticeId);
    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }
    await cacheSet(cacheKey, opportunity, CACHE_TTL.OPPORTUNITY_DETAIL);
    return NextResponse.json({ opportunity });
  } catch (err) {
    console.error(`[api/opportunities/${noticeId}]`, err);
    return NextResponse.json({ error: 'Failed to fetch opportunity' }, { status: 500 });
  }
}
