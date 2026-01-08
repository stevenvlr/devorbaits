# Guide : Migration des articles dans la table orders

## 📋 Résumé

Les articles commandés sont maintenant stockés directement dans la table `orders` dans un champ JSONB `items`, au lieu d'être dans une table séparée `order_items`.

## 🔧 Étapes de migration

### 1. Exécuter le script SQL dans Supabase

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Exécutez le script `supabase-add-items-to-orders.sql`

Ce script va :
- Ajouter la colonne `items` (JSONB) dans la table `orders`
- Créer un index pour améliorer les performances
- Migrer automatiquement les données existantes de `order_items` vers `orders.items`

### 2. Vérifier la migration

Après avoir exécuté le script, vérifiez que :
- La colonne `items` existe dans la table `orders`
- Les commandes existantes ont leurs articles dans le champ `items`

Vous pouvez vérifier avec cette requête SQL :
```sql
SELECT id, reference, items, jsonb_array_length(items) as items_count 
FROM orders 
WHERE items IS NOT NULL 
LIMIT 10;
```

## 📦 Format des données

Les articles sont stockés dans `orders.items` au format JSON suivant :

```json
[
  {
    "id": "item-1234567890-0",
    "product_id": "prod-123",
    "variant_id": "var-456",
    "quantity": 2,
    "price": 10.50,
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```

## ✅ Avantages

1. **Simplicité** : Plus besoin de faire des jointures avec `order_items`
2. **Performance** : Les articles sont récupérés en une seule requête
3. **Cohérence** : Toutes les données de la commande sont au même endroit
4. **Flexibilité** : Le format JSON permet d'ajouter facilement de nouveaux champs

## 🔄 Compatibilité

Le code a été mis à jour pour :
- ✅ Sauvegarder les items dans `orders.items` lors de la création
- ✅ Récupérer les items depuis `orders.items` lors de la lecture
- ✅ Fonctionner avec localStorage (fallback)
- ✅ Convertir automatiquement le JSONB en tableau d'OrderItem

## ⚠️ Note importante

La table `order_items` existe toujours dans la base de données mais n'est plus utilisée par le code. Vous pouvez :
- La laisser en place (pour l'historique)
- Ou la supprimer si vous êtes sûr que toutes les données ont été migrées

Pour supprimer la table `order_items` (optionnel) :
```sql
DROP TABLE IF EXISTS order_items CASCADE;
```

## 🐛 Dépannage

Si les articles ne s'affichent pas :

1. Vérifiez que le script SQL a bien été exécuté
2. Vérifiez la console du navigateur pour les logs de débogage
3. Vérifiez dans Supabase que les commandes ont bien un champ `items` rempli


