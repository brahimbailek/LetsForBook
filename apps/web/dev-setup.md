# Guide de Développement Local

## Prérequis
- Node.js 20+
- pnpm 9+
- PostgreSQL (ou SQLite pour démarrage rapide)

## Démarrage Rapide

### 1. Installer les dépendances
```bash
cd C:\Users\Brahim\Desktop\planity-clone
pnpm install
```

### 2. Configurer la base de données

#### Option A: SQLite (plus simple pour démarrer)
Le fichier .env est déjà configuré pour SQLite.

#### Option B: PostgreSQL (pour production)
```bash
# Installer PostgreSQL et créer une base de données
# Modifier .env avec l'URL de connexion:
DATABASE_URL="postgresql://user:password@localhost:5432/planity"
```

### 3. Générer le client Prisma et créer la base
```bash
cd apps/web
pnpm db:generate
pnpm db:migrate
```

### 4. Lancer le serveur de développement
```bash
pnpm dev
```

L'application sera disponible sur http://localhost:3000

## Structure des URLs

- `/` - Page d'accueil
- `/search` - Recherche de salons
- `/salon/[slug]` - Détail d'un salon (à créer)
- `/login` - Connexion (à créer)
- `/register` - Inscription (à créer)

## Scripts Disponibles

- `pnpm dev` - Lance le serveur de développement
- `pnpm build` - Construit l'application pour la production
- `pnpm start` - Lance le serveur de production
- `pnpm type-check` - Vérifie les types TypeScript
- `pnpm lint` - Lance le linter

## Problèmes Courants

### Erreur Prisma Client
```bash
pnpm db:generate
```

### Erreur de port déjà utilisé
Changer le port dans .env:
```
PORT=3001
```

### Types non reconnus
```bash
pnpm type-check
```
