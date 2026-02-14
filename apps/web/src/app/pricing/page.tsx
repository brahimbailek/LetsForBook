'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header, Button, Card } from '@/components/ui';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Pro',
      description: 'Le plus populaire',
      monthlyPrice: 59,
      yearlyPrice: 49,
      features: [
        'Jusqu&apos;à 5 professionnels',
        'Agenda en ligne',
        'Réservations illimitées',
        'Rappels SMS (200/mois)',
        'Page salon personnalisée',
        'Paiement en ligne',
        'Acomptes & cautions',
        'Statistiques détaillées',
        'Widget de réservation',
        'Support prioritaire',
      ],
      notIncluded: [
        'Multi-établissements',
      ],
      cta: 'Commencer',
      popular: true,
    },
    {
      name: 'Business',
      description: 'Pour les grands salons',
      monthlyPrice: 99,
      yearlyPrice: 84,
      features: [
        'Professionnels illimités',
        'Tout Pro +',
        'Rappels SMS illimités',
        'Multi-établissements',
        'API & intégrations',
        'Formation dédiée',
        'Account manager',
        'SLA garanti',
      ],
      notIncluded: [],
      cta: 'Commencer',
      popular: false,
    },
  ];

  const faqs = [
    {
      question: 'Y a-t-il un engagement ?',
      answer: 'Non, tous nos plans sont sans engagement. Vous pouvez annuler à tout moment depuis votre espace client.',
    },
    {
      question: 'Puis-je changer de plan ?',
      answer: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Le changement sera effectif immédiatement.',
    },
    {
      question: 'Comment fonctionne l&apos;essai gratuit ?',
      answer: 'Vous bénéficiez de 30 jours d&apos;essai gratuit sur le plan Pro, sans carte bancaire requise. À la fin de l&apos;essai, vous choisissez votre plan.',
    },
    {
      question: 'Les SMS sont-ils inclus ?',
      answer: 'Chaque plan inclut un quota de SMS. Au-delà, les SMS sont facturés 0.07€/SMS pour la France.',
    },
    {
      question: 'Quels moyens de paiement acceptez-vous ?',
      answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard, Amex) et les prélèvements SEPA pour les paiements annuels.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
      <Header />

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-coffee-800 mb-4">
            Des tarifs simples et transparents
          </h1>
          <p className="text-xl text-coffee-600 mb-8">
            Choisissez le plan adapté à votre activité. Essai gratuit 30 jours.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-sand-100 rounded-xl">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-coffee-800 shadow-sm'
                  : 'text-coffee-600 hover:text-coffee-800'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-coffee-800 shadow-sm'
                  : 'text-coffee-600 hover:text-coffee-800'
              }`}
            >
              Annuel
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? 'border-2 border-cream-500 shadow-xl' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-cream-600 text-white text-sm font-medium rounded-full">
                      Populaire
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-coffee-800 mb-1">{plan.name}</h3>
                  <p className="text-coffee-500 text-sm">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-4xl font-bold text-coffee-800">
                      {billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}€
                    </span>
                    <span className="text-coffee-500 mb-1">/mois</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-sm text-green-600 mt-1">
                      Facturé {plan.yearlyPrice * 12}€/an
                    </p>
                  )}
                </div>

                <Link href="/register?type=pro">
                  <Button
                    fullWidth
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="mb-6"
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-coffee-600" dangerouslySetInnerHTML={{ __html: feature }} />
                    </div>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 opacity-50">
                      <svg className="w-5 h-5 text-coffee-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm text-coffee-500">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-coffee-800 mb-4">
              Tous les plans incluent
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🔒', label: 'Sécurité SSL' },
              { icon: '📱', label: 'App mobile' },
              { icon: '🔄', label: 'Mises à jour' },
              { icon: '💬', label: 'Support client' },
              { icon: '📊', label: 'Statistiques' },
              { icon: '🔔', label: 'Notifications' },
              { icon: '🎨', label: 'Personnalisation' },
              { icon: '🌐', label: 'Référencement' },
            ].map((item) => (
              <div key={item.label} className="text-center p-4">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-sm text-coffee-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-coffee-800 mb-4">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.question}>
                <h3 className="font-semibold text-coffee-800 mb-2">{faq.question}</h3>
                <p className="text-coffee-600 text-sm" dangerouslySetInnerHTML={{ __html: faq.answer }} />
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-coffee-600 mb-4">
              Une autre question ?
            </p>
            <Link href="/contact">
              <Button variant="outline">
                Contactez-nous
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card className="text-center py-12 bg-gradient-to-br from-cream-600 to-cream-700">
            <h2 className="text-3xl font-bold text-white mb-4">
              Lancez-vous gratuitement
            </h2>
            <p className="text-cream-100 mb-8">
              30 jours d&apos;essai gratuit • Sans engagement • Sans carte bancaire
            </p>
            <Link href="/register?type=pro">
              <Button variant="secondary" size="lg">
                Créer mon compte gratuit
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
