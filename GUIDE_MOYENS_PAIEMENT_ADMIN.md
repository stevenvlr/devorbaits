# Guide : Gestion des Moyens de Paiement depuis l'Admin

Ce guide explique comment masquer temporairement des moyens de paiement depuis l'interface admin.

## 📋 Prérequis

1. Avoir accès à l'interface admin (`/admin`)
2. Avoir exécuté le script SQL pour créer la table `payment_methods` dans Supabase

## 🚀 Installation

### Étape 1 : Créer la table dans Supabase

Exécutez le script SQL suivant dans votre base de données Supabase :

```sql
-- Voir le fichier : supabase-payment-methods-table.sql
```

Ou copiez-collez le contenu du fichier `supabase-payment-methods-table.sql` dans l'éditeur SQL de Supabase et exécutez-le.

### Étape 2 : Vérifier que tout fonctionne

1. Connectez-vous à l'interface admin
2. Allez sur `/admin/payment-methods`
3. Vous devriez voir deux moyens de paiement :
   - PayPal
   - Carte bancaire (Monetico)

## 💡 Utilisation

### Masquer un moyen de paiement

1. Allez sur `/admin/payment-methods`
2. Cliquez sur le bouton **"Masquer"** à côté du moyen de paiement que vous souhaitez désactiver
3. Le moyen de paiement sera immédiatement masqué sur la page de checkout

### Réactiver un moyen de paiement

1. Allez sur `/admin/payment-methods`
2. Cliquez sur le bouton **"Activer"** à côté du moyen de paiement masqué
3. Le moyen de paiement sera immédiatement visible sur la page de checkout

## ⚠️ Notes importantes

- **Changements immédiats** : Les modifications sont appliquées immédiatement. Les utilisateurs qui sont déjà sur la page de checkout verront les changements après un rafraîchissement de la page.

- **Fallback** : Si Supabase n'est pas accessible ou si la table n'existe pas, le système utilisera les valeurs par défaut définies dans les variables d'environnement (`NEXT_PUBLIC_PAYMENT_PAYPAL_ENABLED` et `NEXT_PUBLIC_PAYMENT_CARD_ENABLED`).

- **Au moins un moyen de paiement** : Il est recommandé de toujours avoir au moins un moyen de paiement activé. Si tous les moyens de paiement sont masqués, un message d'erreur s'affichera sur la page de checkout.

## 🔧 Structure technique

### Table Supabase : `payment_methods`

```sql
- id (UUID) : Identifiant unique
- method (TEXT) : 'paypal' ou 'card'
- enabled (BOOLEAN) : true si activé, false si masqué
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Fichiers créés

1. **`supabase-payment-methods-table.sql`** : Script SQL pour créer la table
2. **`lib/payment-methods-supabase.ts`** : Fonctions pour gérer les moyens de paiement
3. **`app/admin/payment-methods/page.tsx`** : Interface admin pour gérer les moyens de paiement
4. **`app/checkout/page.tsx`** : Modifié pour lire les états depuis Supabase (affichage uniquement)

## 🐛 Dépannage

### Le moyen de paiement ne se masque pas

1. Vérifiez que la table `payment_methods` existe dans Supabase
2. Vérifiez que les politiques RLS (Row Level Security) sont correctement configurées
3. Vérifiez la console du navigateur pour les erreurs
4. Rafraîchissez la page de checkout

### Erreur "Aucun moyen de paiement trouvé"

1. Vérifiez que le script SQL a été exécuté
2. Vérifiez que les données par défaut ont été insérées :
   ```sql
   SELECT * FROM payment_methods;
   ```
3. Si la table est vide, réinsérez les données :
   ```sql
   INSERT INTO payment_methods (method, enabled)
   VALUES 
     ('paypal', true),
     ('card', true)
   ON CONFLICT (method) DO NOTHING;
   ```

## 📝 Exemple d'utilisation

**Scénario** : Vous devez temporairement désactiver PayPal pour maintenance.

1. Allez sur `/admin/payment-methods`
2. Cliquez sur **"Masquer"** à côté de PayPal
3. Les clients ne verront plus PayPal sur la page de checkout
4. Une fois la maintenance terminée, cliquez sur **"Activer"** pour réactiver PayPal

---

**Créé le** : 28 janvier 2026
