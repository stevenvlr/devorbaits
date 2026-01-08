# Guide d'utilisation de l'API Boxtal v3

## ✅ Migration vers l'API v3 terminée

Votre application utilise maintenant l'**API v3 de Boxtal** au lieu de l'ancienne API v1.

## 🔑 Configuration requise

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Clés API Boxtal (obligatoires)
NEXT_PUBLIC_BOXTAL_API_KEY=votre_access_key_ici
NEXT_PUBLIC_BOXTAL_API_SECRET=votre_secret_key_ici

# Environnement (optionnel, par défaut: test)
# Utilisez 'production' pour l'environnement de production
NEXT_PUBLIC_BOXTAL_ENV=test

# Adresse expéditeur (optionnel, valeurs par défaut utilisées si non défini)
BOXTAL_FROM_FIRST_NAME=Votre
BOXTAL_FROM_LAST_NAME=Entreprise
BOXTAL_FROM_EMAIL=contact@example.com
BOXTAL_FROM_PHONE=+33612345678
BOXTAL_FROM_STREET=4 boulevard des Capucines
BOXTAL_FROM_CITY=Paris
BOXTAL_FROM_POSTAL_CODE=75009
BOXTAL_FROM_COUNTRY=FR

# Code d'offre de transport (optionnel)
# Récupérez-le depuis votre compte Boxtal
BOXTAL_SHIPPING_OFFER_CODE=MONR-CpourToi
```

### 2. Obtenir vos clés API v3

1. Connectez-vous à [developer.boxtal.com](https://developer.boxtal.com)
2. Allez dans la section "Apps"
3. Créez une nouvelle application
4. Copiez l'**Access Key** et le **Secret Key**
5. Ajoutez-les dans votre `.env.local`

⚠️ **Important** : Assurez-vous d'utiliser les clés de l'**API v3**, pas celles de l'ancienne API v1.

## 🚀 Utilisation

### Créer une expédition automatiquement

La fonction `createBoxtalShipmentAuto` crée automatiquement une expédition pour une commande :

```typescript
import { createBoxtalShipmentAuto } from '@/lib/boxtal-simple'

const result = await createBoxtalShipmentAuto(orderId)

if (result.success) {
  console.log('Expédition créée !')
  console.log('Numéro de suivi:', result.trackingNumber)
  console.log('URL de l\'étiquette:', result.labelUrl)
} else {
  console.error('Erreur:', result.message)
}
```

### Récupérer le statut de suivi

```typescript
import { getBoxtalTrackingStatus } from '@/lib/boxtal-simple'

const tracking = await getBoxtalTrackingStatus(trackingNumber)
if (tracking) {
  console.log('Statut:', tracking)
}
```

## 🔄 Différences avec l'API v1

### Authentification

- **v1** : Utilisait directement Basic Auth avec les clés API
- **v3** : Utilise d'abord Basic Auth pour obtenir un token Bearer, puis utilise ce token pour les requêtes

### Format des données

- **v1** : Format simplifié
- **v3** : Format structuré avec `fromAddress`, `toAddress`, `packages`, etc.

### URLs

- **v1** : `https://api.boxtal.com/v1/...`
- **v3** : 
  - Test : `https://api.boxtal.build/shipping/v3.1/...`
  - Production : `https://api.boxtal.com/shipping/v3.1/...`

## 📋 Champs de la base de données

Les informations suivantes sont sauvegardées dans la table `orders` :

- `shipping_tracking_number` : Numéro de suivi
- `shipping_label_url` : URL de l'étiquette d'expédition
- `shipping_cost` : Coût de l'expédition
- `shipping_address` : Adresse de livraison (JSON)
- `boxtal_created` : Boolean indiquant si l'expédition a été créée
- `boxtal_order_id` : ID de la commande Boxtal (si le champ existe)

## 🧪 Test de la configuration

Utilisez la page de test pour vérifier votre configuration :

1. Allez sur `/admin/boxtal/test` (nécessite d'être connecté en tant qu'admin)
2. Cliquez sur "Tester la configuration"
3. Vérifiez que tous les tests passent

## ⚙️ Configuration de l'adresse expéditeur

Par défaut, l'adresse expéditeur utilise des valeurs par défaut. Pour la personnaliser :

1. **Option 1** : Utilisez les variables d'environnement (voir ci-dessus)
2. **Option 2** : Modifiez la fonction `getFromAddress()` dans `lib/boxtal-simple.ts` pour récupérer les données depuis votre base de données

