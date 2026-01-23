# 🔍 Vérification : Promotion Globale

## ✅ Checklist de vérification

### 1. Table Supabase créée

- [ ] Exécuter le script SQL `supabase-add-global-promotion-table.sql` dans Supabase SQL Editor
- [ ] Vérifier que la table `global_promotion` existe dans Supabase
- [ ] Vérifier les permissions RLS (Row Level Security)

### 2. Promotion créée dans l'admin

- [ ] Aller sur `/admin/global-promotion`
- [ ] Créer une promotion avec :
  - [ ] **Activer cette promotion** : coché
  - [ ] **Pourcentage** : par exemple 10
  - [ ] **Application** : "Sur tout le site" OU sélectionner des catégories/gammes
- [ ] Cliquer sur "Créer la promotion"

### 3. Vérification dans la console du navigateur

Ouvrez la console du navigateur (F12) et vérifiez :

1. **Vérifier que la promotion est chargée** :
   ```javascript
   // Dans la console du navigateur
   // La promotion devrait être chargée automatiquement
   ```

2. **Vérifier les erreurs** :
   - Regardez s'il y a des erreurs dans la console
   - Vérifiez les erreurs réseau (onglet Network)

### 4. Test de la promotion

1. **Aller sur une page produit** (ex: `/categories/bouillettes`)
2. **Vérifier le prix affiché** :
   - Le prix devrait être réduit du pourcentage défini
   - Exemple : Si le prix original est 10€ et la promotion est 10%, le prix affiché devrait être 9€

3. **Vérifier plusieurs types de produits** :
   - Bouillettes
   - Équilibrées
   - Huiles
   - Pop-up Duo
   - Bar à Pop-up
   - Flash Boost
   - Spray Plus

### 5. Test avec filtres

Si vous avez créé une promotion avec filtres (pas "Sur tout le site") :

1. **Vérifier les produits éligibles** :
   - Les produits des catégories/gammes sélectionnées devraient avoir la réduction
   - Les autres produits ne devraient PAS avoir la réduction

2. **Vérifier les produits non éligibles** :
   - Les produits qui ne correspondent pas aux filtres ne devraient pas avoir la réduction

## 🐛 Dépannage

### La promotion ne s'applique pas

1. **Vérifier que la table existe** :
   - Allez dans Supabase Dashboard → Table Editor
   - Vérifiez que la table `global_promotion` existe

2. **Vérifier qu'une promotion est active** :
   - Allez dans Supabase Dashboard → Table Editor → `global_promotion`
   - Vérifiez qu'il y a une ligne avec `active = true`

3. **Vérifier les dates** :
   - Si des dates sont définies, vérifiez qu'elles sont valides
   - `valid_from` doit être dans le passé ou aujourd'hui
   - `valid_until` doit être dans le futur ou aujourd'hui

4. **Vérifier les permissions RLS** :
   - Allez dans Supabase Dashboard → Authentication → Policies
   - Vérifiez que la politique "Anyone can view active promotion" existe

5. **Vérifier dans la console** :
   - Ouvrez la console du navigateur (F12)
   - Regardez s'il y a des erreurs liées à Supabase
   - Vérifiez les requêtes réseau (onglet Network)

### Erreur "Supabase non configuré"

- Vérifiez que les variables d'environnement sont définies :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### La promotion s'applique mais pas aux bons produits

1. **Vérifier les filtres** :
   - Si `apply_to_all = false`, vérifiez que `allowed_categories` ou `allowed_gammes` sont définis
   - Vérifiez que les noms de catégories/gammes correspondent exactement

2. **Vérifier les noms** :
   - Les catégories doivent correspondre exactement (ex: "bouillettes", "huiles")
   - Les gammes doivent correspondre exactement (ex: "Méga Tutti", "Krill Calamar")

## 📝 Test rapide

1. Créez une promotion de **10% sur tout le site**
2. Allez sur une page produit
3. Vérifiez que le prix est réduit de 10%
4. Exemple : Prix original 10€ → Prix avec promotion 9€

## 🔧 Debug dans la console

Pour vérifier si la promotion est chargée, ajoutez temporairement dans un composant :

```typescript
const { promotion, loading } = useGlobalPromotion()
console.log('Promotion:', promotion, 'Loading:', loading)
```

Si `promotion` est `null`, la promotion n'est pas chargée ou n'est pas active.
