'use client';

/**
 * Page de réservation d'un salon (/salon/[slug]/book)
 *
 * Flow progressif sur une seule page :
 *   1. L'utilisateur voit les prestations (seules celles proposées par un pro)
 *   2. Il clique sur une prestation → scroll vers la section "Avec qui ?"
 *   3. Il choisit un pro (ou "Peu importe") → bouton "Choisir un créneau" apparaît
 *   4. Il clique → section date/heure apparaît + scroll
 *   5. Il choisit un créneau → bouton "Réserver" apparaît
 *   6. Il réserve → paiement d'acompte ou confirmation directe
 */

import { trpc } from '@/lib/trpc/client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Button, Card, Header, Badge } from '@/components/ui';
import { PaymentModal } from '@/components/payment';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params['slug'] as string;

  // Pré-sélection via query params ?service=<id>&pro=<id>
  const preselectedService = searchParams.get('service');
  const preselectedPro = searchParams.get('pro');

  // --- État du flow de réservation ---
  const [selectedService, setSelectedService] = useState<string | null>(preselectedService);
  // null = pas encore choisi, 'peu_importe' = n'importe quel pro, CUID = pro spécifique
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(preselectedPro);
  // Si service+pro déjà dans l'URL, ouvrir directement le date picker
  const [showDatePicker, setShowDatePicker] = useState(!!(preselectedService && preselectedPro));
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);

  const isPeuImporte = selectedProfessional === 'peu_importe';

  // Refs pour le scroll automatique entre les sections
  const proSectionRef = useRef<HTMLDivElement>(null);
  const dateSectionRef = useRef<HTMLDivElement>(null);
  const timeSectionRef = useRef<HTMLDivElement>(null);
  const bookingSectionRef = useRef<HTMLDivElement>(null);
  // Timer du scroll vers "Avec qui?" — annulé si l'user clique un pro avant qu'il fire
  const serviceScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollTo = (el: HTMLDivElement | null) => {
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const { data: salon, isLoading } = trpc.salon.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  // Scroll vers le date picker au premier rendu si service+pro pré-sélectionnés
  useEffect(() => {
    if (!preselectedService || !preselectedPro) return;
    scrollTo(dateSectionRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quand le salon charge sans pro pré-sélectionné → scroll vers les pros
  useEffect(() => {
    if (!salon || !preselectedService || preselectedPro) return;
    setTimeout(() => proSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon]);

  // Scroll vers les horaires après choix d'une date
  useEffect(() => {
    if (!selectedDate) return;
    const timer = setTimeout(() => scrollTo(timeSectionRef.current), 150);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  // Scroll vers le bouton Réserver après choix d'un horaire
  useEffect(() => {
    if (!selectedTime) return;
    const timer = setTimeout(() => scrollTo(bookingSectionRef.current), 100);
    return () => clearTimeout(timer);
  }, [selectedTime]);

  const { data: availability, isLoading: isLoadingAvailability } = trpc.availability.getSlots.useQuery(
    {
      salonId: salon?.id || '',
      professionalId: isPeuImporte ? undefined : (selectedProfessional || undefined),
      serviceId: selectedService || undefined,
      date: selectedDate,
    },
    { enabled: !!salon?.id && !!selectedDate && !!selectedService && !!selectedProfessional && showDatePicker }
  );

  const { data: categoriesData } = trpc.category.getBySalonId.useQuery(
    { salonId: salon?.id || '' },
    { enabled: !!salon?.id }
  );

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

  // 14 prochains jours pour la sélection de date
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const isoDate = date.toISOString().split('T')[0] as string;
    return {
      value: isoDate,
      label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  });

  const selectedServiceData = salon?.services?.find(s => s.id === selectedService);

  const requiresDeposit = salon?.depositRequired && salon?.depositPercentage && salon.depositPercentage > 0;
  const depositPercentage = salon?.depositPercentage || 100;
  const totalPrice = selectedServiceData?.price || 0;
  const depositAmount = Math.round((totalPrice * depositPercentage) / 100);

  const handlePaymentSuccess = () => {
    if (createdAppointmentId) {
      router.push(`/booking/confirmation?id=${createdAppointmentId}`);
    }
  };

  /** Pros qui proposent le service sélectionné */
  const availableProsForService = useMemo(() => {
    if (!selectedService || !salon?.professionals) return [];
    return salon.professionals.filter((pro: any) =>
      pro.services?.some((s: any) => s.serviceId === selectedService)
    );
  }, [selectedService, salon]);

  /** Noms d'affichage uniques (désambiguïsation par nom de famille si doublons de prénom) */
  const proDisplayNames = useMemo(() => {
    const names = new Map<string, string>();
    const pros = salon?.professionals || [];
    const byFirstName = new Map<string, any[]>();
    for (const pro of pros) {
      const fn = pro.user.firstName || '';
      if (!byFirstName.has(fn)) byFirstName.set(fn, []);
      byFirstName.get(fn)!.push(pro);
    }
    for (const [, group] of byFirstName) {
      if (group.length === 1) {
        names.set(group[0].id, group[0].user.firstName);
      } else {
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

  /** IDs de services proposés par au moins un pro (filtre les services orphelins) */
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

  // Quand on sélectionne un service → reset pro + date picker (reclique = désélection)
  const handleSelectService = (serviceId: string) => {
    if (selectedService === serviceId) {
      setSelectedService(null);
      setSelectedProfessional(null);
      setShowDatePicker(false);
      setSelectedDate('');
      setSelectedTime(null);
      return;
    }
    setSelectedService(serviceId);
    setSelectedProfessional(null);
    setShowDatePicker(false);
    setSelectedDate('');
    setSelectedTime(null);
    if (serviceScrollTimer.current) clearTimeout(serviceScrollTimer.current);
    serviceScrollTimer.current = setTimeout(() => {
      proSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      serviceScrollTimer.current = null;
    }, 100);
  };

  // Quand on sélectionne un pro → ouvre le date picker
  // On annule aussi le scroll vers "Avec qui?" s'il était encore en attente
  const handleSelectProfessional = (proId: string) => {
    if (serviceScrollTimer.current) {
      clearTimeout(serviceScrollTimer.current);
      serviceScrollTimer.current = null;
    }
    setSelectedProfessional(proId);
    setShowDatePicker(true);
    setSelectedDate('');
    setSelectedTime(null);
  };

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Section 1 : Prestations */}
            <Card>
              <h2 className="text-xl font-semibold text-coffee-800 mb-6">
                Choisissez une prestation
              </h2>
              <div className="space-y-6">
                {categoriesData?.map((category) => {
                  const filteredChildren = ((category as any).children || [])
                    .map((subCat: any) => ({
                      ...subCat,
                      services: (subCat.services || []).filter((s: any) => offeredServiceIds.has(s.id)),
                    }))
                    .filter((subCat: any) => subCat.services.length > 0);

                  const filteredDirectServices = (category.services || []).filter((s: any) => offeredServiceIds.has(s.id));

                  if (filteredChildren.length === 0 && filteredDirectServices.length === 0) return null;

                  return (
                    <div key={category.id}>
                      <h3 className="text-sm font-semibold text-cream-700 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
                        {category.icon && <span>{category.icon}</span>}
                        {category.name}
                      </h3>

                      {/* Sous-catégories */}
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
                                onClick={() => handleSelectService(service.id)}
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

                      {/* Services directs */}
                      <div className="space-y-2">
                        {filteredDirectServices.map((service: any) => (
                          <div
                            key={service.id}
                            onClick={() => handleSelectService(service.id)}
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
            </Card>

            {/* Section 2 : Choix du professionnel */}
            {selectedService && availableProsForService.length > 0 && (
              <Card>
                <div ref={proSectionRef}>
                  <h2 className="text-xl font-semibold text-coffee-800 mb-4">
                    Avec qui ?
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Professionnels individuels */}
                    {availableProsForService.map((pro: any) => (
                      <div
                        key={pro.id}
                        onClick={() => handleSelectProfessional(pro.id)}
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

                    {/* "Peu importe" en dernière option — uniquement si 2+ pros proposent ce service */}
                    {availableProsForService.length >= 2 && (
                      <div
                        onClick={() => handleSelectProfessional('peu_importe')}
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
                  </div>

                </div>
              </Card>
            )}

            {/* Section 3 : Date & Heure */}
            {showDatePicker && (
              <Card>
                <div ref={dateSectionRef}>
                  <h2 className="text-xl font-semibold text-coffee-800 mb-6">
                    Choisissez une date et un horaire
                  </h2>

                  {/* Sélection de la date */}
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

                  {/* Sélection de l'heure */}
                  {selectedDate && (
                    <div ref={timeSectionRef}>
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

                  {/* Bouton "Réserver" — apparaît quand un créneau est sélectionné */}
                  {selectedTime && (
                    <div className="mt-8" ref={bookingSectionRef}>
                      <div className="p-4 bg-cream-50 border border-cream-200 rounded-xl mb-4">
                        <p className="text-sm text-coffee-600">
                          En confirmant, vous acceptez les conditions d'annulation du salon
                          (annulation possible jusqu'à {salon.cancellationPolicyHours}h avant le RDV).
                        </p>
                      </div>
                      <Button
                        fullWidth
                        onClick={handleBooking}
                        disabled={isBooking}
                      >
                        {isBooking ? 'Réservation en cours...' : 'Réserver'}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar — Récapitulatif */}
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
