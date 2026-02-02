'use client';

import Link from 'next/link';
import { Header, Card } from '@/components/ui';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-sand-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="p-8 md:p-12">
          <h1 className="text-3xl font-bold text-coffee-800 mb-2">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-coffee-500 mb-8">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <div className="prose prose-coffee max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">1. Objet</h2>
              <p className="text-coffee-600 leading-relaxed">
                Les présentes Conditions Générales d'Utilisation (ci-après "CGU") ont pour objet de définir les modalités et conditions d'utilisation de la plateforme LetsForBook (ci-après "la Plateforme"), accessible à l'adresse letsforbook.com, ainsi que les droits et obligations des utilisateurs.
              </p>
              <p className="text-coffee-600 leading-relaxed mt-3">
                LetsForBook est une plateforme de mise en relation entre des professionnels de la beauté et du bien-être (ci-après "les Professionnels") et des particuliers souhaitant réserver des prestations (ci-après "les Clients").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">2. Acceptation des CGU</h2>
              <p className="text-coffee-600 leading-relaxed">
                L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU. En créant un compte ou en utilisant nos services, vous reconnaissez avoir lu, compris et accepté ces conditions.
              </p>
              <p className="text-coffee-600 leading-relaxed mt-3">
                LetsForBook se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification par email ou notification sur la Plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">3. Inscription et compte utilisateur</h2>
              <h3 className="text-lg font-medium text-coffee-700 mb-2">3.1 Conditions d'inscription</h3>
              <p className="text-coffee-600 leading-relaxed">
                Pour utiliser les services de réservation, l'utilisateur doit créer un compte en fournissant des informations exactes et à jour (nom, prénom, adresse email, numéro de téléphone).
              </p>
              <p className="text-coffee-600 leading-relaxed mt-3">
                L'utilisateur doit être âgé d'au moins 18 ans ou disposer de l'autorisation d'un représentant légal.
              </p>

              <h3 className="text-lg font-medium text-coffee-700 mb-2 mt-4">3.2 Sécurité du compte</h3>
              <p className="text-coffee-600 leading-relaxed">
                L'utilisateur est responsable de la confidentialité de ses identifiants de connexion et de toute activité effectuée depuis son compte. En cas d'utilisation non autorisée, l'utilisateur doit immédiatement en informer LetsForBook.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">4. Services proposés</h2>
              <h3 className="text-lg font-medium text-coffee-700 mb-2">4.1 Pour les Clients</h3>
              <ul className="list-disc list-inside text-coffee-600 space-y-2">
                <li>Recherche de salons et professionnels de la beauté</li>
                <li>Consultation des disponibilités en temps réel</li>
                <li>Réservation de prestations en ligne</li>
                <li>Paiement sécurisé de l'acompte</li>
                <li>Gestion des rendez-vous (modification, annulation)</li>
                <li>Publication d'avis après les prestations</li>
              </ul>

              <h3 className="text-lg font-medium text-coffee-700 mb-2 mt-4">4.2 Pour les Professionnels</h3>
              <ul className="list-disc list-inside text-coffee-600 space-y-2">
                <li>Création et gestion d'une page établissement</li>
                <li>Gestion des services et tarifs</li>
                <li>Gestion des disponibilités et de l'équipe</li>
                <li>Réception et gestion des réservations</li>
                <li>Encaissement des paiements</li>
                <li>Consultation des statistiques et avis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">5. Réservation et paiement</h2>
              <h3 className="text-lg font-medium text-coffee-700 mb-2">5.1 Processus de réservation</h3>
              <p className="text-coffee-600 leading-relaxed">
                La réservation est effective après paiement de l'acompte (si requis par le Professionnel) et confirmation par email/SMS. Le montant de l'acompte est fixé par chaque Professionnel (généralement entre 20% et 50% du prix total).
              </p>

              <h3 className="text-lg font-medium text-coffee-700 mb-2 mt-4">5.2 Paiement sécurisé</h3>
              <p className="text-coffee-600 leading-relaxed">
                Les paiements sont traités de manière sécurisée via notre partenaire Stripe. LetsForBook ne stocke aucune donnée bancaire. Le reste du paiement est effectué directement auprès du Professionnel le jour de la prestation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">6. Politique d'annulation</h2>
              <p className="text-coffee-600 leading-relaxed">
                <strong>Annulation par le Client :</strong>
              </p>
              <ul className="list-disc list-inside text-coffee-600 space-y-2 mt-2">
                <li>Annulation plus de 48 heures avant le rendez-vous : remboursement intégral de l'acompte</li>
                <li>Annulation moins de 48 heures avant le rendez-vous : l'acompte n'est pas remboursé</li>
                <li>Non-présentation (no-show) : l'acompte n'est pas remboursé</li>
              </ul>
              <p className="text-coffee-600 leading-relaxed mt-3">
                <strong>Annulation par le Professionnel :</strong> En cas d'annulation par le Professionnel, le Client est intégralement remboursé de son acompte.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">7. Avis et commentaires</h2>
              <p className="text-coffee-600 leading-relaxed">
                Les Clients peuvent publier des avis uniquement après avoir effectué une prestation confirmée. Les avis doivent être honnêtes, respectueux et conformes à la réalité de l'expérience vécue.
              </p>
              <p className="text-coffee-600 leading-relaxed mt-3">
                LetsForBook se réserve le droit de supprimer tout avis contraire aux présentes CGU, diffamatoire, injurieux ou manifestement faux.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">8. Responsabilités</h2>
              <h3 className="text-lg font-medium text-coffee-700 mb-2">8.1 Responsabilité de LetsForBook</h3>
              <p className="text-coffee-600 leading-relaxed">
                LetsForBook agit en qualité d'intermédiaire technique et ne peut être tenu responsable de la qualité des prestations réalisées par les Professionnels, ni des différends pouvant survenir entre Clients et Professionnels.
              </p>

              <h3 className="text-lg font-medium text-coffee-700 mb-2 mt-4">8.2 Responsabilité des utilisateurs</h3>
              <p className="text-coffee-600 leading-relaxed">
                Chaque utilisateur est responsable de l'exactitude des informations fournies et de l'utilisation qu'il fait de la Plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">9. Propriété intellectuelle</h2>
              <p className="text-coffee-600 leading-relaxed">
                Tous les éléments de la Plateforme (textes, images, logos, logiciels) sont la propriété exclusive de LetsForBook ou de ses partenaires et sont protégés par les lois relatives à la propriété intellectuelle.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">10. Protection des données personnelles</h2>
              <p className="text-coffee-600 leading-relaxed">
                LetsForBook s'engage à protéger les données personnelles de ses utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD). Pour plus d'informations, consultez notre{' '}
                <Link href="/privacy" className="text-sage-600 hover:underline">
                  Politique de confidentialité
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">11. Résiliation</h2>
              <p className="text-coffee-600 leading-relaxed">
                L'utilisateur peut à tout moment supprimer son compte depuis les paramètres de son profil. LetsForBook se réserve le droit de suspendre ou supprimer tout compte en cas de non-respect des présentes CGU.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">12. Droit applicable et litiges</h2>
              <p className="text-coffee-600 leading-relaxed">
                Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire. À défaut, les tribunaux français seront compétents.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-coffee-800 mb-4">13. Contact</h2>
              <p className="text-coffee-600 leading-relaxed">
                Pour toute question concernant les présentes CGU, vous pouvez nous contacter à l'adresse :{' '}
                <a href="mailto:contact@letsforbook.com" className="text-sage-600 hover:underline">
                  contact@letsforbook.com
                </a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-sand-200">
            <Link href="/" className="text-sage-600 hover:text-sage-700">
              ← Retour à l'accueil
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
