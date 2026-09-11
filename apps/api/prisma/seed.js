import { PrismaClient, Role, ListingStatus, PackageTier, AccountType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Web Development', slug: 'web-development', icon: 'code' },
  { name: 'UI / UX Design', slug: 'ui-ux-design', icon: 'palette' },
  { name: 'Game Development', slug: 'game-development', icon: 'gamepad' },
  { name: 'Motion & Video', slug: 'motion-video', icon: 'film' },
  { name: 'Writing & Translation', slug: 'writing-translation', icon: 'pen' },
  { name: 'AI & Automation', slug: 'ai-automation', icon: 'cpu' },
];

async function ensureAccounts(userId) {
  for (const type of [AccountType.USER_AVAILABLE, AccountType.USER_PENDING, AccountType.USER_ESCROW]) {
    await prisma.ledgerAccount.upsert({
      where: { userId_type_currency: { userId, type, currency: 'USDT' } },
      update: {},
      create: { userId, type, currency: 'USDT' },
    });
  }
}

async function main() {
  console.log('› seeding ZAFONEX Community…');

  // Platform accounts (userId = null)
  for (const type of [AccountType.PLATFORM_REVENUE, AccountType.PLATFORM_GATEWAY]) {
    const existing = await prisma.ledgerAccount.findFirst({ where: { userId: null, type } });
    if (!existing) await prisma.ledgerAccount.create({ data: { userId: null, type, currency: 'USDT' } });
  }

  for (const c of CATEGORIES) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  const hash = await argon2.hash('Passw0rd!demo', { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@zafonex.local' },
    update: {},
    create: {
      email: 'admin@zafonex.local', username: 'admin', passwordHash: hash,
      role: Role.ADMIN, displayName: 'ZAFONEX Admin', isVerified: true,
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@zafonex.local' },
    update: {},
    create: {
      email: 'seller@zafonex.local', username: 'nova', passwordHash: hash,
      role: Role.SELLER, displayName: 'Nova Studio', isVerified: true,
      headline: 'React & Godot developer', country: 'DZ',
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@zafonex.local' },
    update: {},
    create: {
      email: 'buyer@zafonex.local', username: 'buyer', passwordHash: hash,
      role: Role.USER, displayName: 'Demo Buyer',
    },
  });

  for (const u of [admin, seller, buyer]) await ensureAccounts(u.id);

  const web = await prisma.category.findUnique({ where: { slug: 'web-development' } });
  const design = await prisma.category.findUnique({ where: { slug: 'ui-ux-design' } });

  await prisma.product.upsert({
    where: { slug: 'neon-dashboard-kit' },
    update: {},
    create: {
      sellerId: seller.id, categoryId: design.id,
      title: 'Neon Dashboard UI Kit',
      slug: 'neon-dashboard-kit',
      summary: '48 dark-mode React components with a cyberpunk accent system.',
      description: 'A production-ready Tailwind + React component library: charts, tables, auth screens, and a token-based neon theme.',
      priceUsdt: '29.000000', status: ListingStatus.PUBLISHED,
      tags: ['react', 'tailwind', 'dark-mode'],
    },
  });

  const service = await prisma.service.upsert({
    where: { slug: 'react-landing-page-build' },
    update: {},
    create: {
      sellerId: seller.id, categoryId: web.id,
      title: 'I will build a fast React landing page',
      slug: 'react-landing-page-build',
      summary: 'Vite + Tailwind, mobile-first, 95+ Lighthouse.',
      description: 'Hand-coded landing page with responsive layout, animation pass, and deployment.',
      status: ListingStatus.PUBLISHED,
      tags: ['react', 'vite', 'landing-page'],
    },
  });

  const tiers = [
    { tier: PackageTier.BASIC, name: 'Starter', priceUsdt: '80.000000', deliveryDays: 4, revisions: 1, description: 'One-section landing page.', features: ['1 page', 'Responsive', '1 revision'] },
    { tier: PackageTier.STANDARD, name: 'Growth', priceUsdt: '180.000000', deliveryDays: 7, revisions: 3, description: 'Full landing page with animation.', features: ['5 sections', 'Animations', '3 revisions', 'SEO basics'] },
    { tier: PackageTier.PREMIUM, name: 'Empire', priceUsdt: '420.000000', deliveryDays: 12, revisions: 5, description: 'Multi-page site with CMS wiring.', features: ['5 pages', 'CMS', 'Analytics', 'Deployment', '5 revisions'] },
  ];
  for (const t of tiers) {
    await prisma.servicePackage.upsert({
      where: { serviceId_tier: { serviceId: service.id, tier: t.tier } },
      update: {},
      create: { serviceId: service.id, ...t },
    });
  }

  const course = await prisma.course.upsert({
    where: { slug: 'ship-a-saas-with-react-and-prisma' },
    update: {},
    create: {
      instructorId: seller.id, categoryId: web.id,
      title: 'Ship a SaaS with React, Express and Prisma',
      slug: 'ship-a-saas-with-react-and-prisma',
      summary: 'Build and deploy a real marketplace from empty folder to production.',
      description: 'Twelve hours of project-based teaching covering auth, RBAC, ledgers, and deployment.',
      priceUsdt: '49.000000', level: 'intermediate',
      status: ListingStatus.PUBLISHED, tags: ['react', 'prisma', 'saas'],
    },
  });

  const mod = await prisma.module.upsert({
    where: { courseId_position: { courseId: course.id, position: 1 } },
    update: {},
    create: { courseId: course.id, title: 'Foundations', position: 1 },
  });

  const lessons = [
    { title: 'Why a monorepo', position: 1, durationSec: 480, isPreview: true },
    { title: 'Modelling money correctly', position: 2, durationSec: 1260 },
    { title: 'Auth that will not embarrass you', position: 3, durationSec: 1500 },
  ];
  for (const l of lessons) {
    await prisma.lesson.upsert({
      where: { moduleId_position: { moduleId: mod.id, position: l.position } },
      update: {},
      create: { moduleId: mod.id, ...l },
    });
  }

  console.log('✔ seed complete');
  console.log('  admin@zafonex.local  / Passw0rd!demo');
  console.log('  seller@zafonex.local / Passw0rd!demo');
  console.log('  buyer@zafonex.local  / Passw0rd!demo');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
