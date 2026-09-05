import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Roles
  const roles = [
    'SUPER_ADMIN',
    'ADMIN',
    'CONTENT_MANAGER',
    'MODERATOR',
    'SPONSOR_MANAGER',
    'SUPPORT_AGENT',
    'ANALYST',
    'SPONSOR',
    'PARTICIPANT',
  ];

  const roleEntities = await Promise.all(
    roles.map((r) =>
      prisma.role.upsert({
        where: { name: r },
        update: {},
        create: { name: r, description: `${r} role permissions` },
      }),
    ),
  );

  const adminRole = roleEntities.find((r) => r.name === 'ADMIN')!;

  // 2. Seed Admin User
  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jeetoindian.in' },
    update: {},
    create: {
      email: 'admin@jeetoindian.in',
      phone: '9999999999',
      passwordHash,
      status: 'ACTIVE',
      isPhoneVerified: true,
      roles: {
        create: [{ roleId: adminRole.id }],
      },
      profile: {
        create: {
          displayName: 'Platform Admin',
          state: 'Maharashtra',
          city: 'Mumbai',
        },
      },
    },
  });

  // 3. Seed Sample Sponsor & Campaign
  const sponsor = await prisma.sponsor.create({
    data: {
      name: 'TechKart India',
      logoUrl: 'https://cdn.jeetoindian.in/sponsors/techkart.png',
      website: 'https://techkart.in',
      description: 'India’s leading gadget store',
      contacts: {
        create: {
          name: 'Rahul Sharma',
          email: 'partnerships@techkart.in',
          phone: '9876543210',
          isPrimary: true,
        },
      },
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      sponsorId: sponsor.id,
      title: 'TechKart Summer Knowledge Fest 2026',
      objective: 'Brand awareness & gadget giveaway campaign',
      budgetAmount: 250000.0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Seed Sample Prize
  const prize = await prisma.prize.create({
    data: {
      sponsorId: sponsor.id,
      title: 'Smartwatch Pro 5G',
      description: 'Sponsor-funded premium smartwatch for top rankers',
      imageUrl: 'https://cdn.jeetoindian.in/prizes/smartwatch.png',
      prizeType: 'PHYSICAL',
      estimatedValueInr: 4999.0,
      termsConditions: 'Non-cash prize delivered anywhere in India for FREE.',
    },
  });

  // 5. Seed Questions
  const sampleQuestions = [
    {
      category: 'Technology',
      text: 'Which programming language is predominantly used for Flutter cross-platform development?',
      options: [
        { key: 'A', text: 'Java', isCorrect: false },
        { key: 'B', text: 'Dart', isCorrect: true },
        { key: 'C', text: 'Swift', isCorrect: false },
        { key: 'D', text: 'Kotlin', isCorrect: false },
      ],
      explanation: 'Dart is the programming language developed by Google used to build Flutter apps.',
    },
    {
      category: 'General Knowledge',
      text: 'Which Indian city is known as the Silicon Valley of India?',
      options: [
        { key: 'A', text: 'Mumbai', isCorrect: false },
        { key: 'B', text: 'Bengaluru', isCorrect: true },
        { key: 'C', text: 'Hyderabad', isCorrect: false },
        { key: 'D', text: 'Gurugram', isCorrect: false },
      ],
      explanation: 'Bengaluru is widely recognized as the tech and startup hub of India.',
    },
  ];

  const questionRecords = [];
  for (const q of sampleQuestions) {
    const created = await prisma.question.create({
      data: {
        category: q.category,
        difficulty: 'EASY',
        status: 'PUBLISHED',
        currentVersion: 1,
        creatorId: adminUser.id,
        versions: {
          create: {
            version: 1,
            questionText: q.text,
            explanation: q.explanation,
            options: {
              create: q.options.map((o) => ({
                optionKey: o.key,
                optionText: o.text,
                isCorrect: o.isCorrect,
              })),
            },
          },
        },
      },
      include: {
        versions: { include: { options: true } },
      },
    });
    questionRecords.push(created);
  }

  // 6. Seed Competition
  const competition = await prisma.competition.create({
    data: {
      title: 'India Tech & Science Challenge #1',
      slug: 'india-tech-science-challenge-1',
      description: '100% FREE competition sponsored by TechKart. Win a Smartwatch Pro 5G!',
      category: 'Technology',
      status: 'LIVE',
      startTime: new Date(Date.now() - 3600000), // Started 1 hour ago
      endTime: new Date(Date.now() + 86400000), // Ends in 24 hours
      durationSeconds: 120, // 2 minutes
      maxAttemptsPerUser: 1,
      isFreeEntry: true, // MANDATORY RULE
      campaignId: campaign.id,
      questions: {
        create: questionRecords.map((q, idx) => ({
          questionId: q.id,
          questionVersionId: q.versions[0].id,
          sequenceOrder: idx + 1,
        })),
      },
      prizes: {
        create: [
          {
            prizeId: prize.id,
            rankStart: 1,
            rankEnd: 1,
            quantity: 1,
          },
        ],
      },
    },
  });

  console.log(`✅ Database successfully seeded!`);
  console.log(`🏆 Sample Competition ID: ${competition.id}`);
  console.log(`🔑 Admin Login: admin@jeetoindian.in / AdminPassword123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
