# Guide : Membres Sponsorisés - Tarifs Fixes Expédition

## Installation

Exécutez le script SQL dans Supabase (SQL Editor) :
```
supabase-add-sponsor-shipping-discount.sql
```

Ce script crée :
- Le champ `is_sponsored` dans la table `profiles`
- La table `sponsor_shipping_rates` pour la grille tarifaire globale

## Utilisation depuis l'Interface Admin

### Accès : `/admin/sponsors`

Ou via le menu Admin > **Membres Sponsors**

### 1. Configurer la Grille Tarifaire (unique pour tous)

La grille tarifaire s'applique à **tous les sponsors**. Exemple :

| Poids | Prix |
|-------|------|
| 0-5 kg | 5.00 € |
| 5-10 kg | 8.00 € |
| 10-20 kg | 12.00 € |
| +20 kg | 15.00 € |

### 2. Ajouter un Sponsor

1. Cliquez sur **"Ajouter"**
2. Sélectionnez l'utilisateur dans la liste
3. Validez

### 3. Retirer un Sponsor

Cliquez sur **"Retirer"** à côté du membre.

## Fonctionnement au Checkout

1. Le membre sponsor se connecte
2. Au checkout, le système détecte `is_sponsored = true`
3. Le tarif de la grille sponsor remplace le tarif normal
4. Le membre voit l'économie réalisée dans le récapitulatif

## Résumé

| Élément | Description |
|---------|-------------|
| Grille tarifaire | **Unique** pour tous les sponsors |
| Membre sponsor | Simple booléen `is_sponsored` dans son profil |
| Interface admin | `/admin/sponsors` |
