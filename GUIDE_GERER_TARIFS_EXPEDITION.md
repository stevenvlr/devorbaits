# Guide : Gérer les Tarifs d'Expédition depuis l'Interface Admin

## 📋 Vue d'ensemble

Vous pouvez maintenant gérer vos tarifs d'expédition directement depuis l'interface admin de votre site, sans avoir à modifier le code ou les fichiers de configuration.

## 🚀 Installation

### Étape 1 : Créer la table dans Supabase

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor** > **New Query**
3. Copiez-collez le contenu du fichier `supabase-add-shipping-prices-table.sql`
4. Exécutez la requête

Cette table stockera vos tarifs personnalisés.

## 🎯 Accéder à l'interface

1. Connectez-vous à votre site en tant qu'administrateur
2. Allez dans **Administration** > **Tarifs d'Expédition**
3. Vous verrez la liste de vos tarifs configurés

## 💰 Types de tarifs disponibles

### 1. Utiliser uniquement Boxtal (par défaut)

- **Type** : `boxtal_only`
- **Description** : Utilise directement le prix retourné par Boxtal, sans modification
- **Quand l'utiliser** : Si vous voulez utiliser exactement les tarifs configurés dans Boxtal

### 2. Prix fixe

- **Type** : `fixed`
- **Description** : Un prix unique pour tous les envois, peu importe le poids
- **Configuration** : Définissez le prix fixe en euros
- **Exemple** : 5.99€ pour tous les envois

### 3. Marge en pourcentage

- **Type** : `margin_percent`
- **Description** : Ajoute une marge en pourcentage au prix Boxtal
- **Configuration** : Définissez le pourcentage (ex: 10 pour +10%)
- **Exemple** : Si Boxtal retourne 5€ et que vous mettez 10%, le prix final sera 5.50€

### 4. Marge fixe en euros

- **Type** : `margin_fixed`
- **Description** : Ajoute un montant fixe en euros au prix Boxtal
- **Configuration** : Définissez le montant en euros (ex: 2.50)
- **Exemple** : Si Boxtal retourne 5€ et que vous mettez 2.50€, le prix final sera 7.50€

### 5. Tarifs par tranches de poids

- **Type** : `weight_ranges`
- **Description** : Définissez des prix différents selon le poids du colis
- **Configuration** : Créez des tranches de poids avec un prix pour chaque tranche
- **Exemple** :
  - 0 à 0.5 kg → 4.50€
  - 0.5 à 1 kg → 5.50€
  - 1 à 2 kg → 6.50€
  - 2 à 5 kg → 8.50€
  - Plus de 5 kg → 12.50€

## 📝 Créer un nouveau tarif

1. Cliquez sur **"Nouveau tarif"**
2. Remplissez les informations :
   - **Nom du tarif** : Un nom descriptif (ex: "Livraison Standard")
   - **Type de tarif** : Choisissez parmi les 5 types disponibles
   - **Configuration spécifique** : Selon le type choisi, remplissez les champs correspondants
3. **Livraison gratuite** : Optionnellement, définissez un seuil pour la livraison gratuite (ex: 100€)
4. **Actif** : Cochez "Oui" pour activer ce tarif
5. Cliquez sur **"Sauvegarder"**

## ⚙️ Modifier un tarif existant

1. Trouvez le tarif dans la liste
2. Cliquez sur **"Modifier"**
3. Modifiez les paramètres souhaités
4. Cliquez sur **"Sauvegarder"**

## 🗑️ Supprimer un tarif

1. Trouvez le tarif dans la liste
2. Cliquez sur l'icône **poubelle**
3. Confirmez la suppression

## 🎁 Livraison gratuite

Vous pouvez configurer la livraison gratuite pour tous les types de tarifs :

1. Dans le formulaire de création/modification
2. Remplissez le champ **"Livraison gratuite à partir de (€)"**
3. Exemple : Si vous mettez 100€, tous les clients avec une commande de 100€ ou plus auront la livraison gratuite

