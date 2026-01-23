# Correction du double discount Monetico

## Fichier à modifier : `app/checkout/page.tsx`

### Lignes 708-735 : Remplacer par :

```typescript
    // Calculer le montant en centimes (entier) pour Monetico
    // IMPORTANT : totalWithDiscount inclut déjà la remise promo, ne pas la soustraire une seconde fois
    // Sécuriser toutes les valeurs numériques
    const itemsTotal = Number(totalWithDiscount || 0) // Déjà remisé (totalWithPromotion - discount)
    const shipping = Number(calculatedShippingCost || 0)
    
    // Calculer le total en euros (itemsTotal est déjà remisé, pas besoin de re-soustraire discount)
    const total = itemsTotal + shipping
    
    // Convertir en centimes (entier)
    const montant = Math.round(total * 100)
    
    // Validation : montant doit être un entier > 0
    if (!Number.isFinite(montant) || montant <= 0) {
      console.error('[MONETICO] Montant invalide:', { total, montant, itemsTotal, shipping })
      alert('Erreur : montant invalide. Veuillez réessayer.')
      return
    }
    
    // Log pour debug - Comparer finalTotal (PayPal) et total (Monetico)
    const diff = Math.abs(finalTotal - total)
    console.log('[MONETICO] Calcul montant:', { 
      finalTotal: finalTotal.toFixed(2), // Total PayPal/affiché
      totalMonetico: total.toFixed(2), // Total Monetico
      difference: diff.toFixed(2), // Différence (devrait être < 0.01)
      montant, 
      type: typeof montant,
      itemsTotal: itemsTotal.toFixed(2),
      shipping: shipping.toFixed(2)
    })
    
    // Vérification : finalTotal et total doivent matcher (à 1 centime près)
    if (diff > 0.01) {
      console.warn('[MONETICO] ⚠️ Différence entre finalTotal et total Monetico:', diff.toFixed(2))
    }
```

### Changements :
1. ✅ Supprimer la ligne `const discount = Number(promoValidation?.discount || 0)`
2. ✅ Changer `const total = itemsTotal + shipping - discount` en `const total = itemsTotal + shipping`
3. ✅ Mettre à jour les logs pour comparer `finalTotal` et `total` Monetico
4. ✅ Ajouter un avertissement si la différence > 0.01€
