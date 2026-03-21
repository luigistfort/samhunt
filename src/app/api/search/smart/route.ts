// src/app/api/search/smart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseSmartSearch, parseSmartSearchFallback } from '@/lib/sam/smart-search';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Get user profile context for better parsing
    let userProfile;
    const session = await auth();
    if (session?.user?.id) {
      const profile = await db.businessProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          naicsCodes: true,
          certifications: true,
          preferredStates: true,
        },
      });
      if (profile) userProfile = profile;
    }

    let result;
    if (process.env.OPENAI_API_KEY) {
      result = await parseSmartSearch(query, userProfile);
    } else {
      // Fallback if no OpenAI key
      result = parseSmartSearchFallback(query);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/search/smart]', err);
    // Always return something usable
    const { query } = await req.json().catch(() => ({ query: '' }));
    return NextResponse.json({
      params: { keyword: query },
      explanation: `Searching for: ${query}`,
      confidence: 0.5,
    });
  }
}
