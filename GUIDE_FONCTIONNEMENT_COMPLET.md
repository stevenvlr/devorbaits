# 📘 Guide Complet : Fonctionnement du Système E-commerce

## 🎯 Vue d'ensemble

Ce guide explique le fonctionnement complet du système e-commerce après le retrait de Boxtal et la simplification du système d'expédition.

---

## 👤 CÔTÉ CLIENT

### 1. Processus de Commande

#### 1.1. Page Checkout (`/checkout`)

**Modes de retrait disponibles :**
- ✅ **Livraison à domicile** : Livraison à l'adresse du client
- ✅ **Retrait à l'amicale des pêcheurs au blanc** : Retrait gratuit sur place (si produits disponibles)
- ✅ **Retrait sur RDV à Wavignies (60130)** : Retrait gratuit sur rendez-vous (mardi et jeudi uniquement)

**⚠️ Option supprimée :**
- ❌ Point relais (Boxtal) - Retiré

#### 1.2. Saisie de l'adresse de livraison

**Champs requis pour livraison à domicile :**
- Adresse (rue, numéro)
- Code postal
- Ville
- Téléphone (optionnel mais recommandé)

**Fonctionnement :**
1. L'utilisateur saisit son adresse dans le formulaire
2. L'adresse est automatiquement chargée depuis le profil si disponible
3. L'adresse est sauvegardée dans le profil utilisateur après la commande
4. L'adresse est sauvegardée dans la commande (colonne `shipping_address` en JSONB)

#### 1.3. Calcul des frais de port

**Système simplifié (sans Boxtal) :**

1. **Récupération du tarif actif** depuis la table `shipping_prices` dans Supabase
2. **Types de tarifs supportés :**
   - `fixed` : Prix fixe (ex: 10€)
   - `weight_ranges` : Prix par tranches de poids
     - Exemple : 0-1kg = 10€, 1-5kg = 15€, 5-10kg = 20€
   - `margin_percent` : Marge en pourcentage (non utilisé actuellement)
   - `margin_fixed` : Marge fixe (non utilisé actuellement)

3. **Calcul du poids** : Utilise les poids réels des produits depuis la table `product_weights`
4. **Livraison gratuite** : Si un seuil est configuré (`free_shipping_threshold`), la livraison est gratuite au-delà de ce montant

5. **Prix par défaut** : Si aucun tarif n'est configuré :
   - ≤ 1kg : 10€
   - ≤ 5kg : 15€
   - > 5kg : 20€

**Affichage :**
- Le prix d'expédition s'affiche en temps réel dans le résumé
- "Gratuit" pour les retraits (amicale, Wavignies)
- Prix calculé pour la livraison à domicile

#### 1.4. Code promo

**Fonctionnement :**
1. L'utilisateur saisit un code promo
2. Validation en temps réel
3. Réduction appliquée au sous-total
4. Le code est enregistré dans la commande

#### 1.5. Paiement

**Modes de paiement disponibles :**
- 💳 **Carte bleue** (Monetico) : Redirection vers la page de paiement Monetico
- 💰 **PayPal** : Paiement via PayPal

**Processus :**

**A. Paiement par carte (Monetico) :**
1. Clic sur "Paiement par carte"
2. Redirection vers Monetico
3. Après paiement réussi → Retour sur `/payment/success`
4. Création automatique de la commande
5. Sauvegarde de l'adresse de livraison
6. Vider le panier
7. Affichage de la confirmation

**B. Paiement PayPal :**
1. Clic sur le bouton PayPal
2. Redirection vers PayPal
3. Après paiement réussi → Retour sur le site
4. Création automatique de la commande
5. Sauvegarde de l'adresse de livraison
6. Vider le panier
7. Affichage de la confirmation

**C. Mode test (paiement fictif) :**
- Si `NEXT_PUBLIC_TEST_PAYMENT=true` dans `.env.local`
- Commande créée directement sans passer par Monetico/PayPal
- Utile pour tester le système

#### 1.6. Données sauvegardées dans la commande

**Lors de la création de la commande :**
- ✅ Référence unique de commande
- ✅ Total (avec frais de port)
- ✅ Items (produits avec variantes)
- ✅ Méthode de paiement
- ✅ Statut : `pending` (en attente)
- ✅ Frais de port

**Après la création (si livraison) :**
- ✅ Adresse de livraison complète (`shipping_address` en JSONB)
  - Adresse
  - Code postal
  - Ville
  - Téléphone

---

## 👨‍💼 CÔTÉ ADMIN

### 1. Interface Admin (`/admin`)

**Accès :** Réservé aux administrateurs (vérification via `AdminGuard`)

### 2. Gestion des Commandes (`/admin/orders`)

#### 2.1. Vue d'ensemble

