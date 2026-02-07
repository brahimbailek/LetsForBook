import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupClients() {
  console.log('=== Suppression des utilisateurs CLIENT ===\n');

  // 1. Trouver tous les users CLIENT
  const clientUsers = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    include: {
      clientProfile: {
        include: {
          appointments: true,
          reviews: true,
          favorites: true,
        },
      },
    },
  });

  console.log(`Nombre de clients trouvés: ${clientUsers.length}`);

  if (clientUsers.length === 0) {
    console.log('Aucun client à supprimer.');
    await prisma.$disconnect();
    return;
  }

  // Lister les emails
  for (const user of clientUsers) {
    console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
  }

  // 2. Récupérer les IDs
  const clientProfileIds = clientUsers
    .map((u) => u.clientProfile?.id)
    .filter(Boolean) as string[];

  const appointmentIds = clientUsers.flatMap(
    (u) => u.clientProfile?.appointments?.map((a) => a.id) ?? []
  );

  console.log(`\nProfils clients: ${clientProfileIds.length}`);
  console.log(`Rendez-vous: ${appointmentIds.length}`);

  // 3. Supprimer dans l'ordre (contraintes FK)
  if (appointmentIds.length > 0) {
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { appointmentId: { in: appointmentIds } },
    });
    console.log(`Notifications supprimées: ${deletedNotifications.count}`);

    const deletedReviews = await prisma.review.deleteMany({
      where: { appointmentId: { in: appointmentIds } },
    });
    console.log(`Avis supprimés: ${deletedReviews.count}`);

    const deletedAppointmentServices = await prisma.appointmentService.deleteMany({
      where: { appointmentId: { in: appointmentIds } },
    });
    console.log(`Services RDV supprimés: ${deletedAppointmentServices.count}`);

    const deletedPayments = await prisma.payment.deleteMany({
      where: { appointmentId: { in: appointmentIds } },
    });
    console.log(`Paiements supprimés: ${deletedPayments.count}`);

    const deletedAppointments = await prisma.appointment.deleteMany({
      where: { id: { in: appointmentIds } },
    });
    console.log(`Rendez-vous supprimés: ${deletedAppointments.count}`);
  }

  if (clientProfileIds.length > 0) {
    const deletedFavorites = await prisma.favoriteSalon.deleteMany({
      where: { clientId: { in: clientProfileIds } },
    });
    console.log(`Favoris supprimés: ${deletedFavorites.count}`);

    // Supprimer les reviews restants liés aux profils clients
    const deletedClientReviews = await prisma.review.deleteMany({
      where: { clientId: { in: clientProfileIds } },
    });
    console.log(`Avis clients restants supprimés: ${deletedClientReviews.count}`);
  }

  // 4. Supprimer les profils clients (cascade depuis user)
  const userIds = clientUsers.map((u) => u.id);

  // Supprimer accounts et sessions NextAuth
  const deletedAccounts = await prisma.account.deleteMany({
    where: { userId: { in: userIds } },
  });
  console.log(`Comptes auth supprimés: ${deletedAccounts.count}`);

  const deletedSessions = await prisma.session.deleteMany({
    where: { userId: { in: userIds } },
  });
  console.log(`Sessions supprimées: ${deletedSessions.count}`);

  // Supprimer les notifications liées aux users
  const deletedUserNotifications = await prisma.notification.deleteMany({
    where: { userId: { in: userIds } },
  });
  console.log(`Notifications user supprimées: ${deletedUserNotifications.count}`);

  // 5. Supprimer les users CLIENT (cascade supprime clientProfile)
  const deletedUsers = await prisma.user.deleteMany({
    where: { role: 'CLIENT' },
  });
  console.log(`\nUtilisateurs CLIENT supprimés: ${deletedUsers.count}`);

  // 6. Vérification
  const remainingUsers = await prisma.user.findMany({
    select: { email: true, role: true, firstName: true, lastName: true },
    orderBy: { role: 'asc' },
  });

  console.log(`\n=== Utilisateurs restants (${remainingUsers.length}) ===`);
  for (const user of remainingUsers) {
    console.log(`  [${user.role}] ${user.email} - ${user.firstName} ${user.lastName}`);
  }

  await prisma.$disconnect();
  console.log('\nTerminé !');
}

cleanupClients().catch((e) => {
  console.error('Erreur:', e);
  prisma.$disconnect();
  process.exit(1);
});
