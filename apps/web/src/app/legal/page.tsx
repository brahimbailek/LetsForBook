"use client";

import Link from "next/link";
import { Header } from "@/components/ui";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 max-w-4xl py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mentions Légales
          </h1>
          <p className="text-gray-500 mb-8">
            Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l&apos;économie numérique
          </p>

          <div className="prose prose-gray max-w-none">
            {/* Éditeur du site */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                1. Éditeur du site
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-600">
                <p><strong>Planity SAS</strong></p>
                <p>Société par Actions Simplifiée au capital de [montant] euros</p>
                <p>Siège social : [Adresse complète]</p>
                <p>RCS : [Ville] B [numéro]</p>
                <p>SIRET : [numéro SIRET]</p>
                <p>TVA Intracommunautaire : FR [numéro]</p>
                <p className="mt-4">
                  <strong>Directeur de la publication :</strong> [Nom du directeur]
                </p>
                <p>
                  <strong>Email :</strong> contact@planity.fr
                </p>
                <p>
                  <strong>Téléphone :</strong> [numéro de téléphone]
                </p>
              </div>
            </section>

            {/* Hébergement */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                2. Hébergement
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-600">
                <p><strong>Vercel Inc.</strong></p>
                <p>340 S Lemon Ave #4133</p>
                <p>Walnut, CA 91789</p>
                <p>États-Unis</p>
                <p>Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://vercel.com</a></p>
              </div>
            </section>

            {/* Propriété intellectuelle */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                3. Propriété intellectuelle
              </h2>
              <p className="text-gray-600 mb-4">
                L&apos;ensemble du contenu de ce site (textes, images, logos, graphismes, icônes,
                logiciels, base de données, etc.) est la propriété exclusive de Planity SAS
                ou de ses partenaires et est protégé par les lois françaises et internationales
                relatives à la propriété intellectuelle.
              </p>
              <p className="text-gray-600 mb-4">
                Toute reproduction, représentation, modification, publication, adaptation de tout
                ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé,
                est interdite, sauf autorisation écrite préalable de Planity SAS.
              </p>
              <p className="text-gray-600">
                Toute exploitation non autorisée du site ou de son contenu sera considérée
                comme constitutive d&apos;une contrefaçon et poursuivie conformément aux
                dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
              </p>
            </section>

            {/* Limitation de responsabilité */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Limitation de responsabilité
              </h2>
              <p className="text-gray-600 mb-4">
                Planity SAS s&apos;efforce d&apos;assurer au mieux de ses possibilités l&apos;exactitude
                et la mise à jour des informations diffusées sur ce site, dont elle se réserve
                le droit de corriger, à tout moment et sans préavis, le contenu.
              </p>
              <p className="text-gray-600 mb-4">
                Planity SAS décline toute responsabilité :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Pour toute interruption du site</li>
                <li>Pour toute survenance de bugs</li>
                <li>Pour toute inexactitude ou omission portant sur des informations disponibles sur le site</li>
                <li>Pour tous dommages résultant d&apos;une intrusion frauduleuse d&apos;un tiers</li>
                <li>Pour tous dommages, directs ou indirects, quelles qu&apos;en soient les causes, origines, natures ou conséquences</li>
              </ul>
            </section>

            {/* Liens hypertextes */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                5. Liens hypertextes
              </h2>
              <p className="text-gray-600 mb-4">
                Le site peut contenir des liens hypertextes vers d&apos;autres sites internet.
                Planity SAS n&apos;exerce aucun contrôle sur ces sites et décline toute
                responsabilité quant à leur contenu ou aux services qu&apos;ils proposent.
              </p>
              <p className="text-gray-600">
                La création de liens hypertextes vers le site Planity est soumise à
                l&apos;accord préalable et écrit de Planity SAS.
              </p>
            </section>

            {/* Données personnelles */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                6. Données personnelles
              </h2>
              <p className="text-gray-600 mb-4">
                Les informations relatives au traitement des données personnelles sont
                détaillées dans notre{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Politique de Confidentialité
                </Link>.
              </p>
              <p className="text-gray-600 mb-4">
                Conformément au Règlement Général sur la Protection des Données (RGPD) et
                à la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès,
                de rectification, de suppression et de portabilité de vos données personnelles.
              </p>
              <p className="text-gray-600">
                Pour exercer ces droits, vous pouvez nous contacter à l&apos;adresse :
                <strong> privacy@planity.fr</strong>
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                7. Cookies
              </h2>
              <p className="text-gray-600 mb-4">
                Notre site utilise des cookies pour améliorer votre expérience de navigation.
                Les cookies sont de petits fichiers texte stockés sur votre appareil qui nous
                permettent de :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Mémoriser vos préférences et paramètres</li>
                <li>Assurer le bon fonctionnement du site</li>
                <li>Analyser l&apos;utilisation du site pour l&apos;améliorer</li>
              </ul>
              <p className="text-gray-600">
                Vous pouvez configurer votre navigateur pour refuser les cookies ou
                être alerté lorsqu&apos;un cookie est déposé. Toutefois, certaines
                fonctionnalités du site pourraient ne plus être disponibles.
              </p>
            </section>

            {/* Droit applicable */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                8. Droit applicable et juridiction
              </h2>
              <p className="text-gray-600 mb-4">
                Les présentes mentions légales sont régies par le droit français.
              </p>
              <p className="text-gray-600">
                En cas de litige relatif à l&apos;interprétation ou l&apos;exécution des
                présentes, et à défaut de résolution amiable, les tribunaux français
                seront seuls compétents.
              </p>
            </section>

            {/* Médiation */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                9. Médiation
              </h2>
              <p className="text-gray-600 mb-4">
                Conformément aux articles L.611-1 et suivants du Code de la consommation,
                vous avez la possibilité de recourir gratuitement à un médiateur de la
                consommation en cas de litige.
              </p>
              <p className="text-gray-600">
                Nous vous informerons des coordonnées du médiateur compétent sur simple demande.
              </p>
            </section>

            {/* Crédits */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                10. Crédits
              </h2>
              <p className="text-gray-600">
                Conception et développement : Équipe Planity
              </p>
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
                href="/privacy"
                className="text-primary hover:underline"
              >
                Politique de Confidentialité
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
