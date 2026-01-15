# Guide : Gestion Séparée des Tarifs d'Envoi

## 📋 Vue d'ensemble

Le système de gestion des frais d'envoi a été amélioré pour permettre de configurer **séparément** les tarifs pour :
- **Livraison à domicile** (`home`)
- **Point relais** (`relay`)

## 🚀 Installation

### Étape 1 : Mettre à jour la base de données

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor** > **New Query**
3. Copiez-collez le contenu du fichier `supabase-add-shipping-type-field.sql`
4. Exécutez la requête

Cette modification ajoute un champ `shipping_type` à la table `shipping_prices` pour distinguer les deux types d'envoi.

## 💰 Configuration des Tarifs

### Depuis l'interface admin

1. Connectez-vous en tant qu'administrateur
2. Allez dans **Administration** > **Tarifs d'Expédition**
3. Vous verrez maintenant deux sections distinctes :
   - **Livraison à domicile**
   - **Point relais**

### Créer un tarif

1. Cliquez sur **Nouveau tarif**
2. Remplissez les informations :
   - **Nom du tarif** : Ex: "Livraison Standard Domicile"
   - **Type d'envoi** : Choisissez "Livraison à domicile" ou "Point relais"
   - **Type de tarif** : Prix fixe, marge, ou tranches de poids
   - **Autres paramètres** selon le type choisi
3. Cliquez sur **Sauvegarder**

### Exemple de configuration

**Pour la livraison à domicile :**
- Nom : "Livraison Domicile Standard"
- Type d'envoi : Livraison à domicile
- Type de tarif : Tranches de poids
- Tranches :
  - 0 à 1 kg : 10€
  - 1 à 5 kg : 15€
  - 5 kg et plus : 20€

**Pour les points relais :**
- Nom : "Point Relais Standard"
- Type d'envoi : Point relais
- Type de tarif : Prix fixe
- Prix fixe : 5€

## 🔄 Fonctionnement Automatique

Le système sélectionne automatiquement le bon tarif selon le mode de retrait choisi par le client :

- Si le client choisit **"Livraison à domicile"** → Le système utilise le tarif avec `shipping_type = 'home'`
- Si le client choisit **"Chronopost Relais"** → Le système utilise le tarif avec `shipping_type = 'relay'`

## 📝 Notes Importantes

- **Rétrocompatibilité** : Les tarifs existants sans `shipping_type` seront considérés comme des tarifs "domicile" par défaut
- **Un seul tarif actif** : Pour chaque type d'envoi, seul le tarif le plus récent et actif sera utilisé
- **Livraison gratuite** : Chaque type d'envoi peut avoir son propre seuil de livraison gratuite

## 🛠️ Structure Technique

### Champ ajouté dans la base de données

```sql
shipping_type TEXT DEFAULT 'home' CHECK (shipping_type IN ('home', 'relay'))
```

### Fonction modifiée

La fonction `getActiveShippingPrice()` accepte maintenant un paramètre :

```typescript
getActiveShippingPrice(shippingType: 'home' | 'relay' = 'home')
```

### Utilisation dans le checkout

Le checkout détermine automatiquement le type d'envoi :

```typescript
const shippingType = retraitMode === 'livraison' ? 'home' : 'relay'
const shippingPrice = await getActiveShippingPrice(shippingType)
```
