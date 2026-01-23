# Script de correction format montant Monetico : euros avec devise

$checkoutFile = "app/checkout/page.tsx"
$moneticoLibFile = "lib/monetico.ts"
$moneticoApiFile = "app/api/monetico/route.ts"

# 1. Modifier app/checkout/page.tsx
$checkoutContent = Get-Content $checkoutFile -Raw

# Remplacer le calcul du montant
$oldCheckout = '(?s)    // Calculer le total en euros \(itemsTotal est déjà remisé, pas besoin de re-soustraire discount\)\s+const total = itemsTotal \+ shipping\s+// Convertir en centimes \(entier\)\s+const montant = Math\.round\(total \* 100\)\s+// Validation : montant doit être un entier > 0\s+if \(!Number\.isFinite\(montant\) \|\| montant <= 0\) \{\s+console\.error\('\[MONETICO\] Montant invalide:', \{ total, montant, itemsTotal, shipping \}\)\s+alert\('Erreur : montant invalide\. Veuillez réessayer\.'\)\s+return\s+\}\s+// Log pour debug - Comparer finalTotal \(PayPal\) et total \(Monetico\)\s+const diff = Math\.abs\(finalTotal - total\)\s+console\.log\('\[MONETICO\] Calcul montant:', \{ \s+finalTotal: finalTotal\.toFixed\(2\), // Total PayPal/affiché\s+totalMonetico: total\.toFixed\(2\), // Total Monetico\s+difference: diff\.toFixed\(2\), // Différence \(devrait être < 0\.01\)\s+montant, \s+type: typeof montant,\s+itemsTotal: itemsTotal\.toFixed\(2\),\s+shipping: shipping\.toFixed\(2\)\s+\}\)\s+// Vérification : finalTotal et total doivent matcher \(à 1 centime près\)\s+if \(diff > 0\.01\) \{\s+console\.warn\('\[MONETICO\] ⚠️ Différence entre finalTotal et total Monetico:', diff\.toFixed\(2\)\)\s+\}\s+// Préparer les données de commande\s+const orderData = \{\s+montant: montant, // Montant en centimes \(entier\)'

$newCheckout = @'
    // Calculer le total en euros (itemsTotal est déjà remisé, pas besoin de re-soustraire discount)
    const total = round2(itemsTotal + shipping) // Arrondir de façon stable à 2 décimales
    
    // Validation : total doit être > 0
    if (!Number.isFinite(total) || total <= 0) {
      console.error('[MONETICO] Montant invalide:', { total, itemsTotal, shipping })
      alert('Erreur : montant invalide. Veuillez réessayer.')
      return
    }
    
    // Format Monetico : euros avec devise (ex: "95.25EUR")
    const montant = `${total.toFixed(2)}EUR`
    
    // Log pour debug - Comparer finalTotal (PayPal) et total (Monetico)
    const diff = Math.abs(finalTotal - total)
    console.log('[MONETICO montant]', { total, montant })
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

    // Préparer les données de commande
    const orderData = {
      montant: montant, // Montant au format "95.25EUR"
'@

$checkoutContent = $checkoutContent -replace $oldCheckout, $newCheckout
Set-Content $checkoutFile $checkoutContent -NoNewline

# 2. Modifier lib/monetico.ts
$moneticoLibContent = Get-Content $moneticoLibFile -Raw

# Modifier l'interface
$moneticoLibContent = $moneticoLibContent -replace '  montant: number // Montant en CENTIMES \(entier\)', '  montant: string // Montant au format "95.25EUR" (euros avec devise)'

# Modifier la fonction prepareMoneticoPayment
$moneticoLibContent = $moneticoLibContent -replace '  // Le montant est déjà en centimes \(entier\), le convertir en string pour Monetico\s+// Format Monetico : montant en centimes \(ex: "2550" pour 25\.50€\)\s+const montant = String\(orderData\.montant\)', '  // Le montant est déjà au format "95.25EUR" (string)
  const montant = orderData.montant'

Set-Content $moneticoLibFile $moneticoLibContent -NoNewline

# 3. Modifier app/api/monetico/route.ts
$moneticoApiContent = Get-Content $moneticoApiFile -Raw

# Modifier l'interface
$moneticoApiContent = $moneticoApiContent -replace '  montant: number \| string // Montant en CENTIMES \(entier\) - peut être number ou string', '  montant: string // Montant au format "95.25EUR" (euros avec devise)'

# Remplacer la validation
$oldValidation = '(?s)    // Convertir le montant en nombre entier \(centimes\)\s+// Sécuriser : accepter number ou string, avec valeur par défaut 0\s+const montantNumber = typeof montant === ''string'' \? parseInt\(montant, 10\) : Number\(montant \|\| 0\)\s+// Validation stricte : montant doit être un entier fini > 0\s+if \(!Number\.isFinite\(montantNumber\) \|\| !Number\.isInteger\(montantNumber\) \|\| montantNumber <= 0\) \{\s+console\.error\('\[MONETICO\] Montant invalide:', \{ montant, montantNumber, type: typeof montant \}\)\s+return NextResponse\.json\(\s+\{ error: `Montant Monetico invalide: \$\{montant\} \(doit être un entier > 0 en centimes\)` \},\s+\{ status: 400 \}\s+\)\s+\}\s+// Utiliser le montant comme string pour Monetico \(format attendu\)\s+montant = String\(montantNumber\)\s+// Log pour debug\s+console\.log\('\[MONETICO\]', \{ \s+montantOriginal: body\.montant, \s+montantNumber, \s+montant, \s+type: typeof montant \s+\}\)'

$newValidation = @'
    // Validation stricte du format Monetico : [0-9]+(\.[0-9]{1,2})?[A-Z]{3}
    const montantRegex = /^[0-9]+(\.[0-9]{1,2})?[A-Z]{3}$/
    if (typeof montant !== 'string' || !montantRegex.test(montant)) {
      console.error('[MONETICO] Format montant invalide:', { montant, type: typeof montant })
      return NextResponse.json(
        { error: `Format montant Monetico invalide: ${montant} (attendu: "95.25EUR")` },
        { status: 400 }
      )
    }
    
    // Extraire la partie numérique pour vérifier > 0
    const montantNumber = parseFloat(montant.replace(/[A-Z]{3}$/, ''))
    if (!Number.isFinite(montantNumber) || montantNumber <= 0) {
      console.error('[MONETICO] Montant numérique invalide:', { montant, montantNumber })
      return NextResponse.json(
        { error: `Montant Monetico invalide: ${montant} (montant numérique doit être > 0)` },
        { status: 400 }
      )
    }
    
    // Log pour debug
    console.log('[MONETICO montant]', { total: montantNumber, montant })
    console.log('[MONETICO]', { 
      montantOriginal: body.montant, 
      montant, 
      type: typeof montant 
    })
'@

$moneticoApiContent = $moneticoApiContent -replace $oldValidation, $newValidation
Set-Content $moneticoApiFile $moneticoApiContent -NoNewline

Write-Host "✅ Modifications appliquées"
