"use client";

import Link from "next/link";
import { Header } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 max-w-4xl py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-gray-500 mb-8">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
          </p>

          <div className="prose prose-gray max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-600 mb-4">
                Planity (&quot;nous&quot;, &quot;notre&quot;, &quot;nos&quot;) s&apos;engage à protéger la vie privée
                de ses utilisateurs. Cette politique de confidentialité explique comment nous collectons,
                utilisons, stockons et protégeons vos données personnelles lorsque vous utilisez notre
                plateforme de réservation en ligne.
              </p>
              <p className="text-gray-600">
                En utilisant nos services, vous acceptez les pratiques décrites dans cette politique.
              </p>
            </section>

            {/* Responsable du traitement */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                2. Responsable du traitement
              </h2>
              <p className="text-gray-600 mb-4">
                Le responsable du traitement des données personnelles est :
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-600">
                <p><strong>Planity SAS</strong></p>
                <p>Adresse : [À compléter]</p>
                <p>Email : contact@planity.fr</p>
                <p>Téléphone : [À compléter]</p>
              </div>
            </section>

            {/* Données collectées */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                3. Données collectées
              </h2>
              <p className="text-gray-600 mb-4">
                Nous collectons les catégories de données suivantes :
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                3.1 Données d&apos;identification
              </h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone</li>
                <li>Photo de profil (optionnel)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                3.2 Données de réservation
              </h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>Historique des réservations</li>
                <li>Services réservés</li>
                <li>Date et heure des rendez-vous</li>
                <li>Notes et commentaires laissés</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                3.3 Données de paiement
              </h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>Informations de carte bancaire (traitées par Stripe)</li>
                <li>Historique des transactions</li>
                <li>Factures</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                3.4 Données techniques
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Adresse IP</li>
                <li>Type de navigateur</li>
                <li>Données de connexion</li>
                <li>Cookies et traceurs</li>
              </ul>
            </section>

            {/* Finalités du traitement */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Finalités du traitement
              </h2>
              <p className="text-gray-600 mb-4">
                Vos données sont collectées pour les finalités suivantes :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Gestion des comptes :</strong> création et administration de votre compte utilisateur</li>
                <li><strong>Réservations :</strong> traitement et suivi de vos réservations</li>
                <li><strong>Paiements :</strong> traitement sécurisé des transactions</li>
                <li><strong>Communication :</strong> envoi de confirmations, rappels et notifications</li>
                <li><strong>Amélioration des services :</strong> analyse et optimisation de notre plateforme</li>
                <li><strong>Support client :</strong> réponse à vos demandes et réclamations</li>
                <li><strong>Obligations légales :</strong> respect de nos obligations réglementaires</li>
              </ul>
            </section>

            {/* Base légale */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                5. Base légale du traitement
              </h2>
              <p className="text-gray-600 mb-4">
                Le traitement de vos données repose sur les bases légales suivantes :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Exécution du contrat :</strong> pour fournir nos services de réservation</li>
                <li><strong>Consentement :</strong> pour l&apos;envoi de communications marketing</li>
                <li><strong>Intérêt légitime :</strong> pour améliorer nos services et prévenir la fraude</li>
                <li><strong>Obligation légale :</strong> pour respecter nos obligations fiscales et comptables</li>
              </ul>
            </section>

            {/* Destinataires */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                6. Destinataires des données
              </h2>
              <p className="text-gray-600 mb-4">
                Vos données peuvent être partagées avec :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Les professionnels partenaires :</strong> salons et établissements auprès desquels vous réservez</li>
                <li><strong>Prestataires de paiement :</strong> Stripe pour le traitement sécurisé des paiements</li>
                <li><strong>Prestataires techniques :</strong> hébergement (Vercel), base de données (Neon), envoi d&apos;emails (Resend)</li>
                <li><strong>Prestataires SMS :</strong> Twilio pour l&apos;envoi de notifications par SMS</li>
                <li><strong>Autorités compétentes :</strong> en cas d&apos;obligation légale</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Nous ne vendons jamais vos données personnelles à des tiers.
              </p>
            </section>

            {/* Transferts internationaux */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                7. Transferts internationaux
              </h2>
              <p className="text-gray-600">
                Certains de nos prestataires peuvent être situés en dehors de l&apos;Union Européenne.
                Dans ce cas, nous nous assurons que des garanties appropriées sont mises en place
                (clauses contractuelles types, certification Privacy Shield, etc.) pour protéger
                vos données conformément au RGPD.
              </p>
            </section>

            {/* Durée de conservation */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                8. Durée de conservation
              </h2>
              <p className="text-gray-600 mb-4">
                Nous conservons vos données pendant les durées suivantes :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Données de compte :</strong> pendant la durée de votre inscription + 3 ans après suppression</li>
                <li><strong>Données de réservation :</strong> 5 ans à compter de la prestation</li>
                <li><strong>Données de paiement :</strong> 10 ans (obligations comptables)</li>
                <li><strong>Cookies :</strong> 13 mois maximum</li>
                <li><strong>Données de prospection :</strong> 3 ans à compter du dernier contact</li>
              </ul>
            </section>

            {/* Sécurité */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                9. Sécurité des données
              </h2>
              <p className="text-gray-600 mb-4">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées
                pour protéger vos données :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Chiffrement des données en transit (HTTPS/TLS)</li>
                <li>Chiffrement des mots de passe (bcrypt)</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Sauvegardes régulières</li>
                <li>Surveillance et détection des intrusions</li>
                <li>Formation du personnel à la protection des données</li>
              </ul>
            </section>

            {/* Vos droits */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                10. Vos droits
              </h2>
              <p className="text-gray-600 mb-4">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> corriger des données inexactes</li>
                <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données</li>
                <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données</li>
                <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
                <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong>Droit de retirer votre consentement :</strong> à tout moment pour les traitements basés sur le consentement</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Pour exercer ces droits, contactez-nous à : <strong>privacy@planity.fr</strong>
              </p>
              <p className="text-gray-600 mt-2">
                Vous avez également le droit d&apos;introduire une réclamation auprès de la CNIL
                (Commission Nationale de l&apos;Informatique et des Libertés).
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                11. Cookies
              </h2>
              <p className="text-gray-600 mb-4">
                Notre site utilise des cookies pour :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site (authentification, panier)</li>
                <li><strong>Cookies analytiques :</strong> pour comprendre comment vous utilisez notre site</li>
                <li><strong>Cookies de préférences :</strong> pour mémoriser vos choix</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Vous pouvez gérer vos préférences de cookies à tout moment via les paramètres
                de votre navigateur.
              </p>
            </section>

            {/* Mineurs */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                12. Protection des mineurs
              </h2>
              <p className="text-gray-600">
                Nos services sont destinés aux personnes de 16 ans et plus. Nous ne collectons
                pas sciemment de données personnelles concernant des mineurs de moins de 16 ans.
                Si nous découvrons avoir collecté des données d&apos;un mineur sans consentement parental,
                nous les supprimerons immédiatement.
              </p>
            </section>

            {/* Modifications */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                13. Modifications de la politique
              </h2>
              <p className="text-gray-600">
                Nous pouvons mettre à jour cette politique de confidentialité à tout moment.
                En cas de modification substantielle, nous vous en informerons par email ou
                par une notification sur notre site. Nous vous encourageons à consulter
                régulièrement cette page.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                14. Contact
              </h2>
              <p className="text-gray-600 mb-4">
                Pour toute question concernant cette politique de confidentialité ou vos données
                personnelles, vous pouvez nous contacter :
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-600">
                <p><strong>Délégué à la Protection des Données (DPO)</strong></p>
                <p>Email : privacy@planity.fr</p>
                <p>Adresse : [À compléter]</p>
              </div>
            </section>
          </div>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/terms"
                className="text-primary hover:underline"
              >
                Conditions Générales d&apos;Utilisation
              </Link>
              <Link
                href="/"
                className="text-primary hover:underline"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