**Statistiques affichées :**
- Total de commandes
- En attente (pending)
- En préparation (preparing)
- Expédiées (shipped)
- Terminées (completed)
- Annulées (cancelled)

**Filtres disponibles :**
- Recherche par référence, email ou nom
- Filtre par statut

#### 2.2. Détails d'une commande

**Informations affichées :**
- Référence de commande
- Date de création
- Client (nom et email)
- Méthode de paiement
- Total
- Statut (modifiable via dropdown)

**Articles commandés :**
- Liste complète des produits
- Variantes affichées (arôme, taille, couleur, diamètre, conditionnement, etc.)
- Quantité et prix unitaire
- Prix total par ligne

#### 2.3. Adresse de livraison

**Affichage :**
- Section dédiée "Adresse de livraison" (si disponible)
- Adresse complète
- Code postal et ville
- Téléphone

**Format :**
```json
{
  "adresse": "123 Rue Example",
  "codePostal": "75001",
  "ville": "Paris",
  "telephone": "0123456789"
}
```

**Source :** Colonne `shipping_address` (JSONB) dans la table `orders`

#### 2.4. Gestion du numéro de suivi

**Fonctionnalité :**
- ✅ Ajouter un numéro de suivi
- ✅ Modifier un numéro de suivi existant
- ✅ Supprimer un numéro de suivi (en laissant vide)

**Comment utiliser :**
1. Dans la section "Expédition" de chaque commande
2. Cliquer sur "Ajouter" ou "Modifier"
3. Saisir le numéro de suivi
4. Cliquer sur "Enregistrer" ou appuyer sur Entrée
5. Le numéro est sauvegardé dans Supabase (colonne `shipping_tracking_number`)

**Affichage :**
- Numéro de suivi en police monospace jaune
- Message "Aucun numéro de suivi enregistré" si vide
- Bouton d'édition toujours visible

#### 2.5. Changement de statut

**Statuts disponibles :**
- `pending` : En attente
- `preparing` : En préparation
- `shipped` : Expédiée
- `completed` : Terminée
- `cancelled` : Annulée

**Fonctionnement :**
1. Sélectionner le nouveau statut dans le dropdown
2. Mise à jour automatique dans Supabase
3. Message de confirmation affiché

#### 2.6. Informations d'expédition

**Affichées si disponibles :**
- Numéro de suivi (éditable)
- Coût de livraison
- Lien de téléchargement de l'étiquette (si disponible)

**Note :** Ces informations peuvent provenir d'anciennes expéditions Boxtal ou être ajoutées manuellement.

### 3. Gestion des Tarifs d'Expédition (`/admin/shipping-prices`)

#### 3.1. Configuration des tarifs

**Types de tarifs disponibles :**

**A. Prix fixe (`fixed`) :**
- Un prix unique pour toutes les commandes
- Exemple : 10€ pour toutes les livraisons

**B. Tranches de poids (`weight_ranges`) :**
- Prix différents selon le poids
- Exemple :
  - 0-1kg : 10€
  - 1-5kg : 15€
  - 5-10kg : 20€
  - 10kg+ : 25€

**C. Marge en pourcentage (`margin_percent`) :**
- Ajoute une marge au prix de base (non utilisé actuellement)

**D. Marge fixe (`margin_fixed`) :**
- Ajoute un montant fixe au prix de base (non utilisé actuellement)

#### 3.2. Options supplémentaires

**Livraison gratuite :**
- Seuil configurable (`free_shipping_threshold`)
- Exemple : Livraison gratuite à partir de 50€

**Prix minimum de commande :**
- Montant minimum requis (`min_order_value`)

**Limites de poids :**
- Poids minimum (`min_weight`)
- Poids maximum (`max_weight`)

#### 3.3. Activation d'un tarif

- Un seul tarif peut être actif à la fois
- Le tarif actif est utilisé pour le calcul des frais de port
- Les autres tarifs restent en base de données mais ne sont pas utilisés

### 4. Structure des Données dans Supabase

#### 4.1. Table `orders`

