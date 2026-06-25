'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/trpc/client';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const verifyEmail = api.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus('success');
      setTimeout(() => router.push('/'), 3000);
    },
    onError: (err) => {
      setStatus('error');
      setErrorMessage(err.message);
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Lien de vérification manquant.');
      return;
    }
    verifyEmail.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f3ef]">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-[#6b8e6b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#4a3728]">Vérification en cours...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-semibold text-[#4a3728] mb-2">Email vérifié !</h1>
            <p className="text-[#6b5b4d] mb-6">Votre adresse email a été confirmée. Vous allez être redirigé automatiquement.</p>
            <Link href="/" className="inline-block bg-[#6b8e6b] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#4a6b4a] transition-colors">
              Accéder à l&apos;accueil
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">✗</div>
            <h1 className="text-2xl font-semibold text-[#4a3728] mb-2">Lien invalide</h1>
            <p className="text-[#6b5b4d] mb-6">{errorMessage}</p>
            <Link href="/" className="inline-block bg-[#6b8e6b] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#4a6b4a] transition-colors">
              Retour à l&apos;accueil
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
