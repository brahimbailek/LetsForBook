'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button, Card, Header, Modal } from '@/components/ui';
import { ReviewForm } from '@/components/reviews';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'reviews' | 'favorites' | 'settings'>('bookings');
  const [reviewingAppointment, setReviewingAppointment] = useState<{
    id: string;
    salonName: string;
    salonLogo?: string | null;
    serviceName: string;
    date: Date;
  } | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const { data: user, isLoading: isLoadingUser } = trpc.auth.me.useQuery();

  // Initialize form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const utils = trpc.useUtils();
  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      setProfileSuccess(true);
      setProfileError(null);
      utils.auth.me.invalidate();
      setTimeout(() => setProfileSuccess(false), 3000);
    },
    onError: (error) => {
      setProfileError(error.message);
      setProfileSuccess(false);
    },
  });
  const { data: bookings, isLoading: isLoadingBookings } = trpc.booking.getMyBookings.useQuery(
    { status: 'all' },
    { enabled: !!user }
  );
  const { data: favorites, isLoading: isLoadingFavorites } = trpc.salon.getFavorites.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: reviewableAppointments } = trpc.review.getReviewableAppointments.useQuery(
    { limit: 10 },
    { enabled: !!user }
  );
  const { data: myReviews, isLoading: isLoadingMyReviews } = trpc.review.getMyReviews.useQuery(
    { limit: 20 },
    { enabled: !!user }
  );

  const cancelBookingMutation = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      // Refetch bookings
      window.location.reload();
    },
  });

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-sand-200 rounded-2xl" />
            <div className="h-64 bg-sand-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-coffee-800 mb-4">Connexion requise</h1>
          <p className="text-coffee-600 mb-8">
            Vous devez être connecté pour accéder à votre profil.
          </p>
          <Link href="/login">
            <Button>Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings?.items?.filter(b =>
    new Date(b.startTime) > new Date() && !['CANCELLED_CLIENT', 'CANCELLED_SALON'].includes(b.status)
  ) || [];
  const pastBookings = bookings?.items?.filter(b =>
    new Date(b.startTime) <= new Date() || ['CANCELLED_CLIENT', 'CANCELLED_SALON', 'COMPLETED', 'NO_SHOW'].includes(b.status)
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-cream-200 flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.firstName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-cream-700">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-coffee-800">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-coffee-600">{user.email}</p>
              <p className="text-sm text-coffee-500 mt-1">
                Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'bookings', label: 'Mes rendez-vous', count: upcomingBookings.length },
            { id: 'reviews', label: 'Mes avis', count: reviewableAppointments?.length || 0 },
            { id: 'favorites', label: 'Favoris', count: favorites?.length || 0 },
            { id: 'settings', label: 'Paramètres' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                activeTab === tab.id
                  ? 'bg-cream-600 text-white'
                  : 'bg-white text-coffee-700 hover:bg-sand-100'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-cream-700' : 'bg-sand-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            <Card>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">
                Rendez-vous à venir
              </h2>
              {isLoadingBookings ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-sand-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 bg-sand-50 rounded-xl"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-coffee-800">
                            {booking.services.map(s => s.serviceName).join(', ')}
                          </h3>
                          <p className="text-coffee-600">{booking.salon.name}</p>
                          <p className="text-sm text-coffee-500 mt-1">
                            {new Date(booking.startTime).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}{' '}
                            à{' '}
                            {new Date(booking.startTime).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {booking.professional && (
                            <p className="text-sm text-coffee-500">
                              Avec {booking.professional.user.firstName} {booking.professional.user.lastName}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-sand-200 text-coffee-600'
                          }`}>
                            {booking.status === 'CONFIRMED' ? 'Confirmé' :
                             booking.status === 'PENDING' ? 'En attente' : booking.status}
                          </span>
                          <p className="font-semibold text-cream-700 mt-2">
                            {(booking.services.reduce((sum, s) => sum + s.price, 0) / 100).toFixed(2)} €
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Link href={`/salon/${booking.salon.slug}`}>
                          <Button variant="outline" size="sm">
                            Voir le salon
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
                              cancelBookingMutation.mutate({ id: booking.id });
                            }
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-coffee-500 text-center py-8">
                  Aucun rendez-vous à venir.{' '}
                  <Link href="/search" className="text-cream-700 hover:underline">
                    Réserver maintenant
                  </Link>
                </p>
              )}
            </Card>

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <Card>
                <h2 className="text-xl font-semibold text-coffee-800 mb-4">
                  Historique
                </h2>
                <div className="space-y-4">
                  {pastBookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 bg-sand-50 rounded-xl opacity-75"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-coffee-700">
                            {booking.services.map(s => s.serviceName).join(', ')}
                          </h3>
                          <p className="text-sm text-coffee-500">{booking.salon.name}</p>
                          <p className="text-sm text-coffee-400">
                            {new Date(booking.startTime).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          booking.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : ['CANCELLED_CLIENT', 'CANCELLED_SALON'].includes(booking.status)
                            ? 'bg-red-100 text-red-700'
                            : 'bg-sand-200 text-coffee-600'
                        }`}>
                          {booking.status === 'COMPLETED' ? 'Terminé' :
                           ['CANCELLED_CLIENT', 'CANCELLED_SALON'].includes(booking.status) ? 'Annulé' :
                           booking.status === 'NO_SHOW' ? 'Absent' : booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Reviewable Appointments */}
            {reviewableAppointments && reviewableAppointments.length > 0 && (
              <Card>
                <h2 className="text-xl font-semibold text-coffee-800 mb-4">
                  En attente de votre avis
                </h2>
                <p className="text-coffee-600 text-sm mb-4">
                  Partagez votre expérience pour aider les autres clients !
                </p>
                <div className="space-y-4">
                  {reviewableAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 bg-sage-50 rounded-xl border border-sage-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-sage-200 flex items-center justify-center">
                            {appointment.salon.logo ? (
                              <img
                                src={appointment.salon.logo}
                                alt={appointment.salon.name}
                                className="w-full h-full rounded-xl object-cover"
                              />
                            ) : (
                              <span className="text-lg font-bold text-sage-700">
                                {appointment.salon.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-coffee-800">
                              {appointment.salon.name}
                            </h3>
                            <p className="text-sm text-coffee-600">
                              {appointment.services.map(s => s.serviceName).join(', ')}
                            </p>
                            <p className="text-xs text-coffee-500">
                              {new Date(appointment.startTime).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setReviewingAppointment({
                            id: appointment.id,
                            salonName: appointment.salon.name,
                            salonLogo: appointment.salon.logo,
                            serviceName: appointment.services.map(s => s.serviceName).join(', '),
                            date: new Date(appointment.startTime),
                          })}
                        >
                          Donner mon avis
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* My Reviews */}
            <Card>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">
                Mes avis publiés
              </h2>
              {isLoadingMyReviews ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-sand-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : myReviews?.items && myReviews.items.length > 0 ? (
                <div className="space-y-4">
                  {myReviews.items.map((review) => (
                    <div key={review.id} className="p-4 bg-sand-50 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-coffee-800">
                            {review.salon.name}
                          </h3>
                          <p className="text-xs text-coffee-500">
                            {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400' : 'text-sand-300'}`}
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-coffee-600 text-sm mb-3">
                          {review.comment}
                        </p>
                      )}
                      {review.response && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-sand-200">
                          <p className="text-xs font-medium text-coffee-700 mb-1">
                            Réponse du salon :
                          </p>
                          <p className="text-sm text-coffee-600">
                            {review.response}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-coffee-500 text-center py-8">
                  Vous n'avez pas encore publié d'avis.
                </p>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'favorites' && (
          <Card>
            <h2 className="text-xl font-semibold text-coffee-800 mb-4">
              Mes salons favoris
            </h2>
            {isLoadingFavorites ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-32 bg-sand-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : favorites && favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((salon) => (
                  <Link
                    key={salon.id}
                    href={`/salon/${salon.slug}`}
                    className="p-4 bg-sand-50 rounded-xl hover:bg-sand-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-cream-200 flex items-center justify-center flex-shrink-0">
                        {salon.logo ? (
                          <img src={salon.logo} alt={salon.name} className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-cream-700">{salon.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-coffee-800">{salon.name}</h3>
                        <p className="text-sm text-coffee-500">{salon.city}</p>
                        <p className="text-xs text-coffee-400">
                          {salon._count?.services || 0} services
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-coffee-500 text-center py-8">
                Aucun salon favori.{' '}
                <Link href="/search" className="text-cream-700 hover:underline">
                  Découvrir des salons
                </Link>
              </p>
            )}
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card>
            <h2 className="text-xl font-semibold text-coffee-800 mb-6">
              Paramètres du compte
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfileMutation.mutate(profileForm);
              }}
              className="space-y-6"
            >
              {profileSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                  Profil mis à jour avec succès !
                </div>
              )}
              {profileError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  {profileError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-cream-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-cream-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-sand-50 text-coffee-500"
                />
                <p className="text-xs text-coffee-400 mt-1">L'email ne peut pas être modifié</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-4 py-3 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-cream-500"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>

              <div className="pt-6 border-t border-sand-200">
                <h3 className="font-medium text-coffee-800 mb-4">Zone de danger</h3>
                <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                  Supprimer mon compte
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Review Modal */}
      {reviewingAppointment && (
        <Modal
          isOpen={!!reviewingAppointment}
          onClose={() => setReviewingAppointment(null)}
          title="Donner votre avis"
        >
          <ReviewForm
            appointmentId={reviewingAppointment.id}
            salonName={reviewingAppointment.salonName}
            salonLogo={reviewingAppointment.salonLogo}
            serviceName={reviewingAppointment.serviceName}
            appointmentDate={reviewingAppointment.date}
            onSuccess={() => setReviewingAppointment(null)}
            onCancel={() => setReviewingAppointment(null)}
          />
        </Modal>
      )}
    </div>
  );
}
