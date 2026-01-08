# Guide Complet : Intégration Boxtal API v3 avec Calcul des Frais de Livraison et Points Relais

Ce guide vous explique étape par étape comment connecter l'API Boxtal v3 à votre site e-commerce pour calculer automatiquement les frais de livraison et proposer la sélection de points relais à vos clients.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Étape 1 : Obtenir vos clés API Boxtal v3](#étape-1--obtenir-vos-clés-api-boxtal-v3)
3. [Étape 2 : Configurer les variables d'environnement](#étape-2--configurer-les-variables-denvironnement)
4. [Étape 3 : Configurer l'adresse expéditeur](#étape-3--configurer-ladresse-expéditeur)
5. [Étape 4 : Obtenir votre code d'offre de transport](#étape-4--obtenir-votre-code-doffre-de-transport)
6. [Étape 5 : Tester la configuration](#étape-5--tester-la-configuration)
7. [Étape 6 : Comprendre le calcul des frais de livraison](#étape-6--comprendre-le-calcul-des-frais-de-livraison)
8. [Étape 7 : Intégrer la recherche de points relais](#étape-7--intégrer-la-recherche-de-points-relais)
9. [Étape 8 : Utiliser dans le processus de commande](#étape-8--utiliser-dans-le-processus-de-commande)
10. [Dépannage](#dépannage)

---

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte Boxtal actif
- ✅ Accès à votre projet Next.js
- ✅ Un fichier `.env.local` à la racine de votre projet
- ✅ Accès à l'interface d'administration de votre site

---

## Étape 1 : Obtenir vos clés API Boxtal v3

### 1.1 Se connecter à Boxtal Developer

1. Ouvrez votre navigateur et allez sur [https://developer.boxtal.com](https://developer.boxtal.com)
2. Connectez-vous avec vos identifiants Boxtal
3. Si vous n'avez pas de compte, créez-en un sur [https://www.boxtal.com](https://www.boxtal.com)

### 1.2 Créer une application API v3

1. Une fois connecté, cliquez sur **"Apps"** dans le menu de gauche
2. Cliquez sur **"Créer une nouvelle application"** ou **"New App"**
3. Remplissez le formulaire :
   - **Nom de l'application** : Donnez un nom (ex: "Mon Site E-commerce")
   - **Description** : Optionnel
   - **Type** : Sélectionnez **"API v3"** (⚠️ Important : pas v1)
4. Cliquez sur **"Créer"** ou **"Create"**

### 1.3 Récupérer vos clés API

1. Une fois l'application créée, vous verrez deux clés importantes :
   - **Access Key** (Clé d'accès) : Une longue chaîne de caractères
   - **Secret Key** (Clé secrète) : Une autre longue chaîne de caractères

2. **⚠️ IMPORTANT** : Copiez ces deux clés immédiatement et gardez-les dans un endroit sûr. La Secret Key ne sera affichée qu'une seule fois !

3. Exemple de format :
   ```
   Access Key: ak_1234567890abcdefghijklmnopqrstuvwxyz
   Secret Key: sk_9876543210zyxwvutsrqponmlkjihgfedcba
   ```

---

## Étape 2 : Configurer les variables d'environnement

### 2.1 Localiser le fichier .env.local

1. Ouvrez votre projet dans votre éditeur de code (VS Code, etc.)
2. À la racine du projet (même niveau que `package.json`), cherchez le fichier `.env.local`
3. Si le fichier n'existe pas, créez-le

### 2.2 Ajouter les clés API

Ouvrez le fichier `.env.local` et ajoutez ces lignes :

```env
# ============================================
# CONFIGURATION BOXTAL API v3
# ============================================

# Clés API Boxtal (OBLIGATOIRES)
# Remplacez les valeurs ci-dessous par vos vraies clés
NEXT_PUBLIC_BOXTAL_API_KEY=votre_access_key_ici
NEXT_PUBLIC_BOXTAL_API_SECRET=votre_secret_key_ici

# Environnement (test ou production)
# Utilisez 'test' pour tester sans créer de vraies expéditions
# Utilisez 'production' pour les expéditions réelles
NEXT_PUBLIC_BOXTAL_ENV=test
```

**Exemple concret :**
```env
NEXT_PUBLIC_BOXTAL_API_KEY=ak_1234567890abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_BOXTAL_API_SECRET=sk_9876543210zyxwvutsrqponmlkjihgfedcba
NEXT_PUBLIC_BOXTAL_ENV=test
```

### 2.3 Vérifier la configuration

1. **Sauvegardez** le fichier `.env.local`
2. **Redémarrez votre serveur de développement** :
   - Arrêtez le serveur (Ctrl+C dans le terminal)
   - Relancez-le avec `npm run dev` ou `yarn dev`

⚠️ **Important** : Les modifications du fichier `.env.local` ne sont prises en compte qu'après un redémarrage du serveur.

---

## Étape 3 : Configurer l'adresse expéditeur

L'adresse expéditeur est l'adresse de votre entreprise (d'où partent les colis).

### 3.1 Ajouter l'adresse dans .env.local

Ajoutez ces lignes dans votre fichier `.env.local` :

```env
# ============================================
# ADRESSE EXPÉDITEUR (Votre entreprise)
# ============================================

BOXTAL_FROM_FIRST_NAME=Votre
BOXTAL_FROM_LAST_NAME=Entreprise
BOXTAL_FROM_EMAIL=contact@votre-entreprise.com
BOXTAL_FROM_PHONE=+33612345678
BOXTAL_FROM_STREET=4 boulevard des Capucines
BOXTAL_FROM_CITY=Paris
BOXTAL_FROM_POSTAL_CODE=75009
BOXTAL_FROM_COUNTRY=FR
```

**Remplacez** ces valeurs par les vraies informations de votre entreprise.

### 3.2 Format du numéro de téléphone

Le numéro de téléphone doit être au format international :
- ✅ Correct : `+33612345678` (France)
- ❌ Incorrect : `0612345678` ou `06 12 34 56 78`

---

## Étape 4 : Obtenir votre code d'offre de transport

Le code d'offre de transport détermine quel transporteur et quel service utiliser (Mondial Relay, Colis Privé, etc.).

### 4.1 Types d'offres disponibles

Il existe deux types d'offres :

1. **Livraison à domicile** : Le colis est livré directement à l'adresse du client
2. **Point relais** : Le colis est livré dans un point de retrait choisi par le client

### 4.2 Récupérer le code d'offre

1. Connectez-vous à votre compte Boxtal sur [https://www.boxtal.com](https://www.boxtal.com)
2. Allez dans la section **"Offres"** ou **"Mes offres"**
3. Choisissez une offre selon votre besoin :
   - Pour **livraison à domicile** : Sélectionnez une offre de type "Livraison à domicile" ou "Domicile"
   - Pour **points relais** : Sélectionnez une offre de type "Point relais" ou "Relais"
4. Copiez le **code de l'offre** (ex: `MONR-DOMICILE`, `MONR-CpourToi`, `COLIS-DOMICILE`)

### 4.3 Ajouter le code dans .env.local

Ajoutez cette ligne dans votre fichier `.env.local` :

```env
# Code d'offre de transport
BOXTAL_SHIPPING_OFFER_CODE=MONR-CpourToi
```

Remplacez `MONR-CpourToi` par votre code d'offre.

### 4.4 Si vous voulez proposer les deux options

Si vous voulez proposer à la fois la livraison à domicile ET les points relais :

1. Configurez un code d'offre pour la livraison à domicile (par défaut)
2. Pour les points relais, le code sera récupéré automatiquement via l'API quand le client choisit un point relais

---

## Étape 5 : Tester la configuration

### 5.1 Accéder à la page de test

1. Démarrez votre serveur de développement (`npm run dev`)
2. Connectez-vous à votre site en tant qu'administrateur
3. Allez sur la page : `/admin/boxtal/test`
   - URL complète : `http://localhost:3000/admin/boxtal/test`

### 5.2 Lancer les tests

1. Sur la page de test, cliquez sur **"Lancer le test de configuration"**
2. Attendez quelques secondes
3. Vérifiez les résultats :

   ✅ **Succès** : Tous les tests sont verts
   - ✅ Clés API configurées
   - ✅ Authentification réussie
   - ✅ Test de création d'expédition réussi

   ❌ **Erreur** : Un ou plusieurs tests sont rouges
   - Vérifiez les messages d'erreur
   - Consultez la section [Dépannage](#dépannage) ci-dessous

### 5.3 Vérifier le format des clés

1. Sur la page de test, cliquez sur **"Vérifier le format des clés"**
2. Si tout est correct, vous verrez : "Format des clés correct !"
3. Si des problèmes sont détectés, corrigez-les selon les suggestions

---

## Étape 6 : Comprendre le calcul des frais de livraison

### 6.1 Comment ça fonctionne

Le système calcule automatiquement les frais de livraison en fonction de :

1. **L'adresse de livraison** : Code postal, ville, pays
2. **Le poids du colis** : Calculé automatiquement selon les articles dans le panier
3. **La valeur du colis** : Pour l'assurance
4. **Le code d'offre** : Détermine le transporteur et le service

### 6.2 Où le calcul est effectué

Le calcul se fait automatiquement dans le processus de commande (`app/checkout/page.tsx`) :

1. Quand le client entre son adresse de livraison
2. Le système appelle l'API Boxtal pour obtenir une estimation
3. Le prix est affiché au client
4. Le prix peut être ajusté selon vos tarifs personnalisés (voir section suivante)

### 6.3 Calcul du poids

Par défaut, le système calcule le poids ainsi :
- **Poids moyen par article** : 0.4 kg
- **Poids minimum** : 0.5 kg (même pour un article très léger)

**Exemple :**
- 3 articles → Poids = 3 × 0.4 = 1.2 kg
- 1 article → Poids = 0.5 kg (minimum)

### 6.4 Tarifs personnalisés (optionnel)

Vous pouvez configurer des tarifs personnalisés pour :
- Appliquer une marge sur le prix Boxtal
- Définir un prix fixe
- Offrir la livraison gratuite au-dessus d'un certain montant
- Définir des tarifs selon le poids

**Pour configurer les tarifs personnalisés :**
1. Allez dans **Administration > Gérer les tarifs d'expédition**
2. Créez un nouveau tarif
3. Configurez selon vos besoins

**Sans tarif personnalisé** : Le prix Boxtal est utilisé tel quel.

---

## Étape 7 : Intégrer la recherche de points relais

### 7.1 Comment ça fonctionne

Le système permet aux clients de :
1. Entrer leur code postal
2. Rechercher les points relais à proximité
3. Sélectionner un point relais
4. Le code du point relais est enregistré avec la commande

### 7.2 Composant PickupPointSelector

Le composant `PickupPointSelector` est déjà intégré dans votre projet. Il permet de :

- Rechercher des points relais par code postal
- Afficher la liste des points relais avec leurs informations
- Sélectionner un point relais
- Afficher la distance et les horaires d'ouverture

### 7.3 Utilisation dans le checkout

Le composant est déjà utilisé dans la page de checkout. Voici comment il fonctionne :

```typescript
// Dans app/checkout/page.tsx
<PickupPointSelector
  postalCode={livraisonAddress.codePostal}
  city={livraisonAddress.ville}
  country="FR"
  onSelect={(point) => {
    // Le point relais sélectionné est enregistré
    setSelectedPickupPoint(point)
  }}
  selectedPoint={selectedPickupPoint}
/>
```

### 7.4 API de recherche de points relais

L'API est accessible via : `/api/boxtal/pickup-points`

**Paramètres :**
- `postalCode` : Code postal (obligatoire)
- `city` : Ville (optionnel)
- `country` : Pays (par défaut : FR)
- `radius` : Rayon de recherche en km (par défaut : 10)

**Exemple d'utilisation :**
```
GET /api/boxtal/pickup-points?postalCode=75009&city=Paris&radius=10
```

### 7.5 Si l'API de recherche ne fonctionne pas

Si vous obtenez une erreur 404 lors de la recherche de points relais :

1. **Vérifiez votre contrat Boxtal** : L'API de recherche de points relais peut nécessiter un contrat spécifique
2. **Contactez le support Boxtal** : Ils peuvent vous indiquer l'endpoint correct
3. **Alternative** : Vous pouvez demander au client de choisir un point relais sur le site du transporteur et d'entrer manuellement le code

---

## Étape 8 : Utiliser dans le processus de commande

### 8.1 Flux complet

Voici comment tout fonctionne ensemble :

1. **Client ajoute des articles au panier**
2. **Client va au checkout**
3. **Client choisit le mode de livraison** :
   - Livraison à domicile
   - Point relais
4. **Client entre son adresse** :
   - Pour livraison à domicile : Adresse complète
   - Pour point relais : Code postal (recherche automatique des points)
5. **Système calcule les frais de livraison** :
   - Appel à l'API Boxtal
   - Affichage du prix au client
6. **Client valide la commande**
7. **Après le paiement** :
   - Si mode "Livraison" : Création automatique de l'expédition Boxtal
   - Le numéro de suivi est enregistré dans la commande

### 8.2 Création automatique de l'expédition

L'expédition est créée automatiquement après le paiement si :
- Le mode de retrait est "Livraison" (pas "Retrait en magasin")
- Le paiement est validé
- Les informations de livraison sont complètes

**Fonction utilisée :** `createBoxtalShipmentAuto(orderId, pickupPointCode?)`

**Exemple :**
```typescript
// Dans app/payment/success/page.tsx ou similaire
const result = await createBoxtalShipmentAuto(orderId, selectedPickupPoint?.code)

if (result.success) {
  console.log('Expédition créée !')
  console.log('Numéro de suivi:', result.trackingNumber)
  console.log('URL de l\'étiquette:', result.labelUrl)
}
```

### 8.3 Informations enregistrées

Les informations suivantes sont sauvegardées dans la table `orders` :

- `shipping_tracking_number` : Numéro de suivi
- `shipping_label_url` : URL de l'étiquette d'expédition
- `shipping_cost` : Coût de l'expédition
- `shipping_address` : Adresse de livraison (JSON)
- `boxtal_created` : Boolean indiquant si l'expédition a été créée
- `boxtal_order_id` : ID de la commande Boxtal

---

## Dépannage

### ❌ Erreur : "Clés API Boxtal non configurées"

**Cause :** Les clés API ne sont pas dans `.env.local` ou le serveur n'a pas été redémarré.

**Solution :**
1. Vérifiez que les clés sont bien dans `.env.local`
2. Vérifiez qu'il n'y a pas d'espaces avant/après les clés
3. Redémarrez le serveur de développement
4. Vérifiez que les noms des variables sont exacts :
   - `NEXT_PUBLIC_BOXTAL_API_KEY`
   - `NEXT_PUBLIC_BOXTAL_API_SECRET`

### ❌ Erreur : "Impossible d'obtenir le token d'authentification"

**Cause :** Les clés API sont incorrectes ou vous utilisez les clés de l'API v1 au lieu de v3.

**Solution :**
1. Vérifiez que vous utilisez les clés de l'**API v3** (pas v1)
2. Allez sur [developer.boxtal.com](https://developer.boxtal.com) et vérifiez vos clés
3. Recréez une application API v3 si nécessaire
4. Copiez les nouvelles clés dans `.env.local`

### ❌ Erreur 422 : "pickupPointCode missing value"

**Cause :** Le code d'offre configuré est pour les points relais, mais vous essayez de créer une livraison à domicile.

**Solution :**
1. Connectez-vous à votre compte Boxtal
2. Allez dans "Offres"
3. Trouvez une offre de type **"Livraison à domicile"**
4. Copiez le code de cette offre
5. Remplacez `BOXTAL_SHIPPING_OFFER_CODE` dans `.env.local`
6. Redémarrez le serveur

### ❌ Erreur 404 : Recherche de points relais

**Cause :** L'endpoint API pour rechercher les points relais n'est pas disponible ou a changé.

**Solutions possibles :**
1. Vérifiez la [documentation officielle Boxtal API v3.1](https://developer.boxtal.com/fr/fr/apiv3)
2. Contactez le support Boxtal pour obtenir l'endpoint correct
3. Utilisez le widget JavaScript Boxtal si disponible
4. Alternative : Demandez au client de choisir un point relais sur le site du transporteur

### ❌ Le prix de livraison n'est pas calculé

**Cause :** L'adresse de livraison est incomplète ou l'API Boxtal retourne une erreur.

**Solution :**
1. Vérifiez que l'adresse est complète (rue, ville, code postal)
2. Vérifiez la console du navigateur (F12) pour voir les erreurs
3. Vérifiez que le code d'offre de transport est correct
4. Testez avec la page `/admin/boxtal/test`

### ❌ L'expédition n'est pas créée automatiquement

**Cause :** Le mode de retrait n'est pas "Livraison" ou une erreur s'est produite.

**Solution :**
1. Vérifiez que le mode de retrait est bien "Livraison" (pas "Retrait en magasin")
2. Vérifiez les logs du serveur pour voir les erreurs
3. Vérifiez que votre compte Boxtal est configuré pour le paiement automatique
4. Vérifiez que l'adresse de livraison est complète dans la commande

### ❌ Token expiré

**Cause :** Le token d'accès a expiré (normal, les tokens expirent après un certain temps).

**Solution :** Le code gère automatiquement le renouvellement du token. Si le problème persiste :
1. Vérifiez que vos clés API sont toujours valides
2. Redémarrez le serveur
3. Vérifiez la connexion internet

---

## 📚 Ressources supplémentaires

### Documentation officielle

- [Guide de démarrage API v3](https://developer.boxtal.com/fr/fr/apiv3/guide/getting-started-api-v3)
- [Documentation complète API v3](https://developer.boxtal.com/fr/fr/apiv3)
- [Référence API v3.1](https://developer.boxtal.com/fr/fr/apiv3/reference)

### Guides dans votre projet

- `GUIDE_BOXTAL.md` : Guide général d'utilisation
- `GUIDE_CONFIGURER_CLES_API_BOXTAL.md` : Guide détaillé pour configurer les clés
- `GUIDE_CONFIGURER_PRIX_BOXTAL.md` : Guide pour configurer les tarifs personnalisés
- `GUIDE_GERER_TARIFS_EXPEDITION.md` : Guide pour gérer les tarifs d'expédition

### Support

- **Support Boxtal** : [support@boxtal.com](mailto:support@boxtal.com)
- **Documentation Boxtal** : [https://www.boxtal.com/fr/aide](https://www.boxtal.com/fr/aide)

---

## ✅ Checklist de vérification

Avant de passer en production, vérifiez :

- [ ] Clés API v3 configurées dans `.env.local`
- [ ] Adresse expéditeur complète et correcte
- [ ] Code d'offre de transport configuré
- [ ] Tests passés sur `/admin/boxtal/test`
- [ ] Test de création d'expédition réussi
- [ ] Calcul des frais de livraison fonctionne
- [ ] Recherche de points relais fonctionne (si utilisée)
- [ ] Mode `NEXT_PUBLIC_BOXTAL_ENV=production` pour la production
- [ ] Compte Boxtal configuré pour le paiement automatique
- [ ] Adresse expéditeur correspond à l'adresse enregistrée dans Boxtal

---

## 🎉 Félicitations !

Vous avez maintenant configuré l'intégration complète de Boxtal API v3 avec :
- ✅ Calcul automatique des frais de livraison
- ✅ Recherche et sélection de points relais
- ✅ Création automatique d'expéditions après paiement
- ✅ Suivi des expéditions

Votre site e-commerce est maintenant prêt à gérer les expéditions automatiquement !

---

**Dernière mise à jour :** Ce guide est basé sur l'API Boxtal v3.1. Si l'API évolue, consultez la documentation officielle pour les mises à jour.




