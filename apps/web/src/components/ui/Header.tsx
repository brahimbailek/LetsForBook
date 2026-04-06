'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { trpc } from '@/lib/trpc/client';

export function Header() {
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = status === 'authenticated' && !!session?.user;
  const userRole = session?.user?.role;
  const isPro = userRole === 'PROFESSIONAL' || userRole === 'SALON_OWNER' || userRole === 'ADMIN';

  // Fetch user data with salon info for pros
  const { data: userData } = trpc.auth.me.useQuery(undefined, {
    enabled: isLoggedIn && isPro,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstName = session?.user?.name?.split(' ')[0] || '';

  // Get salon name for the dashboard link
  const salonName = userData?.professionalProfile?.salon?.name;

  const handleSignOut = async () => {
    setShowMenu(false);
    await signOut({ callbackUrl: '/' });
  };

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
            {status === 'loading' ? (
              <div className="w-24 h-9 bg-sand-200 rounded-lg animate-pulse" />
            ) : isLoggedIn ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sand-100 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-cream-600 to-cream-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-coffee-800 font-medium">
                    {firstName}
                  </span>
                  <svg className={`w-4 h-4 text-coffee-500 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-sand-200 rounded-xl shadow-lg py-2">
                    <div className="px-4 py-2 border-b border-sand-100">
                      <p className="text-sm font-medium text-coffee-800">{session.user?.name}</p>
                      <p className="text-xs text-coffee-500">{session.user?.email}</p>
                    </div>

                    {userRole === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Panel Admin
                      </Link>
                    )}

                    {isPro && (
                      <Link
                        href="/dashboard"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-coffee-700 hover:bg-sand-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-cream-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {salonName || 'Tableau de bord'}
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-coffee-700 hover:bg-sand-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-coffee-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mon profil
                    </Link>

                    <div className="border-t border-sand-100 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Se connecter
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    S&apos;inscrire
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
