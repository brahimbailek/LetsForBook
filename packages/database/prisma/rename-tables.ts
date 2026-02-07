import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const renames: [string, string][] = [
  ['users', 'auth_users'],
  ['accounts', 'auth_accounts'],
  ['sessions', 'auth_sessions'],
  ['verification_tokens', 'auth_verification_tokens'],
  ['client_profiles', 'profile_clients'],
  ['professional_profiles', 'profile_professionals'],
  ['salons', 'salon_establishments'],
  // salon_availability stays the same
  ['favorite_salons', 'salon_favorites'],
  ['services', 'salon_services'],
  ['professional_services', 'pro_services'],
  ['professional_availability', 'pro_availability'],
  ['availability_exceptions', 'pro_exceptions'],
  ['appointments', 'booking_appointments'],
  ['appointment_services', 'booking_appointment_services'],
  ['payments', 'booking_payments'],
  ['notifications', 'booking_notifications'],
  ['reviews', 'booking_reviews'],
];

async function renameTables() {
  console.log('=== Renommage des tables ===\n');

  for (const [oldName, newName] of renames) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${oldName}" RENAME TO "${newName}";`);
      console.log(`  ${oldName} -> ${newName}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('does not exist')) {
        console.log(`  ${oldName} -> SKIP (n'existe pas)`);
      } else {
        console.error(`  ${oldName} -> ERREUR: ${msg}`);
      }
    }
  }

  console.log('\nTermine !');
  await prisma.$disconnect();
}

renameTables().catch((e) => {
  console.error('Erreur:', e);
  prisma.$disconnect();
  process.exit(1);
});
