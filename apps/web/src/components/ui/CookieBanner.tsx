'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'cookie-consent';

type ConsentStatus = 'pending' | 'accepted' | 'rejected' | 'customized';

interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
}

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }

    // Load saved preferences
    try {
      const savedPrefs = JSON.parse(consent);
      if (savedPrefs.preferences) {
        setPreferences(savedPrefs.preferences);
      }
    } catch {
      // Invalid consent data, show banner again
      setIsVisible(true);
    }

    // Listen for preference modal trigger
    const handleOpenPreferences = () => {
      setShowPreferences(true);
      setIsVisible(true);
    };

    window.addEventListener('openCookiePreferences', handleOpenPreferences);
    return () => window.removeEventListener('openCookiePreferences', handleOpenPreferences);
  }, []);

  const saveConsent = (status: ConsentStatus, prefs: CookiePreferences) => {
    const consentData = {
      status,
      preferences: prefs,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setIsVisible(false);
    setShowPreferences(false);

    // Here you would typically trigger analytics setup based on preferences
    if (prefs.analytics) {
      // Initialize analytics (Google Analytics, etc.)
      console.log('Analytics cookies enabled');
    }
    if (prefs.marketing) {
      // Initialize marketing cookies
      console.log('Marketing cookies enabled');
    }
  };

  const acceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    setPreferences(allAccepted);
    saveConsent('accepted', allAccepted);
  };

  const rejectAll = () => {
    const onlyEssential = { essential: true, analytics: false, marketing: false };
    setPreferences(onlyEssential);
    saveConsent('rejected', onlyEssential);
  };

  const savePreferences = () => {
    saveConsent('customized', preferences);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop for preferences modal */}
      {showPreferences && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998]"
          onClick={() => setShowPreferences(false)}
        />
      )}

      {/* Cookie Banner */}
      <div
        className={`fixed z-[9999] ${
          showPreferences
            ? 'inset-4 md:inset-auto md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl md:w-full'
            : 'bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto md:max-w-lg'
        }`}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {!showPreferences ? (
            // Simple banner
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-cream-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-cream-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Nous utilisons des cookies
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Nous utilisons des cookies pour améliorer votre expérience sur notre site,
                    analyser le trafic et personnaliser le contenu.{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      En savoir plus
                    </Link>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={acceptAll}
                      className="px-4 py-2 bg-cream-600 text-white rounded-lg font-medium hover:bg-cream-700 transition"
                    >
                      Tout accepter
                    </button>
                    <button
                      onClick={rejectAll}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                    >
                      Tout refuser
                    </button>
                    <button
                      onClick={() => setShowPreferences(true)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition"
                    >
                      Personnaliser
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Preferences modal
            <div className="max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Paramètres des cookies
                  </h3>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Gérez vos préférences de cookies. Les cookies essentiels ne peuvent pas être désactivés.
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Cookies essentiels</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Nécessaires au fonctionnement du site (authentification, sécurité, panier).
                      Ces cookies ne peuvent pas être désactivés.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-12 h-6 bg-cream-600 rounded-full relative cursor-not-allowed">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Cookies analytiques</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Nous aident à comprendre comment vous utilisez le site pour l&apos;améliorer.
                      Données anonymisées.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        preferences.analytics ? 'bg-cream-600' : 'bg-gray-200'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          preferences.analytics ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Cookies marketing</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Permettent d&apos;afficher des publicités pertinentes et de mesurer leur efficacité.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        preferences.marketing ? 'bg-cream-600' : 'bg-gray-200'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          preferences.marketing ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={rejectAll}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition"
                  >
                    Tout refuser
                  </button>
                  <button
                    onClick={acceptAll}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    Tout accepter
                  </button>
                  <button
                    onClick={savePreferences}
                    className="px-4 py-2 bg-cream-600 text-white rounded-lg font-medium hover:bg-cream-700 transition"
                  >
                    Enregistrer mes choix
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
