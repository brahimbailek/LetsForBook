'use client';

import Link from 'next/link';
import { Header, Button, Card } from '@/components/ui';

export default function AboutPage() {
  const stats = [
    { value: '10K+', label: 'Utilisateurs' },
    { value: '500+', label: 'Salons partenaires' },
    { value: '50K+', label: 'Réservations' },
    { value: '4.8/5', label: 'Note moyenne' },
  ];

  const values = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Simplicité',
      description: 'Une expérience de réservation fluide et intuitive, en quelques clics seulement.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Confiance',
      description: 'Des professionnels vérifiés et des avis authentiques pour choisir en toute sérénité.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Proximité',
      description: 'Nous accompagnons clients et professionnels au quotidien avec un support réactif.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Innovation',
      description: 'Des outils modernes pour faciliter la gestion et développer votre activité.',
    },
  ];

  const team = [
    { name: 'Marie Martin', role: 'CEO & Co-fondatrice', avatar: 'MM' },
    { name: 'Thomas Bernard', role: 'CTO & Co-fondateur', avatar: 'TB' },
    { name: 'Sophie Dubois', role: 'Directrice Marketing', avatar: 'SD' },
    { name: 'Lucas Petit', role: 'Lead Développeur', avatar: 'LP' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
      <Header />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-5xl font-bold text-coffee-800 mb-6">
            Notre mission : simplifier
            <br />
            <span className="text-cream-700">la beauté au quotidien</span>
          </h1>
          <p className="text-xl text-coffee-600 max-w-3xl mx-auto mb-12">
            Planity connecte les clients aux meilleurs professionnels de la beauté et du bien-être.
            Notre plateforme permet de réserver facilement et aux professionnels de développer leur activité.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-cream-700 mb-1">{stat.value}</div>
                <div className="text-sm text-coffee-600">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-coffee-800 mb-6">
                Notre histoire
              </h2>
              <div className="space-y-4 text-coffee-600">
                <p>
                  Planity est né d&apos;un constat simple : trouver et réserver un rendez-vous
                  chez un professionnel de la beauté ne devrait pas être compliqué.
                </p>
                <p>
                  En 2024, nous avons lancé notre plateforme avec l&apos;ambition de révolutionner
                  la façon dont les clients découvrent et réservent leurs prestations beauté,
                  tout en offrant aux professionnels des outils puissants pour gérer leur activité.
                </p>
                <p>
                  Aujourd&apos;hui, des milliers de clients font confiance à Planity pour leurs
                  rendez-vous, et des centaines de professionnels utilisent notre solution
                  pour développer leur salon.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-cream-400 to-cream-600 rounded-3xl flex items-center justify-center">
                <svg className="w-32 h-32 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-coffee-800 mb-4">
              Nos valeurs
            </h2>
            <p className="text-coffee-600 max-w-2xl mx-auto">
              Ces principes guident chacune de nos décisions et notre façon de travailler.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0 text-cream-600">
                  {value.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-coffee-800 mb-2">{value.title}</h3>
                  <p className="text-coffee-600 text-sm">{value.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-coffee-800 mb-4">
              Notre équipe
            </h2>
            <p className="text-coffee-600 max-w-2xl mx-auto">
              Une équipe passionnée qui travaille chaque jour pour vous offrir la meilleure expérience.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cream-500 to-cream-700 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-white">{member.avatar}</span>
                </div>
                <h3 className="font-semibold text-coffee-800">{member.name}</h3>
                <p className="text-sm text-coffee-500">{member.role}</p>
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
              Rejoignez l&apos;aventure Planity
            </h2>
            <p className="text-cream-100 mb-8 max-w-xl mx-auto">
              Que vous soyez client ou professionnel, nous avons une solution pour vous.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/search">
                <Button variant="secondary" size="lg">
                  Trouver un salon
                </Button>
              </Link>
              <Link href="/for-professionals">
                <Button variant="outline" size="lg" className="bg-white/10 text-white border-white hover:bg-white/20">
                  Devenir partenaire
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
