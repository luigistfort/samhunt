// prisma/seed.ts
// Run with: npm run db:seed

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  // Create a demo user
  const user = await db.user.upsert({
    where: { email: 'demo@samhunt.app' },
    update: {},
    create: {
      email: 'demo@samhunt.app',
      name: 'Demo User',
    },
  });

  console.log('✓ Created demo user:', user.email);

  // Create a demo business profile
  await db.businessProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      companyName: 'Demo Tech Solutions LLC',
      description: 'IT services and cybersecurity consulting for federal agencies',
      naicsCodes: ['541511', '541512', '541519'],
      certifications: ['small_business', 'sdvosb'],
      preferredStates: ['IN', 'OH', 'IL', 'VA'],
      homeZip: '46032',
      targetAgencies: ['Department of Defense', 'Department of Veterans Affairs'],
      minContractSize: 50000,
      maxContractSize: 5000000,
      allowRemote: true,
      preferredNoticeTypes: ['Solicitation', 'Sources Sought'],
    },
  });

  console.log('✓ Created demo business profile');

  // Create a demo saved search
  await db.savedSearch.upsert({
    where: { id: 'demo-search-1' },
    update: {},
    create: {
      id: 'demo-search-1',
      userId: user.id,
      name: 'IT Services in Indiana',
      query: {
        keyword: 'IT services',
        state: 'IN',
        naicsCodes: ['541511', '541512'],
        noticeType: ['Solicitation', 'Sources Sought'],
        page: 1,
        limit: 25,
        sortBy: 'postedDate',
      },
      notifyEmail: false,
    },
  });

  console.log('✓ Created demo saved search');
  console.log('\n✅ Seed complete!');
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
