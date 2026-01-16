# 🔍 Diagnostic : Tarifs d'Expédition Ne S'Affichent Pas

## 📋 Vérifications à Effectuer

### 1. Vérifier que le champ `shipping_type` existe dans Supabase

1. Connectez-vous à votre projet Supabase
2. Allez dans **Table Editor** > **shipping_prices**
3. Vérifiez que la colonne `shipping_type` existe
4. Si elle n'existe pas, exécutez le script SQL `supabase-add-shipping-type-field.sql`

### 2. Vérifier les tarifs dans la base de données

1. Dans Supabase, allez dans **SQL Editor**
2. Exécutez cette requête pour voir tous vos tarifs :

```sql
SELECT 
  id,
  name,
  type,
  shipping_type,
  active,
  fixed_price,
  weight_ranges,
  free_shipping_threshold
FROM shipping_prices
ORDER BY created_at DESC;
```

**Points à vérifier :**
- ✅ Au moins un tarif avec `active = true`
- ✅ Le tarif a un `shipping_type` défini (`'home'` ou `'relay'`)
- ✅ Pour la livraison à domicile : au moins un tarif avec `shipping_type = 'home'`
- ✅ Pour les points relais : au moins un tarif avec `shipping_type = 'relay'`

### 3. Vérifier la console du navigateur

1. Ouvrez la page checkout
2. Ouvrez la console du navigateur (F12)
3. Remplissez l'adresse de livraison
4. Regardez les messages dans la console :
   - ✅ `✅ Tarif home trouvé:` = Le tarif est bien récupéré
   - ⚠️ `⚠️ Aucun tarif actif trouvé` = Aucun tarif n'est trouvé
   - ❌ `❌ Erreur lors de la récupération` = Erreur de connexion ou de permissions

### 4. Vérifier les permissions RLS (Row Level Security)

1. Dans Supabase, allez dans **Authentication** > **Policies**
2. Vérifiez que la politique `"Anyone can view active shipping_prices"` existe sur la table `shipping_prices`
3. Si elle n'existe pas, exécutez cette requête :

```sql
-- Politique : Lecture publique pour le calcul des prix
CREATE POLICY "Anyone can view active shipping_prices"
  ON shipping_prices FOR SELECT
  USING (active = true);
```

### 5. Créer un tarif de test

1. Allez dans l'interface admin : `/admin/shipping-prices`
2. Cliquez sur **Nouveau tarif**
3. Remplissez :
   - **Nom** : "Test Livraison"
   - **Type d'envoi** : "Livraison à domicile"
   - **Type de tarif** : "Prix fixe"
   - **Prix fixe** : 10.00
   - **Actif** : Oui
4. Cliquez sur **Sauvegarder**
5. Vérifiez que le tarif apparaît dans la liste avec le badge "Actif"

### 6. Vérifier que le tarif est bien sauvegardé

Après avoir créé/modifié un tarif, vérifiez dans Supabase :

```sql
SELECT * FROM shipping_prices 
WHERE active = true 
AND shipping_type = 'home'
ORDER BY created_at DESC
LIMIT 1;
```

## 🔧 Solutions Courantes

### Problème : Le champ `shipping_type` n'existe pas

**Solution :** Exécutez le script SQL `supabase-add-shipping-type-field.sql`

### Problème : Les tarifs existants n'ont pas de `shipping_type`

**Solution :** Exécutez cette requête pour mettre à jour les tarifs existants :

```sql
UPDATE shipping_prices 
SET shipping_type = 'home' 
WHERE shipping_type IS NULL;
```

### Problème : Aucun tarif actif

**Solution :** 
1. Allez dans `/admin/shipping-prices`
2. Vérifiez que vos tarifs ont le statut "Actif"
3. Si non, modifiez-les et cochez "Actif"

### Problème : Erreur de permissions RLS

**Solution :** Vérifiez que la politique de lecture publique existe (voir étape 4)

### Problème : Le tarif n'est pas du bon type

**Solution :** 
- Pour la livraison à domicile, le tarif doit avoir `shipping_type = 'home'`
- Pour les points relais, le tarif doit avoir `shipping_type = 'relay'`

## 📝 Exemple de Configuration Correcte

**Pour la livraison à domicile :**
```sql
INSERT INTO shipping_prices (
  name,
  type,
  shipping_type,
  fixed_price,
  active,
  free_shipping_threshold
) VALUES (
  'Livraison Standard',
  'fixed',
  'home',
  10.00,
  true,
  100.00
);
```

**Pour les points relais :**
```sql
INSERT INTO shipping_prices (
  name,
  type,
  shipping_type,
  fixed_price,
  active,
  free_shipping_threshold
) VALUES (
  'Point Relais Standard',
  'fixed',
  'relay',
  5.00,
  true,
  100.00
);
```

## 🆘 Si le problème persiste

1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez les logs Supabase dans **Logs** > **Postgres Logs**
3. Vérifiez que votre fichier `.env.local` contient bien les variables Supabase :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
