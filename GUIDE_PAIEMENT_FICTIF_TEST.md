# Guide : Paiement Fictif pour Tests d'Expédition

## 🎯 Objectif

Ce mode permet de créer des commandes directement sans passer par Monetico, pour tester la création d'expéditions Boxtal sans avoir à effectuer de vrais paiements.

## ⚙️ Configuration

### 1. Activer le mode test

Ajoutez cette variable dans votre fichier `.env.local` :

```env
NEXT_PUBLIC_TEST_PAYMENT=true
```

### 2. Redémarrer le serveur

Après avoir modifié `.env.local`, redémarrez votre serveur Next.js :
- Arrêtez le serveur (Ctrl+C)
- Relancez avec `npm run dev` ou `yarn dev`

## 🚀 Utilisation

### Tester une commande avec expédition

1. **Ajoutez des produits au panier**
2. **Allez sur la page de checkout** (`/checkout`)
3. **Sélectionnez "Livraison à domicile"**
4. **Remplissez l'adresse de livraison** (obligatoire pour créer l'expédition Boxtal)
5. **Cliquez sur "Paiement"**

### Ce qui se passe automatiquement

1. ✅ **Création de la commande** : La commande est créée directement dans Supabase avec le statut `completed`
2. ✅ **Création de l'expédition Boxtal** : Si vous avez sélectionné "Livraison à domicile", l'expédition Boxtal est créée automatiquement
3. ✅ **Redirection vers la page de succès** : Vous êtes redirigé vers `/payment/success` avec les détails de la commande

### Vérifier l'expédition créée

1. **Dans la console du navigateur** : Vous verrez les logs de création de l'expédition Boxtal
2. **Dans l'interface admin** : Allez sur `/admin/orders` pour voir la commande créée
3. **Vérifier les champs Boxtal** :
   - `shipping_tracking_number` : Numéro de suivi
   - `shipping_label_url` : URL de l'étiquette
   - `boxtal_created` : `true` si l'expédition a été créée

## 📋 Conditions pour la création d'expédition

L'expédition Boxtal est créée automatiquement si :
- ✅ Le mode de retrait est **"Livraison à domicile"**
- ✅ L'adresse de livraison est **complète** (adresse, code postal, ville)
- ✅ Les **clés API Boxtal** sont configurées dans `.env.local`
- ✅ Le **profil utilisateur** a une adresse complète dans Supabase

## ⚠️ Important

### Mode test vs Production

- **Mode test activé** (`NEXT_PUBLIC_TEST_PAYMENT=true`) : Les commandes sont créées directement, sans passer par Monetico
- **Mode production** (variable non définie ou `false`) : Les commandes passent par Monetico comme d'habitude

### ⚠️ Ne pas utiliser en production !

**IMPORTANT** : N'activez jamais `NEXT_PUBLIC_TEST_PAYMENT=true` en production ! Cela permettrait de créer des commandes sans paiement réel.

## 🔍 Dépannage

### L'expédition Boxtal n'est pas créée

1. **Vérifiez les clés API** : Assurez-vous que `NEXT_PUBLIC_BOXTAL_API_KEY` et `NEXT_PUBLIC_BOXTAL_API_SECRET` sont configurées
2. **Vérifiez l'adresse** : L'adresse de livraison doit être complète
3. **Vérifiez le profil** : Le profil utilisateur doit avoir une adresse complète dans Supabase
4. **Consultez la console** : Les erreurs sont affichées dans la console du navigateur

### La commande n'est pas créée

1. **Vérifiez Supabase** : Assurez-vous que Supabase est configuré
2. **Vérifiez la console** : Les erreurs sont affichées dans la console
3. **Vérifiez les logs** : Regardez les logs du serveur Next.js

## 📝 Exemple de test complet

1. **Configurer les variables d'environnement** :
   ```env
   NEXT_PUBLIC_TEST_PAYMENT=true
   NEXT_PUBLIC_BOXTAL_API_KEY=votre_cle
   NEXT_PUBLIC_BOXTAL_API_SECRET=votre_secret
   NEXT_PUBLIC_BOXTAL_ENV=test
   ```

2. **Créer une commande test** :
   - Ajoutez des produits au panier
   - Allez sur `/checkout`
   - Sélectionnez "Livraison à domicile"
   - Remplissez l'adresse
   - Cliquez sur "Paiement"

3. **Vérifier le résultat** :
   - La commande apparaît dans `/admin/orders`
   - L'expédition Boxtal est créée (vérifiez `boxtal_created: true`)
   - Le numéro de suivi est disponible

## ✅ Avantages

- ✅ Test rapide sans passer par Monetico
- ✅ Test des expéditions Boxtal sans frais
- ✅ Développement et débogage facilités
- ✅ Pas besoin de carte bancaire pour tester

## 🔒 Sécurité

- Le mode test ne doit **jamais** être activé en production
- Les commandes créées en mode test ont `payment_method: 'test'`
- Vous pouvez filtrer les commandes test dans l'admin si nécessaire