## 📦 Code d'offre de transport

Le code d'offre de transport (`shippingOfferCode`) détermine le transporteur et le service utilisé. 

### ⚠️ Important : Type de livraison

**Il existe deux types de codes d'offre :**
- **Livraison à domicile** : Pour les envois directement à l'adresse du client
- **Point relais** : Pour les envois vers un point de retrait (nécessite `pickupPointCode`)

**Le code d'offre `MONR-CpourToi` est généralement configuré pour les points relais.**

### Pour obtenir votre code :

1. Connectez-vous à votre compte Boxtal
2. Allez dans la section **"Offres"** ou **"Mes offres"**
3. **Pour les livraisons à domicile** : Sélectionnez une offre de type "Livraison à domicile" ou "Domicile"
4. **Pour les points relais** : Sélectionnez une offre de type "Point relais" ou "Relais"
5. Copiez le code de l'offre (ex: `MONR-DOMICILE` pour livraison à domicile)
6. Ajoutez-le dans **Administration > Configuration Boxtal** dans le champ "Code d'offre de transport"

### 💡 Astuce

Si vous voulez proposer les deux options (domicile et point relais) :
- Configurez un code d'offre pour les livraisons à domicile
- Pour les points relais, vous devrez obtenir le code du point relais choisi par le client via l'API Boxtal

## 🔍 Dépannage

### Erreur d'authentification

- Vérifiez que vos clés API sont correctes
- Assurez-vous qu'il n'y a pas d'espaces avant/après les clés
- Vérifiez que vous utilisez les clés de l'API v3 (pas v1)

### Erreur lors de la création d'expédition

- Vérifiez que l'adresse de livraison est complète
- Vérifiez que le code d'offre de transport est valide
- Vérifiez que votre compte Boxtal est actif et configuré pour le paiement automatique

### Erreur 422 : pickupPointCode manquant

**Symptôme :** Erreur `422` avec le message "shipment.pickupPointCode missing value"

**Cause :** Le code d'offre configuré est destiné aux livraisons en point relais, pas aux livraisons à domicile.

**Solution :**
1. Connectez-vous à votre compte Boxtal
2. Allez dans **"Offres"** ou **"Mes offres"**
3. Trouvez une offre de type **"Livraison à domicile"** ou **"Domicile"**
4. Copiez le code de cette offre (ex: `MONR-DOMICILE`, `COLIS-DOMICILE`, etc.)
5. Allez dans **Administration > Configuration Boxtal** dans votre application
6. Remplacez le code d'offre actuel par le nouveau code
7. Sauvegardez et relancez le test

### Erreur 404 : Recherche de points relais

**Symptôme :** Erreur `404` lors de la recherche de points relais

**Cause :** L'endpoint API pour rechercher les points relais peut ne pas être disponible ou nécessiter une configuration spéciale dans votre compte Boxtal.

**Solutions possibles :**

1. **Vérifier la documentation Boxtal** : L'endpoint exact peut varier selon votre contrat Boxtal. Consultez la [documentation officielle Boxtal API v3.1](https://developer.boxtal.com/fr/fr/apiv3).

2. **Utiliser le widget Boxtal** : Boxtal propose peut-être un widget JavaScript intégré pour la sélection de points relais. Contactez le support Boxtal pour obtenir les informations.

3. **Alternative manuelle** : En attendant, vous pouvez :
   - Demander au client de choisir un point relais sur le site du transporteur (Mondial Relay, Colis Privé, etc.)
   - Le client vous communique le code du point relais
   - Vous entrez manuellement le code lors de la création de l'expédition

4. **Contactez le support Boxtal** : Si vous avez besoin de cette fonctionnalité, contactez le support Boxtal pour obtenir l'endpoint correct ou les instructions pour activer la recherche de points relais.

### Token expiré

Le token d'accès expire après un certain temps. Le code gère automatiquement le renouvellement du token à chaque appel.

## 📚 Documentation officielle

Pour plus d'informations, consultez la documentation officielle de Boxtal :
- [Guide de démarrage API v3](https://developer.boxtal.com/fr/fr/apiv3/guide/getting-started-api-v3)
- [Documentation API v3](https://developer.boxtal.com/fr/fr/apiv3)

## ✅ Avantages de l'API v3

- ✅ Format de données plus structuré et flexible
- ✅ Meilleure gestion des erreurs
- ✅ Support des webhooks pour les mises à jour de suivi
- ✅ Consultation de référentiels (points relais, etc.)
- ✅ API plus moderne et maintenue activement



