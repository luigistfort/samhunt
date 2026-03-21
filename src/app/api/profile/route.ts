// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const ProfileSchema = z.object({
  companyName: z.string().optional(),
  uei: z.string().optional(),
  cageCode: z.string().optional(),
  description: z.string().optional(),
  naicsCodes: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  preferredStates: z.array(z.string()).default([]),
  homeZip: z.string().optional(),
  targetAgencies: z.array(z.string()).default([]),
  minContractSize: z.number().optional(),
  maxContractSize: z.number().optional(),
  allowRemote: z.boolean().default(true),
  preferredNoticeTypes: z.array(z.string()).default([]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await db.businessProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid profile data', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const profile = await db.businessProfile.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: {
      userId: session.user.id,
      ...parsed.data,
    },
  });

  return NextResponse.json({ profile });
}
