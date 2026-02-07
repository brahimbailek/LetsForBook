import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log(`\nUsers (${users.length}):`);
  users.forEach(u => console.log(`  [${u.role}] ${u.email}`));

  const salons = await prisma.salon.findMany({ select: { name: true } });
  console.log(`\nSalons (${salons.length}):`);
  salons.forEach(s => console.log(`  ${s.name}`));

  // List actual table names
  const tables = await prisma.$queryRaw<{tablename: string}[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
  `;
  console.log(`\nTables in DB (${tables.length}):`);
  tables.forEach(t => console.log(`  ${t.tablename}`));

  await prisma.$disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
