# LetsForBook

### Votre agenda en ligne qui travaille pour vous, 24h/24

---

## Qu'est-ce que LetsForBook ?

LetsForBook est une **plateforme de réservation en ligne** conçue pour les professionnels de la beauté et du bien-être : coiffeurs, esthéticiennes, barbiers, spas, instituts de massage...

Vos clients réservent directement en ligne. Vous, vous vous concentrez sur votre métier.

---

## Le constat

**Vous perdez de l'argent chaque jour sans le savoir :**

- Le téléphone sonne pendant que vous êtes avec un client
- Des clients oublient leur RDV et ne viennent pas
- Vous passez des heures à gérer votre planning
- Vous rappelez manuellement vos clients la veille

**Résultat** : des créneaux vides, du stress, et du temps perdu.

---

## La solution LetsForBook

### Vos clients réservent quand ils veulent

Votre salon est ouvert à la réservation **24h/24, 7j/7**. Un client veut réserver à 23h depuis son canapé ? C'est possible. Fini les appels manqués.

### Fini les lapins

Le client paie un **acompte** lors de sa réservation. S'il annule à la dernière minute ou ne vient pas, vous gardez l'acompte. Simple et efficace.

### Des rappels automatiques

Vos clients reçoivent automatiquement :
- Un **SMS et email** 7 jours avant leur RDV
- Un **SMS et email** la veille

Plus besoin de les appeler un par un.

### Un tableau de bord simple

Visualisez tous vos RDV, gérez votre équipe, suivez vos paiements... tout depuis une seule interface claire et intuitive.

---

## Ce que vous pouvez faire

### Côté salon

- **Gérer votre établissement** : photos, description, horaires, coordonnées
- **Créer vos prestations** : coupe, coloration, soin visage... avec prix et durée
- **Gérer votre équipe** : chaque collaborateur a son propre agenda
- **Définir vos disponibilités** : jours de travail, pauses, congés
- **Configurer l'acompte** : 20%, 30%, 50%... vous choisissez
- **Accepter ou refuser** les demandes de RDV
- **Voir vos statistiques** : chiffre d'affaires, nombre de RDV, avis clients
- **Répondre aux avis** de vos clients

### Côté client

- **Rechercher un salon** par ville, service ou nom
- **Voir votre page** avec photos, équipe, avis et tarifs
- **Réserver en ligne** en choisissant la prestation, le collaborateur, la date et l'heure
- **Payer l'acompte** de manière sécurisée
- **Recevoir des rappels** par SMS et email
- **Annuler ou modifier** son RDV (dans les délais autorisés)
- **Laisser un avis** après la prestation
- **Sauvegarder en favoris** ses salons préférés

---

## Les avantages concrets

| Problème | Solution LetsForBook |
|----------|---------------------|
| Appels manqués pendant les soins | Réservation en ligne 24h/24 |
| Clients qui oublient leur RDV | Rappels SMS + Email automatiques |
| No-shows et annulations tardives | Acompte obligatoire |
| Gestion administrative chronophage | Tableau de bord centralisé |
| Manque de visibilité en ligne | Page salon professionnelle + avis clients |
| Pas de suivi des paiements | Historique et statistiques détaillées |

---

## La politique anti no-show

C'est notre arme secrète.

1. **Le client réserve** et paie un acompte (ex: 30% du prix)
2. **Il reçoit des rappels** à J-7 et J-1
3. **S'il annule moins de 48h avant** : l'acompte est conservé
4. **S'il ne vient pas** : idem

**Résultat** : vos clients viennent, ou vous êtes indemnisé.

---

## Les notifications

Votre client reçoit automatiquement :

**À la réservation :**
> "Votre RDV chez Salon Élégance est confirmé pour le samedi 15 février à 14h00. Coupe + Brushing. Adresse : 12 rue de la Paix, Paris."

**7 jours avant :**
> "Rappel : votre RDV chez Salon Élégance est dans 7 jours. Pensez à annuler 48h à l'avance si besoin."

**La veille :**
> "Rappel : votre RDV est DEMAIN à 14h00. Attention : le délai d'annulation de 48h est dépassé."

**En cas d'annulation :**
> "Votre RDV chez Salon Élégance a bien été annulé."

Tout est automatique. Vous n'avez rien à faire.

---

## Une page vitrine pour votre salon

Chaque salon a sa propre page publique avec :

- **Photos** de votre établissement
- **Liste des prestations** avec tarifs
- **Présentation de l'équipe** avec spécialités
- **Avis clients** vérifiés
- **Horaires** d'ouverture
- **Adresse** et coordonnées
- **Bouton "Réserver"** visible

C'est comme un mini-site web dédié à votre salon.

---

## Pour qui ?

LetsForBook est fait pour vous si vous êtes :

- Coiffeur / Coiffeuse
- Barbier
- Esthéticienne
- Prothésiste ongulaire
- Spa / Centre de bien-être
- Masseur / Masseuse
- Maquilleur / Maquilleuse
- Tout professionnel de la beauté avec prise de RDV

---

## Ce que ça change au quotidien

| Avant | Après |
|-------|-------|
| Téléphone qui sonne sans cesse | Réservations en ligne silencieuses |
| Agenda papier ou Excel | Tableau de bord numérique |
| Rappels manuels un par un | SMS et emails automatiques |
| No-shows = perte sèche | Acompte = revenu garanti |
| Pas de visibilité en ligne | Page salon + avis Google |
| Gestion administrative longue | Tout centralisé en un clic |

---

## En résumé

**LetsForBook**, c'est :

- Plus de réservations (disponible 24h/24)
- Moins de no-shows (grâce aux acomptes)
- Moins de stress (rappels automatiques)
- Plus de temps (gestion simplifiée)
- Plus de visibilité (page salon + avis)
- Des revenus sécurisés

---

*Vous méritez un outil qui travaille pour vous.*

**LetsForBook - Réservez l'esprit tranquille.**

---

# Documentation Technique

## Stack Technique

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.3+ (Strict Mode)
- **Database:** PostgreSQL + Prisma ORM
- **API:** tRPC (End-to-end type safety)
- **Styling:** TailwindCSS
- **Monorepo:** Turborepo + pnpm workspaces
- **Payments:** Stripe
- **Notifications:** Twilio (SMS) + Resend (Email)

## Structure du Projet

```
letsforbook/
├── apps/
│   └── web/           # Site clients + pros (Next.js)
├── packages/
│   ├── database/      # Schema Prisma + client
│   ├── api/           # tRPC routers + business logic
│   └── validation/    # Schémas Zod
```

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
# Lancer l'app
pnpm dev

# Vérifier les types
pnpm type-check

# Linter
pnpm lint
```

## Base de Données

```bash
# Générer le client Prisma
pnpm db:generate

# Push le schema (dev uniquement)
pnpm db:push

# Ouvrir Prisma Studio
pnpm db:studio

# Seed la base
pnpm db:seed
```

## Build & Déploiement

```bash
# Build
pnpm build

# Deploy sur Vercel
vercel --prod
```

## Architecture

### Type Safety

- **TypeScript strict mode** - Aucun type `any` autorisé
- **tRPC** - Types partagés automatiquement backend ↔ frontend
- **Zod** - Validation runtime des données
- **Prisma** - Types générés pour la base de données

### Sécurité

- **NextAuth.js v5** - Authentication
- **RBAC** - Role-based access control
- **Validation** - Zod schemas partout

## Licence

Propriétaire - Tous droits réservés
