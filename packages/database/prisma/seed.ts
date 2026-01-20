import { PrismaClient, UserRole, DayOfWeek, AppointmentStatus, PaymentStatus, NotificationChannel, NotificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // Nettoyer la base de données
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointmentService.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.professionalService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.professionalAvailability.deleteMany();
  await prisma.professionalProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.favoriteSalon.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Base de données nettoyée');

  // Hash du mot de passe par défaut
  const defaultPassword = await bcrypt.hash('password123', 10);

  // Créer des utilisateurs clients
  const clients = await Promise.all([
    prisma.user.create({
      data: {
        email: 'marie.dupont@example.com',
        password: defaultPassword,
        firstName: 'Marie',
        lastName: 'Dupont',
        phone: '+33612345678',
        role: UserRole.CLIENT,
        emailVerified: new Date(),
        clientProfile: {
          create: {
            preferredLanguage: 'fr',
            marketingOptIn: true,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'sophie.martin@example.com',
        password: defaultPassword,
        firstName: 'Sophie',
        lastName: 'Martin',
        phone: '+33623456789',
        role: UserRole.CLIENT,
        emailVerified: new Date(),
        clientProfile: {
          create: {
            preferredLanguage: 'fr',
            marketingOptIn: false,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'julie.bernard@example.com',
        password: defaultPassword,
        firstName: 'Julie',
        lastName: 'Bernard',
        phone: '+33634567890',
        role: UserRole.CLIENT,
        emailVerified: new Date(),
        clientProfile: {
          create: {
            preferredLanguage: 'fr',
            marketingOptIn: true,
          },
        },
      },
    }),
  ]);

  console.log(`✅ ${clients.length} clients créés`);

  // Créer des propriétaires de salons
  const salonOwners = await Promise.all([
    prisma.user.create({
      data: {
        email: 'owner.beaute@example.com',
        password: defaultPassword,
        firstName: 'Pierre',
        lastName: 'Laurent',
        phone: '+33645678901',
        role: UserRole.SALON_OWNER,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'owner.elegance@example.com',
        password: defaultPassword,
        firstName: 'Catherine',
        lastName: 'Moreau',
        phone: '+33656789012',
        role: UserRole.SALON_OWNER,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'owner.zenitude@example.com',
        password: defaultPassword,
        firstName: 'Thomas',
        lastName: 'Petit',
        phone: '+33667890123',
        role: UserRole.SALON_OWNER,
        emailVerified: new Date(),
      },
    }),
  ]);

  console.log(`✅ ${salonOwners.length} propriétaires de salons créés`);

  // Créer des salons
  const salons = await Promise.all([
    prisma.salon.create({
      data: {
        name: 'Beauté Éternelle',
        slug: 'beaute-eternelle-paris',
        description: 'Salon de beauté haut de gamme au cœur de Paris. Spécialisé en coiffure, soins du visage et manucure. Notre équipe passionnée vous accueille dans un cadre élégant et relaxant.',
        address: '15 Rue de Rivoli',
        city: 'Paris',
        postalCode: '75001',
        latitude: 48.8566,
        longitude: 2.3522,
        phone: '+33142345678',
        email: 'contact@beaute-eternelle.fr',
        website: 'https://beaute-eternelle.fr',
        logo: 'https://placehold.co/400x400/9333ea/ffffff?text=BE',
        coverImage: 'https://placehold.co/1200x400/9333ea/ffffff?text=Beauté+Éternelle',
        ownerId: salonOwners[0].id,
        acceptsOnlineBooking: true,
        requiresDeposit: true,
        depositAmount: 20,
        cancellationPolicy: 'Annulation gratuite jusqu\'à 24h avant le rendez-vous. Au-delà, l\'acompte est conservé.',
        settings: {
          bookingLeadTime: 60,
          bufferTime: 15,
          maxAdvanceBooking: 60,
        },
      },
    }),
    prisma.salon.create({
      data: {
        name: 'Élégance Coiffure',
        slug: 'elegance-coiffure-lyon',
        description: 'Salon de coiffure moderne à Lyon. Coupes tendance, colorations végétales et soins capillaires professionnels. Experts en coiffure homme, femme et enfant.',
        address: '42 Rue de la République',
        city: 'Lyon',
        postalCode: '69002',
        latitude: 45.7640,
        longitude: 4.8357,
        phone: '+33478123456',
        email: 'hello@elegance-coiffure.fr',
        website: 'https://elegance-coiffure.fr',
        logo: 'https://placehold.co/400x400/ec4899/ffffff?text=EC',
        coverImage: 'https://placehold.co/1200x400/ec4899/ffffff?text=Élégance+Coiffure',
        ownerId: salonOwners[1].id,
        acceptsOnlineBooking: true,
        requiresDeposit: false,
        cancellationPolicy: 'Annulation gratuite jusqu\'à 12h avant le rendez-vous.',
        settings: {
          bookingLeadTime: 30,
          bufferTime: 10,
          maxAdvanceBooking: 45,
        },
      },
    }),
    prisma.salon.create({
      data: {
        name: 'Zénitude Spa',
        slug: 'zenitude-spa-marseille',
        description: 'Spa et centre de bien-être à Marseille. Massages, soins du corps, hammam et sauna. Un havre de paix pour votre détente absolue.',
        address: '8 Boulevard de la Corniche',
        city: 'Marseille',
        postalCode: '13007',
        latitude: 43.2965,
        longitude: 5.3698,
        phone: '+33491234567',
        email: 'info@zenitude-spa.fr',
        website: 'https://zenitude-spa.fr',
        logo: 'https://placehold.co/400x400/10b981/ffffff?text=ZS',
        coverImage: 'https://placehold.co/1200x400/10b981/ffffff?text=Zénitude+Spa',
        ownerId: salonOwners[2].id,
        acceptsOnlineBooking: true,
        requiresDeposit: true,
        depositAmount: 30,
        cancellationPolicy: 'Annulation gratuite jusqu\'à 48h avant le rendez-vous pour les forfaits spa.',
        settings: {
          bookingLeadTime: 120,
          bufferTime: 20,
          maxAdvanceBooking: 90,
        },
      },
    }),
    prisma.salon.create({
      data: {
        name: 'L\'Atelier du Sourcil',
        slug: 'atelier-sourcil-toulouse',
        description: 'Spécialiste du regard à Toulouse. Épilation, restructuration et maquillage permanent des sourcils. Techniques microblading et brow lift.',
        address: '23 Rue Alsace Lorraine',
        city: 'Toulouse',
        postalCode: '31000',
        latitude: 43.6047,
        longitude: 1.4442,
        phone: '+33561876543',
        email: 'contact@atelier-sourcil.fr',
        logo: 'https://placehold.co/400x400/f59e0b/ffffff?text=AS',
        coverImage: 'https://placehold.co/1200x400/f59e0b/ffffff?text=L\'Atelier+du+Sourcil',
        ownerId: salonOwners[0].id,
        acceptsOnlineBooking: true,
        requiresDeposit: false,
        cancellationPolicy: 'Annulation gratuite jusqu\'à 6h avant le rendez-vous.',
        settings: {
          bookingLeadTime: 15,
          bufferTime: 5,
          maxAdvanceBooking: 30,
        },
      },
    }),
    prisma.salon.create({
      data: {
        name: 'Nail Art Paradise',
        slug: 'nail-art-paradise-nice',
        description: 'Institut de manucure et pédicure à Nice. Pose de vernis semi-permanent, nail art personnalisé, prothésie ongulaire. Des ongles sublimes garantis!',
        address: '56 Promenade des Anglais',
        city: 'Nice',
        postalCode: '06000',
        latitude: 43.6951,
        longitude: 7.2658,
        phone: '+33493456789',
        email: 'hello@nailart-paradise.fr',
        logo: 'https://placehold.co/400x400/ef4444/ffffff?text=NP',
        coverImage: 'https://placehold.co/1200x400/ef4444/ffffff?text=Nail+Art+Paradise',
        ownerId: salonOwners[1].id,
        acceptsOnlineBooking: true,
        requiresDeposit: false,
        cancellationPolicy: 'Annulation gratuite jusqu\'à 24h avant.',
        settings: {
          bookingLeadTime: 30,
          bufferTime: 10,
          maxAdvanceBooking: 30,
        },
      },
    }),
    prisma.salon.create({
      data: {
        name: 'Barber\'s Club',
        slug: 'barbers-club-bordeaux',
        description: 'Salon de barbier traditionnel à Bordeaux. Taille de barbe, rasage à l\'ancienne, coupes classiques et modernes. Ambiance conviviale et masculine.',
        address: '12 Cours de l\'Intendance',
        city: 'Bordeaux',
        postalCode: '33000',
        latitude: 44.8378,
        longitude: -0.5792,
        phone: '+33556789012',
        email: 'contact@barbers-club.fr',
        website: 'https://barbers-club.fr',
        logo: 'https://placehold.co/400x400/1f2937/ffffff?text=BC',
        coverImage: 'https://placehold.co/1200x400/1f2937/ffffff?text=Barber\'s+Club',
        ownerId: salonOwners[2].id,
        acceptsOnlineBooking: true,
        requiresDeposit: false,
        cancellationPolicy: 'Annulation gratuite jusqu\'à 2h avant.',
        settings: {
          bookingLeadTime: 30,
          bufferTime: 5,
          maxAdvanceBooking: 21,
        },
      },
    }),
  ]);

  console.log(`✅ ${salons.length} salons créés`);

  // Créer des professionnels
  const professionals = await Promise.all([
    // Beauté Éternelle
    prisma.user.create({
      data: {
        email: 'camille.rousseau@example.com',
        password: defaultPassword,
        firstName: 'Camille',
        lastName: 'Rousseau',
        phone: '+33678901234',
        role: UserRole.PROFESSIONAL,
        emailVerified: new Date(),
        avatar: 'https://i.pravatar.cc/150?img=1',
        professionalProfile: {
          create: {
            salonId: salons[0].id,
            bio: 'Coiffeuse passionnée depuis 10 ans. Spécialisée en coupes femmes et colorations.',
            specialties: ['Coupe femme', 'Coloration', 'Balayage'],
            yearsExperience: 10,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'lucas.dubois@example.com',
        password: defaultPassword,
        firstName: 'Lucas',
        lastName: 'Dubois',
        phone: '+33689012345',
        role: UserRole.PROFESSIONAL,
        emailVerified: new Date(),
        avatar: 'https://i.pravatar.cc/150?img=12',
        professionalProfile: {
          create: {
            salonId: salons[0].id,
            bio: 'Expert en soins du visage et massages relaxants. Formation en aromathérapie.',
            specialties: ['Soin visage', 'Massage', 'Aromathérapie'],
            yearsExperience: 7,
          },
        },
      },
    }),
    // Élégance Coiffure
    prisma.user.create({
      data: {
        email: 'emma.vincent@example.com',
        password: defaultPassword,
        firstName: 'Emma',
        lastName: 'Vincent',
        phone: '+33690123456',
        role: UserRole.PROFESSIONAL,
        emailVerified: new Date(),
        avatar: 'https://i.pravatar.cc/150?img=5',
        professionalProfile: {
          create: {
            salonId: salons[1].id,
            bio: 'Styliste visagiste, passionnée par les coupes tendances et les colorations végétales.',
            specialties: ['Coupe', 'Coloration végétale', 'Visagisme'],
            yearsExperience: 12,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'hugo.garcia@example.com',
        password: defaultPassword,
        firstName: 'Hugo',
        lastName: 'Garcia',
        phone: '+33601234567',
        role: UserRole.PROFESSIONAL,
        emailVerified: new Date(),
        avatar: 'https://i.pravatar.cc/150?img=13',
        professionalProfile: {
          create: {
            salonId: salons[1].id,
            bio: 'Coiffeur barbier spécialisé en coupes homme et taille de barbe.',
            specialties: ['Coupe homme', 'Barbe', 'Rasage'],
            yearsExperience: 8,
          },
        },
      },
    }),
    // Zénitude Spa
    prisma.user.create({
      data: {
        email: 'lea.martinez@example.com',
        password: defaultPassword,
        firstName: 'Léa',
        lastName: 'Martinez',
        phone: '+33612345670',
        role: UserRole.PROFESSIONAL,
        emailVerified: new Date(),
        avatar: 'https://i.pravatar.cc/150?img=9',
        professionalProfile: {
          create: {
            salonId: salons[2].id,
            bio: 'Masseuse certifiée, spécialisée en massages suédois, deep tissue et pierres chaudes.',
            specialties: ['Massage suédois', 'Deep tissue', 'Pierres chaudes'],
            yearsExperience: 15,
          },
        },
      },
    }),
  ]);

  console.log(`✅ ${professionals.length} professionnels créés`);

  // Créer des services
  const services = await Promise.all([
    // Services Beauté Éternelle
    prisma.service.create({
      data: {
        salonId: salons[0].id,
        name: 'Coupe Femme',
        description: 'Coupe femme avec shampoing et brushing inclus',
        category: 'Coiffure',
        price: 45,
        duration: 60,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salons[0].id,
        name: 'Coloration Complète',
        description: 'Coloration sur l\'ensemble de la chevelure',
        category: 'Coiffure',
        price: 85,
        duration: 120,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salons[0].id,
        name: 'Balayage',
        description: 'Technique de coloration naturelle pour un effet soleil',
        category: 'Coiffure',
        price: 95,
        duration: 150,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salons[0].id,
        name: 'Manucure',
        description: 'Soin des mains et pose de vernis classique',
        category: 'Manucure',
        price: 25,
        duration: 45,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salons[0].id,
        name: 'Soin Visage Hydratant',
        description: 'Soin complet du visage avec nettoyage, gommage et masque hydratant',
        category: 'Soin visage',
        price: 65,
        duration: 75,
        active: true,
      },
    }),
    // Services Élégance Coiffure
    prisma.service.create({
      data: {
        salonId: salons[1].id,
        name: 'Coupe Homme',
        description: 'Coupe homme avec lavage et styling',
        category: 'Coiffure',
        price: 28,
        duration: 45,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salons[1].id,
        name: 'Coupe + Barbe',
        description: 'Coupe homme et taille de barbe',
        category: 'Coiffure',
        price: 38,
        duration: 60,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salons[1].id,
        name: 'Brushing',
        description: 'Brushing professionnel',
        category: 'Coiffure',
        price: 25,
        duration: 30,
        active: true,
      },
    }),
    // Services Zénitude Spa
    prisma.service.create({
      data: {
        salonId: salons[2].id,
        name: 'Massage Suédois 60min',
        description: 'Massage relaxant du corps entier',
        category: 'Massage',
        price: 75,
        duration: 60,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salons[2].id,
        name: 'Massage Deep Tissue',
        description: 'Massage en profondeur pour dénouer les tensions',
        category: 'Massage',
        price: 85,
        duration: 75,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: salons[2].id,
        name: 'Hammam + Gommage',
        description: 'Séance de hammam suivie d\'un gommage corporel',
        category: 'Spa',
        price: 55,
        duration: 90,
        active: true,
      },
    }),
  ]);

  console.log(`✅ ${services.length} services créés`);

  // Lier les services aux professionnels
  const professionalServices = await Promise.all([
    // Camille Rousseau (Beauté Éternelle) - Coiffeuse
    prisma.professionalService.create({
      data: {
        professionalId: professionals[0].professionalProfile!.id,
        serviceId: services[0].id, // Coupe Femme
        active: true,
      },
    }),
    prisma.professionalService.create({
      data: {
        professionalId: professionals[0].professionalProfile!.id,
        serviceId: services[1].id, // Coloration
        active: true,
      },
    }),
    prisma.professionalService.create({
      data: {
        professionalId: professionals[0].professionalProfile!.id,
        serviceId: services[2].id, // Balayage
        active: true,
      },
    }),
    // Lucas Dubois (Beauté Éternelle) - Soins
    prisma.professionalService.create({
      data: {
        professionalId: professionals[1].professionalProfile!.id,
        serviceId: services[4].id, // Soin Visage
        active: true,
      },
    }),
    // Emma Vincent (Élégance Coiffure)
    prisma.professionalService.create({
      data: {
        professionalId: professionals[2].professionalProfile!.id,
        serviceId: services[5].id, // Coupe Homme
        active: true,
      },
    }),
    prisma.professionalService.create({
      data: {
        professionalId: professionals[2].professionalProfile!.id,
        serviceId: services[7].id, // Brushing
        active: true,
      },
    }),
    // Hugo Garcia (Élégance Coiffure)
    prisma.professionalService.create({
      data: {
        professionalId: professionals[3].professionalProfile!.id,
        serviceId: services[5].id, // Coupe Homme
        active: true,
      },
    }),
    prisma.professionalService.create({
      data: {
        professionalId: professionals[3].professionalProfile!.id,
        serviceId: services[6].id, // Coupe + Barbe
        active: true,
      },
    }),
    // Léa Martinez (Zénitude Spa)
    prisma.professionalService.create({
      data: {
        professionalId: professionals[4].professionalProfile!.id,
        serviceId: services[8].id, // Massage Suédois
        active: true,
      },
    }),
    prisma.professionalService.create({
      data: {
        professionalId: professionals[4].professionalProfile!.id,
        serviceId: services[9].id, // Massage Deep Tissue
        active: true,
      },
    }),
  ]);

  console.log(`✅ ${professionalServices.length} services professionnels liés`);

  // Créer des disponibilités pour les professionnels
  const availabilities = [];

  // Disponibilités pour tous les professionnels (Lun-Sam 9h-19h)
  for (const professional of professionals) {
    const days: DayOfWeek[] = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];

    for (const day of days) {
      availabilities.push(
        prisma.professionalAvailability.create({
          data: {
            professionalId: professional.professionalProfile!.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '19:00',
            breakStartTime: '12:30',
            breakEndTime: '14:00',
            isAvailable: true,
          },
        })
      );
    }
  }

  await Promise.all(availabilities);
  console.log(`✅ ${availabilities.length} disponibilités créées`);

  // Créer des avis
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        salonId: salons[0].id,
        clientId: clients[0].clientProfile!.id,
        rating: 5,
        comment: 'Excellent salon! Camille est une vraie professionnelle, ma coupe est parfaite. Je recommande vivement!',
        response: 'Merci Marie pour ce gentil retour! À très bientôt chez Beauté Éternelle 😊',
        responseDate: new Date(),
      },
    }),
    prisma.review.create({
      data: {
        salonId: salons[0].id,
        clientId: clients[1].clientProfile!.id,
        rating: 5,
        comment: 'Le soin visage était incroyable, ma peau est radieuse! Lucas a des mains en or.',
        response: 'Ravie que vous ayez apprécié votre soin Sophie! À bientôt 🌟',
        responseDate: new Date(),
      },
    }),
    prisma.review.create({
      data: {
        salonId: salons[1].id,
        clientId: clients[2].clientProfile!.id,
        rating: 5,
        comment: 'Emma a parfaitement compris ce que je voulais. Super salon, ambiance sympa!',
      },
    }),
    prisma.review.create({
      data: {
        salonId: salons[2].id,
        clientId: clients[0].clientProfile!.id,
        rating: 5,
        comment: 'Le massage de Léa était divin. Un moment de pur bonheur et détente. Je reviendrai!',
        response: 'Merci infiniment Marie! Au plaisir de vous accueillir à nouveau 🧘‍♀️',
        responseDate: new Date(),
      },
    }),
  ]);

  console.log(`✅ ${reviews.length} avis créés`);

  // Créer quelques favoris
  await Promise.all([
    prisma.favoriteSalon.create({
      data: {
        clientId: clients[0].clientProfile!.id,
        salonId: salons[0].id,
      },
    }),
    prisma.favoriteSalon.create({
      data: {
        clientId: clients[0].clientProfile!.id,
        salonId: salons[2].id,
      },
    }),
    prisma.favoriteSalon.create({
      data: {
        clientId: clients[1].clientProfile!.id,
        salonId: salons[0].id,
      },
    }),
  ]);

  console.log('✅ Favoris créés');

  console.log('\n🎉 Seed terminé avec succès!');
  console.log(`
📊 Résumé:
- ${clients.length} clients
- ${salonOwners.length} propriétaires de salons
- ${salons.length} salons
- ${professionals.length} professionnels
- ${services.length} services
- ${professionalServices.length} services professionnels
- ${availabilities.length} créneaux de disponibilité
- ${reviews.length} avis

🔐 Connexion de test:
Email: marie.dupont@example.com
Mot de passe: password123

🏢 Salons créés:
${salons.map(s => `- ${s.name} (${s.city})`).join('\n')}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
