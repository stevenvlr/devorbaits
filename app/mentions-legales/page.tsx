import type { Metadata } from 'next'
import { FileText, Building, Mail, Phone, MapPin, User } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mentions Légales - Devorbaits',
  description: 'Mentions légales du site Devorbaits - Appâts pour la pêche à la carpe, fabrication française.',
}

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <FileText className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">INFORMATIONS LÉGALES</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Mentions Légales</h1>
          <p className="text-gray-400">Dernière mise à jour : Janvier 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Éditeur du site */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Building className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">Éditeur du site</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p><span className="text-gray-500">Nom de l'entreprise :</span> Devorbaits</p>
              <p><span className="text-gray-500">Forme juridique :</span> Entreprise individuelle</p>
              <p><span className="text-gray-500">SIRET :</span> 848 555 686 00015</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-yellow-500 mt-1" />
                <p><span className="text-gray-500">Siège social :</span> 240 rue Douce, 60130 Wavignies, France</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-yellow-500" />
                <p><span className="text-gray-500">Email :</span> devorbaits.contact@gmail.com</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-yellow-500" />
                <p><span className="text-gray-500">Téléphone :</span> 07 61 28 85 12</p>
              </div>
            </div>
          </section>

          {/* Directeur de publication */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <User className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">Directeur de la publication</h2>
            </div>
            <p className="text-gray-300">Jean-Claude Maquaire, en qualité de gérant de Devorbaits.</p>
          </section>

          {/* Hébergement */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Hébergement</h2>
            <div className="space-y-2 text-gray-300">
              <p>Le site est hébergé par Vercel Inc.</p>
              <p><span className="text-gray-500">Adresse :</span> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
              <p><span className="text-gray-500">Site web :</span> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">vercel.com</a></p>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Propriété intellectuelle</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                L'ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, etc.) est la propriété exclusive 
                de Devorbaits, à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
              </p>
              <p>
                Toute reproduction, distribution, modification, adaptation, retransmission ou publication, même partielle, 
                de ces différents éléments est strictement interdite sans l'accord exprès par écrit de Devorbaits.
              </p>
            </div>
          </section>

          {/* Responsabilité */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Limitation de responsabilité</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Devorbaits s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. 
                Toutefois, Devorbaits ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations 
                mises à disposition sur ce site.
              </p>
              <p>
                En conséquence, Devorbaits décline toute responsabilité pour toute imprécision, inexactitude ou omission 
                portant sur des informations disponibles sur ce site.
              </p>
              <p>
                Les liens hypertextes mis en place dans le cadre du présent site internet en direction d'autres ressources 
                présentes sur le réseau Internet ne sauraient engager la responsabilité de Devorbaits.
              </p>
            </div>
          </section>

          {/* Données personnelles */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Protection des données personnelles</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, 
                vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles 
                vous concernant.
              </p>
              <p>
                Pour plus d'informations sur la gestion de vos données personnelles, veuillez consulter notre{' '}
                <a href="/confidentialite" className="text-yellow-500 hover:underline">Politique de Confidentialité</a>.
              </p>
              <p>
                Pour exercer vos droits, vous pouvez nous contacter à l'adresse suivante : devorbaits.contact@gmail.com
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Cookies</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Le site Devorbaits peut être amené à utiliser des cookies pour améliorer l'expérience utilisateur. 
                Les cookies sont de petits fichiers stockés sur votre ordinateur qui nous permettent de :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Mémoriser vos préférences de navigation</li>
                <li>Maintenir votre panier d'achats</li>
                <li>Analyser le trafic du site de manière anonyme</li>
              </ul>
              <p>
                Vous pouvez configurer votre navigateur pour refuser les cookies ou être alerté lorsqu'un cookie est envoyé.
              </p>
            </div>
          </section>

          {/* Droit applicable */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Droit applicable</h2>
            <p className="text-gray-300">
              Le présent site et les présentes mentions légales sont soumis au droit français. 
              En cas de litige, les tribunaux français seront seuls compétents.
            </p>
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
