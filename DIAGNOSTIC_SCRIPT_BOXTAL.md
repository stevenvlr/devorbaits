# 🔍 Diagnostic : Erreur "Impossible de charger le script Boxtal"

## ❌ Problème

Vous voyez toujours l'erreur "Impossible de charger le script Boxtal" même après avoir configuré l'URL dans Supabase.

## 🔍 Diagnostic à faire

### Étape 1 : Vérifier dans la console du navigateur

1. Ouvrez votre site : `https://6b67fd8b.devorbaits.pages.dev`
2. Ouvrez la console du navigateur (F12)
3. Allez sur la page checkout et sélectionnez "Point relais Chronopost"
4. Regardez les messages dans la console :

**Messages à chercher :**
- `✅ URL script Boxtal récupérée depuis Supabase: ...`
- `✅ Script Boxtal chargé depuis: ...`
- `🔍 Vérification window.BoxtalParcelPointMap: ...`
- `❌ Erreur chargement script Boxtal: ...`

### Étape 2 : Vérifier dans l'onglet Network

1. Dans la console, allez dans l'onglet **Network** (Réseau)
2. Filtrez par **JS**
3. Cherchez une requête vers `boxtal` ou `parcel-point-map`
4. Cliquez sur la requête et regardez :
   - **Status** : 200 (OK) ou 404 (Not Found) ?
   - **Response** : Le fichier JavaScript est-il chargé ?

### Étape 3 : Tester l'URL directement

1. Ouvrez un nouvel onglet
2. Collez l'URL : `https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js`
3. Voyez si le fichier se charge (vous devriez voir du code JavaScript)

## ✅ Solutions possibles

### Solution 1 : L'URL n'est pas accessible

Si l'URL retourne 404 ou une erreur, essayez une autre URL dans Supabase :

```sql
UPDATE boxtal_config
SET map_script_url = 'https://cdn.jsdelivr.net/npm/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js'
WHERE map_script_url IS NOT NULL;
```

### Solution 2 : Le script se charge mais l'API n'est pas disponible

Si le script se charge (200 OK) mais `window.BoxtalParcelPointMap` n'existe pas, cela signifie que :
- Le package npm n'expose pas de build UMD compatible
- Il faut utiliser le package npm directement dans le build

**Solution alternative** : Utiliser uniquement le widget Chronopost officiel (sans Boxtal)

### Solution 3 : Problème de CORS

Si vous voyez une erreur CORS, le CDN peut bloquer les requêtes. Dans ce cas, il faut :
- Utiliser le package npm directement
- Ou contacter Boxtal pour obtenir une URL officielle

## 🔄 Alternative : Utiliser uniquement le widget Chronopost

Si Boxtal continue de poser problème, vous pouvez utiliser uniquement le widget Chronopost officiel qui fonctionne déjà.

**Dites-moi ce que vous voyez dans la console du navigateur** et je vous aiderai à résoudre le problème spécifique.
