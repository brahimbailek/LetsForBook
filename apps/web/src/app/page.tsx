'use client';

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { Button, Card, Header } from '@/components/ui';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  // Autocomplete states
  const [showQuerySuggestions, setShowQuerySuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const queryInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Autocomplete queries
  const { data: querySuggestions } = trpc.salon.autocomplete.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  const { data: locationSuggestions } = trpc.salon.autocompleteCities.useQuery(
    { query: searchLocation },
    { enabled: searchLocation.length >= 2 }
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (queryInputRef.current && !queryInputRef.current.parentElement?.contains(e.target as Node)) {
        setShowQuerySuggestions(false);
      }
      if (locationInputRef.current && !locationInputRef.current.parentElement?.contains(e.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: salons, isLoading } = trpc.salon.getAll.useQuery({
    limit: 6,
  });

  // Géolocalisation - recherche les salons proches
  const { data: nearbySalons, isLoading: isLoadingNearby } = trpc.salon.search.useQuery(
    {
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      radius: 10, // 10 km de rayon
      limit: 6,
    },
    {
      enabled: !!userLocation, // Ne s'exécute que si on a la position
    }
  );

  // Demander la géolocalisation
  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationPermission('granted');
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
          setLocationPermission('denied');
        }
      );
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchLocation) params.set('city', searchLocation);
    window.location.href = `/search?${params.toString()}`;
  };

  const professions = [
    {
      name: 'Coiffure & Barbier',
      description: 'Coupe, coloration, coiffage',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
        </svg>
      ),
      color: 'from-cream-600 to-cream-700'
    },
    {
      name: 'Beauté & Spa',
      description: 'Soin visage, massage, manucure',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'from-cream-500 to-cream-600'
    },
    {
      name: 'Bien-être',
      description: 'Massage, ostéo, kinésithérapie',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      color: 'from-cream-500 to-cream-600'
    },
    {
      name: 'Fitness & Sport',
      description: 'Coach sportif, yoga, pilates',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'from-coffee-400 to-coffee-500'
    },
    {
      name: 'Tatouage & Piercing',
      description: 'Tatoueurs, pierceurs professionnels',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      color: 'from-sand-400 to-sand-500'
    },
    {
      name: 'Services à domicile',
      description: 'Ménage, jardinage, bricolage',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      color: 'from-cream-400 to-cream-500'
    },
    {
      name: 'Cours particuliers',
      description: 'Musique, langue, soutien scolaire',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-cream-400 to-cream-500'
    },
    {
      name: 'Autres services',
      description: 'Tous les professionnels',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      color: 'from-coffee-300 to-coffee-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-coffee-800 mb-6">
              Trouvez votre professionnel
              <br />
              <span className="text-cream-700">en quelques clics</span>
            </h1>
            <p className="text-xl text-coffee-600 max-w-2xl mx-auto">
              Réservez en ligne vos rendez-vous chez tous types de professionnels : beauté, bien-être, sport, cours, et bien plus
            </p>
          </div>

          {/* Barre de recherche */}
          <Card padding="lg" className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Champ de recherche avec autocomplétion */}
              <div className="md:col-span-6 relative">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-coffee-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    ref={queryInputRef}
                    type="text"
                    placeholder="Coiffeur, massage, coach sportif..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowQuerySuggestions(e.target.value.length >= 2);
                    }}
                    onFocus={() => setShowQuerySuggestions(searchQuery.length >= 2)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-cream-500 focus:border-transparent transition-all bg-white"
                  />
                </div>
                {/* Dropdown suggestions */}
                {showQuerySuggestions && querySuggestions && querySuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-sand-200 rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                    {querySuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearchQuery(suggestion);
                          setShowQuerySuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-cream-50 transition flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <span className="text-cream-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </span>
                        <span className="text-coffee-700">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Champ ville avec autocomplétion */}
              <div className="md:col-span-4 relative">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-coffee-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <input
                    ref={locationInputRef}
                    type="text"
                    placeholder="Ville ou code postal"
                    value={searchLocation}
                    onChange={(e) => {
                      setSearchLocation(e.target.value);
                      setShowLocationSuggestions(e.target.value.length >= 2);
                    }}
                    onFocus={() => setShowLocationSuggestions(searchLocation.length >= 2)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-cream-500 focus:border-transparent transition-all bg-white"
                  />
                </div>
                {/* Dropdown suggestions villes */}
                {showLocationSuggestions && locationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-sand-200 rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                    {locationSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearchLocation(suggestion);
                          setShowLocationSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-cream-50 transition flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <span className="text-cream-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </span>
                        <span className="text-coffee-700">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleSearch}
                  className="h-full"
                >
                  Rechercher
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="text-sm text-coffee-600">Recherches populaires :</span>
              {['Coiffeur', 'Massage', 'Manucure', 'Coach sportif', 'Tatoueur'].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                  }}
                  className="px-3 py-1 text-sm bg-cream-100 text-cream-800 rounded-lg hover:bg-cream-200 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Professionnels près de chez vous */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-coffee-800 mb-2">
                Près de chez vous
              </h2>
              <p className="text-coffee-600">
                Les professionnels les plus proches de votre position
              </p>
            </div>

            {locationPermission === 'prompt' && (
              <Button onClick={requestLocation} variant="primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Activer ma position
              </Button>
            )}

            {locationPermission === 'granted' && (
              <div className="flex items-center gap-2 text-cream-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Position activée</span>
              </div>
            )}
          </div>

          {locationPermission === 'prompt' && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cream-100 mb-6">
                <svg className="w-10 h-10 text-cream-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-coffee-800 mb-2">
                Activez votre géolocalisation
              </h3>
              <p className="text-coffee-600 mb-6">
                Pour voir les professionnels près de vous, activez votre position
              </p>
              <Button onClick={requestLocation} size="lg">
                Activer ma position
              </Button>
            </div>
          )}

          {locationPermission === 'denied' && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-coffee-800 mb-2">
                Géolocalisation désactivée
              </h3>
              <p className="text-coffee-600">
                Activez la géolocalisation dans les paramètres de votre navigateur pour voir les professionnels près de vous
              </p>
            </div>
          )}

          {locationPermission === 'granted' && isLoadingNearby && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} padding="none" className="overflow-hidden">
                  <div className="h-48 bg-sand-200 animate-pulse" />
                  <div className="p-6">
                    <div className="h-6 bg-sand-200 rounded animate-pulse mb-3" />
                    <div className="h-4 bg-sand-100 rounded animate-pulse w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {locationPermission === 'granted' && !isLoadingNearby && nearbySalons && (
            <>
              {nearbySalons.items.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-coffee-600">
                    Aucun professionnel trouvé dans un rayon de 10 km
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nearbySalons.items.map((salon: any) => (
                    <Link key={salon.id} href={`/salon/${salon.slug}`}>
                      <Card padding="none" hover className="overflow-hidden h-full">
                        <div className="h-48 bg-gradient-to-br from-cream-500 to-cream-700 flex items-center justify-center relative">
                          <svg className="w-20 h-20 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-soft flex items-center gap-1">
                            <svg className="w-4 h-4 text-cream-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="text-sm font-medium text-coffee-800">
                              {salon.city}
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="font-bold text-xl text-coffee-800 mb-2">
                            {salon.name}
                          </h3>
                          <p className="text-coffee-600 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {salon.address}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm text-coffee-600 font-medium">
                                {salon.averageRating || 5.0}
                              </span>
                            </div>
                            {salon.services && salon.services.length > 0 && (
                              <span className="text-sm text-cream-700 font-medium">
                                {salon.services.length} service{salon.services.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Catégories de services */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-coffee-800 mb-4">
              Explorez nos catégories
            </h2>
            <p className="text-lg text-coffee-600">
              Tous les professionnels dont vous avez besoin, en un seul endroit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {professions.map((profession) => (
              <Link
                key={profession.name}
                href={`/search?category=${profession.name}`}
              >
                <Card padding="md" hover className="h-full">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${profession.color} flex items-center justify-center text-white mb-4`}>
                    {profession.icon}
                  </div>
                  <h3 className="font-bold text-lg text-coffee-800 mb-2">
                    {profession.name}
                  </h3>
                  <p className="text-sm text-coffee-600">
                    {profession.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Établissements recommandés */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-coffee-800 mb-2">
                Établissements recommandés
              </h2>
              <p className="text-lg text-coffee-600">
                Les mieux notés près de chez vous
              </p>
            </div>
            <Link href="/search">
              <Button variant="outline">
                Voir tout
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} padding="none" className="overflow-hidden">
                  <div className="h-48 bg-sand-200 animate-pulse" />
                  <div className="p-6">
                    <div className="h-6 bg-sand-200 rounded animate-pulse mb-3" />
                    <div className="h-4 bg-sand-100 rounded animate-pulse w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salons?.items.map((salon: any) => (
                <Link key={salon.id} href={`/salon/${salon.slug}`}>
                  <Card padding="none" hover className="overflow-hidden h-full">
                    <div className="h-48 bg-gradient-to-br from-cream-500 to-cream-700 flex items-center justify-center">
                      <svg className="w-20 h-20 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-xl text-coffee-800 mb-2">
                        {salon.name}
                      </h3>
                      <p className="text-coffee-600 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {salon.city}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-coffee-600 font-medium">5.0</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-coffee-800 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-coffee-600">
              Réservez votre rendez-vous en 3 étapes simples
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: '1',
                title: 'Recherchez',
                description: 'Trouvez le professionnel qui correspond à vos besoins parmi des milliers d\'établissements',
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )
              },
              {
                step: '2',
                title: 'Réservez',
                description: 'Choisissez votre créneau horaire et confirmez votre rendez-vous en ligne instantanément',
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                step: '3',
                title: 'Profitez',
                description: 'Présentez-vous à l\'heure et profitez de votre prestation chez le professionnel',
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ].map((item) => (
              <Card key={item.step} padding="lg" className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cream-600 to-cream-700 text-white mb-6">
                  {item.icon}
                </div>
                <div className="text-cream-700 font-bold text-sm mb-2">ÉTAPE {item.step}</div>
                <h3 className="font-bold text-2xl text-coffee-800 mb-4">
                  {item.title}
                </h3>
                <p className="text-coffee-600">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA pour professionnels */}
      <section className="py-16 px-4 bg-gradient-to-br from-cream-600 to-cream-800">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Vous êtes professionnel ?
          </h2>
          <p className="text-xl text-cream-50 mb-8 max-w-2xl mx-auto">
            Rejoignez LetsForBook et développez votre activité grâce à notre plateforme de réservation en ligne
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/for-professionals">
              <Button variant="secondary" size="lg">
                En savoir plus
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="bg-white/10 text-white border-white hover:bg-white/20">
                Créer mon compte pro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-coffee-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cream-600 to-cream-700 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold">LetsForBook</span>
              </div>
              <p className="text-coffee-300">
                La plateforme de réservation pour tous les professionnels
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Pour les clients</h4>
              <ul className="space-y-2 text-coffee-300">
                <li><Link href="/search" className="hover:text-white transition-colors">Rechercher</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">S'inscrire</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">Comment ça marche</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Pour les professionnels</h4>
              <ul className="space-y-2 text-coffee-300">
                <li><Link href="/for-professionals" className="hover:text-white transition-colors">LetsForBook Pro</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Rejoindre LetsForBook</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="/resources" className="hover:text-white transition-colors">Ressources</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">À propos</h4>
              <ul className="space-y-2 text-coffee-300">
                <li><Link href="/about" className="hover:text-white transition-colors">Qui sommes-nous</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">CGU</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-coffee-700 pt-8 text-center text-coffee-400">
            <p>&copy; 2024 LetsForBook. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
