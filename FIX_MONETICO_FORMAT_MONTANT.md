# Correction format montant Monetico

## Format requis : "95.25EUR" (euros avec devise, pas centimes)

### 1. app/checkout/page.tsx (lignes 715-747)

**Remplacer :**
```typescript
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

    // Préparer les données de commande
    const orderData = {
      montant: montant, // Montant en centimes (entier)
```

**Par :**
```typescript
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
```

### 2. lib/monetico.ts (ligne 15-16, 45-47)

**Remplacer :**
```typescript
export interface MoneticoOrderData {
  montant: number // Montant en CENTIMES (entier)
```

**Par :**
```typescript
export interface MoneticoOrderData {
  montant: string // Montant au format "95.25EUR" (euros avec devise)
```

**Remplacer :**
```typescript
  // Le montant est déjà en centimes (entier), le convertir en string pour Monetico
  // Format Monetico : montant en centimes (ex: "2550" pour 25.50€)
  const montant = String(orderData.montant)
```

**Par :**
```typescript
  // Le montant est déjà au format "95.25EUR" (string)
  const montant = orderData.montant
```

### 3. app/api/monetico/route.ts (lignes 6-7, 125-147)

**Remplacer :**
```typescript
interface MoneticoRequest {
  montant: number | string // Montant en CENTIMES (entier) - peut être number ou string
```

**Par :**
```typescript
interface MoneticoRequest {
  montant: string // Montant au format "95.25EUR" (euros avec devise)
```

**Remplacer :**
```typescript
    // Convertir le montant en nombre entier (centimes)
    // Sécuriser : accepter number ou string, avec valeur par défaut 0
    const montantNumber = typeof montant === 'string' ? parseInt(montant, 10) : Number(montant || 0)
    
    // Validation stricte : montant doit être un entier fini > 0
    if (!Number.isFinite(montantNumber) || !Number.isInteger(montantNumber) || montantNumber <= 0) {
      console.error('[MONETICO] Montant invalide:', { montant, montantNumber, type: typeof montant })
      return NextResponse.json(
        { error: `Montant Monetico invalide: ${montant} (doit être un entier > 0 en centimes)` },
        { status: 400 }
      )
    }
    
    // Utiliser le montant comme string pour Monetico (format attendu)
    montant = String(montantNumber)
    
    // Log pour debug
    console.log('[MONETICO]', { 
      montantOriginal: body.montant, 
      montantNumber, 
      montant, 
      type: typeof montant 
    })
```

**Par :**
```typescript
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
```
