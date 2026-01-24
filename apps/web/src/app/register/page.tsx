'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';

type UserType = 'CLIENT' | 'PROFESSIONAL' | 'SALON_OWNER';

export default function RegisterPage() {
  const [userType, setUserType] = useState<UserType>('CLIENT');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement user registration
      console.log('Register with:', { ...formData, userType });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirect to homepage after successful registration
      window.location.href = '/';
    } catch (err) {
      setError('Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-sage-50 py-12 px-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-coffee-800 mb-2">
            Créer un compte
          </h1>
          <p className="text-coffee-600">
            Rejoignez Planity et gérez vos rendez-vous facilement
          </p>
        </div>

        {/* Sélection du type d'utilisateur */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            type="button"
            onClick={() => setUserType('CLIENT')}
            className={`
              p-6 rounded-2xl border-2 transition-all duration-200
              ${userType === 'CLIENT'
                ? 'border-sage-500 bg-sage-50 shadow-soft'
                : 'border-sand-200 hover:border-sage-300 bg-white'
              }
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <svg className="w-8 h-8 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div className="text-center">
                <p className="font-semibold text-coffee-800">Client</p>
                <p className="text-sm text-coffee-600">Prendre RDV</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setUserType('PROFESSIONAL')}
            className={`
              p-6 rounded-2xl border-2 transition-all duration-200
              ${userType === 'PROFESSIONAL'
                ? 'border-sage-500 bg-sage-50 shadow-soft'
                : 'border-sand-200 hover:border-sage-300 bg-white'
              }
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <svg className="w-8 h-8 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div className="text-center">
                <p className="font-semibold text-coffee-800">Professionnel</p>
                <p className="text-sm text-coffee-600">Employé</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setUserType('SALON_OWNER')}
            className={`
              p-6 rounded-2xl border-2 transition-all duration-200
              ${userType === 'SALON_OWNER'
                ? 'border-sage-500 bg-sage-50 shadow-soft'
                : 'border-sand-200 hover:border-sage-300 bg-white'
              }
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <svg className="w-8 h-8 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div className="text-center">
                <p className="font-semibold text-coffee-800">Propriétaire</p>
                <p className="text-sm text-coffee-600">Établissement</p>
              </div>
            </div>
          </button>
        </div>

        {/* Formulaire d'inscription */}
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom et Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                label="Prénom"
                placeholder="Jean"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                required
                disabled={isLoading}
              />
              <Input
                type="text"
                label="Nom"
                placeholder="Dupont"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                required
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <Input
              type="email"
              label="Adresse email"
              placeholder="exemple@email.com"
              value={formData.email}
              onChange={handleInputChange('email')}
              required
              disabled={isLoading}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            {/* Téléphone */}
            <Input
              type="tel"
              label="Téléphone"
              placeholder="+33 6 12 34 56 78"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              required
              disabled={isLoading}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            />

            {/* Mot de passe */}
            <Input
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange('password')}
              required
              disabled={isLoading}
              helperText="Au moins 8 caractères"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {/* Confirmation mot de passe */}
            <Input
              type="password"
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              required
              disabled={isLoading}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* CGU */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 w-4 h-4 rounded border-sand-300 text-sage-600 focus:ring-sage-500"
              />
              <label htmlFor="terms" className="text-sm text-coffee-600">
                J'accepte les{' '}
                <Link href="/terms" className="text-sage-600 hover:text-sage-700 underline">
                  conditions générales d'utilisation
                </Link>
                {' '}et la{' '}
                <Link href="/privacy" className="text-sage-600 hover:text-sage-700 underline">
                  politique de confidentialité
                </Link>
              </label>
            </div>

            {/* Bouton d'inscription */}
            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Création du compte...
                </>
              ) : (
                'Créer mon compte'
              )}
            </Button>

            {/* Séparateur */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-sand-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-coffee-500">ou</span>
              </div>
            </div>

            {/* Connexion Google */}
            <Button
              type="button"
              variant="outline"
              fullWidth
              size="lg"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </Button>
          </form>
        </Card>

        {/* Lien connexion */}
        <p className="text-center mt-6 text-coffee-600">
          Vous avez déjà un compte ?{' '}
          <Link
            href="/login"
            className="text-sage-600 hover:text-sage-700 font-medium transition-colors"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
