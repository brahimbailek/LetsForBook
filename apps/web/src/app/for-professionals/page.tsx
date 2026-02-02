'use client';

import Link from 'next/link';
import { Header, Button, Card } from '@/components/ui';

export default function ForProfessionalsPage() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Agenda intelligent',
      description: 'Gérez vos rendez-vous en temps réel avec un agenda synchronisé. Fini les doubles réservations et les appels téléphoniques.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      title: 'Rappels automatiques',
      description: 'Réduisez les no-shows de 80% grâce aux rappels SMS et email automatiques envoyés à vos clients.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Gestion d&apos;équipe',
      description: 'Gérez les plannings de tous vos collaborateurs, leurs compétences et leurs disponibilités.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Statistiques détaillées',
      description: 'Analysez vos performances avec des rapports complets : chiffre d&apos;affaires, taux de remplissage, fidélité clients.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title: 'Paiement en ligne',
      description: 'Acceptez les paiements en ligne et les acomptes pour sécuriser vos réservations.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      title: 'Avis & Réputation',
      description: 'Collectez automatiquement les avis clients et boostez votre visibilité sur la plateforme.',
    },
  ];

  const testimonials = [
    {
      quote: "Depuis que j'utilise Planity, mon agenda est toujours rempli. Les rappels automatiques ont divisé mes no-shows par 4 !",
      author: 'Marie L.',
      role: 'Coiffeuse à Paris',
      rating: 5,
    },
    {
      quote: "L'outil est super intuitif. J'ai pu former mon équipe en moins d'une heure. Un vrai gain de temps au quotidien.",
      author: 'Thomas B.',
      role: 'Gérant d&apos;institut',
      rating: 5,
    },
    {
      quote: "Les statistiques me permettent de mieux comprendre mon activité et d'optimiser mes horaires d'ouverture.",
      author: 'Sophie D.',
      role: 'Esthéticienne',
      rating: 5,
    },
  ];

  const steps = [
    { number: '1', title: 'Inscrivez-vous', description: 'Créez votre compte professionnel en quelques minutes' },
    { number: '2', title: 'Configurez', description: 'Ajoutez vos services, tarifs et disponibilités' },
    { number: '3', title: 'Recevez des clients', description: 'Votre salon apparaît sur Planity et reçoit des réservations' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
      <Header />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-cream-100 text-cream-700 rounded-full text-sm font-medium mb-6">
                Pour les professionnels
              </div>
              <h1 className="text-5xl font-bold text-coffee-800 mb-6">
                Développez votre activité avec Planity
              </h1>
              <p className="text-xl text-coffee-600 mb-8">
                La solution tout-en-un pour gérer votre salon, automatiser vos tâches
                et attirer de nouveaux clients.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg">
                    Créer mon compte gratuit
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg">
                    Voir les tarifs
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-coffee-500">
                Essai gratuit 30 jours • Sans engagement • Sans carte bancaire
              </p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-cream-400 to-cream-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <svg className="w-32 h-32 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-coffee-800 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-coffee-600 max-w-2xl mx-auto">
              Des outils puissants et simples à utiliser pour gérer votre activité au quotidien.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full">
                <div className="w-14 h-14 rounded-xl bg-cream-100 flex items-center justify-center text-cream-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-coffee-800 text-lg mb-2">{feature.title}</h3>
                <p className="text-coffee-600 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-coffee-800 mb-4">
              Commencez en 3 étapes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="text-center relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-cream-200" />
                )}
                <div className="w-16 h-16 rounded-full bg-cream-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 relative z-10">
                  {step.number}
                </div>
                <h3 className="font-semibold text-coffee-800 mb-2">{step.title}</h3>
                <p className="text-coffee-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-coffee-800 mb-4">
              Ils nous font confiance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.author}>
                <div className="flex text-yellow-500 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-coffee-600 mb-4 italic">&quot;{testimonial.quote}&quot;</p>
                <div>
                  <p className="font-semibold text-coffee-800">{testimonial.author}</p>
                  <p className="text-sm text-coffee-500">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card className="text-center py-12 bg-gradient-to-br from-cream-600 to-cream-700">
            <h2 className="text-3xl font-bold text-white mb-4">
              Prêt à développer votre activité ?
            </h2>
            <p className="text-cream-100 mb-8 max-w-xl mx-auto">
              Rejoignez des centaines de professionnels qui utilisent déjà Planity pour gérer leur salon.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="secondary" size="lg">
                  Démarrer mon essai gratuit
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="bg-white/10 text-white border-white hover:bg-white/20">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
