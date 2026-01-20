'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCity = searchParams.get('city') || '';

  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchCity, setSearchCity] = useState(initialCity);

  const { data: salons, isLoading } = trpc.salon.search.useQuery({
    query: searchQuery,
    city: searchCity,
    limit: 20,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
    setSearchCity(city);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              Planity
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Connexion
              </Link>
              <Link
                href="/register"
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                S'inscrire
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Coiffeur, manucure, massage..."
              className="flex-1 px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville"
              className="w-48 px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-md font-semibold transition"
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
              <h3 className="font-semibold text-lg mb-4">Filtres</h3>

              <div className="mb-6">
                <h4 className="font-medium mb-2">Prix</h4>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">€ - Économique</span>
                </label>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">€€ - Modéré</span>
                </label>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">€€€ - Premium</span>
                </label>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-2">Note</h4>
                {[5, 4, 3].map((rating) => (
                  <label key={rating} className="flex items-center gap-2 mb-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm flex items-center gap-1">
                      {'★'.repeat(rating)}
                      {'☆'.repeat(5 - rating)} et +
                    </span>
                  </label>
                ))}
              </div>

              <div>
                <h4 className="font-medium mb-2">Services</h4>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Coiffure</span>
                </label>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Manucure</span>
                </label>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Pédicure</span>
                </label>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Massage</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Results List */}
          <main className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                {salons?.items.length || 0} salons trouvés
              </h2>
              {searchCity && (
                <p className="text-gray-600">à {searchCity}</p>
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
            ) : (
              <div className="space-y-4">
                {salons?.items.map((salon: any) => (
                  <Link
                    key={salon.id}
                    href={`/salon/${salon.slug}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition flex"
                  >
                    <div className="w-64 h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0" />
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
                            <span className="font-semibold">5.0</span>
                            <span>★★★★★</span>
                          </div>
                          <p className="text-sm text-gray-600">120 avis</p>
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
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
