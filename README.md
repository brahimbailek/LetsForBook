# Planity Clone

Plateforme de réservation pour salons de beauté - Architecture monorepo moderne avec TypeScript strict.

## Stack Technique

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.3+ (Strict Mode)
- **Database:** PostgreSQL + Prisma ORM
- **API:** tRPC (End-to-end type safety)
- **Mobile:** Expo (React Native)
- **Styling:** TailwindCSS
- **Monorepo:** Turborepo + pnpm workspaces
- **Payments:** Stripe
- **Notifications:** Twilio (SMS) + Resend (Email)

## Structure du Projet

```
planity-clone/
├── apps/
│   ├── web/           # Site clients (Next.js)
│   ├── admin/         # Dashboard professionnels (Next.js)
│   └── mobile/        # Application mobile (Expo)
├── packages/
│   ├── database/      # Schema Prisma + client
│   ├── api/           # tRPC routers + business logic
│   ├── ui/            # Composants UI partagés
│   ├── validation/    # Schémas Zod
│   ├── types/         # Types TypeScript
│   ├── utils/         # Utilitaires
│   ├── constants/     # Constantes
│   └── config/        # Configurations ESLint/TS
└── tooling/
    └── scripts/       # Scripts utilitaires
```

## Prérequis

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 14

## Installation

```bash
# Installer pnpm si nécessaire
npm install -g pnpm@9.1.0

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Générer le client Prisma
pnpm db:generate

# Créer la base de données
pnpm db:push

# Seed avec des données de test
pnpm db:seed
```

## Développement

```bash
# Lancer tous les apps
pnpm dev

# Lancer un app spécifique
pnpm dev:web    # Site clients (localhost:3000)
pnpm dev:admin  # Dashboard pros (localhost:3001)
pnpm dev:mobile # App mobile (Expo)

# Vérifier les types
pnpm type-check

# Linter
pnpm lint
pnpm lint:fix

# Formater le code
pnpm format
```

## Base de Données

```bash
# Générer le client Prisma
pnpm db:generate

# Créer une migration
pnpm db:migrate

# Push le schema (dev uniquement)
pnpm db:push

# Ouvrir Prisma Studio
pnpm db:studio

# Seed la base
pnpm db:seed
```

## Build

```bash
# Build tous les packages
pnpm build

# Build un package spécifique
pnpm build:web
pnpm build:admin
```

## Tests

```bash
# Tests unitaires
pnpm test

# Tests E2E
pnpm test:e2e
```

## Déploiement

### Web + Admin (Vercel)

```bash
# Connecter avec Vercel
vercel

# Deploy en production
vercel --prod
```

### Base de Données (Railway)

1. Créer un projet PostgreSQL sur Railway
2. Copier le DATABASE_URL
3. Configurer dans les variables d'environnement Vercel
4. Run migrations: `pnpm db:migrate:deploy`

### Mobile (EAS)

```bash
cd apps/mobile

# Build iOS
eas build --platform ios

# Build Android
eas build --platform android

# Submit aux stores
eas submit --platform all
```

## Features

### MVP (Phase 1)

- ✅ Réservation en ligne (clients)
  - Recherche de salons par ville/service
  - Visualisation des services et tarifs
  - Sélection de créneaux disponibles
  - Paiement en ligne (Stripe)
  - Confirmation par email/SMS

- ✅ Dashboard professionnel
  - Calendrier des rendez-vous
  - Gestion des disponibilités
  - Acceptation/refus des réservations
  - Gestion des services
  - Analytics de base

- ✅ Système de notifications
  - Confirmations automatiques
  - Rappels 24h avant
  - SMS + Email

- ✅ Paiements
  - Intégration Stripe
  - Acomptes ou paiement complet
  - Remboursements

## Architecture Highlights

### Type Safety

- ✅ **TypeScript strict mode** - Aucun type `any` autorisé
- ✅ **tRPC** - Types partagés automatiquement backend ↔ frontend
- ✅ **Zod** - Validation runtime des données et env vars
- ✅ **Prisma** - Types générés pour la base de données

### Performance

- ✅ **Turborepo** - Build cache intelligent
- ✅ **Next.js ISR** - Pages statiques régénérées
- ✅ **React Query** - Cache côté client
- ✅ **Redis** - Rate limiting et caching

### Sécurité

- ✅ **NextAuth.js** - Authentication robuste
- ✅ **RBAC** - Role-based access control
- ✅ **Rate limiting** - Protection API
- ✅ **Validation** - Zod schemas partout

## Scripts Utiles

```bash
# Clean tous les node_modules et builds
pnpm clean

# Vérifier les types dans tous les packages
pnpm type-check

# Linter avec auto-fix
pnpm lint:fix

# Formater tout le code
pnpm format

# Vérifier le formatage
pnpm format:check
```

## Documentation

- [Plan d'implémentation](.claude/plans/zippy-sparking-pumpkin.md)
- [tRPC Docs](https://trpc.io)
- [Next.js Docs](https://nextjs.org)
- [Prisma Docs](https://prisma.io)
- [Turborepo Docs](https://turbo.build)

## Support

Pour toute question ou problème, consulter la documentation du projet ou créer une issue sur GitHub.

## Licence

Propriétaire - Tous droits réservés
