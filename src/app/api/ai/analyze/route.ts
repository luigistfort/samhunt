// src/app/api/ai/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { explainOpportunity, analyzeOpportunityFit } from '@/lib/ai/summarize';
import { cacheGet, cacheSet, buildAiCacheKey, CACHE_TTL } from '@/lib/cache';
import { getSamClient } from '@/lib/sam/client';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';

const RequestSchema = z.object({
  noticeId: z.string(),
  action: z.enum(['explain', 'fit']),
  opportunityData: z.any().optional(), // Can pass pre-fetched data
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI features require an OpenAI API key' },
      { status: 503 }
    );
  }

  const session = await auth();

  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { noticeId, action, opportunityData } = parsed.data;

    // Get user profile if doing fit analysis
    let profile = null;
    let profileHash = 'noprofile';

    if (action === 'fit' && session?.user?.id) {
      profile = await db.businessProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (profile) {
        profileHash = crypto
          .createHash('md5')
          .update(JSON.stringify(profile))
          .digest('hex')
          .slice(0, 8);
      }
    }

    // Check AI cache
    const cacheKey = buildAiCacheKey(noticeId, action, profileHash);
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json({ result: cached, fromCache: true });
    }

    // Fetch opportunity if not provided
    let opp = opportunityData;
    if (!opp) {
      const client = getSamClient();
      opp = await client.getOpportunity(noticeId);
      if (!opp) {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }
    }

    // Run AI analysis
    let result;
    if (action === 'explain') {
      result = await explainOpportunity(opp);
    } else {
      if (!profile) {
        return NextResponse.json(
          { error: 'Business profile required for fit analysis. Please complete your profile.' },
          { status: 400 }
        );
      }
      result = await analyzeOpportunityFit(opp, profile as any);
    }

    // Cache AI result (expensive, long TTL)
    await cacheSet(cacheKey, result, CACHE_TTL.AI_SUMMARY);

    return NextResponse.json({ result });
  } catch (err) {
    console.error('[api/ai/analyze]', err);
    return NextResponse.json(
      { error: 'AI analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
