import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TRPCProvider } from '@/lib/trpc/Provider';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Planity - Réservez votre rendez-vous beauté en ligne',
  description:
    'Trouvez et réservez vos rendez-vous chez les meilleurs salons de coiffure et instituts de beauté près de chez vous.',
  keywords: [
    'coiffeur',
    'salon de beauté',
    'réservation en ligne',
    'manucure',
    'pédicure',
    'coiffure',
    'beauté',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.variable}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
