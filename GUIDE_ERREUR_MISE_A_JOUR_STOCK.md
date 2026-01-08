# 🔧 Guide : Résoudre l'Erreur de Mise à Jour du Stock

## 🚨 Erreur : "Échec de la mise à jour du stock pour product-xxx (variante: variant-xxx)"

Cette erreur se produit lorsque le système ne peut pas mettre à jour le stock d'un produit dans Supabase.

## 🔍 Causes possibles

### 1. Contrainte UNIQUE manquante (le plus fréquent)

**Symptôme** : L'erreur se produit lors de la sauvegarde du stock

**Solution** :
1. Allez dans Supabase Dashboard > **SQL Editor**
2. Exécutez le script `supabase-fix-stock-table.sql`
3. Ce script ajoute la contrainte UNIQUE nécessaire sur `(product_id, variant_id, location)`

### 2. Politiques RLS bloquantes

**Symptôme** : L'erreur indique "permission denied" ou "policy"

**Solution** :
1. Allez dans Supabase Dashboard > **SQL Editor**
2. Exécutez le script `supabase-fix-stock-table.sql` qui configure les bonnes politiques
3. Vérifiez que votre utilisateur a le rôle `admin` dans la table `profiles`

### 3. Table stock n'existe pas

**Symptôme** : L'erreur indique "relation does not exist" ou "42P01"

**Solution** :
1. Allez dans Supabase Dashboard > **SQL Editor**
2. Exécutez le script `supabase-schema.sql` ou `supabase-add-all-tables.sql`
3. Vérifiez que la table `stock` existe dans **Table Editor**

### 4. Supabase non configuré

**Symptôme** : L'erreur indique "Supabase non configuré"

**Solution** :
1. Vérifiez votre fichier `.env.local` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
   ```
2. Redémarrez le serveur après modification

## ✅ Solution rapide

### Étape 1 : Exécuter le script de correction

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** > **New Query**
4. Copiez-collez le contenu de `supabase-fix-stock-table.sql`
5. Cliquez sur **Run**

### Étape 2 : Vérifier les résultats

Le script affichera :
- ✅ Si la contrainte UNIQUE a été ajoutée
- ✅ La structure de la table stock
- ✅ Les contraintes existantes
- ✅ Les politiques RLS

### Étape 3 : Vérifier votre rôle admin

1. Allez dans **Table Editor** > **profiles**
2. Trouvez votre profil (par email)
3. Vérifiez que le champ `role` est défini à `admin`
4. Si ce n'est pas le cas, modifiez-le manuellement

## 🔧 Vérifications

### Vérifier que la table stock existe

Dans Supabase SQL Editor, exécutez :
```sql
SELECT * FROM stock LIMIT 5;
```

Si vous voyez une erreur, la table n'existe pas. Exécutez `supabase-schema.sql`.

### Vérifier la contrainte UNIQUE

Dans Supabase SQL Editor, exécutez :
```sql
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'stock'::regclass
AND contype = 'u';
```

Vous devriez voir une contrainte nommée `stock_product_variant_location_unique`.

### Vérifier les politiques RLS

Dans Supabase SQL Editor, exécutez :
```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'stock';
```

Vous devriez voir au moins :
- `Anyone can view stock` (SELECT)
- `Admins can manage stock` (ALL)

## 🆘 Si le problème persiste

1. **Ouvrez la console du navigateur** (F12)
2. **Regardez les logs détaillés** - les nouveaux logs affichent :
   - Le code d'erreur Supabase
   - Le message d'erreur complet
   - Des suggestions de correction
3. **Vérifiez les logs du serveur** dans le terminal
4. **Testez la connexion Supabase** sur `/admin/supabase-test`

## 📋 Checklist

- [ ] Script `supabase-fix-stock-table.sql` exécuté
- [ ] Contrainte UNIQUE présente sur `(product_id, variant_id, location)`
- [ ] Politiques RLS configurées correctement
- [ ] Votre profil a le rôle `admin`
- [ ] Supabase est configuré dans `.env.local`
- [ ] Le serveur a été redémarré après modification de `.env.local`

## 💡 Note importante

Si vous utilisez le **service role key** côté serveur (dans les routes API), les politiques RLS ne s'appliquent pas. Mais si vous utilisez la **clé anon** côté client, vous devez avoir les bonnes politiques RLS configurées.

---

**Après avoir exécuté le script de correction, l'erreur devrait être résolue !**



