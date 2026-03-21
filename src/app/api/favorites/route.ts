// src/app/api/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const FavoriteSchema = z.object({
  noticeId: z.string(),
  solicitationNumber: z.string().optional(),
  title: z.string(),
  agencyName: z.string().optional(),
  noticeType: z.string().optional(),
  postedDate: z.string().optional(),
  responseDeadLine: z.string().optional(),
  naicsCode: z.string().optional(),
  setAside: z.string().optional(),
  placeOfPerformance: z.string().optional(),
  samUrl: z.string(),
  notes: z.string().optional(),
  fitScore: z.number().optional(),
  aiSummary: z.string().optional(),
});

// GET - list favorites
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favorites = await db.favoriteOpportunity.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ favorites });
}

// POST - add favorite
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = FavoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const favorite = await db.favoriteOpportunity.upsert({
    where: {
      userId_noticeId: {
        userId: session.user.id,
        noticeId: parsed.data.noticeId,
      },
    },
    update: {
      notes: parsed.data.notes,
      fitScore: parsed.data.fitScore,
      aiSummary: parsed.data.aiSummary,
    },
    create: {
      userId: session.user.id,
      ...parsed.data,
      postedDate: parsed.data.postedDate ? new Date(parsed.data.postedDate) : undefined,
      responseDeadLine: parsed.data.responseDeadLine ? new Date(parsed.data.responseDeadLine) : undefined,
    },
  });

  return NextResponse.json({ favorite });
}

// DELETE - remove favorite
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { noticeId } = await req.json();
  if (!noticeId) {
    return NextResponse.json({ error: 'noticeId required' }, { status: 400 });
  }

  await db.favoriteOpportunity.deleteMany({
    where: { userId: session.user.id, noticeId },
  });

  return NextResponse.json({ success: true });
}
