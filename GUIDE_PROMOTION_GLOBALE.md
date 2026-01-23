# 🎯 Guide : Promotion Globale

## 📋 Description

Le système de promotion globale permet de créer une réduction sur tout le site ou sur des types de produits spécifiques. Vous pouvez :
- Choisir le pourcentage de réduction (ex: 10%, 15%, 20%)
- Appliquer la promotion sur **tout le site** OU sur des **types de produits spécifiques**
- Filtrer par **catégories** (bouillettes, huiles, etc.) et/ou **gammes** (Méga Tutti, Krill Calamar, etc.)
- Définir des dates de début et de fin
- Activer/désactiver la promotion facilement

## 🚀 Installation

### 1. Créer la table dans Supabase

Exécutez le fichier SQL dans Supabase SQL Editor :
```
supabase-add-global-promotion-table.sql
```

Ce script crée la table `global_promotion` avec toutes les permissions nécessaires.

### 2. Accéder à la page d'administration

Allez sur `/admin/global-promotion` depuis votre interface d'administration.

## 📝 Utilisation

### Créer une promotion

1. **Aller sur** `/admin/global-promotion`
2. **Remplir le formulaire** :
   - **Activer cette promotion** : cochez pour activer immédiatement
   - **Pourcentage de réduction** : entrez le pourcentage (ex: 10 pour 10%)
   - **Application** :
     - **Sur tout le site** : la promotion s'applique à tous les produits
     - **Sur des types de produits spécifiques** : sélectionnez les catégories et/ou gammes éligibles
   - **Description** (optionnel) : texte descriptif de la promotion
   - **Dates** (optionnelles) : date de début et/ou de fin
3. **Cliquer sur "Créer la promotion"**

### Modifier une promotion

1. Cliquez sur **"Modifier"** sur la promotion souhaitée
2. Modifiez les paramètres
3. Cliquez sur **"Mettre à jour"**

### Désactiver une promotion

1. Cliquez sur **"Modifier"** sur la promotion active
2. Décochez **"Activer cette promotion"**
3. Cliquez sur **"Mettre à jour"**

### Supprimer une promotion

1. Cliquez sur **"Supprimer"** sur une promotion inactive
2. Confirmez la suppression

## ⚙️ Fonctionnement technique

### Comment ça marche ?

1. **Chargement** : La promotion active est chargée automatiquement depuis Supabase
2. **Application** : Lors du calcul des prix, la fonction `getPrixPersonnalise()` vérifie si une promotion est active
3. **Filtrage** : Si la promotion ne s'applique pas à tout le site, elle vérifie :
   - La catégorie du produit
   - La gamme du produit
4. **Calcul** : Si le produit est éligible, le prix est réduit du pourcentage défini

### Exemple de calcul

- Prix original : 10€
- Promotion : 10%
- Prix final : 10€ - (10€ × 10%) = 9€

## 🔧 Intégration dans le code

### Utiliser la promotion dans un composant

```typescript
import { useGlobalPromotion } from '@/hooks/useGlobalPromotion'
import { getPrixPersonnalise } from '@/lib/price-utils'
import { usePrixPersonnalises } from '@/hooks/usePrixPersonnalises'

function MonComposant() {
  const prixPersonnalises = usePrixPersonnalises()
  const { promotion } = useGlobalPromotion()
  
  const prix = getPrixPersonnalise(
    prixPersonnalises,
    productId,
    prixParDefaut,
    promotion,           // Promotion globale
    'bouillettes',       // Catégorie du produit
    'Méga Tutti'         // Gamme du produit
  )
  
  return <div>Prix : {prix.toFixed(2)}€</div>
}
```

### Paramètres de `getPrixPersonnalise()`

```typescript
getPrixPersonnalise(
  prixPersonnalises: Record<string, number>,  // Prix personnalisés
  productId: string,                          // ID du produit
  prixParDefaut: number,                      // Prix par défaut
  promotion?: GlobalPromotion | null,         // Promotion globale (optionnel)
  productCategory?: string,                   // Catégorie du produit (optionnel)
  productGamme?: string                       // Gamme du produit (optionnel)
): number
```

## 📊 Catégories disponibles

- bouillettes
- équilibrées / équilibrés
- huiles
- farines
- pop-up duo
- bar à pop-up
- flash boost
- spray plus
- boosters
- stick mix
- bird food
- robin red

## ⚠️ Notes importantes

1. **Une seule promotion active** : Si vous activez une nouvelle promotion, l'ancienne sera automatiquement désactivée
2. **Dates de validité** : Si vous définissez des dates, la promotion ne sera active que pendant cette période
3. **Filtres** : Si vous choisissez "Sur des types de produits spécifiques", vous devez sélectionner au moins une catégorie OU une gamme
4. **Prix personnalisés** : La promotion s'applique après les prix personnalisés (si un produit a un prix personnalisé, la promotion s'applique sur ce prix)

## 🐛 Dépannage

### La promotion ne s'applique pas

1. Vérifiez que la promotion est **active** dans l'admin
2. Vérifiez les **dates de validité** (si définies)
3. Vérifiez que le produit correspond aux **filtres** (catégories/gammes) si la promotion ne s'applique pas à tout le site
4. Vérifiez que le composant utilise bien `useGlobalPromotion()` et passe la promotion à `getPrixPersonnalise()`

### Erreur dans la console

- Vérifiez que la table `global_promotion` existe dans Supabase
- Vérifiez les permissions RLS dans Supabase
- Vérifiez que Supabase est bien configuré (variables d'environnement)

## 📚 Fichiers créés

- `supabase-add-global-promotion-table.sql` : Script SQL pour créer la table
- `lib/global-promotion-supabase.ts` : Fonctions pour gérer la promotion dans Supabase
- `lib/global-promotion-manager.ts` : Logique métier de la promotion
- `hooks/useGlobalPromotion.ts` : Hook React pour utiliser la promotion
- `app/admin/global-promotion/page.tsx` : Page d'administration
- `lib/price-utils.ts` : Modifié pour appliquer la promotion
