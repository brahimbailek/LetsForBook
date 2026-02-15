import { PrismaClient, UserRole, DayOfWeek } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed MASSIF...');

  // Nettoyer la base de données
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointmentService.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.professionalService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.professionalAvailability.deleteMany();
  await prisma.availabilityException.deleteMany();
  await prisma.salonAvailability.deleteMany();
  await prisma.professionalProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.favoriteSalon.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Base de données nettoyée');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // ============================================
  // 1. CATÉGORIES
  // ============================================
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Beauté',
        slug: 'beaute',
        description: 'Instituts de beauté, soins du visage et du corps, épilation',
        icon: '💄',
        color: '#E91E63',
        order: 1,
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Coiffure Femme',
        slug: 'coiffure-femme',
        description: 'Coupes, brushings et soins capillaires pour femmes',
        icon: '💇‍♀️',
        color: '#9C27B0',
        order: 2,
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Coiffure Homme',
        slug: 'coiffure-homme',
        description: 'Coupes et coiffures pour hommes',
        icon: '💇‍♂️',
        color: '#7B1FA2',
        order: 3,
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Coiffure Enfant',
        slug: 'coiffure-enfant',
        description: 'Coupes et coiffures pour enfants',
        icon: '👶',
        color: '#BA68C8',
        order: 4,
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Coloration',
        slug: 'coloration',
        description: 'Colorations, balayages, mèches et techniques couleur',
        icon: '🎨',
        color: '#AB47BC',
        order: 5,
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Barbier',
        slug: 'barbier',
        description: 'Barbershops, coupes homme et taille de barbe',
        icon: '💈',
        color: '#3F51B5',
        order: 6,
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Bien-être & Spa',
        slug: 'bien-etre-spa',
        description: 'Massages, spa, hammam, soins relaxants',
        icon: '🧘',
        color: '#00BCD4',
        order: 7,
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Sport & Fitness',
        slug: 'sport-fitness',
        description: 'Coaching sportif, yoga, pilates, musculation',
        icon: '💪',
        color: '#4CAF50',
        order: 8,
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Tatouage & Piercing',
        slug: 'tatouage-piercing',
        description: 'Studios de tatouage et piercing professionnels',
        icon: '🎨',
        color: '#FF5722',
        order: 9,
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Automobile',
        slug: 'automobile',
        description: 'Garages, mécanique, entretien et réparation automobile',
        icon: '🚗',
        color: '#607D8B',
        order: 10,
        active: true,
      },
    }),
  ]);

  const categoryMap = {
    'Beauté': categories.find(c => c.slug === 'beaute')!.id,
    'Coiffure Femme': categories.find(c => c.slug === 'coiffure-femme')!.id,
    'Coiffure Homme': categories.find(c => c.slug === 'coiffure-homme')!.id,
    'Coiffure Enfant': categories.find(c => c.slug === 'coiffure-enfant')!.id,
    'Coloration': categories.find(c => c.slug === 'coloration')!.id,
    'Barbier': categories.find(c => c.slug === 'barbier')!.id,
    'Bien-être & Spa': categories.find(c => c.slug === 'bien-etre-spa')!.id,
    'Sport & Fitness': categories.find(c => c.slug === 'sport-fitness')!.id,
    'Tatouage & Piercing': categories.find(c => c.slug === 'tatouage-piercing')!.id,
    'Automobile': categories.find(c => c.slug === 'automobile')!.id,
  };

  console.log(`✅ ${categories.length} catégories créées`);

  // ============================================
  // 2. ADMIN (pour les devs)
  // ============================================
  await prisma.user.create({
    data: {
      email: 'admin@letsforbook.fr',
      password: defaultPassword,
      firstName: 'Admin',
      lastName: 'LetsForBook',
      phone: '+33600000000',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log('✅ 1 Admin créé (admin@letsforbook.fr)');

  // ============================================
  // 2b. COMPTE TEST CLIENT
  // ============================================
  await prisma.user.create({
    data: {
      email: 'client@letsforbook.fr',
      password: defaultPassword,
      firstName: 'Jean',
      lastName: 'Client',
      phone: '+33611111111',
      role: UserRole.CLIENT,
      emailVerified: new Date(),
      clientProfile: {
        create: {
          preferredLanguage: 'fr',
          marketingOptIn: true,
        },
      },
    },
  });
  console.log('✅ 1 Compte test CLIENT créé (client@letsforbook.fr)');

  // ============================================
  // 3. CLIENTS (15 utilisateurs)
  // ============================================
  const clientsData = [
    { email: 'marie.dupont@gmail.com', firstName: 'Marie', lastName: 'Dupont', phone: '+33612345678' },
    { email: 'sophie.martin@gmail.com', firstName: 'Sophie', lastName: 'Martin', phone: '+33623456789' },
    { email: 'julie.bernard@gmail.com', firstName: 'Julie', lastName: 'Bernard', phone: '+33634567890' },
    { email: 'emma.petit@gmail.com', firstName: 'Emma', lastName: 'Petit', phone: '+33645678901' },
    { email: 'lucas.moreau@gmail.com', firstName: 'Lucas', lastName: 'Moreau', phone: '+33656789012' },
    { email: 'thomas.leroy@gmail.com', firstName: 'Thomas', lastName: 'Leroy', phone: '+33667890123' },
    { email: 'camille.roux@gmail.com', firstName: 'Camille', lastName: 'Roux', phone: '+33678901234' },
    { email: 'lea.fournier@gmail.com', firstName: 'Léa', lastName: 'Fournier', phone: '+33689012345' },
    { email: 'hugo.girard@gmail.com', firstName: 'Hugo', lastName: 'Girard', phone: '+33690123456' },
    { email: 'chloe.bonnet@gmail.com', firstName: 'Chloé', lastName: 'Bonnet', phone: '+33601234567' },
    { email: 'antoine.lambert@gmail.com', firstName: 'Antoine', lastName: 'Lambert', phone: '+33612345670' },
    { email: 'manon.dumont@gmail.com', firstName: 'Manon', lastName: 'Dumont', phone: '+33623456780' },
    { email: 'maxime.mercier@gmail.com', firstName: 'Maxime', lastName: 'Mercier', phone: '+33634567801' },
    { email: 'clara.lefevre@gmail.com', firstName: 'Clara', lastName: 'Lefèvre', phone: '+33645678012' },
    { email: 'nathan.simon@gmail.com', firstName: 'Nathan', lastName: 'Simon', phone: '+33656780123' },
  ];

  const clients = await Promise.all(
    clientsData.map((client) =>
      prisma.user.create({
        data: {
          ...client,
          password: defaultPassword,
          role: UserRole.CLIENT,
          emailVerified: new Date(),
          clientProfile: {
            create: {
              preferredLanguage: 'fr',
              marketingOptIn: Math.random() > 0.5,
            },
          },
        },
        include: { clientProfile: true },
      })
    )
  );
  console.log(`✅ ${clients.length} clients créés`);

  // ============================================
  // 4. COMPTE TEST SALON_OWNER + 3 PROFESSIONNELS
  // ============================================
  const testOwner = await prisma.user.create({
    data: {
      email: 'test-owner@letsforbook.fr',
      password: defaultPassword,
      firstName: 'Test',
      lastName: 'Owner',
      phone: '+33799999999',
      role: UserRole.SALON_OWNER,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Compte test SALON_OWNER créé (test-owner@letsforbook.fr)');

  // Créer le salon du test owner
  const testSalon = await prisma.salon.create({
    data: {
      name: 'Salon Test Paris',
      slug: 'salon-test-paris',
      description: 'Salon de test pour démo et développement. Coiffure, beauté, manucure.',
      address: '1 Rue de Test',
      city: 'Paris',
      postalCode: '75001',
      latitude: 48.8566,
      longitude: 2.3522,
      phone: '+33199999999',
      email: 'contact@salon-test.fr',
      ownerId: testOwner.id,
      depositRequired: true,
      depositPercentage: 20,
      cancellationPolicyHours: 24,
      bookingBufferMinutes: 10,
      verified: true,
      active: true,
    },
  });

  // Créer 3 professionnels test
  const testProfessionalsData = [
    {
      email: 'test-pro1@letsforbook.fr',
      firstName: 'Sophie',
      lastName: 'Test',
      bio: 'Coiffeuse test - Spécialiste coupes et colorations',
      specialties: ['Coupe femme', 'Coloration', 'Balayage'],
      experience: 8,
    },
    {
      email: 'test-pro2@letsforbook.fr',
      firstName: 'Marc',
      lastName: 'Test',
      bio: 'Esthéticien test - Expert soins visage et manucure',
      specialties: ['Soin visage', 'Manucure', 'Pédicure'],
      experience: 5,
    },
    {
      email: 'test-pro3@letsforbook.fr',
      firstName: 'Julie',
      lastName: 'Test',
      bio: 'Masseuse test - Massages relaxants et thérapeutiques',
      specialties: ['Massage suédois', 'Massage aux pierres chaudes'],
      experience: 10,
    },
  ];

  const testProfessionals = await Promise.all(
    testProfessionalsData.map((pro, index) =>
      prisma.user.create({
        data: {
          email: pro.email,
          password: defaultPassword,
          firstName: pro.firstName,
          lastName: pro.lastName,
          phone: `+3379999999${index + 1}`,
          role: UserRole.PROFESSIONAL,
          emailVerified: new Date(),
          avatar: `https://i.pravatar.cc/150?img=${index + 50}`,
          professionalProfile: {
            create: {
              salonId: testSalon.id,
              bio: pro.bio,
              specialties: pro.specialties,
              experience: pro.experience,
              active: true,
            },
          },
        },
        include: { professionalProfile: true },
      })
    )
  );
  console.log(`✅ 3 professionnels test créés`);

  // ============================================
  // 5. PROPRIÉTAIRES DE SALONS (8)
  // ============================================
  const ownersData = [
    { email: 'owner1@letsforbook.fr', firstName: 'Pierre', lastName: 'Laurent', phone: '+33700000001' },
    { email: 'owner2@letsforbook.fr', firstName: 'Catherine', lastName: 'Moreau', phone: '+33700000002' },
    { email: 'owner3@letsforbook.fr', firstName: 'Thomas', lastName: 'Petit', phone: '+33700000003' },
    { email: 'owner4@letsforbook.fr', firstName: 'Isabelle', lastName: 'Dubois', phone: '+33700000004' },
    { email: 'owner5@letsforbook.fr', firstName: 'François', lastName: 'Robert', phone: '+33700000005' },
    { email: 'owner6@letsforbook.fr', firstName: 'Nathalie', lastName: 'Richard', phone: '+33700000006' },
    { email: 'owner7@letsforbook.fr', firstName: 'Jean', lastName: 'Durand', phone: '+33700000007' },
    { email: 'owner8@letsforbook.fr', firstName: 'Sylvie', lastName: 'Leroy', phone: '+33700000008' },
  ];

  const owners = await Promise.all(
    ownersData.map((owner) =>
      prisma.user.create({
        data: {
          ...owner,
          password: defaultPassword,
          role: UserRole.SALON_OWNER,
          emailVerified: new Date(),
        },
      })
    )
  );
  console.log(`✅ ${owners.length} propriétaires créés`);

  // ============================================
  // 6. SALONS (28 établissements variés)
  // ============================================
  const salonsData = [
    // PARIS (48.8566, 2.3522) - 7 salons
    {
      name: 'Beauté Éternelle',
      slug: 'beaute-eternelle-paris',
      description: 'Salon de beauté haut de gamme au cœur de Paris. Spécialisé en coiffure, soins et manucure.',
      address: '15 Rue de Rivoli',
      city: 'Paris',
      postalCode: '75001',
      latitude: 48.8566,
      longitude: 2.3522,
      phone: '+33142345678',
      email: 'contact@beaute-eternelle.fr',
      ownerId: owners[0]!.id,
    },
    {
      name: 'Le Studio Coiffure',
      slug: 'studio-coiffure-paris',
      description: 'Salon de coiffure moderne spécialisé dans les coupes tendance et colorations.',
      address: '42 Avenue des Champs-Élysées',
      city: 'Paris',
      postalCode: '75008',
      latitude: 48.8698,
      longitude: 2.3075,
      phone: '+33145678901',
      email: 'contact@studio-coiffure.fr',
      ownerId: owners[0]!.id,
    },
    {
      name: 'Ink Master Tattoo',
      slug: 'ink-master-paris',
      description: 'Studio de tatouage artistique. Tous styles : réaliste, old school, japonais, géométrique.',
      address: '88 Boulevard de Belleville',
      city: 'Paris',
      postalCode: '75020',
      latitude: 48.8720,
      longitude: 2.3840,
      phone: '+33156789012',
      email: 'contact@inkmaster.fr',
      ownerId: owners[1]!.id,
    },
    {
      name: 'FitCoach Paris',
      slug: 'fitcoach-paris',
      description: 'Coaching sportif personnalisé. Personal training, yoga, pilates, remise en forme.',
      address: '10 Rue de la Paix',
      city: 'Paris',
      postalCode: '75002',
      latitude: 48.8685,
      longitude: 2.3300,
      phone: '+33167890123',
      email: 'contact@fitcoach-paris.fr',
      ownerId: owners[1]!.id,
    },
    {
      name: 'Barber\'s Republic',
      slug: 'barbers-republic-paris',
      description: 'Barbershop traditionnel. Coupes homme, taille de barbe, rasage à l\'ancienne.',
      address: '25 Rue du Faubourg Saint-Antoine',
      city: 'Paris',
      postalCode: '75011',
      latitude: 48.8520,
      longitude: 2.3750,
      phone: '+33178901234',
      email: 'contact@barbers-republic.fr',
      ownerId: owners[2]!.id,
    },
    {
      name: 'Zen Attitude Spa',
      slug: 'zen-attitude-paris',
      description: 'Spa urbain : massages, soins du corps, hammam, sauna. Détente garantie.',
      address: '5 Rue de Castiglione',
      city: 'Paris',
      postalCode: '75001',
      latitude: 48.8650,
      longitude: 2.3280,
      phone: '+33189012345',
      email: 'contact@zenattitude.fr',
      ownerId: owners[2]!.id,
    },
    {
      name: 'Garage Expert Paris',
      slug: 'garage-expert-paris',
      description: 'Garage automobile multimarques. Entretien, réparation, révision, diagnostic.',
      address: '78 Boulevard Périphérique',
      city: 'Paris',
      postalCode: '75018',
      latitude: 48.8900,
      longitude: 2.3400,
      phone: '+33190123456',
      email: 'contact@garage-expert-paris.fr',
      ownerId: owners[3]!.id,
    },

    // LYON (45.7640, 4.8357) - 5 salons
    {
      name: 'Élégance Coiffure',
      slug: 'elegance-coiffure-lyon',
      description: 'Salon de coiffure moderne à Lyon. Coupes tendance, colorations végétales.',
      address: '42 Rue de la République',
      city: 'Lyon',
      postalCode: '69002',
      latitude: 45.7640,
      longitude: 4.8357,
      phone: '+33478123456',
      email: 'hello@elegance-coiffure.fr',
      ownerId: owners[3]!.id,
    },
    {
      name: 'Lyon Piercing Studio',
      slug: 'lyon-piercing-studio',
      description: 'Studio de piercing professionnel. Tous types de piercings, bijoux de qualité.',
      address: '18 Rue Mercière',
      city: 'Lyon',
      postalCode: '69002',
      latitude: 45.7600,
      longitude: 4.8320,
      phone: '+33478234567',
      email: 'contact@lyon-piercing.fr',
      ownerId: owners[3]!.id,
    },
    {
      name: 'Massage & Bien-être Lyon',
      slug: 'massage-bienetre-lyon',
      description: 'Centre de massage et relaxation. Massage suédois, thaï, aux pierres chaudes.',
      address: '8 Place Bellecour',
      city: 'Lyon',
      postalCode: '69002',
      latitude: 45.7578,
      longitude: 4.8320,
      phone: '+33478345678',
      email: 'contact@massage-lyon.fr',
      ownerId: owners[4]!.id,
    },
    {
      name: 'Nails Factory Lyon',
      slug: 'nails-factory-lyon',
      description: 'Institut spécialisé en prothésie ongulaire. Gel, résine, nail art.',
      address: '55 Cours Vitton',
      city: 'Lyon',
      postalCode: '69006',
      latitude: 45.7700,
      longitude: 4.8500,
      phone: '+33478456789',
      email: 'contact@nailsfactory-lyon.fr',
      ownerId: owners[4]!.id,
    },
    {
      name: 'Auto Service Lyon',
      slug: 'auto-service-lyon',
      description: 'Centre auto complet. Pneumatiques, vidange, freinage, climatisation.',
      address: '120 Avenue Berthelot',
      city: 'Lyon',
      postalCode: '69007',
      latitude: 45.7450,
      longitude: 4.8400,
      phone: '+33478567890',
      email: 'contact@autoservice-lyon.fr',
      ownerId: owners[4]!.id,
    },

    // MARSEILLE (43.2965, 5.3698) - 4 salons
    {
      name: 'Zénitude Spa Marseille',
      slug: 'zenitude-spa-marseille',
      description: 'Spa et centre de bien-être face à la mer. Massages, soins, hammam.',
      address: '8 Boulevard de la Corniche',
      city: 'Marseille',
      postalCode: '13007',
      latitude: 43.2965,
      longitude: 5.3698,
      phone: '+33491234567',
      email: 'info@zenitude-spa.fr',
      ownerId: owners[5]!.id,
    },
    {
      name: 'Coiff\'Style Marseille',
      slug: 'coiffstyle-marseille',
      description: 'Salon de coiffure mixte. Coupes, couleurs, mèches, lissage brésilien.',
      address: '45 La Canebière',
      city: 'Marseille',
      postalCode: '13001',
      latitude: 43.2980,
      longitude: 5.3800,
      phone: '+33491345678',
      email: 'contact@coiffstyle-marseille.fr',
      ownerId: owners[5]!.id,
    },
    {
      name: 'Marseille Tattoo Art',
      slug: 'marseille-tattoo-art',
      description: 'Tatouage artistique et cover-up. Artistes renommés, hygiène irréprochable.',
      address: '22 Rue de Rome',
      city: 'Marseille',
      postalCode: '13001',
      latitude: 43.2950,
      longitude: 5.3750,
      phone: '+33491456789',
      email: 'contact@marseille-tattoo.fr',
      ownerId: owners[6]!.id,
    },
    {
      name: 'CrossFit Marseille',
      slug: 'crossfit-marseille',
      description: 'Box CrossFit et coaching sportif. WOD quotidiens, personal training.',
      address: '100 Avenue du Prado',
      city: 'Marseille',
      postalCode: '13008',
      latitude: 43.2700,
      longitude: 5.3900,
      phone: '+33491567890',
      email: 'contact@crossfit-marseille.fr',
      ownerId: owners[6]!.id,
    },

    // TOULOUSE (43.6047, 1.4442) - 4 salons
    {
      name: 'L\'Atelier du Sourcil Toulouse',
      slug: 'atelier-sourcil-toulouse',
      description: 'Spécialiste du regard. Microblading, restructuration sourcils, extension cils.',
      address: '23 Rue Alsace Lorraine',
      city: 'Toulouse',
      postalCode: '31000',
      latitude: 43.6047,
      longitude: 1.4442,
      phone: '+33561876543',
      email: 'contact@atelier-sourcil.fr',
      ownerId: owners[7]!.id,
    },
    {
      name: 'Yoga Studio Toulouse',
      slug: 'yoga-studio-toulouse',
      description: 'Cours de yoga tous niveaux. Hatha, Vinyasa, Yin, méditation.',
      address: '15 Rue du Taur',
      city: 'Toulouse',
      postalCode: '31000',
      latitude: 43.6060,
      longitude: 1.4430,
      phone: '+33561987654',
      email: 'contact@yoga-toulouse.fr',
      ownerId: owners[7]!.id,
    },
    {
      name: 'Barber Shop Toulouse',
      slug: 'barber-shop-toulouse',
      description: 'Barbier traditionnel. Coupes homme, barbe, soins visage homme.',
      address: '8 Place du Capitole',
      city: 'Toulouse',
      postalCode: '31000',
      latitude: 43.6040,
      longitude: 1.4450,
      phone: '+33561098765',
      email: 'contact@barber-toulouse.fr',
      ownerId: owners[0]!.id,
    },
    {
      name: 'Garage Toulouse Auto',
      slug: 'garage-toulouse-auto',
      description: 'Mécanique générale toutes marques. Contrôle technique, entretien, carrosserie.',
      address: '56 Route de Narbonne',
      city: 'Toulouse',
      postalCode: '31400',
      latitude: 43.5850,
      longitude: 1.4500,
      phone: '+33561109876',
      email: 'contact@garage-toulouse.fr',
      ownerId: owners[0]!.id,
    },

    // NICE (43.6951, 7.2658) - 3 salons
    {
      name: 'Nail Art Paradise Nice',
      slug: 'nail-art-paradise-nice',
      description: 'Institut manucure et pédicure. Pose gel, nail art, semi-permanent.',
      address: '56 Promenade des Anglais',
      city: 'Nice',
      postalCode: '06000',
      latitude: 43.6951,
      longitude: 7.2658,
      phone: '+33493456789',
      email: 'hello@nailart-paradise.fr',
      ownerId: owners[1]!.id,
    },
    {
      name: 'Nice Coiffure Premium',
      slug: 'nice-coiffure-premium',
      description: 'Salon de coiffure luxe. Extensions, lissage, colorations premium.',
      address: '12 Avenue Jean Médecin',
      city: 'Nice',
      postalCode: '06000',
      latitude: 43.7000,
      longitude: 7.2700,
      phone: '+33493567890',
      email: 'contact@nice-coiffure.fr',
      ownerId: owners[2]!.id,
    },
    {
      name: 'Riviera Massage',
      slug: 'riviera-massage-nice',
      description: 'Massages relaxants face à la mer. Californien, balinais, aux huiles.',
      address: '3 Quai des États-Unis',
      city: 'Nice',
      postalCode: '06300',
      latitude: 43.6940,
      longitude: 7.2750,
      phone: '+33493678901',
      email: 'contact@riviera-massage.fr',
      ownerId: owners[3]!.id,
    },

    // BORDEAUX (44.8378, -0.5792) - 3 salons
    {
      name: 'Barber\'s Club Bordeaux',
      slug: 'barbers-club-bordeaux',
      description: 'Salon de barbier traditionnel. Taille de barbe, rasage, coupes classiques.',
      address: '12 Cours de l\'Intendance',
      city: 'Bordeaux',
      postalCode: '33000',
      latitude: 44.8378,
      longitude: -0.5792,
      phone: '+33556789012',
      email: 'contact@barbers-club.fr',
      ownerId: owners[4]!.id,
    },
    {
      name: 'Bordeaux Ink',
      slug: 'bordeaux-ink',
      description: 'Studio de tatouage. Artistes spécialisés tous styles. Recouvrement expert.',
      address: '45 Rue Sainte-Catherine',
      city: 'Bordeaux',
      postalCode: '33000',
      latitude: 44.8400,
      longitude: -0.5750,
      phone: '+33556890123',
      email: 'contact@bordeaux-ink.fr',
      ownerId: owners[5]!.id,
    },
    {
      name: 'Spa Vinothérapie Bordeaux',
      slug: 'spa-vinotherapie-bordeaux',
      description: 'Spa unique aux soins à base de raisin. Massages, soins corps, bains.',
      address: '8 Place de la Bourse',
      city: 'Bordeaux',
      postalCode: '33000',
      latitude: 44.8420,
      longitude: -0.5700,
      phone: '+33556901234',
      email: 'contact@spa-vino-bordeaux.fr',
      ownerId: owners[6]!.id,
    },

    // NANTES (47.2184, -1.5536) - 2 salons
    {
      name: 'Hair Design Nantes',
      slug: 'hair-design-nantes',
      description: 'Salon de coiffure créatif. Coupes sur-mesure, couleurs tendance.',
      address: '20 Rue Crébillon',
      city: 'Nantes',
      postalCode: '44000',
      latitude: 47.2184,
      longitude: -1.5536,
      phone: '+33240123456',
      email: 'contact@hairdesign-nantes.fr',
      ownerId: owners[7]!.id,
    },
    {
      name: 'Pilates Studio Nantes',
      slug: 'pilates-studio-nantes',
      description: 'Cours de Pilates sur machines et au sol. Reformer, Cadillac, Mat.',
      address: '15 Rue de Strasbourg',
      city: 'Nantes',
      postalCode: '44000',
      latitude: 47.2150,
      longitude: -1.5500,
      phone: '+33240234567',
      email: 'contact@pilates-nantes.fr',
      ownerId: owners[0]!.id,
    },
  ];

  const salons = await Promise.all(
    salonsData.map((salon) =>
      prisma.salon.create({
        data: {
          name: salon.name,
          slug: salon.slug,
          description: salon.description,
          address: salon.address,
          city: salon.city,
          postalCode: salon.postalCode,
          latitude: salon.latitude,
          longitude: salon.longitude,
          phone: salon.phone,
          email: salon.email,
          ownerId: salon.ownerId,
          depositRequired: Math.random() > 0.5,
          depositPercentage: Math.random() > 0.5 ? 20 : 30,
          cancellationPolicyHours: [6, 12, 24, 48][Math.floor(Math.random() * 4)],
          bookingBufferMinutes: [5, 10, 15][Math.floor(Math.random() * 3)],
          verified: true,
          active: true,
        },
      })
    )
  );
  console.log(`✅ ${salons.length} salons créés`);

  // ============================================
  // 7. PROFESSIONNELS (20+)
  // ============================================
  const professionalsData = [
    { email: 'pro1@letsforbook.fr', firstName: 'Camille', lastName: 'Rousseau', salonIndex: 0, bio: 'Coiffeuse passionnée depuis 10 ans', specialties: ['Coupe femme', 'Coloration'], experience: 10 },
    { email: 'pro2@letsforbook.fr', firstName: 'Lucas', lastName: 'Dubois', salonIndex: 0, bio: 'Expert en soins du visage', specialties: ['Soin visage', 'Massage'], experience: 7 },
    { email: 'pro3@letsforbook.fr', firstName: 'Emma', lastName: 'Vincent', salonIndex: 1, bio: 'Styliste visagiste', specialties: ['Coupe', 'Visagisme'], experience: 12 },
    { email: 'pro4@letsforbook.fr', firstName: 'Hugo', lastName: 'Garcia', salonIndex: 4, bio: 'Barbier expert', specialties: ['Coupe homme', 'Barbe'], experience: 8 },
    { email: 'pro5@letsforbook.fr', firstName: 'Léa', lastName: 'Martinez', salonIndex: 5, bio: 'Masseuse certifiée', specialties: ['Massage suédois', 'Deep tissue'], experience: 15 },
    { email: 'pro6@letsforbook.fr', firstName: 'Nathan', lastName: 'Thomas', salonIndex: 2, bio: 'Tatoueur réaliste', specialties: ['Réaliste', 'Portrait'], experience: 9 },
    { email: 'pro7@letsforbook.fr', firstName: 'Chloé', lastName: 'Robert', salonIndex: 2, bio: 'Tatoueuse old school', specialties: ['Old school', 'Japonais'], experience: 6 },
    { email: 'pro8@letsforbook.fr', firstName: 'Maxime', lastName: 'Lefevre', salonIndex: 3, bio: 'Coach sportif certifié', specialties: ['HIIT', 'Musculation'], experience: 5 },
    { email: 'pro9@letsforbook.fr', firstName: 'Clara', lastName: 'Moreau', salonIndex: 7, bio: 'Coiffeuse coloriste', specialties: ['Coloration', 'Balayage'], experience: 11 },
    { email: 'pro10@letsforbook.fr', firstName: 'Antoine', lastName: 'Simon', salonIndex: 8, bio: 'Perceur professionnel', specialties: ['Piercing', 'Bijoux'], experience: 7 },
    { email: 'pro11@letsforbook.fr', firstName: 'Manon', lastName: 'Laurent', salonIndex: 9, bio: 'Masseuse thaï', specialties: ['Massage thaï', 'Réflexologie'], experience: 10 },
    { email: 'pro12@letsforbook.fr', firstName: 'Théo', lastName: 'Michel', salonIndex: 10, bio: 'Prothésiste ongulaire', specialties: ['Gel', 'Nail art'], experience: 4 },
    { email: 'pro13@letsforbook.fr', firstName: 'Jade', lastName: 'Garcia', salonIndex: 11, bio: 'Esthéticienne spa', specialties: ['Soins corps', 'Hammam'], experience: 8 },
    { email: 'pro14@letsforbook.fr', firstName: 'Romain', lastName: 'Durand', salonIndex: 12, bio: 'Coiffeur homme/femme', specialties: ['Coupe', 'Brushing'], experience: 13 },
    { email: 'pro15@letsforbook.fr', firstName: 'Sarah', lastName: 'Petit', salonIndex: 13, bio: 'Tatoueuse géométrique', specialties: ['Géométrique', 'Minimaliste'], experience: 5 },
    { email: 'pro16@letsforbook.fr', firstName: 'Julien', lastName: 'Roux', salonIndex: 14, bio: 'Coach CrossFit', specialties: ['CrossFit', 'Haltérophilie'], experience: 6 },
    { email: 'pro17@letsforbook.fr', firstName: 'Océane', lastName: 'Blanc', salonIndex: 15, bio: 'Experte microblading', specialties: ['Microblading', 'Sourcils'], experience: 4 },
    { email: 'pro18@letsforbook.fr', firstName: 'Alexandre', lastName: 'Faure', salonIndex: 16, bio: 'Professeur de yoga', specialties: ['Hatha', 'Vinyasa'], experience: 9 },
    { email: 'pro19@letsforbook.fr', firstName: 'Inès', lastName: 'Girard', salonIndex: 17, bio: 'Barbier traditionnel', specialties: ['Rasage', 'Taille barbe'], experience: 7 },
    { email: 'pro20@letsforbook.fr', firstName: 'Paul', lastName: 'Bonnet', salonIndex: 18, bio: 'Styliste ongulaire', specialties: ['Nail art', 'Gel UV'], experience: 6 },
    { email: 'pro21@letsforbook.fr', firstName: 'Kevin', lastName: 'Martin', salonIndex: 6, bio: 'Mécanicien expert', specialties: ['Diagnostic', 'Réparation'], experience: 12 },
    { email: 'pro22@letsforbook.fr', firstName: 'David', lastName: 'Bernard', salonIndex: 11, bio: 'Spécialiste pneumatiques', specialties: ['Pneus', 'Géométrie'], experience: 8 },
  ];

  const professionals = await Promise.all(
    professionalsData.map((pro, index) =>
      prisma.user.create({
        data: {
          email: pro.email,
          password: defaultPassword,
          firstName: pro.firstName,
          lastName: pro.lastName,
          phone: `+3380000${String(index + 1).padStart(4, '0')}`,
          role: UserRole.PROFESSIONAL,
          emailVerified: new Date(),
          avatar: `https://i.pravatar.cc/150?img=${index + 1}`,
          professionalProfile: {
            create: {
              salonId: salons[pro.salonIndex % salons.length]!.id,
              bio: pro.bio,
              specialties: pro.specialties,
              experience: pro.experience,
              active: true,
            },
          },
        },
        include: { professionalProfile: true },
      })
    )
  );
  console.log(`✅ ${professionals.length} professionnels créés`);

  // ============================================
  // 8. SERVICES (60+)
  // ============================================
  const servicesData = [
    // Coiffure Femme
    { name: 'Coupe Femme', category: 'Coiffure Femme', price: 4500, duration: 60, salonIndices: [0, 1, 7, 12, 19] },
    { name: 'Brushing', category: 'Coiffure Femme', price: 2500, duration: 30, salonIndices: [0, 1, 7, 12, 19] },
    { name: 'Lissage Brésilien', category: 'Coiffure Femme', price: 20000, duration: 180, salonIndices: [1, 7, 19] },

    // Coiffure Homme
    { name: 'Coupe Homme', category: 'Coiffure Homme', price: 2800, duration: 45, salonIndices: [0, 1, 7, 12, 19] },

    // Coiffure Enfant
    { name: 'Coupe Enfant', category: 'Coiffure Enfant', price: 1800, duration: 30, salonIndices: [0, 1, 7, 12] },

    // Coloration
    { name: 'Coloration Complète', category: 'Coloration', price: 8500, duration: 120, salonIndices: [0, 1, 7, 12, 19] },
    { name: 'Balayage', category: 'Coloration', price: 9500, duration: 150, salonIndices: [0, 1, 7, 19] },
    { name: 'Mèches', category: 'Coloration', price: 7500, duration: 90, salonIndices: [0, 1, 7, 12] },

    // Barbier
    { name: 'Coupe + Barbe', category: 'Barbier', price: 3800, duration: 60, salonIndices: [4, 17, 21] },
    { name: 'Taille de Barbe', category: 'Barbier', price: 1800, duration: 30, salonIndices: [4, 17, 21] },
    { name: 'Rasage Traditionnel', category: 'Barbier', price: 2500, duration: 45, salonIndices: [4, 17, 21] },
    { name: 'Soin Barbe', category: 'Barbier', price: 1500, duration: 20, salonIndices: [4, 17, 21] },

    // Manucure/Beauté
    { name: 'Manucure Simple', category: 'Beauté', price: 2500, duration: 45, salonIndices: [0, 10, 18] },
    { name: 'Pose Gel', category: 'Beauté', price: 5500, duration: 90, salonIndices: [10, 18] },
    { name: 'Semi-Permanent', category: 'Beauté', price: 3500, duration: 60, salonIndices: [0, 10, 18] },
    { name: 'Nail Art', category: 'Beauté', price: 4500, duration: 75, salonIndices: [10, 18] },
    { name: 'Pédicure', category: 'Beauté', price: 3500, duration: 60, salonIndices: [0, 10, 18] },

    // Bien-être & Spa
    { name: 'Massage Suédois 60min', category: 'Bien-être & Spa', price: 7500, duration: 60, salonIndices: [5, 9, 11, 20, 23] },
    { name: 'Massage Deep Tissue', category: 'Bien-être & Spa', price: 8500, duration: 75, salonIndices: [5, 9, 11, 20] },
    { name: 'Massage aux Pierres Chaudes', category: 'Bien-être & Spa', price: 9500, duration: 90, salonIndices: [5, 11, 20, 23] },
    { name: 'Massage Californien', category: 'Bien-être & Spa', price: 8000, duration: 60, salonIndices: [5, 9, 20] },
    { name: 'Réflexologie Plantaire', category: 'Bien-être & Spa', price: 5500, duration: 45, salonIndices: [5, 9, 11] },
    { name: 'Hammam + Gommage', category: 'Bien-être & Spa', price: 5500, duration: 90, salonIndices: [5, 11, 23] },
    { name: 'Soin Visage Hydratant', category: 'Bien-être & Spa', price: 6500, duration: 75, salonIndices: [0, 5, 11, 23] },
    { name: 'Enveloppement Corps', category: 'Bien-être & Spa', price: 7000, duration: 60, salonIndices: [5, 11, 23] },

    // Tatouage & Piercing
    { name: 'Tatouage Petit (< 5cm)', category: 'Tatouage & Piercing', price: 8000, duration: 60, salonIndices: [2, 13, 22] },
    { name: 'Tatouage Moyen (5-15cm)', category: 'Tatouage & Piercing', price: 20000, duration: 120, salonIndices: [2, 13, 22] },
    { name: 'Tatouage Grand (> 15cm)', category: 'Tatouage & Piercing', price: 40000, duration: 240, salonIndices: [2, 13, 22] },
    { name: 'Consultation Projet', category: 'Tatouage & Piercing', price: 0, duration: 30, salonIndices: [2, 13, 22] },
    { name: 'Retouche', category: 'Tatouage & Piercing', price: 5000, duration: 45, salonIndices: [2, 13, 22] },
    { name: 'Piercing Lobe', category: 'Tatouage & Piercing', price: 3500, duration: 30, salonIndices: [8] },
    { name: 'Piercing Hélix', category: 'Tatouage & Piercing', price: 4500, duration: 30, salonIndices: [8] },
    { name: 'Piercing Nez', category: 'Tatouage & Piercing', price: 4500, duration: 30, salonIndices: [8] },
    { name: 'Piercing Septum', category: 'Tatouage & Piercing', price: 5500, duration: 30, salonIndices: [8] },

    // Sport & Fitness
    { name: 'Personal Training 1h', category: 'Sport & Fitness', price: 6000, duration: 60, salonIndices: [3, 14] },
    { name: 'Coaching Duo', category: 'Sport & Fitness', price: 4500, duration: 60, salonIndices: [3, 14] },
    { name: 'Programme Remise en Forme', category: 'Sport & Fitness', price: 5000, duration: 75, salonIndices: [3, 14] },
    { name: 'Cours Yoga', category: 'Sport & Fitness', price: 2500, duration: 60, salonIndices: [16] },
    { name: 'Cours Pilates', category: 'Sport & Fitness', price: 3000, duration: 60, salonIndices: [24] },
    { name: 'WOD CrossFit', category: 'Sport & Fitness', price: 2000, duration: 60, salonIndices: [14] },

    // Beauté (regard/sourcils)
    { name: 'Microblading Sourcils', category: 'Beauté', price: 35000, duration: 120, salonIndices: [15] },
    { name: 'Extension Cils', category: 'Beauté', price: 8000, duration: 90, salonIndices: [15] },
    { name: 'Rehaussement Cils', category: 'Beauté', price: 5500, duration: 60, salonIndices: [15] },
    { name: 'Épilation Sourcils', category: 'Beauté', price: 1200, duration: 15, salonIndices: [0, 15] },

    // Automobile
    { name: 'Vidange + Filtre', category: 'Automobile', price: 7500, duration: 60, salonIndices: [6, 11, 19] },
    { name: 'Révision Complète', category: 'Automobile', price: 15000, duration: 120, salonIndices: [6, 11, 19] },
    { name: 'Diagnostic Électronique', category: 'Automobile', price: 6000, duration: 45, salonIndices: [6, 11, 19] },
    { name: 'Changement Plaquettes Freins', category: 'Automobile', price: 12000, duration: 90, salonIndices: [6, 11, 19] },
    { name: 'Changement Pneumatiques (4 pneus)', category: 'Automobile', price: 30000, duration: 120, salonIndices: [6, 11, 19] },
    { name: 'Géométrie + Équilibrage', category: 'Automobile', price: 8000, duration: 60, salonIndices: [6, 11, 19] },
    { name: 'Recharge Climatisation', category: 'Automobile', price: 9000, duration: 60, salonIndices: [6, 11, 19] },
    { name: 'Contrôle Technique', category: 'Automobile', price: 7000, duration: 45, salonIndices: [6, 11, 19] },
    { name: 'Changement Courroie Distribution', category: 'Automobile', price: 45000, duration: 240, salonIndices: [6, 11, 19] },
    { name: 'Réparation Carrosserie Légère', category: 'Automobile', price: 25000, duration: 180, salonIndices: [6, 19] },
  ];

  // Helper: get or create salon-specific category
  const salonCategoryCache: Record<string, Record<string, string>> = {};
  async function getSalonCategory(salonId: string, categoryName: string): Promise<string> {
    if (!salonCategoryCache[salonId]) salonCategoryCache[salonId] = {};
    if (salonCategoryCache[salonId]![categoryName]) return salonCategoryCache[salonId]![categoryName]!;

    // Find the global category info to copy its icon/color
    const globalCat = categories.find(c => c.name === categoryName);
    const slug = categoryName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const order = Object.keys(salonCategoryCache[salonId]!).length;

    const cat = await prisma.category.create({
      data: {
        name: categoryName,
        slug,
        icon: globalCat?.icon || null,
        color: globalCat?.color || null,
        order,
        salonId,
        active: true,
      },
    });

    salonCategoryCache[salonId]![categoryName] = cat.id;
    return cat.id;
  }

  const services = [];
  for (const serviceData of servicesData) {
    for (const salonIndex of serviceData.salonIndices) {
      if (salonIndex < salons.length) {
        const salonId = salons[salonIndex]!.id;
        const catId = await getSalonCategory(salonId, serviceData.category);
        const service = await prisma.service.create({
          data: {
            salonId,
            name: serviceData.name,
            categoryId: catId,
            price: serviceData.price,
            durationMinutes: serviceData.duration,
            order: services.filter(s => s.salonId === salonId && s.categoryId === catId).length,
            active: true,
          },
        });
        services.push(service);
      }
    }
  }

  // Services pour le salon test (salon-specific categories)
  const testCatCoiffureFemme = await getSalonCategory(testSalon.id, 'Coiffure Femme');
  const testCatCoiffureHomme = await getSalonCategory(testSalon.id, 'Coiffure Homme');
  const testCatCoiffureEnfant = await getSalonCategory(testSalon.id, 'Coiffure Enfant');
  const testCatColoration = await getSalonCategory(testSalon.id, 'Coloration');
  const testCatBeaute = await getSalonCategory(testSalon.id, 'Beauté');
  const testCatBienEtre = await getSalonCategory(testSalon.id, 'Bien-être & Spa');

  const testServices = await Promise.all([
    prisma.service.create({
      data: {
        salonId: testSalon.id,
        name: 'Coupe Femme',
        categoryId: testCatCoiffureFemme,
        price: 4500,
        durationMinutes: 60,
        order: 0,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: testSalon.id,
        name: 'Brushing',
        categoryId: testCatCoiffureFemme,
        price: 2500,
        durationMinutes: 30,
        order: 1,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: testSalon.id,
        name: 'Coupe Homme',
        categoryId: testCatCoiffureHomme,
        price: 2800,
        durationMinutes: 45,
        order: 0,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: testSalon.id,
        name: 'Coupe Enfant',
        categoryId: testCatCoiffureEnfant,
        price: 1800,
        durationMinutes: 30,
        order: 0,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: testSalon.id,
        name: 'Coloration Complète',
        categoryId: testCatColoration,
        price: 8500,
        durationMinutes: 120,
        order: 0,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: testSalon.id,
        name: 'Balayage',
        categoryId: testCatColoration,
        price: 9500,
        durationMinutes: 150,
        order: 1,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: testSalon.id,
        name: 'Manucure Gel',
        categoryId: testCatBeaute,
        price: 5500,
        durationMinutes: 90,
        order: 0,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        salonId: testSalon.id,
        name: 'Massage Relaxant',
        categoryId: testCatBienEtre,
        price: 7500,
        durationMinutes: 60,
        order: 0,
        active: true,
      },
    }),
  ]);

  services.push(...testServices);
  console.log(`✅ ${services.length} services créés (dont ${testServices.length} pour le salon test)`);

  // ============================================
  // 9. LIER SERVICES AUX PROFESSIONNELS
  // ============================================
  let professionalServicesCount = 0;

  // Professionnels normaux
  for (const pro of professionals) {
    if (!pro.professionalProfile) continue;

    const salonServices = services.filter(
      (s) => s.salonId === pro.professionalProfile!.salonId
    );

    const numServices = Math.min(salonServices.length, Math.floor(Math.random() * 3) + 2);
    const shuffled = salonServices.sort(() => 0.5 - Math.random());

    for (let i = 0; i < numServices; i++) {
      await prisma.professionalService.create({
        data: {
          professionalId: pro.professionalProfile!.id,
          serviceId: shuffled[i]!.id,
          active: true,
        },
      });
      professionalServicesCount++;
    }
  }

  // Professionnels test
  for (const testPro of testProfessionals) {
    if (!testPro.professionalProfile) continue;

    const testSalonServices = testServices;

    for (const service of testSalonServices) {
      await prisma.professionalService.create({
        data: {
          professionalId: testPro.professionalProfile!.id,
          serviceId: service.id,
          active: true,
        },
      });
      professionalServicesCount++;
    }
  }

  console.log(`✅ ${professionalServicesCount} services professionnels liés`);

  // ============================================
  // 10. DISPONIBILITÉS
  // ============================================
  const days: DayOfWeek[] = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];

  let availabilitiesCount = 0;

  // Professionnels normaux
  for (const pro of professionals) {
    if (!pro.professionalProfile) continue;

    for (const day of days) {
      await prisma.professionalAvailability.create({
        data: {
          professionalId: pro.professionalProfile!.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: day === DayOfWeek.SATURDAY ? '17:00' : '19:00',
          breakStartTime: '12:30',
          breakEndTime: '14:00',
          isAvailable: true,
        },
      });
      availabilitiesCount++;
    }
  }

  // Professionnels test
  for (const testPro of testProfessionals) {
    if (!testPro.professionalProfile) continue;

    for (const day of days) {
      await prisma.professionalAvailability.create({
        data: {
          professionalId: testPro.professionalProfile!.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: day === DayOfWeek.SATURDAY ? '17:00' : '19:00',
          breakStartTime: '12:30',
          breakEndTime: '14:00',
          isAvailable: true,
        },
      });
      availabilitiesCount++;
    }
  }

  console.log(`✅ ${availabilitiesCount} disponibilités créées`);

  // ============================================
  // 11. FAVORIS
  // ============================================
  for (let i = 0; i < Math.min(10, clients.length); i++) {
    const numFavs = Math.floor(Math.random() * 3) + 1;
    const shuffledSalons = [...salons].sort(() => 0.5 - Math.random());

    for (let j = 0; j < numFavs; j++) {
      try {
        await prisma.favoriteSalon.create({
          data: {
            clientId: clients[i]!.clientProfile!.id,
            salonId: shuffledSalons[j]!.id,
          },
        });
      } catch (e) {
        // Ignore duplicate
      }
    }
  }
  console.log('✅ Favoris créés');

  // ============================================
  // RÉSUMÉ FINAL
  // ============================================
  console.log(`
🎉 SEED MASSIF TERMINÉ !

📊 RÉSUMÉ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 1 Admin
👥 ${clients.length} Clients
🏢 ${owners.length + 1} Propriétaires de salons (dont 1 test)
🏪 ${salons.length + 1} Salons (dont 1 test)
💼 ${professionals.length + testProfessionals.length} Professionnels (dont ${testProfessionals.length} test)
🛠️  ${services.length} Services
📂 ${categories.length} Catégories
📅 ${availabilitiesCount} Créneaux de disponibilité
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 COMPTES DE TEST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADMIN:         admin@letsforbook.fr / password123
CLIENT:        client@letsforbook.fr / password123
OWNER (TEST):  test-owner@letsforbook.fr / password123
  └─ Salon:    Salon Test Paris
  └─ Pros:     test-pro1@letsforbook.fr (Sophie Test - Coiffure)
              test-pro2@letsforbook.fr (Marc Test - Esthétique)
              test-pro3@letsforbook.fr (Julie Test - Massage)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 CATÉGORIES DISPONIBLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💄 Beauté
✂️  Coiffure
💈 Barbier
🧘 Bien-être & Spa
💪 Sport & Fitness
🎨 Tatouage & Piercing
🚗 Automobile
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏪 SALONS PAR VILLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Paris: 7 salons (Beauté, Coiffure, Tattoo, Sport, Barbier, Spa, Garage)
Lyon: 5 salons (Coiffure, Piercing, Massage, Manucure, Garage)
Marseille: 4 salons (Spa, Coiffure, Tattoo, CrossFit)
Toulouse: 4 salons (Beauté, Yoga, Barbier, Garage)
Nice: 3 salons (Manucure, Coiffure, Massage)
Bordeaux: 3 salons (Barbier, Tattoo, Spa)
Nantes: 2 salons (Coiffure, Pilates)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
