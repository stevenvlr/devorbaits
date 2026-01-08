# Guide de Configuration Boxtal API v1

Ce guide vous explique comment configurer Boxtal API v1 pour votre site e-commerce.

## 📋 Prérequis

1. Un compte Boxtal avec des clés API v1
2. Accès à l'interface d'administration de votre site
3. Accès à Supabase SQL Editor

## 🚀 Installation

### Étape 1 : Créer la table de configuration dans Supabase

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor** > **New Query**
3. Copiez-collez le contenu du fichier `supabase-add-boxtal-config-table.sql`
4. Exécutez la requête

Cette table stockera vos clés API de manière sécurisée.

### Étape 2 : Configurer les clés API via l'interface admin

1. Connectez-vous à votre site en tant qu'administrateur
2. Allez dans **Administration** > **Configuration Boxtal**
3. Remplissez les champs suivants :

#### Clés API (obligatoires)
- **Clé API (API Key)** : Votre clé API Boxtal
- **Clé secrète (API Secret)** : Votre clé secrète Boxtal
- **Environnement** : 
  - `test` : Pour tester sans créer de vraies expéditions
  - `production` : Pour les expéditions réelles
- **Code d'offre de transport** : Le code de votre offre configurée dans Boxtal (ex: `MONR-CpourToi`)

#### Adresse expéditeur
Remplissez les informations de votre entreprise :
- Prénom et Nom
- Email et Téléphone
- Adresse complète (rue, ville, code postal, pays)

4. Cliquez sur **Sauvegarder la configuration**

## 🔧 Utilisation

### Mode Test vs Production

- **Mode Test** : 
  - URL API : `https://test.envoimoinscher.com`
  - Permet de tester sans créer de vraies expéditions
  - Recommandé pour le développement

- **Mode Production** :
  - URL API : `https://api.boxtal.com`
  - Crée de vraies expéditions
  - À utiliser uniquement en production

### Fonctionnement automatique

Une fois configuré, Boxtal fonctionne automatiquement :

1. **Lors du checkout** : Le prix d'expédition est calculé automatiquement selon le poids et l'adresse de livraison
2. **Après le paiement** : L'expédition est créée automatiquement si le mode de retrait est "Livraison"
3. **Suivi** : Le numéro de suivi est enregistré dans la commande

## 🧪 Tester la configuration

1. Allez dans **Administration** > **Test Boxtal**
2. Suivez les instructions pour tester :
   - L'authentification
   - La création d'une expédition test
   - Le calcul du prix d'expédition

## ⚠️ Important

- Les clés API sont stockées de manière sécurisée dans Supabase
- Ne partagez jamais vos clés API
- Utilisez toujours le mode "Test" pour tester avant de passer en production
- Le code d'offre de transport doit correspondre exactement à celui configuré dans votre compte Boxtal

## 🔄 Migration depuis API v3

Si vous migrez depuis l'API v3 :

1. Les clés API v1 sont différentes des clés v3
2. Assurez-vous d'avoir les bonnes clés dans votre compte Boxtal
3. L'URL de l'API change automatiquement selon l'environnement sélectionné
4. Le format des données envoyées à l'API est différent (géré automatiquement par le code)

## 📞 Support

En cas de problème :

1. Vérifiez que les clés API sont correctes
2. Vérifiez que le code d'offre de transport est correct
3. Consultez les logs dans la console du navigateur (F12)
4. Testez avec l'outil de test dans l'interface admin

## 🔐 Sécurité

- Les clés API sont stockées dans Supabase avec Row Level Security (RLS)
- Seuls les administrateurs peuvent voir et modifier la configuration
- Les clés ne sont jamais exposées côté client (elles sont utilisées uniquement côté serveur)






