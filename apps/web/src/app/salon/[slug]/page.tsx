'use client';

import { trpc } from '@/lib/trpc/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useMemo } from 'react';
import { Button, Card, Header } from '@/components/ui';

export default function SalonDetailPage() {
  const params = useParams();
  // const router = useRouter();
  const slug = params['slug'] as string;

  const { data: salon, isLoading, error } = trpc.salon.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const { data: user } = trpc.auth.me.useQuery();
  const { data: favoriteStatus } = trpc.salon.isFavorite.useQuery(
    { salonId: salon?.id || '' },
    { enabled: !!salon?.id && !!user }
  );

  const utils = trpc.useUtils();
  const toggleFavoriteMutation = trpc.salon.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.salon.isFavorite.invalidate({ salonId: salon?.id || '' });
      utils.salon.getFavorites.invalidate();
    },
  });

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const prosSectionRef = useRef<HTMLDivElement>(null);
  const servicesSectionRef = useRef<HTMLDivElement>(null);

  const handleSelectService = (serviceId: string) => {
    if (selectedService === serviceId) {
      setSelectedService(null);
      return;
    }
    setSelectedService(serviceId);
    setTimeout(() => prosSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  // Grouper les services du salon par catégorie (source de vérité = salon.services dans getBySlug)
  const servicesByCategory = useMemo(() => {
    if (!salon?.services) return [];
    const groups = new Map<string, { category: any; services: any[] }>();
    for (const service of (salon.services as any[])) {
      const catId = service.category.id;
      if (!groups.has(catId)) {
        groups.set(catId, { category: service.category, services: [] });
      }
      groups.get(catId)!.services.push(service);
    }
    for (const group of groups.values()) {
      group.services.sort((a: any, b: any) => a.order - b.order);
    }
    return Array.from(groups.values());
  }, [salon]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="animate-pulse">
            <div className="h-64 bg-sand-200 rounded-2xl mb-8" />
            <div className="h-8 bg-sand-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-sand-200 rounded w-1/2 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-sand-200 rounded-xl" />
                ))}
              </div>
              <div className="h-96 bg-sand-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-6xl text-center">
          <h1 className="text-3xl font-bold text-coffee-800 mb-4">Salon introuvable</h1>
          <p className="text-coffee-600 mb-8">Ce salon n'existe pas ou a été supprimé.</p>
          <Link href="/search">
            <Button>Retour à la recherche</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate average rating
  const averageRating = salon.reviews && salon.reviews.length > 0
    ? (salon.reviews.reduce((sum, r) => sum + r.rating, 0) / salon.reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
      <Header />

      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-cream-400 to-cream-600">
        {salon.coverImage && (
          <img
            src={salon.coverImage}
            alt={salon.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Favorite Button */}
        {user && (
          <button
            onClick={() => toggleFavoriteMutation.mutate({ salonId: salon.id })}
            disabled={toggleFavoriteMutation.isPending}
            className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition-all ${
              favoriteStatus?.isFavorite
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-white/90 hover:bg-white text-coffee-600 hover:text-red-500'
            } ${toggleFavoriteMutation.isPending ? 'opacity-50' : ''}`}
            aria-label={favoriteStatus?.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <svg
              className="w-6 h-6"
              fill={favoriteStatus?.isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-end gap-4">
              {salon.logo ? (
                <img
                  src={salon.logo}
                  alt={salon.name}
                  className="w-20 h-20 rounded-xl border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl border-4 border-white shadow-lg bg-cream-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{salon.name.charAt(0)}</span>
                </div>
              )}
              <div className="text-white mb-2">
                <h1 className="text-3xl font-bold">{salon.name}</h1>
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {salon.address}, {salon.city}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card padding="md" className="text-center">
                <div className="text-2xl font-bold text-cream-700">
                  {averageRating || '-'}
                </div>
                <div className="text-sm text-coffee-600">
                  {averageRating && (
                    <span className="text-yellow-500">{'★'.repeat(Math.round(Number(averageRating)))}</span>
                  )}
                </div>
                <div className="text-xs text-coffee-500">{salon._count?.reviews || 0} avis</div>
              </Card>

              <Card padding="md" className="text-center">
                <div className="text-2xl font-bold text-cream-700">
                  {salon.services?.length || 0}
                </div>
                <div className="text-sm text-coffee-600">Services</div>
              </Card>

              <Card padding="md" className="text-center">
                <div className="text-2xl font-bold text-cream-700">
                  {salon.professionals?.length || 0}
                </div>
                <div className="text-sm text-coffee-600">Professionnels</div>
              </Card>

              <Card padding="md" className="text-center">
                <div className="text-2xl font-bold text-cream-700">
                  {salon.bookingBufferMinutes || 0}
                </div>
                <div className="text-sm text-coffee-600">Min. avant RDV</div>
              </Card>
            </div>

            {/* Description */}
            {salon.description && (
              <Card>
                <h2 className="text-xl font-semibold text-coffee-800 mb-4">À propos</h2>
                <p className="text-coffee-600 whitespace-pre-line">{salon.description}</p>
              </Card>
            )}

            {/* Services */}
            <Card>
              <div ref={servicesSectionRef}>
              <h2 className="text-xl font-semibold text-coffee-800 mb-6">Nos prestations</h2>
              <div className="space-y-6">
                {servicesByCategory.map(({ category, services }) => (
                  <div key={category.id}>
                    <h3 className="text-lg font-medium text-coffee-700 mb-3 pb-2 border-b border-sand-200 flex items-center gap-2">
                      {category.icon && <span>{category.icon}</span>}
                      {category.name}
                    </h3>
                    <div className="space-y-3">
                      {services.map((service: any) => (
                        <div
                          key={service.id}
                          onClick={() => handleSelectService(service.id)}
                          className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2 ${
                            selectedService === service.id
                              ? 'border-cream-500 bg-cream-50'
                              : 'border-transparent bg-sand-50 hover:bg-sand-100'
                          }`}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-coffee-800">{service.name}</h4>
                            <p className="text-sm text-coffee-500">{service.durationMinutes} min</p>
                          </div>
                          <span className="font-semibold text-cream-700">
                            {(service.price / 100).toFixed(2)} €
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {servicesByCategory.length === 0 && (
                  <p className="text-coffee-500 text-center py-8">
                    Aucune prestation disponible pour le moment.
                  </p>
                )}
              </div>
              </div>
            </Card>

            {/* Section pros — filtrés par spécialité via ProfessionalService */}
            {selectedService && (() => {
              const prosForService = (salon.professionals || []).filter((pro: any) =>
                pro.services?.some((s: any) => s.serviceId === selectedService)
              );
              return (
                <Card>
                  <div ref={prosSectionRef}>
                    <h2 className="text-xl font-semibold text-coffee-800 mb-2">Avec qui ?</h2>
                    {prosForService.length === 0 ? (
                      <p className="text-coffee-500 text-center py-6">
                        Aucun professionnel disponible pour cette prestation.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-coffee-500 mb-6">Choisissez votre professionnel</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {prosForService.map((pro: any) => (
                            <div
                              key={pro.id}
                              // onClick={() => router.push(`/salon/${slug}/book?service=${selectedService}&pro=${pro.id}`)}
                              className="flex items-center justify-between p-4 bg-sand-50 hover:bg-cream-50 border-2 border-transparent hover:border-cream-400 rounded-xl cursor-pointer transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                {pro.user.avatar ? (
                                  <img
                                    src={pro.user.avatar}
                                    alt={`${pro.user.firstName} ${pro.user.lastName}`}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center shrink-0">
                                    <span className="text-cream-700 font-medium">
                                      {pro.user.firstName?.charAt(0)}{pro.user.lastName?.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-coffee-800">{pro.user.firstName} {pro.user.lastName}</p>
                                  <p className="text-sm text-coffee-500">{pro.specialties?.length ? pro.specialties.join(', ') : 'Professionnel'}</p>
                                </div>
                              </div>
                              <svg className="w-5 h-5 text-cream-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          ))}
                          {prosForService.length >= 2 && (
                            <div
                              // onClick={() => router.push(`/salon/${slug}/book?service=${selectedService}&pro=peu_importe`)}
                              className="flex items-center justify-between p-4 bg-sand-50 hover:bg-cream-50 border-2 border-transparent hover:border-cream-400 rounded-xl cursor-pointer transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-sand-200 flex items-center justify-center shrink-0">
                                  <svg className="w-6 h-6 text-coffee-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-medium text-coffee-800">Peu importe</p>
                                  <p className="text-sm text-coffee-500">Le premier professionnel disponible</p>
                                </div>
                              </div>
                              <svg className="w-5 h-5 text-cream-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              );
            })()}

            {/* Notre équipe — visible uniquement si aucun service sélectionné */}
            {!selectedService && salon.professionals && salon.professionals.length > 0 && (
              <Card>
                <h2 className="text-xl font-semibold text-coffee-800 mb-6">Notre équipe</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {salon.professionals.map((pro) => (
                    <div key={pro.id} className="p-4 rounded-xl bg-sand-50">
                      <div className="flex items-center gap-3">
                        {pro.user.avatar ? (
                          <img
                            src={pro.user.avatar}
                            alt={`${pro.user.firstName} ${pro.user.lastName}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center">
                            <span className="text-cream-700 font-medium">
                              {pro.user.firstName?.charAt(0)}{pro.user.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-coffee-800">{pro.user.firstName} {pro.user.lastName}</p>
                          <p className="text-sm text-coffee-500">{pro.specialties?.length ? pro.specialties.join(', ') : 'Professionnel'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Reviews */}
            {salon.reviews && salon.reviews.length > 0 && (
              <Card>
                <h2 className="text-xl font-semibold text-coffee-800 mb-6">
                  Avis clients ({salon._count?.reviews || salon.reviews.length})
                </h2>
                <div className="space-y-4">
                  {salon.reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-sand-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center">
                            <span className="text-cream-700 font-medium text-sm">
                              {review.client?.user?.firstName?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-coffee-800">
                              {review.client?.user?.firstName || 'Utilisateur'}
                            </p>
                            <p className="text-xs text-coffee-500">
                              {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-yellow-500">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-coffee-600 mt-2">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Book Card */}
            <Card className="sticky top-24">
              <h3 className="text-lg font-semibold text-coffee-800 mb-4">Réserver</h3>
              <p className="text-sm text-coffee-500 mb-4">
                Prenez rendez-vous en quelques clics
              </p>
              <Button
                fullWidth
                onClick={() => servicesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Prendre rendez-vous
              </Button>
            </Card>

            {/* Contact Info */}
            <Card>
              <h3 className="text-lg font-semibold text-coffee-800 mb-4">Contact</h3>
              <div className="space-y-3">
                <a
                  href={`tel:${salon.phone}`}
                  className="flex items-center gap-3 text-coffee-600 hover:text-cream-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {salon.phone}
                </a>

                <a
                  href={`mailto:${salon.email}`}
                  className="flex items-center gap-3 text-coffee-600 hover:text-cream-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {salon.email}
                </a>

                {salon.website && (
                  <a
                    href={salon.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-coffee-600 hover:text-cream-700 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Site web
                  </a>
                )}

                <div className="flex items-start gap-3 text-coffee-600">
                  <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p>{salon.address}</p>
                    <p>{salon.postalCode} {salon.city}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Policies */}
            <Card>
              <h3 className="text-lg font-semibold text-coffee-800 mb-4">Informations</h3>
              <div className="space-y-2 text-sm text-coffee-600">
                <p>
                  <span className="font-medium">Annulation :</span>{' '}
                  {salon.cancellationPolicyHours}h avant le RDV
                </p>
                {salon.depositRequired && (
                  <p>
                    <span className="font-medium">Acompte requis :</span>{' '}
                    {salon.depositPercentage}%
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
