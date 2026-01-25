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
  await prisma.user.deleteMany();

  console.log('✅ Base de données nettoyée');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // ============================================
  // 1. ADMIN (pour les devs)
  // ============================================
  await prisma.user.create({
    data: {
      email: 'admin@planity.fr',
      password: defaultPassword,
      firstName: 'Admin',
      lastName: 'Planity',
      phone: '+33600000000',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log('✅ 1 Admin créé (admin@planity.fr)');

  // ============================================
  // 2. CLIENTS (15 utilisateurs)
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
  // 3. PROPRIÉTAIRES DE SALONS (8)
  // ============================================
  const ownersData = [
    { email: 'owner1@planity.fr', firstName: 'Pierre', lastName: 'Laurent', phone: '+33700000001' },
    { email: 'owner2@planity.fr', firstName: 'Catherine', lastName: 'Moreau', phone: '+33700000002' },
    { email: 'owner3@planity.fr', firstName: 'Thomas', lastName: 'Petit', phone: '+33700000003' },
    { email: 'owner4@planity.fr', firstName: 'Isabelle', lastName: 'Dubois', phone: '+33700000004' },
    { email: 'owner5@planity.fr', firstName: 'François', lastName: 'Robert', phone: '+33700000005' },
    { email: 'owner6@planity.fr', firstName: 'Nathalie', lastName: 'Richard', phone: '+33700000006' },
    { email: 'owner7@planity.fr', firstName: 'Jean', lastName: 'Durand', phone: '+33700000007' },
    { email: 'owner8@planity.fr', firstName: 'Sylvie', lastName: 'Leroy', phone: '+33700000008' },
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
  // 4. SALONS (25+ établissements variés)
  // ============================================
  const salonsData = [
    // PARIS (48.8566, 2.3522) - 6 salons
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
      category: 'Beauté',
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
      category: 'Coiffure',
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
      category: 'Tatouage',
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
      category: 'Sport',
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
      category: 'Barbier',
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
      category: 'Spa',
    },

    // LYON (45.7640, 4.8357) - 4 salons
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
      category: 'Coiffure',
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
      category: 'Piercing',
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
      category: 'Massage',
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
      category: 'Manucure',
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
      category: 'Spa',
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
      category: 'Coiffure',
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
      category: 'Tatouage',
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
      category: 'Sport',
    },

    // TOULOUSE (43.6047, 1.4442) - 3 salons
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
      category: 'Beauté',
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
      category: 'Sport',
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
      category: 'Barbier',
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
      category: 'Manucure',
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
      category: 'Coiffure',
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
      category: 'Massage',
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
      category: 'Barbier',
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
      category: 'Tatouage',
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
      category: 'Spa',
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
      category: 'Coiffure',
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
      category: 'Sport',
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
  // 5. PROFESSIONNELS (20+)
  // ============================================
  const professionalsData = [
    { email: 'pro1@planity.fr', firstName: 'Camille', lastName: 'Rousseau', salonIndex: 0, bio: 'Coiffeuse passionnée depuis 10 ans', specialties: ['Coupe femme', 'Coloration'], experience: 10 },
    { email: 'pro2@planity.fr', firstName: 'Lucas', lastName: 'Dubois', salonIndex: 0, bio: 'Expert en soins du visage', specialties: ['Soin visage', 'Massage'], experience: 7 },
    { email: 'pro3@planity.fr', firstName: 'Emma', lastName: 'Vincent', salonIndex: 1, bio: 'Styliste visagiste', specialties: ['Coupe', 'Visagisme'], experience: 12 },
    { email: 'pro4@planity.fr', firstName: 'Hugo', lastName: 'Garcia', salonIndex: 4, bio: 'Barbier expert', specialties: ['Coupe homme', 'Barbe'], experience: 8 },
    { email: 'pro5@planity.fr', firstName: 'Léa', lastName: 'Martinez', salonIndex: 5, bio: 'Masseuse certifiée', specialties: ['Massage suédois', 'Deep tissue'], experience: 15 },
    { email: 'pro6@planity.fr', firstName: 'Nathan', lastName: 'Thomas', salonIndex: 2, bio: 'Tatoueur réaliste', specialties: ['Réaliste', 'Portrait'], experience: 9 },
    { email: 'pro7@planity.fr', firstName: 'Chloé', lastName: 'Robert', salonIndex: 2, bio: 'Tatoueuse old school', specialties: ['Old school', 'Japonais'], experience: 6 },
    { email: 'pro8@planity.fr', firstName: 'Maxime', lastName: 'Lefevre', salonIndex: 3, bio: 'Coach sportif certifié', specialties: ['HIIT', 'Musculation'], experience: 5 },
    { email: 'pro9@planity.fr', firstName: 'Clara', lastName: 'Moreau', salonIndex: 6, bio: 'Coiffeuse coloriste', specialties: ['Coloration', 'Balayage'], experience: 11 },
    { email: 'pro10@planity.fr', firstName: 'Antoine', lastName: 'Simon', salonIndex: 7, bio: 'Perceur professionnel', specialties: ['Piercing', 'Bijoux'], experience: 7 },
    { email: 'pro11@planity.fr', firstName: 'Manon', lastName: 'Laurent', salonIndex: 8, bio: 'Masseuse thaï', specialties: ['Massage thaï', 'Réflexologie'], experience: 10 },
    { email: 'pro12@planity.fr', firstName: 'Théo', lastName: 'Michel', salonIndex: 9, bio: 'Prothésiste ongulaire', specialties: ['Gel', 'Nail art'], experience: 4 },
    { email: 'pro13@planity.fr', firstName: 'Jade', lastName: 'Garcia', salonIndex: 10, bio: 'Esthéticienne spa', specialties: ['Soins corps', 'Hammam'], experience: 8 },
    { email: 'pro14@planity.fr', firstName: 'Romain', lastName: 'Durand', salonIndex: 11, bio: 'Coiffeur homme/femme', specialties: ['Coupe', 'Brushing'], experience: 13 },
    { email: 'pro15@planity.fr', firstName: 'Sarah', lastName: 'Petit', salonIndex: 12, bio: 'Tatoueuse géométrique', specialties: ['Géométrique', 'Minimaliste'], experience: 5 },
    { email: 'pro16@planity.fr', firstName: 'Julien', lastName: 'Roux', salonIndex: 13, bio: 'Coach CrossFit', specialties: ['CrossFit', 'Haltérophilie'], experience: 6 },
    { email: 'pro17@planity.fr', firstName: 'Océane', lastName: 'Blanc', salonIndex: 14, bio: 'Experte microblading', specialties: ['Microblading', 'Sourcils'], experience: 4 },
    { email: 'pro18@planity.fr', firstName: 'Alexandre', lastName: 'Faure', salonIndex: 15, bio: 'Professeur de yoga', specialties: ['Hatha', 'Vinyasa'], experience: 9 },
    { email: 'pro19@planity.fr', firstName: 'Inès', lastName: 'Girard', salonIndex: 16, bio: 'Barbier traditionnel', specialties: ['Rasage', 'Taille barbe'], experience: 7 },
    { email: 'pro20@planity.fr', firstName: 'Paul', lastName: 'Bonnet', salonIndex: 17, bio: 'Styliste ongulaire', specialties: ['Nail art', 'Gel UV'], experience: 6 },
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
  // 6. SERVICES (50+)
  // ============================================
  const servicesData = [
    // Coiffure
    { name: 'Coupe Femme', category: 'Coiffure', price: 45, duration: 60, salonIndices: [0, 1, 6, 11, 18] },
    { name: 'Coupe Homme', category: 'Coiffure', price: 28, duration: 45, salonIndices: [0, 1, 6, 11, 18] },
    { name: 'Coupe Enfant', category: 'Coiffure', price: 18, duration: 30, salonIndices: [0, 1, 6, 11] },
    { name: 'Coloration Complète', category: 'Coiffure', price: 85, duration: 120, salonIndices: [0, 1, 6, 11, 18] },
    { name: 'Balayage', category: 'Coiffure', price: 95, duration: 150, salonIndices: [0, 1, 6, 18] },
    { name: 'Mèches', category: 'Coiffure', price: 75, duration: 90, salonIndices: [0, 1, 6, 11] },
    { name: 'Brushing', category: 'Coiffure', price: 25, duration: 30, salonIndices: [0, 1, 6, 11, 18] },
    { name: 'Lissage Brésilien', category: 'Coiffure', price: 200, duration: 180, salonIndices: [1, 6, 18] },

    // Barbier
    { name: 'Coupe + Barbe', category: 'Barbier', price: 38, duration: 60, salonIndices: [4, 16, 20] },
    { name: 'Taille de Barbe', category: 'Barbier', price: 18, duration: 30, salonIndices: [4, 16, 20] },
    { name: 'Rasage Traditionnel', category: 'Barbier', price: 25, duration: 45, salonIndices: [4, 16, 20] },
    { name: 'Soin Barbe', category: 'Barbier', price: 15, duration: 20, salonIndices: [4, 16, 20] },

    // Manucure
    { name: 'Manucure Simple', category: 'Manucure', price: 25, duration: 45, salonIndices: [0, 9, 17] },
    { name: 'Pose Gel', category: 'Manucure', price: 55, duration: 90, salonIndices: [9, 17] },
    { name: 'Semi-Permanent', category: 'Manucure', price: 35, duration: 60, salonIndices: [0, 9, 17] },
    { name: 'Nail Art', category: 'Manucure', price: 45, duration: 75, salonIndices: [9, 17] },
    { name: 'Pédicure', category: 'Manucure', price: 35, duration: 60, salonIndices: [0, 9, 17] },

    // Massage/Spa
    { name: 'Massage Suédois 60min', category: 'Massage', price: 75, duration: 60, salonIndices: [5, 8, 10, 19, 22] },
    { name: 'Massage Deep Tissue', category: 'Massage', price: 85, duration: 75, salonIndices: [5, 8, 10, 19] },
    { name: 'Massage aux Pierres Chaudes', category: 'Massage', price: 95, duration: 90, salonIndices: [5, 10, 19, 22] },
    { name: 'Massage Californien', category: 'Massage', price: 80, duration: 60, salonIndices: [5, 8, 19] },
    { name: 'Réflexologie Plantaire', category: 'Massage', price: 55, duration: 45, salonIndices: [5, 8, 10] },
    { name: 'Hammam + Gommage', category: 'Spa', price: 55, duration: 90, salonIndices: [5, 10, 22] },
    { name: 'Soin Visage Hydratant', category: 'Spa', price: 65, duration: 75, salonIndices: [0, 5, 10, 22] },
    { name: 'Enveloppement Corps', category: 'Spa', price: 70, duration: 60, salonIndices: [5, 10, 22] },

    // Tatouage
    { name: 'Tatouage Petit (< 5cm)', category: 'Tatouage', price: 80, duration: 60, salonIndices: [2, 12, 21] },
    { name: 'Tatouage Moyen (5-15cm)', category: 'Tatouage', price: 200, duration: 120, salonIndices: [2, 12, 21] },
    { name: 'Tatouage Grand (> 15cm)', category: 'Tatouage', price: 400, duration: 240, salonIndices: [2, 12, 21] },
    { name: 'Consultation Projet', category: 'Tatouage', price: 0, duration: 30, salonIndices: [2, 12, 21] },
    { name: 'Retouche', category: 'Tatouage', price: 50, duration: 45, salonIndices: [2, 12, 21] },

    // Piercing
    { name: 'Piercing Lobe', category: 'Piercing', price: 35, duration: 30, salonIndices: [7] },
    { name: 'Piercing Hélix', category: 'Piercing', price: 45, duration: 30, salonIndices: [7] },
    { name: 'Piercing Nez', category: 'Piercing', price: 45, duration: 30, salonIndices: [7] },
    { name: 'Piercing Septum', category: 'Piercing', price: 55, duration: 30, salonIndices: [7] },

    // Sport/Fitness
    { name: 'Personal Training 1h', category: 'Sport', price: 60, duration: 60, salonIndices: [3, 13] },
    { name: 'Coaching Duo', category: 'Sport', price: 45, duration: 60, salonIndices: [3, 13] },
    { name: 'Programme Remise en Forme', category: 'Sport', price: 50, duration: 75, salonIndices: [3, 13] },
    { name: 'Cours Yoga', category: 'Sport', price: 25, duration: 60, salonIndices: [15] },
    { name: 'Cours Pilates', category: 'Sport', price: 30, duration: 60, salonIndices: [23] },
    { name: 'WOD CrossFit', category: 'Sport', price: 20, duration: 60, salonIndices: [13] },

    // Beauté/Regard
    { name: 'Microblading Sourcils', category: 'Beauté', price: 350, duration: 120, salonIndices: [14] },
    { name: 'Extension Cils', category: 'Beauté', price: 80, duration: 90, salonIndices: [14] },
    { name: 'Rehaussement Cils', category: 'Beauté', price: 55, duration: 60, salonIndices: [14] },
    { name: 'Épilation Sourcils', category: 'Beauté', price: 12, duration: 15, salonIndices: [0, 14] },
  ];

  const services = [];
  for (const serviceData of servicesData) {
    for (const salonIndex of serviceData.salonIndices) {
      if (salonIndex < salons.length) {
        const service = await prisma.service.create({
          data: {
            salonId: salons[salonIndex]!.id,
            name: serviceData.name,
            category: serviceData.category,
            price: serviceData.price,
            durationMinutes: serviceData.duration,
            active: true,
          },
        });
        services.push(service);
      }
    }
  }
  console.log(`✅ ${services.length} services créés`);

  // ============================================
  // 7. LIER SERVICES AUX PROFESSIONNELS
  // ============================================
  let professionalServicesCount = 0;
  for (const pro of professionals) {
    if (!pro.professionalProfile) continue;

    // Trouver les services du salon du professionnel
    const salonServices = services.filter(
      (s) => s.salonId === pro.professionalProfile!.salonId
    );

    // Assigner 2-4 services aléatoires
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
  console.log(`✅ ${professionalServicesCount} services professionnels liés`);

  // ============================================
  // 8. DISPONIBILITÉS
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
  console.log(`✅ ${availabilitiesCount} disponibilités créées`);

  // ============================================
  // 9. FAVORIS
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
🏢 ${owners.length} Propriétaires de salons
🏪 ${salons.length} Salons
💼 ${professionals.length} Professionnels
🛠️ ${services.length} Services
📅 ${availabilitiesCount} Créneaux de disponibilité
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 COMPTES DE TEST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADMIN:      admin@planity.fr / password123
CLIENT:     marie.dupont@gmail.com / password123
OWNER:      owner1@planity.fr / password123
PRO:        pro1@planity.fr / password123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏪 SALONS PAR VILLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Paris: 6 salons (Beauté, Coiffure, Tattoo, Sport, Barbier, Spa)
Lyon: 4 salons (Coiffure, Piercing, Massage, Manucure)
Marseille: 4 salons (Spa, Coiffure, Tattoo, CrossFit)
Toulouse: 3 salons (Beauté, Yoga, Barbier)
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
