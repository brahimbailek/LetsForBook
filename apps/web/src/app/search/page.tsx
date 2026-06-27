'use client';

import { Suspense } from 'react';
import { trpc } from '@/lib/trpc/client';
import { keepPreviousData } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/ui';
import { GeoRadiusMap } from '@/components/GeoRadiusMap';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCity = searchParams.get('city') || '';

  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchCity, setSearchCity] = useState(initialCity);

  // Geolocation states
  const [userLat, setUserLat] = useState<number | undefined>(undefined);
  const [userLng, setUserLng] = useState<number | undefined>(undefined);
  const [radius, setRadius] = useState(10);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [usingGeo, setUsingGeo] = useState(false);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setUsingGeo(true);
        setCity('');
        setSearchCity('');
        setGeoLoading(false);
      },
      () => {
        setGeoError('Impossible d\'obtenir votre position. Vérifiez les permissions.');
        setGeoLoading(false);
      }
    );
  };

  const clearGeo = () => {
    setUserLat(undefined);
    setUserLng(undefined);
    setUsingGeo(false);
    setGeoError('');
  };

  // Filter states
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Scroll to top
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Category label → DB names mapping (one label can cover multiple DB category names)
  const categoryMappings = [
    { label: 'Coiffure', dbNames: ['Coiffure Femme', 'Coiffure Homme', 'Coiffure Enfant'] },
    { label: 'Coloration', dbNames: ['Coloration'] },
    { label: 'Barbier', dbNames: ['Barbier'] },
    { label: 'Beauté des ongles', dbNames: ['Beauté'] },
    { label: 'Bien-être & Spa', dbNames: ['Bien-être & Spa'] },
    { label: 'Tatouage & Piercing', dbNames: ['Tatouage & Piercing'] },
    { label: 'Sport & Fitness', dbNames: ['Sport & Fitness'] },
  ];

  const resolvedCategories = selectedCategories.flatMap(
    (label) => categoryMappings.find((m) => m.label === label)?.dbNames ?? [label]
  );

  // Autocomplete states
  const [showQuerySuggestions, setShowQuerySuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const queryInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);

  // Autocomplete queries
  const { data: querySuggestions } = trpc.salon.autocomplete.useQuery(
    { query },
    { enabled: query.length >= 2 }
  );

  const { data: citySuggestions } = trpc.salon.autocompleteCities.useQuery(
    { query: city },
    { enabled: city.length >= 2 }
  );

  const {
    data: salonsData,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.salon.search.useInfiniteQuery(
    {
      query: searchQuery,
      city: usingGeo ? undefined : searchCity,
      categories: resolvedCategories.length > 0 ? resolvedCategories : undefined,
      minRating: minRating,
      latitude: usingGeo ? userLat : undefined,
      longitude: usingGeo ? userLng : undefined,
      radius: usingGeo ? radius : undefined,
      limit: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      placeholderData: keepPreviousData,
    }
  );

  const salons = salonsData?.pages.flatMap((page) => page.items) ?? [];

  // Toggle category filter
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
    setSearchCity(city);
    setShowQuerySuggestions(false);
    setShowCitySuggestions(false);
  };

  const selectQuerySuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setShowQuerySuggestions(false);
    queryInputRef.current?.focus();
  };

  const selectCitySuggestion = (suggestion: string) => {
    setCity(suggestion);
    setShowCitySuggestions(false);
    cityInputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (queryInputRef.current && !queryInputRef.current.parentElement?.contains(e.target as Node)) {
        setShowQuerySuggestions(false);
      }
      if (cityInputRef.current && !cityInputRef.current.parentElement?.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex gap-4">
          {/* Query input with autocomplete */}
          <div className="flex-1 relative">
            <input
              ref={queryInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowQuerySuggestions(e.target.value.length >= 2);
              }}
              onFocus={() => setShowQuerySuggestions(query.length >= 2)}
              placeholder="Coiffeur, manucure, massage..."
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {showQuerySuggestions && querySuggestions && querySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-60 overflow-auto">
                {querySuggestions.map((suggestion: any, index: any) => (
                  <button key={index} type="button" onMouseDown={(e) => { e.preventDefault(); selectQuerySuggestion(suggestion); }}
                    className="w-full text-left px-4 py-3 hover:bg-amber-50 transition flex items-center gap-2">
                    <span className="text-amber-600">🔍</span>
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* City input or GPS active indicator */}
          {usingGeo ? (
            <div className="w-56 flex items-center gap-2 px-3 py-2 rounded-md border border-amber-400 bg-amber-50">
              <span className="text-amber-600 text-sm font-medium flex-1">📍 Position GPS active</span>
              <button type="button" onClick={clearGeo} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            </div>
          ) : (
            <div className="w-48 relative">
              <input
                ref={cityInputRef}
                type="text"
                value={city}
                onChange={(e) => { setCity(e.target.value); setShowCitySuggestions(e.target.value.length >= 2); }}
                onFocus={() => setShowCitySuggestions(city.length >= 2)}
                placeholder="Ville"
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {showCitySuggestions && citySuggestions && citySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-60 overflow-auto">
                  {citySuggestions.map((suggestion: any, index: any) => (
                    <button key={index} type="button" onMouseDown={(e) => { e.preventDefault(); selectCitySuggestion(suggestion); }}
                      className="w-full text-left px-4 py-3 hover:bg-amber-50 transition flex items-center gap-2">
                      <span className="text-amber-600">📍</span>
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* GPS button */}
          <button type="button" onClick={handleGeolocate} disabled={geoLoading}
            title="Utiliser ma position GPS"
            className={`px-4 py-3 rounded-md border transition flex items-center gap-2 text-sm font-medium ${usingGeo ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-amber-50 hover:border-amber-400'}`}>
            {geoLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )}
            <span className="hidden sm:inline">Près de moi</span>
          </button>

          <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-md font-semibold transition">
            Rechercher
          </button>
        </div>

        {/* GPS error */}
        {geoError && <p className="mt-2 text-sm text-red-500">{geoError}</p>}

        {/* Radius selector (only when GPS active) */}
        {usingGeo && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">Rayon :</span>
            {[5, 10, 20, 50].map((r) => (
              <button key={r} type="button" onClick={() => setRadius(r)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${radius === r ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-amber-100'}`}>
                {r} km
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Results */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Filtres</h3>
              {(minRating || selectedCategories.length > 0 || usingGeo) && (
                <button
                  onClick={() => {
                    setMinRating(undefined);
                    setSelectedCategories([]);
                    clearGeo();
                  }}
                  className="text-xs text-amber-600 hover:text-amber-700"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {/* GPS filter */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Localisation</h4>
              {usingGeo ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-amber-700 font-medium">
                    <span>📍 Position GPS active</span>
                    <button onClick={clearGeo} className="text-gray-400 hover:text-gray-600 text-xs ml-auto">✕</button>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Rayon</p>
                    <div className="flex flex-wrap gap-1">
                      {[5, 10, 20, 50].map((r) => (
                        <button key={r} onClick={() => setRadius(r)}
                          className={`px-2 py-1 rounded text-xs font-medium transition ${radius === r ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-amber-100'}`}>
                          {r} km
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Mini map */}
                  {userLat && userLng && (
                    <GeoRadiusMap latitude={userLat} longitude={userLng} radius={radius} />
                  )}
                </div>
              ) : (
                <button onClick={handleGeolocate} disabled={geoLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-600 hover:bg-amber-50 hover:border-amber-400 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {geoLoading ? 'Localisation...' : 'Près de moi'}
                </button>
              )}
            </div>

            <div className="mb-6">
              <h4 className="font-medium mb-2">Note minimum</h4>
              {[5, 4, 3].map((rating) => (
                <label key={rating} className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    className="rounded"
                    checked={minRating === rating}
                    onChange={() => setMinRating(minRating === rating ? undefined : rating)}
                  />
                  <span className="text-sm flex items-center gap-1">
                    <span className="text-yellow-500">{'★'.repeat(rating)}</span>
                    <span className="text-gray-300">{'★'.repeat(5 - rating)}</span>
                    <span className="text-gray-600">et +</span>
                  </span>
                </label>
              ))}
              {minRating && (
                <button
                  onClick={() => setMinRating(undefined)}
                  className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                >
                  Effacer
                </button>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Services</h4>
              {categoryMappings.map(({ label }) => (
                <label key={label} className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-amber-600 focus:ring-amber-500"
                    checked={selectedCategories.includes(label)}
                    onChange={() => toggleCategory(label)}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results List */}
        <main className={`flex-1 transition-opacity duration-200 ${isFetching && !isFetchingNextPage ? 'opacity-60' : 'opacity-100'}`}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {salons.length || 0} salon{(salons.length || 0) > 1 ? 's' : ''} trouvé{(salons.length || 0) > 1 ? 's' : ''}
            </h2>
            {usingGeo && (
              <p className="text-gray-600">dans un rayon de {radius} km autour de vous</p>
            )}
            {!usingGeo && searchCity && (
              <p className="text-gray-600">à {searchCity}</p>
            )}
            {searchQuery && (
              <p className="text-gray-600">pour "{searchQuery}"</p>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-md h-48 animate-pulse"
                />
              ))}
            </div>
          ) : salons.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 text-lg mb-4">Aucun salon trouvé</p>
              <p className="text-gray-400">Essayez avec d'autres termes de recherche</p>
            </div>
          ) : (
            <div className="space-y-4">
              {salons.map((salon: any) => (
                <Link
                  key={salon.id}
                  href={`/salon/${salon.slug}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition flex"
                >
                  <div className="w-64 h-48 bg-gradient-to-br from-amber-400 to-amber-600 flex-shrink-0 relative overflow-hidden">
                    {salon.coverImage ? (
                      <img
                        src={salon.coverImage}
                        alt={salon.name}
                        className="w-full h-full object-cover"
                      />
                    ) : salon.logo ? (
                      <img
                        src={salon.logo}
                        alt={salon.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-4xl font-bold opacity-60">
                          {salon.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-xl mb-1">
                          {salon.name}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          {salon.address}, {salon.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-500 mb-1">
                          <span className="font-semibold">{salon.averageRating || '—'}</span>
                          <span>★★★★★</span>
                        </div>
                        <p className="text-sm text-gray-600">{salon.reviewCount || 0} avis</p>
                      </div>
                    </div>

                    {salon.description && (
                      <p className="text-gray-700 text-sm line-clamp-2 mb-4">
                        {salon.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {salon.phone && <span>📞 {salon.phone}</span>}
                      <span>📍 {salon.city}</span>
                      {salon.distanceKm !== null && salon.distanceKm !== undefined && (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {salon.distanceKm < 1 ? `${Math.round(salon.distanceKm * 1000)} m` : `${salon.distanceKm} km`}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-8 py-3 rounded-md font-semibold transition"
                  >
                    {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 bg-amber-600 hover:bg-amber-700 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition z-50"
          aria-label="Retour en haut"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-pulse">
        <div className="h-12 bg-gray-200 rounded-md"></div>
      </div>
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-6 h-96 animate-pulse"></div>
        </div>
        <div className="flex-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md h-48 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <Suspense fallback={<LoadingFallback />}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
