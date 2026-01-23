# Script de correction du double discount Monetico
$file = "app/checkout/page.tsx"
$content = Get-Content $file -Raw

# Supprimer la ligne vide après shipping
$content = $content -replace "    const shipping = Number\(calculatedShippingCost \|\| 0\)\r?\n\r?\n", "    const shipping = Number(calculatedShippingCost || 0)`n`n"

# Corriger le commentaire
$content = $content -replace "    // Calculer le montant en centimes \(entier\) pour Monetico\r?\n    // Sécuriser toutes les valeurs numériques", "    // Calculer le montant en centimes (entier) pour Monetico`n    // IMPORTANT : totalWithDiscount inclut déjà la remise promo, ne pas la soustraire une seconde fois`n    // Sécuriser toutes les valeurs numériques"

# Corriger itemsTotal comment
$content = $content -replace "    const itemsTotal = Number\(totalWithDiscount \|\| 0\)", "    const itemsTotal = Number(totalWithDiscount || 0) // Déjà remisé (totalWithPromotion - discount)"

# Corriger le commentaire du total
$content = $content -replace "    // Calculer le total en euros", "    // Calculer le total en euros (itemsTotal est déjà remisé, pas besoin de re-soustraire discount)"

# Corriger console.error pour enlever discount
$content = $content -replace "      console\.error\('\[MONETICO\] Montant invalide:', \{ total, montant, itemsTotal, shipping, discount \}\)", "      console.error('[MONETICO] Montant invalide:', { total, montant, itemsTotal, shipping })"

# Remplacer le log complet
$oldLog = "    // Log pour debug\r?\n    console\.log\('\[MONETICO\]', \{ \r?\n      total: total\.toFixed\(2\), \r?\n      montant, \r?\n      type: typeof montant,\r?\n      itemsTotal: itemsTotal\.toFixed\(2\),\r?\n      shipping: shipping\.toFixed\(2\),\r?\n      discount: discount\.toFixed\(2\)\r?\n    \}\)"
$newLog = @"
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
"@

$content = $content -replace $oldLog, $newLog

Set-Content $file $content -NoNewline
