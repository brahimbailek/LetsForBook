'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button, Input, Card } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'CredentialsSignin':
        return 'Email ou mot de passe incorrect';
      case 'OAuthAccountNotLinked':
        return 'Ce compte existe déjà avec une autre méthode de connexion';
      case 'AccessDenied':
        return 'Accès refusé';
      default:
        return errorCode ? 'Une erreur est survenue' : '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setFormError('Email ou mot de passe incorrect');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setFormError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setFormError('Une erreur est survenue avec Google');
      setIsLoading(false);
    }
  };

  const displayError = formError || getErrorMessage(error);

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="email"
          label="Adresse email"
          placeholder="exemple@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          }
        />

        <Input
          type="password"
          label="Mot de passe"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-sage-600 hover:text-sage-700 transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {displayError && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {displayError}
          </div>
        )}

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
              Connexion...
            </>
          ) : (
            'Se connecter'
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-sand-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-coffee-500">ou</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          fullWidth
          size="lg"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
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
  );
}

function LoginFormFallback() {
  return (
    <Card padding="lg">
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-sand-200 rounded-xl" />
        <div className="h-12 bg-sand-200 rounded-xl" />
        <div className="h-12 bg-sand-200 rounded-xl" />
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-2">
            <h1 className="text-4xl font-bold text-cream-700 hover:text-cream-800 transition-colors">
              LetsForBook
            </h1>
          </Link>
          <p className="text-coffee-600">
            Connectez-vous pour gérer vos rendez-vous
          </p>
        </div>

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>

        <p className="text-center mt-6 text-coffee-600">
          Pas encore de compte ?{' '}
          <Link
            href="/register"
            className="text-cream-700 hover:text-cream-800 font-medium transition-colors"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