## ✅ Tarif actif

- **Un seul tarif peut être actif à la fois**
- Le tarif actif est celui qui sera utilisé pour calculer les prix d'expédition
- Pour activer un tarif, modifiez-le et cochez "Actif" → "Oui"
- Les autres tarifs seront automatiquement désactivés

## 📊 Exemples de configuration

### Exemple 1 : Marge de 15% sur Boxtal

```
Nom : "Livraison avec marge"
Type : Marge en pourcentage
Marge : 15%
Livraison gratuite : 100€
Actif : Oui
```

**Résultat** : Si Boxtal retourne 5€, le client paiera 5.75€ (5€ × 1.15)

### Exemple 2 : Prix fixe de 6.99€

```
Nom : "Livraison Standard"
Type : Prix fixe
Prix fixe : 6.99€
Livraison gratuite : 80€
Actif : Oui
```

**Résultat** : Tous les clients paieront 6.99€ pour la livraison, sauf si leur commande est >= 80€

### Exemple 3 : Tarifs par tranches de poids

```
Nom : "Livraison selon poids"
Type : Tarifs par tranches de poids
Tranches :
  - 0 à 0.5 kg → 4.50€
  - 0.5 à 1 kg → 5.50€
  - 1 à 2 kg → 6.50€
  - 2 à 5 kg → 8.50€
  - Plus de 5 kg → 12.50€
Livraison gratuite : 100€
Actif : Oui
```

**Résultat** : Le prix varie selon le poids réel du colis

## 🔄 Ordre de priorité

1. **Livraison gratuite** : Si le montant de la commande >= seuil, la livraison est gratuite (0€)
2. **Tarif personnalisé** : Le tarif actif est appliqué au prix Boxtal
3. **Prix Boxtal** : Si aucun tarif personnalisé n'est configuré, le prix Boxtal est utilisé directement

## ⚠️ Important

- **Un seul tarif actif** : Seul le tarif marqué comme "Actif" sera utilisé
- **Livraison gratuite prioritaire** : Si le seuil est atteint, la livraison est toujours gratuite, même avec un tarif personnalisé
- **Prix Boxtal requis** : Les tarifs personnalisés (marges, prix fixes) nécessitent que Boxtal fonctionne correctement
- **Tarifs par poids** : Si vous utilisez "Tarifs par tranches de poids", le prix Boxtal n'est pas utilisé, seulement vos tranches

## 🧪 Tester vos tarifs

1. Allez sur votre page de checkout (`/checkout`)
2. Ajoutez des produits au panier
3. Sélectionnez **"Livraison à domicile"**
4. Remplissez une adresse
5. Observez le prix d'expédition affiché
6. Testez avec différents montants de commande pour vérifier la livraison gratuite
7. Testez avec différents poids pour vérifier les tarifs par tranches

## 📞 Besoin d'aide ?

### Vérifier votre configuration

1. Testez votre configuration Boxtal : `/admin/boxtal/test`
2. Vérifiez les logs dans la console du navigateur (F12)
3. Vérifiez que le tarif est bien "Actif"

### Problèmes courants

**Le prix ne change pas selon le tarif configuré**
- Vérifiez que le tarif est "Actif"
- Vérifiez que vous avez bien sauvegardé le tarif
- Videz le cache du navigateur

**La livraison gratuite ne fonctionne pas**
- Vérifiez que le seuil est correctement configuré
- Vérifiez que le montant de la commande atteint le seuil

**Le prix est toujours celui de Boxtal**
- Vérifiez qu'un tarif personnalisé est "Actif"
- Vérifiez que le type de tarif est correctement configuré

## ✅ Checklist

- [ ] Table `shipping_prices` créée dans Supabase
- [ ] Au moins un tarif créé et activé
- [ ] Configuration testée avec différents poids
- [ ] Configuration testée avec différents montants de commande
- [ ] Livraison gratuite testée si configurée






