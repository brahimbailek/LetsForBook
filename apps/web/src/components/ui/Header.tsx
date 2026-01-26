'use client';

import Link from 'next/link';
import { Button } from './Button';

export function Header() {
  return (
    <header className="bg-white border-b border-sand-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cream-600 to-cream-700 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-coffee-800">LetsForBook</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/search"
              className="text-coffee-700 hover:text-cream-700 font-medium transition-colors"
            >
              Rechercher
            </Link>
            <Link
              href="/how-it-works"
              className="text-coffee-700 hover:text-cream-700 font-medium transition-colors"
            >
              Comment ça marche
            </Link>
            <Link
              href="/for-professionals"
              className="text-coffee-700 hover:text-cream-700 font-medium transition-colors"
            >
              Pour les professionnels
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Se connecter
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                S'inscrire
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
