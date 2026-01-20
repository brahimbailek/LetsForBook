'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';

export default function HomePage() {
  const { data: salons, isLoading } = trpc.salon.getAll.useQuery({
    limit: 6,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Réservez votre rendez-vous beauté en quelques clics
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Trouvez les meilleurs salons de coiffure et instituts de beauté près de chez vous
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl mx-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coiffeur, manucure, massage..."
                  className="flex-1 px-4 py-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  placeholder="Ville"
                  className="w-48 px-4 py-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-md font-semibold transition">
                  Rechercher
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Catégories populaires</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Coiffure', icon: '💇' },
              { name: 'Manucure', icon: '💅' },
              { name: 'Pédicure', icon: '🦶' },
              { name: 'Massage', icon: '💆' },
              { name: 'Épilation', icon: '✨' },
              { name: 'Maquillage', icon: '💄' },
              { name: 'Soin visage', icon: '🧖' },
              { name: 'Barbier', icon: '💈' },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/search?category=${category.name}`}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition cursor-pointer"
              >
                <div className="text-4xl mb-2">{category.icon}</div>
                <h3 className="font-semibold">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Salons */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold mb-8">Salons recommandés</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {salons?.items.map((salon: any) => (
                <Link
                  key={salon.id}
                  href={`/salon/${salon.slug}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600" />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{salon.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{salon.city}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">★★★★★</span>
                      <span className="text-sm text-gray-600">5.0</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="font-semibold text-xl mb-2">1. Recherchez</h3>
              <p className="text-gray-600">
                Trouvez le salon idéal près de chez vous
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📅</span>
              </div>
              <h3 className="font-semibold text-xl mb-2">2. Réservez</h3>
              <p className="text-gray-600">
                Choisissez votre créneau et validez votre rendez-vous
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="font-semibold text-xl mb-2">3. Profitez</h3>
              <p className="text-gray-600">
                Rendez-vous chez votre professionnel et profitez du moment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4">Planity</h3>
              <p className="text-gray-400">
                La plateforme de réservation beauté en ligne
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Clients</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/search">Rechercher un salon</Link></li>
                <li><Link href="/login">Se connecter</Link></li>
                <li><Link href="/register">S'inscrire</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Professionnels</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/pro">Planity Pro</Link></li>
                <li><Link href="/pro/register">Rejoindre Planity</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">À propos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about">Qui sommes-nous</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/legal">Mentions légales</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Planity Clone. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
