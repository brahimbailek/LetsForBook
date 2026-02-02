'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Button, Card, Input, Header } from '@/components/ui';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!token) {
      setError('Token invalide ou expiré');
      return;
    }

    resetPasswordMutation.mutate({ token, newPassword: password });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-sand-50">
        <Header />
        <div className="flex items-center justify-center py-20 px-4">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-coffee-800 mb-4">
              Lien invalide
            </h1>
            <p className="text-coffee-600 mb-6">
              Ce lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.
            </p>
            <Link href="/forgot-password">
              <Button className="w-full">
                Demander un nouveau lien
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-sand-50">
        <Header />
        <div className="flex items-center justify-center py-20 px-4">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-coffee-800 mb-4">
              Mot de passe modifié !
            </h1>
            <p className="text-coffee-600 mb-6">
              Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion...
            </p>
            <Link href="/login">
              <Button className="w-full">
                Se connecter maintenant
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <Header />
      <div className="flex items-center justify-center py-20 px-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-coffee-800 mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-coffee-600">
              Choisissez un nouveau mot de passe sécurisé pour votre compte.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-coffee-700 mb-2">
                Nouveau mot de passe
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-coffee-500">
                Minimum 8 caractères
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-coffee-700 mb-2">
                Confirmer le mot de passe
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sage-600 hover:text-sage-700 text-sm">
              Retour à la connexion
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
