import type { Metadata } from 'next'
import { ScrollText, ShoppingCart, Truck, CreditCard, RotateCcw, Shield, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente - Devorbaits',
  description: 'Conditions Générales de Vente du site Devorbaits - Appâts pour la pêche à la carpe, fabrication française.',
}

export default function CGV() {
  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <ScrollText className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">CONDITIONS DE VENTE</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Conditions Générales de Vente</h1>
          <p className="text-gray-400">Dernière mise à jour : Janvier 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Préambule */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Préambule</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Le vendeur :</strong> Devorbaits, entreprise individuelle, SIRET 848 555 686 00015, 
                située au 240 rue Douce, 60130 Wavignies, France</li>
                <li><strong>Le client :</strong> Toute personne physique ou morale effectuant un achat sur le site devorbaits.fr</li>
              </ul>
              <p>
                Toute commande passée sur le site implique l'acceptation sans réserve des présentes CGV par le client.
              </p>
            </div>
          </section>

          {/* Produits */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">Article 1 - Produits</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Devorbaits propose à la vente des appâts pour la pêche à la carpe : bouillettes, pop-ups, équilibrées, 
                huiles, farines et produits personnalisables, fabriqués artisanalement en France.
              </p>
              <p>
                Les photographies et descriptions des produits sont les plus fidèles possibles mais ne peuvent assurer 
                une similitude parfaite avec le produit offert, notamment en ce qui concerne les couleurs qui peuvent 
                varier légèrement.
              </p>
              <p>
                Les produits proposés sont conformes à la réglementation en vigueur en France et ont des performances 
                compatibles avec des usages non professionnels (pêche de loisir).
              </p>
            </div>
          </section>

          {/* Prix */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">Article 2 - Prix et paiement</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Les prix sont indiqués en euros toutes taxes comprises (TTC). Devorbaits se réserve le droit de modifier 
                ses prix à tout moment, étant entendu que le prix figurant au catalogue le jour de la commande sera 
                le seul applicable à l'acheteur.
              </p>
              <p>
                <strong>Moyens de paiement acceptés :</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Carte bancaire (Visa, Mastercard)</li>
                <li>PayPal</li>
              </ul>
              <p>
                Le paiement est exigible immédiatement à la commande. La commande ne sera validée qu'après confirmation 
                du paiement par notre prestataire de paiement sécurisé.
              </p>
            </div>
          </section>

          {/* Commandes */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Article 3 - Commandes</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Le client sélectionne les produits qu'il souhaite commander dans le panier. Pour finaliser sa commande, 
                le client doit :
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Valider le contenu de son panier</li>
                <li>Renseigner ses coordonnées de livraison</li>
                <li>Choisir le mode de livraison</li>
                <li>Accepter les présentes CGV</li>
                <li>Procéder au paiement sécurisé</li>
              </ol>
              <p>
                Un email de confirmation récapitulatif sera envoyé au client après validation du paiement. 
                Devorbaits se réserve le droit de refuser toute commande pour des motifs légitimes.
              </p>
            </div>
          </section>

          {/* Livraison */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Truck className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">Article 4 - Livraison</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Les produits sont livrés à l'adresse indiquée par le client lors de la commande. Les livraisons sont 
                effectuées en France métropolitaine.
              </p>
              <p><strong>Modes de livraison disponibles :</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Colissimo à domicile</li>
                <li>Point relais</li>
                <li>Retrait sur place (L'amicale des pêcheurs au blanc)</li>
              </ul>
              <p>
                <strong>Délais de livraison :</strong> Les commandes sont généralement expédiées sous 2 à 5 jours ouvrés 
                après confirmation du paiement. Les délais de livraison varient selon le transporteur choisi 
                (généralement 2 à 5 jours ouvrés après expédition).
              </p>
              <p>
                En cas de retard de livraison, le client sera informé dans les plus brefs délais. Tout retard de 
                livraison ne pourra donner lieu à des dommages et intérêts.
              </p>
              <p>
                À réception, le client doit vérifier l'état du colis. En cas de dommage, il convient de formuler 
                des réserves précises auprès du transporteur et d'en informer Devorbaits sous 48 heures.
              </p>
            </div>
          </section>

          {/* Droit de rétractation */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <RotateCcw className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">Article 5 - Droit de rétractation</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Conformément aux articles L.221-18 et suivants du Code de la consommation, le client dispose d'un 
                délai de <strong>14 jours</strong> à compter de la réception des produits pour exercer son droit de 
                rétractation, sans avoir à justifier de motifs ni à payer de pénalités.
              </p>
              <p>
                Pour exercer ce droit, le client doit notifier sa décision de rétractation à Devorbaits par email à 
                devorbaits.contact@gmail.com ou par courrier postal.
              </p>
              <p>
                <strong>Conditions de retour :</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Les produits doivent être retournés dans leur emballage d'origine, complets et non utilisés</li>
                <li>Les frais de retour sont à la charge du client</li>
                <li>Les produits personnalisés ne peuvent faire l'objet d'un droit de rétractation</li>
              </ul>
              <p>
                Le remboursement sera effectué dans un délai de 14 jours suivant la réception des produits retournés, 
                via le même moyen de paiement que celui utilisé pour la commande.
              </p>
            </div>
          </section>

          {/* Exclusion du droit de rétractation */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl font-bold">Article 6 - Exclusions du droit de rétractation</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne peut être 
                exercé pour :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Les produits confectionnés selon les spécifications du client ou nettement personnalisés 
                (produits du Bar à Pop-up, Flash Boost, Spray Plus personnalisés)</li>
                <li>Les produits qui ont été descellés par le client après la livraison et qui ne peuvent être 
                renvoyés pour des raisons d'hygiène (appâts ouverts)</li>
                <li>Les produits susceptibles de se détériorer ou de se périmer rapidement</li>
              </ul>
            </div>
          </section>

          {/* Garanties */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold">Article 7 - Garanties</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Tous nos produits bénéficient de la garantie légale de conformité (articles L.217-4 à L.217-14 du 
                Code de la consommation) et de la garantie contre les vices cachés (articles 1641 à 1649 du Code civil).
              </p>
              <p>
                En cas de défaut de conformité, le client peut choisir entre le remplacement ou le remboursement du produit.
              </p>
              <p>
                Pour faire valoir ces garanties, le client doit contacter Devorbaits par email à 
                devorbaits.contact@gmail.com en décrivant le défaut constaté et en joignant des photos si possible.
              </p>
            </div>
          </section>

          {/* Réclamations */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Article 8 - Service client et réclamations</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Pour toute question, information ou réclamation, le service client est joignable :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Par email :</strong> devorbaits.contact@gmail.com</li>
                <li><strong>Par téléphone :</strong> 07 61 28 85 12</li>
                <li><strong>Par courrier :</strong> Devorbaits, 240 rue Douce, 60130 Wavignies</li>
              </ul>
              <p>
                En cas de litige, le client peut recourir à une procédure de médiation conventionnelle ou à tout 
                autre mode alternatif de règlement des différends. Le client peut notamment saisir le Médiateur de 
                la consommation.
              </p>
              <p>
                Plateforme européenne de règlement des litiges en ligne : 
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" 
                   className="text-yellow-500 hover:underline ml-1">
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
            </div>
          </section>

          {/* Données personnelles */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Article 9 - Données personnelles</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Les informations recueillies lors de la commande sont nécessaires au traitement de celle-ci. 
                Elles sont traitées conformément au Règlement Général sur la Protection des Données (RGPD).
              </p>
              <p>
                Pour plus d'informations sur le traitement de vos données personnelles, veuillez consulter notre{' '}
                <a href="/confidentialite" className="text-yellow-500 hover:underline">Politique de Confidentialité</a>.
              </p>
            </div>
          </section>

          {/* Droit applicable */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Article 10 - Droit applicable et litiges</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera 
                recherchée avant toute action judiciaire.
              </p>
              <p>
                À défaut d'accord amiable, les tribunaux français seront seuls compétents pour connaître du litige.
              </p>
            </div>
          </section>

          {/* Modification des CGV */}
          <section className="bg-noir-900/50 border border-noir-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Article 11 - Modification des CGV</h2>
            <p className="text-gray-300">
              Devorbaits se réserve le droit de modifier les présentes CGV à tout moment. Les CGV applicables 
              sont celles en vigueur à la date de la commande.
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
