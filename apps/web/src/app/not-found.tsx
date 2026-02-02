import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-cream-100 mb-6">
            <svg
              className="w-16 h-16 text-cream-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-8xl font-bold text-cream-600 mb-4">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-coffee-800 mb-4">
          Page introuvable
        </h2>
        <p className="text-coffee-600 mb-8">
          Oups ! La page que vous recherchez semble avoir disparu.
          Elle a peut-être été déplacée ou n&apos;existe plus.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-cream-600 text-white rounded-xl font-medium hover:bg-cream-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-coffee-700 rounded-xl font-medium border border-sand-200 hover:bg-sand-50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Rechercher un salon
          </Link>
        </div>

        {/* Help */}
        <p className="mt-12 text-sm text-coffee-500">
          Besoin d&apos;aide ?{' '}
          <Link href="/contact" className="text-cream-700 hover:underline">
            Contactez-nous
          </Link>
        </p>
      </div>
    </div>
  );
}
