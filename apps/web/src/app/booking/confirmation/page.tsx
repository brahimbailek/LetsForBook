'use client';

import { Suspense } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Header } from '@/components/ui';

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');

  const { data: booking, isLoading } = trpc.booking.getById.useQuery(
    { id: bookingId || '' },
    { enabled: !!bookingId }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-sand-200 rounded-full w-16 mx-auto" />
          <div className="h-8 bg-sand-200 rounded w-3/4 mx-auto" />
          <div className="h-64 bg-sand-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-coffee-800 mb-4">Réservation introuvable</h1>
        <Link href="/">
          <Button>Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      {/* Success Icon */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-coffee-800 mb-2">
          Réservation confirmée !
        </h1>
        <p className="text-coffee-600">
          Un email de confirmation a été envoyé à votre adresse.
        </p>
      </div>

      {/* Booking Details */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold text-coffee-800 mb-6">
          Détails de votre rendez-vous
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-sand-50 rounded-xl">
            <div className="w-12 h-12 bg-cream-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-cream-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-coffee-800">{booking.salon.name}</p>
              <p className="text-sm text-coffee-600">
                {booking.salon.address}, {booking.salon.postalCode} {booking.salon.city}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-sand-50 rounded-xl">
            <div className="w-12 h-12 bg-cream-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-cream-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-coffee-800">
                {booking.services.map(s => s.serviceName).join(', ')}
              </p>
              <p className="text-sm text-coffee-600">
                {booking.services.reduce((sum, s) => sum + s.duration, 0)} min - {booking.services.reduce((sum, s) => sum + s.price, 0).toFixed(2)} €
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-sand-50 rounded-xl">
            <div className="w-12 h-12 bg-cream-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-cream-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-coffee-800">
                {new Date(booking.startTime).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-sm text-coffee-600">
                à {new Date(booking.startTime).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {booking.professional && (
            <div className="flex items-start gap-4 p-4 bg-sand-50 rounded-xl">
              <div className="w-12 h-12 bg-cream-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cream-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-coffee-800">
                  {booking.professional.user.firstName} {booking.professional.user.lastName}
                </p>
                <p className="text-sm text-coffee-600">Votre professionnel</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-cream-50 border border-cream-200 rounded-xl">
          <p className="text-sm text-coffee-600">
            <strong>N° de réservation :</strong> {booking.id.slice(-8).toUpperCase()}
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/profile" className="flex-1">
          <Button fullWidth variant="outline">
            Voir mes rendez-vous
          </Button>
        </Link>
        <Link href="/" className="flex-1">
          <Button fullWidth>
            Retour à l'accueil
          </Button>
        </Link>
      </div>

      {/* Add to Calendar */}
      <div className="mt-8 text-center">
        <p className="text-sm text-coffee-500 mb-4">Ajouter à votre calendrier</p>
        <div className="flex justify-center gap-4">
          <button className="p-2 rounded-lg bg-sand-100 hover:bg-sand-200 transition">
            <svg className="w-6 h-6 text-coffee-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="animate-pulse space-y-6">
        <div className="h-16 bg-sand-200 rounded-full w-16 mx-auto" />
        <div className="h-8 bg-sand-200 rounded w-3/4 mx-auto" />
        <div className="h-64 bg-sand-200 rounded-2xl" />
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
      <Header />
      <Suspense fallback={<LoadingFallback />}>
        <BookingConfirmationContent />
      </Suspense>
    </div>
  );
}
