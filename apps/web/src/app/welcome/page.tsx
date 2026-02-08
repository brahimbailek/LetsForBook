'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-sage-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-cream-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const firstName = session?.user?.name?.split(' ')[0] || 'vous';
  const userRole = session?.user?.role;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-sage-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card padding="lg" className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-coffee-800 mb-2">
              Bienvenue, {firstName} !
            </h1>
            <p className="text-coffee-600 text-lg">
              Votre compte a été créé avec succès.
            </p>
          </div>

          <div className="bg-sage-50 border border-sage-200 rounded-xl p-4 mb-8">
            <p className="text-sage-800 text-sm">
              {userRole === 'SALON_OWNER'
                ? 'Votre établissement est en cours de vérification. Vous pouvez dès maintenant configurer vos services et horaires.'
                : userRole === 'PROFESSIONAL'
                  ? 'Vous pouvez maintenant gérer votre agenda et vos rendez-vous.'
                  : 'Vous pouvez maintenant rechercher des professionnels et réserver vos rendez-vous en ligne.'}
            </p>
          </div>

          <div className="space-y-3">
            {userRole === 'SALON_OWNER' || userRole === 'PROFESSIONAL' ? (
              <>
                <Link href="/dashboard" className="block">
                  <Button fullWidth size="lg">
                    Accéder à mon tableau de bord
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button fullWidth size="lg" variant="outline">
                    Retour à l'accueil
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/search" className="block">
                  <Button fullWidth size="lg">
                    Rechercher un professionnel
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button fullWidth size="lg" variant="outline">
                    Explorer l'accueil
                  </Button>
                </Link>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
