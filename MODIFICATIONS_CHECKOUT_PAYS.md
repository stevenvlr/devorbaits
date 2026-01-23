# Modifications à appliquer dans app/checkout/page.tsx

## 1. Ligne 196-230 : Modifier le useEffect pour prendre en compte le pays

**Remplacer :**
```typescript
  // Gérer le mode de livraison selon le poids
  // 0-18 kg: Point relais uniquement
  // 18.01-28 kg: Domicile uniquement
  // 28.01-38 kg: Point relais (2 colis)
  // 38.01-50 kg: Domicile (2 colis)
  // >50 kg: Nous contacter (blocage)
  useEffect(() => {
    // Forcer le mode selon le poids
    if (totalWeight <= 18) {
      // 0-18 kg: Point relais uniquement
      if (retraitMode === 'livraison') {
        console.log(`⚠️ Poids ${totalWeight.toFixed(2)}kg <= 18kg - Forçage Chronopost Relais`)
        setRetraitMode('chronopost-relais')
      }
    } else if (totalWeight > 18 && totalWeight <= 28) {
      // 18.01-28 kg: Domicile uniquement
      if (retraitMode === 'chronopost-relais') {
        console.log(`⚠️ Poids ${totalWeight.toFixed(2)}kg entre 18.01-28kg - Forçage Livraison domicile`)
        setRetraitMode('livraison')
      }
    } else if (totalWeight > 28 && totalWeight <= 38) {
      // 28.01-38 kg: Point relais (2 colis)
      if (retraitMode === 'livraison') {
        console.log(`⚠️ Poids ${totalWeight.toFixed(2)}kg entre 28.01-38kg - Forçage Chronopost Relais (2 colis)`)
        setRetraitMode('chronopost-relais')
      }
    } else if (totalWeight > 38 && totalWeight <= 50) {
      // 38.01-50 kg: Domicile (2 colis)
      if (retraitMode === 'chronopost-relais') {
        console.log(`⚠️ Poids ${totalWeight.toFixed(2)}kg entre 38.01-50kg - Forçage Livraison domicile (2 colis)`)
        setRetraitMode('livraison')
      }
    }
    // >50 kg: pas de forçage, mais blocage affiché ailleurs
  }, [totalWeight, retraitMode])
```

**Par :**
```typescript
  // Gérer le mode de livraison selon le poids et le pays
  // BELGIQUE: Toujours point relais uniquement
  // FRANCE:
  //   0-18 kg: Point relais uniquement
  //   18.01-28 kg: Domicile uniquement
  //   28.01-38 kg: Point relais (2 colis)
  //   38.01-50 kg: Domicile (2 colis)
  //   >50 kg: Nous contacter (blocage)
  useEffect(() => {
    const country = livraisonAddress.pays || 'FR'
    
    // Pour la Belgique, forcer TOUJOURS point relais
    if (country === 'BE') {
      if (retraitMode === 'livraison') {
        console.log(`🇧🇪 Belgique détectée - Forçage Chronopost Relais (obligatoire)`)
        setRetraitMode('chronopost-relais')
      }
      return // Pas de forçage selon le poids pour BE, car c'est toujours point relais
    }
    
    // Règles pour la France uniquement
    if (totalWeight <= 18) {
      // 0-18 kg: Point relais uniquement
      if (retraitMode === 'livraison') {
        console.log(`⚠️ Poids ${totalWeight.toFixed(2)}kg <= 18kg - Forçage Chronopost Relais`)
        setRetraitMode('chronopost-relais')
      }
    } else if (totalWeight > 18 && totalWeight <= 28) {
      // 18.01-28 kg: Domicile uniquement
      if (retraitMode === 'chronopost-relais') {
        console.log(`⚠️ Poids ${totalWeight.toFixed(2)}kg entre 18.01-28kg - Forçage Livraison domicile`)
        setRetraitMode('livraison')
      }
    } else if (totalWeight > 28 && totalWeight <= 38) {
      // 28.01-38 kg: Point relais (2 colis)
      if (retraitMode === 'livraison') {
        console.log(`⚠️ Poids ${totalWeight.toFixed(2)}kg entre 28.01-38kg - Forçage Chronopost Relais (2 colis)`)
        setRetraitMode('chronopost-relais')
      }
    } else if (totalWeight > 38 && totalWeight <= 50) {
      // 38.01-50 kg: Domicile (2 colis)
      if (retraitMode === 'chronopost-relais') {
        console.log(`⚠️ Poids ${totalWeight.toFixed(2)}kg entre 38.01-50kg - Forçage Livraison domicile (2 colis)`)
        setRetraitMode('livraison')
      }
    }
    // >50 kg: pas de forçage, mais blocage affiché ailleurs
  }, [totalWeight, retraitMode, livraisonAddress.pays])
```

## 2. Ligne 1146 : Modifier la condition isAvailable pour "Livraison à domicile"

**Remplacer :**
```typescript
                  const isAvailable = (totalWeight > 18 && totalWeight <= 28) || (totalWeight > 38 && totalWeight <= 50)
```

**Par :**
```typescript
                  const country = livraisonAddress.pays || 'FR'
                  // Domicile disponible : 18.01-28 kg OU 38.01-50 kg, ET seulement pour la France
                  const isAvailable = country === 'FR' && ((totalWeight > 18 && totalWeight <= 28) || (totalWeight > 38 && totalWeight <= 50))
```

## 3. Ligne 1190 : Modifier le message d'erreur

**Remplacer :**
```typescript
                            ? 'Disponible pour les colis de 18 à 28 kg ou de 38 à 50 kg'
```

**Par :**
```typescript
                            ? (country === 'BE' 
                                ? 'Non disponible pour la Belgique (point relais uniquement)'
                                : 'Disponible pour les colis de 18 à 28 kg ou de 38 à 50 kg')
```

## 4. Ligne 1204 : Modifier la condition isAvailable pour "Chronopost Relais"

**Remplacer :**
```typescript
                  const isAvailable = (totalWeight <= 18) || (totalWeight > 28 && totalWeight <= 38)
```

**Par :**
```typescript
                  const country = livraisonAddress.pays || 'FR'
                  // Relais disponible : 0-18 kg OU 28.01-38 kg pour la France, TOUJOURS pour la Belgique
                  const isAvailable = country === 'BE' || (totalWeight <= 18) || (totalWeight > 28 && totalWeight <= 38)
```
