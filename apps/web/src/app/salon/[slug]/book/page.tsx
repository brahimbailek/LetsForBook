'use client';

import { trpc } from '@/lib/trpc/client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, Header, Badge } from '@/components/ui';
import { PaymentModal } from '@/components/payment';

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params['slug'] as string;

  const serviceId = searchParams.get('service');
  const professionalId = searchParams.get('professional');

  const [selectedService, setSelectedService] = useState<string | null>(serviceId);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(professionalId);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);

  const { data: salon, isLoading } = trpc.salon.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  // Get availability for selected date and professional (use resolvedProfessionalId for "Indifférent" case)
  const { data: availability, isLoading: isLoadingAvailability } = trpc.availability.getSlots.useQuery(
    {
      salonId: salon?.id || '',
      professionalId: selectedProfessional || undefined,
      serviceId: selectedService || undefined,
      date: selectedDate,
    },
    { enabled: !!salon?.id && !!selectedDate && !!selectedService }
  );

  const createBookingMutation = trpc.booking.create.useMutation({
    onSuccess: (data) => {
      // Check if salon requires deposit
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

  // Generate next 14 days for date selection
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

  const selectedServiceData = salon?.services?.find(s => s.id === selectedService);
  const selectedProfessionalData = salon?.professionals?.find(p => p.id === selectedProfessional);

  const requiresDeposit = salon?.depositRequired && salon?.depositPercentage && salon.depositPercentage > 0;
  const depositPercentage = salon?.depositPercentage || 100;
  const totalPrice = selectedServiceData?.price || 0;
  const depositAmount = Math.round((totalPrice * depositPercentage) / 100);

  const handlePaymentSuccess = () => {
    if (createdAppointmentId) {
      router.push(`/booking/confirmation?id=${createdAppointmentId}`);
    }
  };

  // Get the list of professionals who offer the selected service
  const availableProsForService = selectedService && salon
    ? salon.professionals?.filter((pro: any) =>
        pro.services?.some((s: any) => s.serviceId === selectedService)
      ) || []
    : salon?.professionals || [];

  // Resolve the professional ID (auto-select first available if "Indifférent")
  const resolvedProfessionalId = selectedProfessional
    || (availableProsForService.length === 1 ? availableProsForService[0]?.id : null);

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !salon) return;

    // If no professional selected, pick the first one who offers the service
    const proId = resolvedProfessionalId || availableProsForService[0]?.id;
    if (!proId) return;

    setIsBooking(true);

    // Parse time and create start datetime
    const timeParts = selectedTime.split(':').map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    createBookingMutation.mutate({
      professionalId: proId,
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
            {/* Step 1: Select Service */}
            {step === 1 && (
              <Card>
                <h2 className="text-xl font-semibold text-coffee-800 mb-6">
                  Choisissez une prestation
                </h2>
                {(() => {
                  // Group services by category
                  const grouped: Record<string, typeof salon.services> = {};
                  salon.services?.forEach((service) => {
                    const catName = service.category?.name || 'Autres';
                    if (!grouped[catName]) grouped[catName] = [];
                    grouped[catName]!.push(service);
                  });

                  return (
                    <div className="space-y-6">
                      {Object.entries(grouped).map(([categoryName, services]) => (
                        <div key={categoryName}>
                          <h3 className="text-sm font-semibold text-cream-700 uppercase tracking-wider mb-3 px-1">
                            {categoryName}
                          </h3>
                          <div className="space-y-2">
                            {services!.map((service) => (
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
                                    <h3 className="font-medium text-coffee-800">{service.name}</h3>
                                    <p className="text-sm text-coffee-500">{service.durationMinutes} min</p>
                                  </div>
                                  <span className="font-semibold text-cream-700">
                                    {service.price.toFixed(2)} €
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Professional Selection - filtered by selected service */}
                {salon.professionals && salon.professionals.length > 0 && (() => {
                  // Filter professionals who offer the selected service
                  const availablePros = selectedService
                    ? salon.professionals.filter((pro: any) =>
                        pro.services?.some((s: any) => s.serviceId === selectedService)
                      )
                    : salon.professionals;

                  if (availablePros.length === 0) return null;

                  return (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-coffee-800 mb-4">
                        Avec qui ?
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {availablePros.length > 1 && (
                          <div
                            onClick={() => setSelectedProfessional(null)}
                            className={`p-4 rounded-xl cursor-pointer transition border-2 ${
                              !selectedProfessional
                                ? 'border-cream-500 bg-cream-50'
                                : 'border-transparent bg-sand-50 hover:bg-sand-100'
                            }`}
                          >
                            <p className="font-medium text-coffee-800">Indifférent</p>
                            <p className="text-sm text-coffee-500">Premier disponible</p>
                          </div>
                        )}
                        {availablePros.map((pro: any) => (
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
                              <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center">
                                <span className="text-cream-700 font-medium text-sm">
                                  {pro.user.firstName?.charAt(0)}{pro.user.lastName?.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-coffee-800">
                                  {pro.user.firstName} {pro.user.lastName}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-8">
                  <Button
                    fullWidth
                    disabled={!selectedService}
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
                      {selectedServiceData?.durationMinutes} min - {selectedServiceData?.price.toFixed(2)} €
                    </p>
                  </div>

                  {selectedProfessionalData && (
                    <div className="p-4 bg-sand-50 rounded-xl">
                      <p className="text-sm text-coffee-500">Professionnel</p>
                      <p className="font-medium text-coffee-800">
                        {selectedProfessionalData.user.firstName} {selectedProfessionalData.user.lastName}
                      </p>
                    </div>
                  )}

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

                {selectedProfessionalData && (
                  <div>
                    <p className="text-sm text-coffee-500">Professionnel</p>
                    <p className="font-medium text-coffee-800">
                      {selectedProfessionalData.user.firstName} {selectedProfessionalData.user.lastName}
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
                      {selectedServiceData?.price.toFixed(2) || '0.00'} €
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
            // If user closes without paying, redirect to confirmation anyway
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
