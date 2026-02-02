'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header, Button, Card } from '@/components/ui';

type ContactSubject = 'general' | 'support' | 'partnership' | 'press' | 'other';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general' as ContactSubject,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjects: { value: ContactSubject; label: string }[] = [
    { value: 'general', label: 'Question générale' },
    { value: 'support', label: 'Support technique' },
    { value: 'partnership', label: 'Partenariat' },
    { value: 'press', label: 'Presse / Médias' },
    { value: 'other', label: 'Autre' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-coffee-800 mb-4">
              Message envoyé !
            </h1>
            <p className="text-coffee-600 mb-8">
              Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.
            </p>
            <Link href="/">
              <Button>Retour à l&apos;accueil</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
      <Header />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-coffee-800 mb-4">
            Contactez-nous
          </h1>
          <p className="text-lg text-coffee-600 max-w-2xl mx-auto">
            Une question ? Une suggestion ? Notre équipe est là pour vous aider.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cream-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-coffee-800 mb-1">Email</h3>
                  <p className="text-coffee-600 text-sm">Pour toute question générale</p>
                  <a href="mailto:contact@planity.fr" className="text-cream-700 hover:underline">
                    contact@planity.fr
                  </a>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cream-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-coffee-800 mb-1">Support</h3>
                  <p className="text-coffee-600 text-sm">Assistance technique</p>
                  <a href="mailto:support@planity.fr" className="text-cream-700 hover:underline">
                    support@planity.fr
                  </a>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cream-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-coffee-800 mb-1">Adresse</h3>
                  <p className="text-coffee-600 text-sm">
                    Planity SAS<br />
                    Paris, France
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-coffee-800 mb-3">FAQ</h3>
              <p className="text-coffee-600 text-sm mb-4">
                Consultez notre page &quot;Comment ça marche&quot; pour trouver des réponses aux questions fréquentes.
              </p>
              <Link href="/how-it-works">
                <Button variant="outline" size="sm" fullWidth>
                  Voir la FAQ
                </Button>
              </Link>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-semibold text-coffee-800 mb-6">
                Envoyez-nous un message
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-coffee-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-cream-500"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-coffee-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-cream-500"
                      placeholder="jean@exemple.fr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-coffee-700 mb-2">
                    Sujet *
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value as ContactSubject })}
                    className="w-full px-4 py-3 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-cream-500 bg-white"
                  >
                    {subjects.map((subject) => (
                      <option key={subject.value} value={subject.value}>
                        {subject.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-coffee-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-cream-500 resize-none"
                    placeholder="Décrivez votre demande..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-coffee-500">
                    * Champs obligatoires
                  </p>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
