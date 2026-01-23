# ✅ Guide : Configurer Boxtal pour les points relais

## 🎯 Modifications effectuées

J'ai restauré l'utilisation de Boxtal dans votre code :
- ✅ `BoxtalRelayMap` est maintenant utilisé dans `app/checkout/page.tsx`
- ✅ La logique de sauvegarde des points relais Boxtal est restaurée
- ✅ L'affichage du point relais sélectionné fonctionne avec Boxtal

## ⚠️ Problème : Script Boxtal non chargé

Le script Boxtal ne se charge pas car l'URL CDN par défaut n'existe pas :
- ❌ `https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js` → **Not Found**

## 🔧 Solutions possibles

### Solution 1 : Configurer l'URL dans Supabase (RECOMMANDÉ)

Le composant récupère l'URL du script depuis Supabase. Vous devez configurer une URL valide :

1. **Allez dans Supabase > SQL Editor**
2. **Exécutez ce script** :

```sql
-- Ajouter la colonne si elle n'existe pas
ALTER TABLE boxtal_config 
ADD COLUMN IF NOT EXISTS map_script_url TEXT;

-- Mettre à jour avec une URL alternative
UPDATE boxtal_config
SET 
  map_script_url = 'https://cdn.jsdelivr.net/npm/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js',
  updated_at = NOW();
```

3. **Si ça ne fonctionne toujours pas**, essayez ces URLs alternatives :

```sql
-- Option 1 : jsDelivr avec index.js
UPDATE boxtal_config
SET map_script_url = 'https://cdn.jsdelivr.net/npm/@boxtal/parcel-point-map@0.0.7/dist/index.js';

-- Option 2 : unpkg avec index.js
UPDATE boxtal_config
SET map_script_url = 'https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.js';

-- Option 3 : Version différente
UPDATE boxtal_config
SET map_script_url = 'https://unpkg.com/@boxtal/parcel-point-map@0.0.6/dist/index.umd.js';
```

### Solution 2 : Utiliser le package npm directement (MEILLEURE SOLUTION)

Au lieu d'utiliser un script externe, installez le package npm :

1. **Installez le package** :
```bash
npm install @boxtal/parcel-point-map
```

2. **Modifiez `components/BoxtalRelayMap.tsx`** pour importer directement :
```typescript
import { BoxtalParcelPointMap } from '@boxtal/parcel-point-map'
```

Cette solution nécessite de refactoriser le composant, mais c'est la méthode recommandée par Boxtal.

### Solution 3 : Contacter le support Boxtal

Si aucune URL CDN ne fonctionne, contactez le support Boxtal pour obtenir :
- L'URL officielle du script JavaScript
- Ou les instructions pour intégrer le package npm

## 📝 Vérification

Après avoir configuré l'URL dans Supabase :

1. **Commitez et poussez les changements** :
```bash
git add app/checkout/page.tsx
git commit -m "Restaurer utilisation Boxtal pour points relais"
git push
```

2. **Vérifiez dans la console du navigateur** :
   - Ouvrez votre site en production
   - Allez sur la page checkout
   - Sélectionnez "Point relais"
   - Ouvrez la console (F12)
   - Cherchez les messages :
     - `✅ URL script Boxtal récupérée depuis Supabase: ...`
     - `✅ Script Boxtal chargé depuis: ...`
     - Ou `❌ Erreur chargement script Boxtal: ...`

## 🔍 Diagnostic

Si le script ne se charge toujours pas :

1. **Vérifiez l'URL dans Supabase** :
```sql
SELECT map_script_url FROM boxtal_config;
```

2. **Testez l'URL directement** :
   - Ouvrez l'URL dans votre navigateur
   - Si vous voyez du code JavaScript → L'URL est valide
   - Si vous voyez "Not Found" → L'URL est invalide

3. **Vérifiez la console du navigateur** :
   - Regardez les erreurs réseau (onglet Network)
   - Cherchez les requêtes vers l'URL du script
   - Vérifiez le code de réponse (404, 200, etc.)

## ✅ Prochaines étapes

1. Configurez l'URL dans Supabase (Solution 1)
2. Testez en production
3. Si ça ne fonctionne pas, contactez le support Boxtal ou utilisez la Solution 2 (package npm)

---

**Note** : Le package `@boxtal/parcel-point-map` est conçu pour être utilisé via un bundler (webpack, vite, etc.), pas via un script tag CDN. C'est pourquoi les URLs CDN peuvent ne pas fonctionner.
