'use client';

/**
 * Page de réservation d'un salon (/salon/[slug]/book)
 *
 * Flow en 3 étapes :
 *   1. Sélection d'une prestation → affichage dynamique des professionnels qui la proposent
 *      - Seuls les services proposés par au moins un professionnel sont affichés
 *      - "Peu importe" n'apparaît que si 2+ pros proposent le service sélectionné
 *      - Si un seul pro propose le service, seul ce pro est affiché (pas de "Peu importe")
 *   2. Sélection d'une date et d'un créneau horaire
 *      - Si "Peu importe" : les créneaux sont agrégés (disponible si AU MOINS un pro l'est)
 *      - Si pro spécifique : créneaux de ce pro uniquement
 *   3. Confirmation et réservation
 *      - Si "Peu importe" : le backend assigne aléatoirement un pro disponible
 *      - Si acompte requis par le salon : ouverture de la modale de paiement
 *
 * Paramètres URL optionnels :
 *   - ?service=<CUID>       : pré-sélectionne un service
 *   - ?professional=<CUID>  : pré-sélectionne un professionnel
 */

import { trpc } from '@/lib/trpc/client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Button, Card, Header, Badge } from '@/components/ui';
import { PaymentModal } from '@/components/payment';

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params['slug'] as string;

  // Paramètres URL optionnels pour pré-sélection
  const serviceId = searchParams.get('service');
  const professionalId = searchParams.get('professional');

  // --- État du flow de réservation ---
  // L'utilisateur choisit d'abord un service, puis un professionnel
  const [selectedService, setSelectedService] = useState<string | null>(serviceId);
  // null = pas encore choisi, 'peu_importe' = n'importe quel pro, CUID = pro spécifique
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(professionalId);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1 = prestation, 2 = date/heure, 3 = confirmation
  const [isBooking, setIsBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);

  // Raccourci : vérifie si le mode "Peu importe" est actif
  const isPeuImporte = selectedProfessional === 'peu_importe';

  const { data: salon, isLoading } = trpc.salon.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  // Récupération des créneaux disponibles
  // - Si "Peu importe" : on ne passe pas de professionalId → le backend agrège les dispos de tous les pros
  // - Si pro spécifique : on passe son ID → créneaux de ce pro uniquement
  const { data: availability, isLoading: isLoadingAvailability } = trpc.availability.getSlots.useQuery(
    {
      salonId: salon?.id || '',
      professionalId: isPeuImporte ? undefined : (selectedProfessional || undefined),
      serviceId: selectedService || undefined,
      date: selectedDate,
    },
    { enabled: !!salon?.id && !!selectedDate && !!selectedService }
  );

  // Récupération des catégories avec hiérarchie (catégories → sous-catégories → services)
  const { data: categoriesData } = trpc.category.getBySalonId.useQuery(
    { salonId: salon?.id || '' },
    { enabled: !!salon?.id }
  );

  // Mutation de création de réservation
  // - Si acompte requis : ouvre la modale de paiement après succès
  // - Sinon : redirige directement vers la page de confirmation
  const createBookingMutation = trpc.booking.create.useMutation({
    onSuccess: (data) => {
      if (salon?.depositRequired && salon?.depositPercentage && salon.depositPercentage > 0) {
        setCreatedAppointmentId(data.id);
        setShowPaymentModal(true);
        setIsBooking(false);
      } else {
        router.push(`/booking/confirmation?id=${data.id}`);
      }
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
      setIsBooking(false);
    },
  });

  // Génère les 14 prochains jours pour la sélection de date (step 2)
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const isoDate = date.toISOString().split('T')[0] as string;
    return {
      value: isoDate,
      label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
      dayName: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
    };
  });

  // Données du service sélectionné (pour le récapitulatif et le calcul du prix)
  const selectedServiceData = salon?.services?.find(s => s.id === selectedService);

  // Calcul de l'acompte si le salon l'exige (prix en centimes)
  const requiresDeposit = salon?.depositRequired && salon?.depositPercentage && salon.depositPercentage > 0;
  const depositPercentage = salon?.depositPercentage || 100;
  const totalPrice = selectedServiceData?.price || 0;
  const depositAmount = Math.round((totalPrice * depositPercentage) / 100);

  const handlePaymentSuccess = () => {
    if (createdAppointmentId) {
      router.push(`/booking/confirmation?id=${createdAppointmentId}`);
    }
  };

  /**
   * Filtre dynamique des professionnels qui proposent le service sélectionné.
   * Utilisé pour afficher la section "Avec qui ?" après sélection d'un service.
   * Retourne un tableau vide si aucun service n'est sélectionné.
   */
  const availableProsForService = useMemo(() => {
    if (!selectedService || !salon?.professionals) return [];
    return salon.professionals.filter((pro: any) =>
      pro.services?.some((s: any) => s.serviceId === selectedService)
    );
  }, [selectedService, salon]);

  /**
   * Génère des noms d'affichage courts et uniques pour les professionnels.
   * - Si un seul pro a ce prénom → affiche juste le prénom ("Camille")
   * - Si plusieurs pros ont le même prénom → ajoute progressivement des lettres
   *   du nom de famille jusqu'à désambiguïsation ("Camille R", "Camille D", etc.)
   * - S'arrête après 10 caractères max du nom de famille
   *
   * Retourne une Map<professionalId, displayName>
   */
  const proDisplayNames = useMemo(() => {
    const names = new Map<string, string>();
    const pros = salon?.professionals || [];

    // Regrouper les pros par prénom
    const byFirstName = new Map<string, any[]>();
    for (const pro of pros) {
      const fn = pro.user.firstName || '';
      if (!byFirstName.has(fn)) byFirstName.set(fn, []);
      byFirstName.get(fn)!.push(pro);
    }

    for (const [, group] of byFirstName) {
      if (group.length === 1) {
        // Prénom unique → pas de désambiguïsation nécessaire
        names.set(group[0].id, group[0].user.firstName);
      } else {
        // Prénoms en doublon → ajouter lettre(s) du nom progressivement
        let charIndex = 0;
        let resolved = false;
        while (!resolved) {
          const seen = new Map<string, any[]>();
          for (const pro of group) {
            const suffix = (pro.user.lastName || '').substring(0, charIndex + 1).toUpperCase();
            const key = `${pro.user.firstName} ${suffix}`;
            if (!seen.has(key)) seen.set(key, []);
            seen.get(key)!.push(pro);
          }
          if ([...seen.values()].every(g => g.length === 1) || charIndex >= 10) {
            for (const [displayName, g] of seen) {
              names.set(g[0].id, displayName);
            }
            resolved = true;
          } else {
            charIndex++;
          }
        }
      }
    }
    return names;
  }, [salon]);

  /**
   * Ensemble des IDs de services proposés par au moins un professionnel.
   * Sert à filtrer les services affichés dans la page de réservation :
   * un service sans aucun pro ne sera pas affiché (ex: "Brushing" que personne ne propose).
   */
  const offeredServiceIds = useMemo(() => {
    if (!salon?.professionals) return new Set<string>();
    const ids = new Set<string>();
    for (const pro of salon.professionals) {
      for (const ps of (pro as any).services || []) {
        ids.add(ps.serviceId);
      }
    }
    return ids;
  }, [salon]);

  /**
   * Soumet la réservation au backend.
   * - Construit un objet Date à partir de la date + heure sélectionnées
   * - Si "Peu importe" : professionalId n'est pas envoyé → le backend auto-assigne un pro disponible
   * - Si pro spécifique : professionalId est envoyé pour réserver avec ce pro
   */
  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !salon) return;

    setIsBooking(true);

    const timeParts = selectedTime.split(':').map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    createBookingMutation.mutate({
      professionalId: isPeuImporte ? undefined : (selectedProfessional || undefined),
      salonId: salon.id,
      serviceIds: [selectedService],
      startTime: startTime,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-sand-200 rounded w-1/2" />
            <div className="h-64 bg-sand-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-coffee-800 mb-4">Salon introuvable</h1>
          <Link href="/search">
            <Button>Retour à la recherche</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-coffee-500 mb-6">
          <Link href={`/salon/${slug}`} className="hover:text-cream-700">
            {salon.name}
          </Link>
          <span>/</span>
          <span className="text-coffee-800">Réservation</span>
        </div>

        <h1 className="text-3xl font-bold text-coffee-800 mb-8">Réserver un rendez-vous</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[
            { num: 1, label: 'Prestation' },
            { num: 2, label: 'Date & Heure' },
            { num: 3, label: 'Confirmation' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s.num ? 'bg-cream-600 text-white' : 'bg-sand-200 text-coffee-500'
                }`}
              >
                {s.num}
              </div>
              <span
                className={`ml-2 hidden sm:block ${
                  step >= s.num ? 'text-coffee-800' : 'text-coffee-400'
                }`}
              >
                {s.label}
              </span>
              {i < 2 && <div className="w-16 h-0.5 mx-4 bg-sand-200" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Service FIRST, then Professional dynamically */}
            {step === 1 && (
              <Card>
                {/* Service Selection */}
                <h2 className="text-xl font-semibold text-coffee-800 mb-6">
                  Choisissez une prestation
                </h2>
                {/* Affichage des catégories → sous-catégories → services.
                    Seuls les services proposés par au moins un pro sont affichés.
                    Les catégories/sous-catégories vides après filtrage sont masquées. */}
                <div className="space-y-6">
                  {categoriesData?.map((category) => {
                    // Filtrer les sous-catégories : ne garder que les services proposés par un pro
                    const filteredChildren = ((category as any).children || [])
                      .map((subCat: any) => ({
                        ...subCat,
                        services: (subCat.services || []).filter((s: any) => offeredServiceIds.has(s.id)),
                      }))
                      .filter((subCat: any) => subCat.services.length > 0);

                    // Filtrer les services directs de la catégorie (sans sous-catégorie)
                    const filteredDirectServices = (category.services || []).filter((s: any) => offeredServiceIds.has(s.id));

                    // Masquer la catégorie entière si aucun service après filtrage
                    if (filteredChildren.length === 0 && filteredDirectServices.length === 0) return null;

                    return (
                    <div key={category.id}>
                      <h3 className="text-sm font-semibold text-cream-700 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
                        {category.icon && <span>{category.icon}</span>}
                        {category.name}
                      </h3>

                      {/* Sub-categories */}
                      {filteredChildren.map((subCat: any) => (
                        <div key={subCat.id} className="ml-3 mb-3">
                          <p className="text-xs font-medium text-coffee-500 mb-2 flex items-center gap-1">
                            {subCat.icon && <span>{subCat.icon}</span>}
                            {subCat.name}
                          </p>
                          <div className="space-y-2">
                            {subCat.services.map((service: any) => (
                              <div
                                key={service.id}
                                onClick={() => {
                                  setSelectedService(service.id);
                                  setSelectedProfessional(null);
                                }}
                                className={`p-4 rounded-xl cursor-pointer transition border-2 ${
                                  selectedService === service.id
                                    ? 'border-cream-500 bg-cream-50'
                                    : 'border-transparent bg-sand-50 hover:bg-sand-100'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-coffee-800">{service.name}</h4>
                                    <p className="text-sm text-coffee-500">{service.durationMinutes} min</p>
                                  </div>
                                  <span className="font-semibold text-cream-700">
                                    {(service.price / 100).toFixed(2)} €
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Direct services */}
                      <div className="space-y-2">
                        {filteredDirectServices.map((service: any) => (
                          <div
                            key={service.id}
                            onClick={() => {
                              setSelectedService(service.id);
                              setSelectedProfessional(null);
                            }}
                            className={`p-4 rounded-xl cursor-pointer transition border-2 ${
                              selectedService === service.id
                                ? 'border-cream-500 bg-cream-50'
                                : 'border-transparent bg-sand-50 hover:bg-sand-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-coffee-800">{service.name}</h4>
                                <p className="text-sm text-coffee-500">{service.durationMinutes} min</p>
                              </div>
                              <span className="font-semibold text-cream-700">
                                {(service.price / 100).toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    );
                  })}

                  {(!categoriesData || categoriesData.length === 0) && (
                    <p className="text-coffee-500 text-center py-4">
                      Aucune prestation disponible.
                    </p>
                  )}
                </div>

                {/* Section "Avec qui ?" — apparaît dynamiquement après sélection d'un service.
                    Visible uniquement si au moins 1 pro propose le service sélectionné.
                    "Peu importe" n'apparaît que si 2+ pros proposent ce service. */}
                {selectedService && availableProsForService.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-coffee-800 mb-4">
                      Avec qui ?
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      {/* "Peu importe" option — only if 2+ pros offer this service */}
                      {availableProsForService.length >= 2 && (
                      <div
                        onClick={() => setSelectedProfessional('peu_importe')}
                        className={`p-4 rounded-xl cursor-pointer transition border-2 ${
                          isPeuImporte
                            ? 'border-cream-500 bg-cream-50'
                            : 'border-transparent bg-sand-50 hover:bg-sand-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-cream-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-coffee-800">Peu importe</p>
                            <p className="text-sm text-coffee-500">Premier disponible</p>
                          </div>
                        </div>
                      </div>
                      )}

                      {/* Individual professionals who offer this service */}
                      {availableProsForService.map((pro: any) => (
                        <div
                          key={pro.id}
                          onClick={() => setSelectedProfessional(pro.id)}
                          className={`p-4 rounded-xl cursor-pointer transition border-2 ${
                            selectedProfessional === pro.id
                              ? 'border-cream-500 bg-cream-50'
                              : 'border-transparent bg-sand-50 hover:bg-sand-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {pro.user.avatar ? (
                              <img
                                src={pro.user.avatar}
                                alt={proDisplayNames.get(pro.id) || pro.user.firstName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center">
                                <span className="text-cream-700 font-medium text-sm">
                                  {pro.user.firstName?.charAt(0)}
                                </span>
                              </div>
                            )}
                            <p className="font-medium text-coffee-800">
                              {proDisplayNames.get(pro.id) || pro.user.firstName}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bouton "Continuer" — désactivé tant que service ET professionnel ne sont pas choisis */}
                <div className="mt-8">
                  <Button
                    fullWidth
                    disabled={!selectedService || !selectedProfessional}
                    onClick={() => setStep(2)}
                  >
                    Continuer
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 2 && (
              <Card>
                <h2 className="text-xl font-semibold text-coffee-800 mb-6">
                  Choisissez une date et un horaire
                </h2>

                {/* Date Selection */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-coffee-800 mb-4">Date</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {dates.map((date) => (
                      <button
                        key={date.value}
                        onClick={() => {
                          setSelectedDate(date.value);
                          setSelectedTime(null);
                        }}
                        className={`flex-shrink-0 p-3 rounded-xl text-center min-w-[80px] transition ${
                          selectedDate === date.value
                            ? 'bg-cream-600 text-white'
                            : 'bg-sand-100 text-coffee-700 hover:bg-sand-200'
                        }`}
                      >
                        <p className="text-xs uppercase">{date.label.split(' ')[0]}</p>
                        <p className="text-lg font-bold">{date.label.split(' ')[1]}</p>
                        <p className="text-xs">{date.label.split(' ')[2]}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <h3 className="text-lg font-medium text-coffee-800 mb-4">Horaires disponibles</h3>
                    {isLoadingAvailability ? (
                      <div className="grid grid-cols-4 gap-2">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="h-12 bg-sand-200 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : availability && availability.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {availability.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={`p-3 rounded-lg text-center transition ${
                              selectedTime === slot.time
                                ? 'bg-cream-600 text-white'
                                : slot.available
                                ? 'bg-sand-100 text-coffee-700 hover:bg-sand-200'
                                : 'bg-sand-50 text-coffee-300 cursor-not-allowed'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-coffee-500 text-center py-8">
                        Aucun créneau disponible pour cette date.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-8 flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Retour
                  </Button>
                  <Button
                    fullWidth
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setStep(3)}
                  >
                    Continuer
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <Card>
                <h2 className="text-xl font-semibold text-coffee-800 mb-6">
                  Confirmez votre réservation
                </h2>

                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-sand-50 rounded-xl">
                    <p className="text-sm text-coffee-500">Prestation</p>
                    <p className="font-medium text-coffee-800">{selectedServiceData?.name}</p>
                    <p className="text-sm text-coffee-600">
                      {selectedServiceData?.durationMinutes} min - {selectedServiceData ? (selectedServiceData.price / 100).toFixed(2) : '0.00'} €
                    </p>
                  </div>

                  <div className="p-4 bg-sand-50 rounded-xl">
                    <p className="text-sm text-coffee-500">Professionnel</p>
                    <p className="font-medium text-coffee-800">
                      {isPeuImporte
                        ? 'Peu importe (premier disponible)'
                        : selectedProfessional && proDisplayNames.get(selectedProfessional)
                        ? proDisplayNames.get(selectedProfessional)
                        : '-'
                      }
                    </p>
                  </div>

                  <div className="p-4 bg-sand-50 rounded-xl">
                    <p className="text-sm text-coffee-500">Date et heure</p>
                    <p className="font-medium text-coffee-800">
                      {new Date(selectedDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-coffee-700">{selectedTime}</p>
                  </div>

                  <div className="p-4 bg-sand-50 rounded-xl">
                    <p className="text-sm text-coffee-500">Lieu</p>
                    <p className="font-medium text-coffee-800">{salon.name}</p>
                    <p className="text-sm text-coffee-600">
                      {salon.address}, {salon.postalCode} {salon.city}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-cream-50 border border-cream-200 rounded-xl mb-8">
                  <p className="text-sm text-coffee-600">
                    En confirmant, vous acceptez les conditions d'annulation du salon
                    (annulation possible jusqu'à {salon.cancellationPolicyHours}h avant le RDV).
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Retour
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleBooking}
                    disabled={isBooking}
                  >
                    {isBooking ? 'Réservation en cours...' : 'Confirmer la réservation'}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar Summary */}
          <div>
            <Card className="sticky top-24">
              <h3 className="text-lg font-semibold text-coffee-800 mb-4">Récapitulatif</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-coffee-500">Salon</p>
                  <p className="font-medium text-coffee-800">{salon.name}</p>
                </div>

                {selectedServiceData && (
                  <div>
                    <p className="text-sm text-coffee-500">Prestation</p>
                    <p className="font-medium text-coffee-800">{selectedServiceData.name}</p>
                    <p className="text-sm text-coffee-600">{selectedServiceData.durationMinutes} min</p>
                  </div>
                )}

                {selectedProfessional && (
                  <div>
                    <p className="text-sm text-coffee-500">Professionnel</p>
                    <p className="font-medium text-coffee-800">
                      {isPeuImporte
                        ? 'Peu importe'
                        : proDisplayNames.get(selectedProfessional) || '-'
                      }
                    </p>
                  </div>
                )}

                {selectedDate && (
                  <div>
                    <p className="text-sm text-coffee-500">Date</p>
                    <p className="font-medium text-coffee-800">
                      {new Date(selectedDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </div>
                )}

                {selectedTime && (
                  <div>
                    <p className="text-sm text-coffee-500">Heure</p>
                    <p className="font-medium text-coffee-800">{selectedTime}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-sand-200">
                  <div className="flex justify-between">
                    <span className="font-medium text-coffee-800">Total</span>
                    <span className="font-bold text-cream-700">
                      {selectedServiceData ? (selectedServiceData.price / 100).toFixed(2) : '0.00'} €
                    </span>
                  </div>

                  {requiresDeposit && selectedServiceData && (
                    <div className="mt-3 p-3 bg-sage-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="info">Acompte requis</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-coffee-600">À payer maintenant ({depositPercentage}%)</span>
                        <span className="font-semibold text-sage-700">
                          {(depositAmount / 100).toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-coffee-500">
                        <span>Reste à payer sur place</span>
                        <span>{((totalPrice - depositAmount) / 100).toFixed(2)} €</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && createdAppointmentId && selectedServiceData && salon && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            router.push(`/booking/confirmation?id=${createdAppointmentId}`);
          }}
          appointmentId={createdAppointmentId}
          salonName={salon.name}
          services={[{
            name: selectedServiceData.name,
            price: selectedServiceData.price,
            duration: selectedServiceData.durationMinutes,
          }]}
          depositPercentage={depositPercentage}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
