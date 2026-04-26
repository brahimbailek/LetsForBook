'use client';

import { Suspense } from 'react';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/ui';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCity = searchParams.get('city') || '';

  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchCity, setSearchCity] = useState(initialCity);

  // Filter states
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Available categories
  const availableCategories = [
    'Coiffure',
    'Manucure',
    'Pédicure',
    'Massage',
    'Soins du visage',
    'Épilation',
  ];

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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.salon.search.useInfiniteQuery(
    {
      query: searchQuery,
      city: searchCity,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      minRating: minRating,
      limit: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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
            {/* Suggestions dropdown */}
            {showQuerySuggestions && querySuggestions && querySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-60 overflow-auto">
                {querySuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectQuerySuggestion(suggestion);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-amber-50 transition flex items-center gap-2"
                  >
                    <span className="text-amber-600">🔍</span>
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* City input with autocomplete */}
          <div className="w-48 relative">
            <input
              ref={cityInputRef}
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setShowCitySuggestions(e.target.value.length >= 2);
              }}
              onFocus={() => setShowCitySuggestions(city.length >= 2)}
              placeholder="Ville"
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {/* City suggestions dropdown */}
            {showCitySuggestions && citySuggestions && citySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-60 overflow-auto">
                {citySuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectCitySuggestion(suggestion);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-amber-50 transition flex items-center gap-2"
                  >
                    <span className="text-amber-600">📍</span>
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-md font-semibold transition"
          >
            Rechercher
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Filtres</h3>
              {(minRating || selectedCategories.length > 0) && (
                <button
                  onClick={() => {
                    setMinRating(undefined);
                    setSelectedCategories([]);
                  }}
                  className="text-xs text-amber-600 hover:text-amber-700"
                >
                  Réinitialiser
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
              {availableCategories.map((category) => (
                <label key={category} className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-amber-600 focus:ring-amber-500"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results List */}
        <main className="flex-1">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {salons.length || 0} salon{(salons.length || 0) > 1 ? 's' : ''} trouvé{(salons.length || 0) > 1 ? 's' : ''}
            </h2>
            {searchCity && (
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
                  <div className="w-64 h-48 bg-gradient-to-br from-amber-400 to-amber-600 flex-shrink-0" />
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
                      <span>📞 {salon.phone}</span>
                      <span>📍 {salon.city}</span>
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
