'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Button, Card, Input, Header } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      setError('');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    requestResetMutation.mutate({ email });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-sand-50">
        <Header />
        <div className="flex items-center justify-center py-20 px-4">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-coffee-800 mb-4">
              Email envoyé !
            </h1>
            <p className="text-coffee-600 mb-6">
              Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
            </p>
            <p className="text-sm text-coffee-500 mb-6">
              N'oubliez pas de vérifier vos spams si vous ne trouvez pas l'email.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Retour à la connexion
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
              Mot de passe oublié ?
            </h1>
            <p className="text-coffee-600">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-coffee-700 mb-2">
                Adresse email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={requestResetMutation.isPending}
            >
              {requestResetMutation.isPending ? 'Envoi en cours...' : 'Envoyer le lien'}
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
