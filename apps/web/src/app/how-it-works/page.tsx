'use client';

import Link from 'next/link';
import { Header, Card, Button } from '@/components/ui';

export default function HowItWorksPage() {
  const clientSteps = [
    {
      number: 1,
      title: 'Recherchez un salon',
      description: 'Trouvez le salon idéal près de chez vous en recherchant par ville, service ou nom. Consultez les avis, photos et tarifs.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      number: 2,
      title: 'Choisissez votre prestation',
      description: 'Sélectionnez le service souhaité, le professionnel de votre choix, puis la date et l\'heure qui vous conviennent.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Confirmez et payez',
      description: 'Réglez un acompte sécurisé en ligne pour confirmer votre réservation. Le reste sera à payer sur place.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      number: 4,
      title: 'Recevez vos rappels',
      description: 'Recevez des rappels par SMS et email 7 jours puis 1 jour avant votre rendez-vous. Impossible d\'oublier !',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      number: 5,
      title: 'Profitez de votre soin',
      description: 'Rendez-vous au salon à l\'heure prévue, profitez de votre prestation et laissez un avis pour aider les autres clients.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const proSteps = [
    {
      number: 1,
      title: 'Créez votre compte pro',
      description: 'Inscrivez-vous gratuitement en tant que professionnel ou propriétaire de salon.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      number: 2,
      title: 'Configurez votre salon',
      description: 'Ajoutez vos informations, photos, services, tarifs et définissez vos horaires de travail.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Recevez des réservations',
      description: 'Les clients réservent en ligne 24h/24. Vous êtes notifié à chaque nouvelle demande.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      number: 4,
      title: 'Sécurisez vos revenus',
      description: 'L\'acompte obligatoire réduit les no-shows. Vous gardez l\'acompte en cas d\'annulation tardive.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      number: 5,
      title: 'Développez votre activité',
      description: 'Consultez vos statistiques, gérez vos avis et fidélisez vos clients grâce à votre page salon.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ];

  const faqs = [
    {
      question: 'Est-ce gratuit pour les clients ?',
      answer: 'Oui, l\'utilisation de LetsForBook est totalement gratuite pour les clients. Vous payez uniquement le prix de vos prestations.',
    },
    {
      question: 'Comment fonctionne l\'acompte ?',
      answer: 'Lors de la réservation, vous payez un pourcentage du prix total (défini par le salon, généralement 20-30%). Le reste est à régler sur place. En cas d\'annulation moins de 48h avant, l\'acompte est conservé par le salon.',
    },
    {
      question: 'Puis-je annuler ma réservation ?',
      answer: 'Oui, vous pouvez annuler gratuitement jusqu\'à 48 heures avant votre rendez-vous. Passé ce délai, l\'acompte n\'est pas remboursable.',
    },
    {
      question: 'Comment recevoir les rappels ?',
      answer: 'Les rappels sont envoyés automatiquement par email et SMS (si vous avez renseigné votre numéro) 7 jours puis 1 jour avant votre rendez-vous.',
    },
    {
      question: 'Comment devenir partenaire ?',
      answer: 'Inscrivez-vous en tant que "Propriétaire de salon" lors de la création de compte. Vous pourrez ensuite configurer votre établissement et commencer à recevoir des réservations.',
    },
    {
      question: 'Le paiement est-il sécurisé ?',
      answer: 'Absolument. Nous utilisons Stripe, le leader mondial du paiement en ligne. Vos données bancaires ne sont jamais stockées sur nos serveurs.',
    },
  ];

  return (
    <div className="min-h-screen bg-sand-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-cream-600 to-cream-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Comment ça marche ?
          </h1>
          <p className="text-xl text-cream-100 max-w-3xl mx-auto">
            LetsForBook simplifie la réservation pour les clients et la gestion pour les professionnels.
            Découvrez comment en quelques étapes simples.
          </p>
        </div>
      </section>

      {/* Client Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-cream-100 text-cream-700 rounded-full text-sm font-medium mb-4">
              Pour les clients
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-coffee-800 mb-4">
              Réservez en 5 étapes simples
            </h2>
            <p className="text-lg text-coffee-600 max-w-2xl mx-auto">
              Fini les appels sans réponse. Réservez votre rendez-vous en ligne, 24h/24, 7j/7.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-cream-200 -translate-y-1/2" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {clientSteps.map((step, index) => (
                <div key={index} className="relative">
                  <Card className="text-center p-6 h-full bg-white relative z-10">
                    <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4 text-cream-600">
                      {step.icon}
                    </div>
                    <div className="w-8 h-8 bg-cream-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold text-coffee-800 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-coffee-600 text-sm">
                      {step.description}
                    </p>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/search">
              <Button size="lg">
                Trouver un salon
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pro Steps */}
      <section className="py-20 bg-sand-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-cream-100 text-cream-700 rounded-full text-sm font-medium mb-4">
              Pour les professionnels
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-coffee-800 mb-4">
              Développez votre activité
            </h2>
            <p className="text-lg text-coffee-600 max-w-2xl mx-auto">
              Rejoignez LetsForBook et profitez d'un outil de gestion complet pour votre salon.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-cream-300 -translate-y-1/2" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {proSteps.map((step, index) => (
                <div key={index} className="relative">
                  <Card className="text-center p-6 h-full bg-white relative z-10">
                    <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4 text-cream-600">
                      {step.icon}
                    </div>
                    <div className="w-8 h-8 bg-cream-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold text-coffee-800 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-coffee-600 text-sm">
                      {step.description}
                    </p>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/pricing">
              <Button variant="secondary" size="lg">
                Devenir partenaire
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-coffee-800 text-center mb-16">
            Pourquoi choisir LetsForBook ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Disponible 24h/24',
                description: 'Réservez à n\'importe quelle heure, même la nuit ou le week-end.',
                icon: '🕐',
              },
              {
                title: 'Rappels automatiques',
                description: 'Plus d\'oubli grâce aux rappels SMS et email avant chaque RDV.',
                icon: '📱',
              },
              {
                title: 'Paiement sécurisé',
                description: 'Vos données sont protégées par Stripe, leader du paiement en ligne.',
                icon: '🔒',
              },
              {
                title: 'Avis vérifiés',
                description: 'Consultez les avis de vrais clients pour faire le bon choix.',
                icon: '⭐',
              },
              {
                title: 'Annulation flexible',
                description: 'Annulez gratuitement jusqu\'à 48h avant votre rendez-vous.',
                icon: '✓',
              },
              {
                title: 'Support réactif',
                description: 'Une question ? Notre équipe est là pour vous aider.',
                icon: '💬',
              },
            ].map((benefit, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-coffee-800 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-coffee-600">
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-sand-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-coffee-800 text-center mb-12">
            Questions fréquentes
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-lg font-semibold text-coffee-800 mb-2">
                  {faq.question}
                </h3>
                <p className="text-coffee-600">
                  {faq.answer}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-cream-600 to-cream-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-cream-100 mb-8">
            Rejoignez des milliers d'utilisateurs qui font confiance à LetsForBook.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" variant="secondary">
                Trouver un salon
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-coffee-800 text-sand-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">LetsForBook</h3>
              <p className="text-sm">
                La plateforme de réservation pour les professionnels de la beauté.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Liens utiles</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/search" className="hover:text-white">Rechercher</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white">Comment ça marche</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Devenir partenaire</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-white">CGU</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Confidentialité</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>contact@letsforbook.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-coffee-700 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} LetsForBook. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