**Colonnes principales :**
- `id` : UUID (identifiant unique)
- `user_id` : UUID (référence vers l'utilisateur)
- `reference` : TEXT (référence unique de commande)
- `total` : DECIMAL (montant total)
- `status` : TEXT (pending, preparing, shipped, completed, cancelled)
- `payment_method` : TEXT (monetico, paypal, test)
- `items` : JSONB (tableau des articles commandés)
- `shipping_cost` : DECIMAL (frais de port)
- `shipping_address` : JSONB (adresse de livraison)
- `shipping_tracking_number` : TEXT (numéro de suivi)
- `shipping_label_url` : TEXT (URL de l'étiquette)
- `created_at` : TIMESTAMP (date de création)

#### 4.2. Table `shipping_prices`

**Colonnes principales :**
- `id` : UUID
- `name` : TEXT (nom du tarif)
- `type` : TEXT (fixed, weight_ranges, etc.)
- `active` : BOOLEAN (tarif actif ou non)
- `fixed_price` : DECIMAL (si type = fixed)
- `weight_ranges` : JSONB (si type = weight_ranges)
- `free_shipping_threshold` : DECIMAL (seuil livraison gratuite)
- `min_order_value` : DECIMAL (prix minimum)
- `min_weight` : DECIMAL (poids minimum)
- `max_weight` : DECIMAL (poids maximum)

#### 4.3. Table `product_weights`

**Colonnes principales :**
- `product_id` : TEXT (identifiant du produit)
- `variant_id` : TEXT (identifiant de la variante)
- `weight_kg` : DECIMAL (poids en kilogrammes)

**Utilisation :** Pour calculer le poids total du panier et déterminer les frais de port.

---

## 🔄 Flux Complet d'une Commande

### 1. Côté Client

```
1. Client ajoute des produits au panier
   ↓
2. Client va au checkout (/checkout)
   ↓
3. Client choisit le mode de retrait
   ↓
4. Si livraison → Saisit l'adresse
   ↓
5. Calcul automatique des frais de port
   ↓
6. Application d'un code promo (optionnel)
   ↓
7. Client choisit le mode de paiement
   ↓
8. Paiement (Monetico/PayPal/Test)
   ↓
9. Retour sur /payment/success
   ↓
10. Création de la commande dans Supabase
    ↓
11. Sauvegarde de l'adresse de livraison
    ↓
12. Vider le panier
    ↓
13. Affichage de la confirmation
```

### 2. Côté Admin

```
1. Commande créée avec statut "pending"
   ↓
2. Admin voit la commande dans /admin/orders
   ↓
3. Admin vérifie l'adresse de livraison
   ↓
4. Admin change le statut à "preparing"
   ↓
5. Admin prépare la commande
   ↓
6. Admin change le statut à "shipped"
   ↓
7. Admin ajoute le numéro de suivi
   ↓
8. Client peut suivre sa commande
   ↓
9. Admin change le statut à "completed" une fois livré
```

---

## 📋 Checklist pour l'Administrateur

### Avant de commencer à vendre :

- [ ] Configurer les tarifs d'expédition dans `/admin/shipping-prices`
- [ ] Vérifier que les poids des produits sont renseignés dans `product_weights`
- [ ] Tester une commande complète (mode test)
- [ ] Vérifier que les adresses sont bien sauvegardées

### Pour chaque commande :

- [ ] Vérifier l'adresse de livraison dans `/admin/orders`
- [ ] Préparer la commande (statut "preparing")
- [ ] Expédier la commande (statut "shipped")
- [ ] Ajouter le numéro de suivi
- [ ] Marquer comme "completed" une fois livrée

---

## ⚠️ Points Importants

### 1. Adresses de livraison

- ✅ **Toujours vérifiées** : Les adresses sont sauvegardées dans chaque commande
- ✅ **Visibles dans l'admin** : Section dédiée pour chaque commande
- ✅ **Sauvegardées dans le profil** : Pour faciliter les prochaines commandes

### 2. Frais de port

- ✅ **Calcul automatique** : Basé sur les tarifs configurés
- ✅ **Poids réel** : Utilise les poids des produits
- ✅ **Tarifs flexibles** : Prix fixe ou par tranches de poids
- ✅ **Livraison gratuite** : Configurable avec un seuil

### 3. Numéro de suivi

- ✅ **Ajout manuel** : Depuis l'interface admin
- ✅ **Modification possible** : À tout moment
- ✅ **Visible pour le client** : (si vous ajoutez une page de suivi)

### 4. Retrait de Boxtal

- ✅ **Plus d'appels API Boxtal** : Système complètement indépendant
- ✅ **Expédition manuelle** : Vous gérez vous-même les expéditions
- ✅ **Numéro de suivi manuel** : Vous ajoutez le numéro après expédition

---

## 🎯 Résumé

### Côté Client :
- ✅ Checkout simplifié (3 modes de retrait)
- ✅ Calcul automatique des frais de port
- ✅ Sauvegarde automatique de l'adresse
- ✅ Paiement sécurisé (Monetico/PayPal)

### Côté Admin :
- ✅ Vue complète des commandes
- ✅ Gestion des statuts
- ✅ Affichage des adresses de livraison
- ✅ Ajout/modification du numéro de suivi
- ✅ Configuration des tarifs d'expédition

### Base de données :
- ✅ Toutes les informations sont sauvegardées dans Supabase
- ✅ Structure claire et organisée
- ✅ Facile à interroger et modifier

---

## 📞 Support

Si vous avez des questions ou rencontrez des problèmes :
1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez les données dans Supabase
3. Consultez les autres guides dans le projet

---

**✅ Système prêt à l'emploi !**
