# Rapport de Développement - LetsForBook

**Projet:** LetsForBook - Plateforme de réservation en ligne pour salons de beauté
**Date:** 23 Mars 2026
**Développeur:** Assistant IA Claude (Opus 4.6)
**Environnement:** Windows 11, Node.js, VSCode

---

## Table des Matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Persistance de la réservation après login](#2-persistance-de-la-réservation-après-login)
3. [Résumé des Fichiers Modifiés](#3-résumé-des-fichiers-modifiés)
4. [État actuel du projet](#4-état-actuel-du-projet)

---

## 1. Résumé Exécutif

### Objectif de la Session

Ajout de la **persistance de la sélection de réservation à travers le login**. Quand un utilisateur non connecté tente de confirmer un rendez-vous, sa sélection (service, pro, date, heure) est préservée dans l'URL. Après connexion, le booking est automatiquement recréé sans que l'utilisateur ait à tout resélectionner.

### Résultats

| Métrique | Valeur |
|----------|--------|
| Fichiers modifiés | 1 |
| Fonctionnalités ajoutées | 1 (persistance booking post-login) |
| Imports ajoutés | `useSearchParams`, `useEffect` |

---

## 2. Persistance de la réservation après login

### Contexte

Problème identifié : quand un utilisateur non connecté cliquait sur "Confirmer le rendez-vous", il était redirigé vers `/login`. Après connexion, il revenait sur la page salon mais **perdait toute sa sélection** (service, pro, date, heure) car c'était du state React en mémoire.

### Solution implémentée

#### Étape 1 : Encoder la sélection dans le callbackUrl

Quand `booking.create` retourne `UNAUTHORIZED`, on redirige vers `/login` avec les 4 paramètres de réservation dans l'URL :

```tsx
onError: (err) => {
  if (err.data?.code === 'UNAUTHORIZED') {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const callbackUrl = `/salon/${slug}?book_service=${selectedService}&book_pro=${selectedPro}&book_date=${dateStr}&book_time=${selectedTime}`;
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return;
  }
  setBookingError(err.message);
},
```

**Paramètres URL utilisés :**
- `book_service` : ID du service sélectionné
- `book_pro` : ID du professionnel (ou `"peu_importe"`)
- `book_date` : Date au format `YYYY-MM-DD`
- `book_time` : Heure au format `HH:MM`

#### Étape 2 : Lire les paramètres au chargement

Au chargement de la page salon, on parse les query params pour détecter une réservation en attente :

```tsx
const searchParams = useSearchParams();
const pendingBooking = useMemo(() => {
  const service = searchParams.get('book_service');
  const pro = searchParams.get('book_pro');
  const date = searchParams.get('book_date');
  const time = searchParams.get('book_time');
  if (service && pro && date && time) return { service, pro, date, time };
  return null;
}, [searchParams]);
```

#### Étape 3 : Restaurer les states depuis les params

Les states React sont initialisés avec les valeurs des query params s'ils existent :

```tsx
const [selectedService, setSelectedService] = useState<string | null>(pendingBooking?.service ?? null);
const [selectedPro, setSelectedPro] = useState<string | null>(pendingBooking?.pro ?? null);
const [showDatePicker, setShowDatePicker] = useState(!!pendingBooking);
const [selectedDate, setSelectedDate] = useState<Date>(
  pendingBooking?.date ? new Date(pendingBooking.date + 'T00:00:00') : new Date()
);
const [selectedTime, setSelectedTime] = useState<string | null>(pendingBooking?.time ?? null);
```

#### Étape 4 : Auto-créer le booking après login

Un `useEffect` détecte que les 3 conditions sont réunies (pendingBooking + user connecté + salon chargé) et relance automatiquement `booking.create` :

```tsx
const [autoBookingTriggered, setAutoBookingTriggered] = useState(false);
useEffect(() => {
  if (pendingBooking && user && salon && !autoBookingTriggered && !createBookingMutation.isPending) {
    setAutoBookingTriggered(true);
    const startTime = new Date(`${pendingBooking.date}T${pendingBooking.time}:00`);
    createBookingMutation.mutate({
      salonId: salon.id,
      serviceIds: [pendingBooking.service],
      professionalId: pendingBooking.pro === 'peu_importe' ? undefined : pendingBooking.pro,
      startTime,
    });
  }
}, [pendingBooking, user, salon]);
```

Le flag `autoBookingTriggered` empêche les appels multiples.

### Flow complet après login

```
1. User non connecté clique "Confirmer le rendez-vous"
2. booking.create() → UNAUTHORIZED
3. Redirect → /login?callbackUrl=/salon/slug?book_service=X&book_pro=Y&book_date=Z&book_time=W
4. User se connecte
5. NextAuth redirige vers /salon/slug?book_service=X&book_pro=Y&book_date=Z&book_time=W
6. pendingBooking détecte les params
7. States restaurés (service, pro, date, heure sélectionnés visuellement)
8. useEffect détecte pendingBooking + user + salon → booking.create() automatique
9. Si acompte → PaymentModal s'ouvre
   Si pas d'acompte → redirect /booking/confirmation
```

---

## 3. Résumé des Fichiers Modifiés

### `apps/web/src/app/salon/[slug]/page.tsx`

| Modification | Détail |
|---|---|
| Imports ajoutés | `useSearchParams` (next/navigation), `useEffect` (react) |
| Logique ajoutée | `pendingBooking` (useMemo) - parse les query params de réservation |
| States modifiés | `selectedService`, `selectedPro`, `showDatePicker`, `selectedDate`, `selectedTime` initialisés depuis `pendingBooking` |
| States ajoutés | `autoBookingTriggered` (flag anti-double appel) |
| Effect ajouté | `useEffect` pour auto-trigger `booking.create` après login |
| Mutation modifiée | `onError` de `createBookingMutation` encode la sélection dans le callbackUrl |

---

## 4. État actuel du projet

### Flow de réservation complet (mis à jour)

```
┌─────────────────────────────────────────────────────────────────┐
│  Page Salon (/salon/[slug])                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PRESTATIONS (groupées par catégorie)                        │
│     └── Clic service → scroll ↓                                 │
│                                                                  │
│  2. AVEC QUI ? (pros filtrés par service)                       │
│     └── Clic pro → scroll ↓                                     │
│                                                                  │
│  3. BOUTON "Choisir un créneau"                                 │
│     └── Clic → scroll ↓                                         │
│                                                                  │
│  4. QUAND ? (dates 14j + créneaux 30min)                        │
│     └── Clic créneau → scroll ↓                                 │
│                                                                  │
│  5. RÉCAPITULATIF + BOUTON "Confirmer"                          │
│     └── Clic → booking.create()                                  │
│         ├── ✅ Si depositRequired → PaymentModal (Stripe)       │
│         │   └── Paiement OK → /booking/confirmation             │
│         ├── ✅ Si pas d'acompte → /booking/confirmation         │
│         └── ❌ Si non connecté :                                │
│             └── /login?callbackUrl=...book_service&book_pro...  │
│                 └── Après login → retour page salon             │
│                     └── Auto booking.create() via useEffect     │
│                         └── (reprend au flow ✅ ci-dessus)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Points d'attention / Prochaines étapes potentielles

- Les créneaux horaires sont actuellement **statiques** (9h-18h30 toutes les 30min). À remplacer par les vraies disponibilités via `availability.getSlots`.
- La page `/salon/[slug]/book` est **dépréciée** depuis le 21 mars — tout le flow est sur la page salon.
- Le scroll automatique après sélection du créneau vers "Confirmer le rendez-vous" a été ajouté (demande du 23 mars).
