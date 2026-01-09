import type { Metadata } from 'next'
import { Shield, Database, Eye, Lock, UserCheck, Mail, Settings, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité - Devorbaits',
  description: 'Politique de confidentialité et protection des données personnelles du site Devorbaits.',
}

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <Shield className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">VOS DONNÉES PROTÉGÉES</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Politique de Confidentialité</h1>
          <p className="text-gray-400">Dernière mise à jour : Janvier 2026</p>
        </div>

        {/* Introduction */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
          <p className="text-gray-300">
            Chez Devorbaits, nous accordons une grande importance à la protection de vos données personnelles. 
            Cette politique de confidentialité vous informe sur la manière dont nous collectons, utilisons et 
            protégeons vos informations lorsque vous utilisez notre site web.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Responsable du traitement */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <UserCheck className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">1. Responsable du traitement</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p>Le responsable du traitement des données personnelles est :</p>
              <ul className="list-none space-y-2 ml-4">
                <li><strong>Entreprise :</strong> Devorbaits</li>
                <li><strong>Représentant :</strong> Jean-Claude Maquaire</li>
                <li><strong>Adresse :</strong> 240 rue Douce, 60130 Wavignies, France</li>
                <li><strong>Email :</strong> devorbaits.contact@gmail.com</li>
                <li><strong>Téléphone :</strong> 07 61 28 85 12</li>
                <li><strong>SIRET :</strong> 848 555 686 00015</li>
              </ul>
            </div>
          </section>

          {/* Données collectées */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Database className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">2. Données collectées</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>Nous collectons les données suivantes :</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Données d'identification :</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Nom et prénom</li>
                    <li>Adresse email</li>
                    <li>Numéro de téléphone</li>
                    <li>Adresse postale de livraison et de facturation</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Données de commande :</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Historique des commandes</li>
                    <li>Produits commandés</li>
                    <li>Montants des transactions</li>
                    <li>Mode de paiement (sans les données bancaires complètes)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Données de navigation :</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Adresse IP</li>
                    <li>Type de navigateur</li>
                    <li>Pages visitées</li>
                    <li>Durée de la visite</li>
                    <li>Cookies (voir section dédiée)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Finalités du traitement */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Eye className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">3. Finalités du traitement</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>Vos données personnelles sont collectées pour les finalités suivantes :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Gestion des commandes :</strong> traitement, préparation, expédition et suivi de vos commandes</li>
                <li><strong>Relation client :</strong> réponse à vos demandes, gestion du service après-vente</li>
                <li><strong>Gestion des comptes clients :</strong> création et gestion de votre espace personnel</li>
                <li><strong>Amélioration du site :</strong> analyse des statistiques de navigation pour améliorer l'expérience utilisateur</li>
                <li><strong>Communication commerciale :</strong> envoi de newsletters et offres promotionnelles (avec votre consentement)</li>
                <li><strong>Obligations légales :</strong> respect de nos obligations comptables et fiscales</li>
              </ul>
            </div>
          </section>

          {/* Base légale */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">4. Base légale du traitement</h2>
            <div className="space-y-4 text-gray-300">
              <p>Le traitement de vos données repose sur les bases légales suivantes :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Exécution du contrat :</strong> pour le traitement de vos commandes</li>
                <li><strong>Consentement :</strong> pour l'envoi de communications commerciales</li>
                <li><strong>Intérêt légitime :</strong> pour l'amélioration de nos services et la prévention de la fraude</li>
                <li><strong>Obligation légale :</strong> pour la conservation des factures et documents comptables</li>
              </ul>
            </div>
          </section>

          {/* Destinataires des données */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">5. Destinataires des données</h2>
            <div className="space-y-4 text-gray-300">
              <p>Vos données personnelles peuvent être transmises aux destinataires suivants :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Services internes :</strong> équipe commerciale et logistique de Devorbaits</li>
                <li><strong>Transporteurs :</strong> pour la livraison de vos commandes (Colissimo, Mondial Relay, etc.)</li>
                <li><strong>Prestataires de paiement :</strong> pour le traitement sécurisé des paiements (PayPal, Monetico)</li>
                <li><strong>Hébergeur :</strong> Vercel (pour l'hébergement du site)</li>
                <li><strong>Supabase :</strong> pour le stockage sécurisé des données</li>
              </ul>
              <p>
                Nous ne vendons ni ne louons vos données personnelles à des tiers à des fins commerciales.
              </p>
            </div>
          </section>

          {/* Durée de conservation */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Lock className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">6. Durée de conservation</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>Vos données sont conservées pendant les durées suivantes :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Données clients :</strong> 3 ans à compter de la dernière commande ou du dernier contact</li>
                <li><strong>Données de commande :</strong> 10 ans (obligations comptables et fiscales)</li>
                <li><strong>Données de navigation :</strong> 13 mois maximum</li>
                <li><strong>Cookies :</strong> 13 mois maximum</li>
              </ul>
              <p>
                Au-delà de ces durées, vos données sont supprimées ou anonymisées.
              </p>
            </div>
          </section>

          {/* Vos droits */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Settings className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">7. Vos droits</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Droit d'accès :</strong> obtenir la confirmation que des données vous concernant sont traitées et en obtenir une copie</li>
                <li><strong>Droit de rectification :</strong> demander la correction de données inexactes ou incomplètes</li>
                <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données dans certains cas</li>
                <li><strong>Droit à la limitation :</strong> demander la limitation du traitement de vos données</li>
                <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et les transmettre à un autre responsable</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données pour des motifs légitimes</li>
                <li><strong>Droit de retirer votre consentement :</strong> à tout moment pour les traitements basés sur le consentement</li>
              </ul>
              <p className="mt-4">
                <strong>Pour exercer vos droits :</strong>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Mail className="w-4 h-4 text-yellow-500" />
                <span>devorbaits.contact@gmail.com</span>
              </div>
              <p className="mt-4">
                Vous disposez également du droit d'introduire une réclamation auprès de la CNIL 
                (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">www.cnil.fr</a>
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Globe className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">8. Cookies</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Notre site utilise des cookies pour améliorer votre expérience de navigation. Un cookie est un petit 
                fichier texte stocké sur votre appareil.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Types de cookies utilisés :</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site (panier, session utilisateur)</li>
                    <li><strong>Cookies de performance :</strong> pour analyser l'utilisation du site et améliorer ses performances</li>
                    <li><strong>Cookies fonctionnels :</strong> pour mémoriser vos préférences (langue, région)</li>
                  </ul>
                </div>
              </div>

              <p>
                <strong>Gestion des cookies :</strong> Vous pouvez configurer votre navigateur pour refuser les cookies 
                ou être alerté lorsqu'un cookie est envoyé. Notez que la désactivation de certains cookies peut affecter 
                le fonctionnement du site.
              </p>
            </div>
          </section>

          {/* Sécurité */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">9. Sécurité des données</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos 
                données personnelles contre tout accès non autorisé, modification, divulgation ou destruction :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Chiffrement SSL/TLS pour toutes les communications</li>
                <li>Stockage sécurisé des données avec Supabase</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Paiements sécurisés via des prestataires certifiés</li>
              </ul>
            </div>
          </section>

          {/* Transferts internationaux */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">10. Transferts internationaux</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Certains de nos prestataires peuvent être situés en dehors de l'Union Européenne. Dans ce cas, 
                nous nous assurons que des garanties appropriées sont mises en place pour protéger vos données 
                (clauses contractuelles types, certifications, etc.).
              </p>
            </div>
          </section>

          {/* Modification de la politique */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">11. Modification de cette politique</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
                Toute modification sera publiée sur cette page avec une date de mise à jour. Nous vous 
                encourageons à consulter régulièrement cette page.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">12. Contact</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, 
                vous pouvez nous contacter :
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-yellow-500" />
                  <span>devorbaits.contact@gmail.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 text-yellow-500">📍</span>
                  <span>240 rue Douce, 60130 Wavignies, France</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <a 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  )
}
