# ✅ Configurer l'URL du script Boxtal dans Supabase

## 🎯 Objectif

L'URL du script Boxtal est maintenant récupérée depuis Supabase (table `boxtal_config`) au lieu d'une variable d'environnement.

## 📝 Comment ajouter l'URL dans Supabase

### Étape 1 : Vérifier que la table existe

1. Allez sur **https://app.supabase.com**
2. Sélectionnez votre projet
3. Allez dans **Table Editor** (Éditeur de tables)
4. Cherchez la table **`boxtal_config`**

### Étape 2 : Vérifier les colonnes

La table `boxtal_config` doit avoir une colonne pour l'URL du script. Si elle n'existe pas, ajoutez-la :

**Option A : Colonne `map_script_url`** (recommandé)
**Option B : Colonne `script_url`**

### Étape 3 : Ajouter la colonne si elle n'existe pas

Si la colonne n'existe pas, exécutez ce script SQL dans **SQL Editor** :

```sql
-- Ajouter la colonne map_script_url si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'boxtal_config' 
    AND column_name = 'map_script_url'
  ) THEN
    ALTER TABLE boxtal_config 
    ADD COLUMN map_script_url TEXT;
    
    RAISE NOTICE 'Colonne map_script_url ajoutée avec succès';
  ELSE
    RAISE NOTICE 'La colonne map_script_url existe déjà';
  END IF;
END $$;
```

### Étape 4 : Insérer ou mettre à jour l'URL

**Si la table est vide**, insérez une ligne :

```sql
INSERT INTO boxtal_config (map_script_url)
VALUES ('https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js')
ON CONFLICT DO NOTHING;
```

**Si la table a déjà une ligne**, mettez à jour :

```sql
UPDATE boxtal_config
SET map_script_url = 'https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js'
WHERE id = (SELECT id FROM boxtal_config LIMIT 1);
```

### Étape 5 : Vérifier

Vérifiez que l'URL est bien enregistrée :

```sql
SELECT map_script_url, script_url FROM boxtal_config;
```

## 🔄 URLs possibles à tester

Si l'URL par défaut ne fonctionne pas, essayez ces alternatives :

1. **unpkg (UMD)** :
   ```
   https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js
   ```

2. **jsDelivr (UMD)** :
   ```
   https://cdn.jsdelivr.net/npm/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js
   ```

3. **unpkg (index.js)** :
   ```
   https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.js
   ```

4. **jsDelivr (index.js)** :
   ```
   https://cdn.jsdelivr.net/npm/@boxtal/parcel-point-map@0.0.7/dist/index.js
   ```

## ⚠️ Si vous avez l'URL officielle Boxtal

Si vous avez une URL officielle depuis votre compte Boxtal, utilisez-la à la place des URLs CDN.

## ✅ Après configuration

1. **L'URL sera récupérée automatiquement** depuis Supabase au chargement du composant
2. **Le script se chargera** avec l'URL configurée
3. **Plus besoin de variable d'environnement** `NEXT_PUBLIC_BOXTAL_MAP_SCRIPT_SRC` dans `wrangler.toml`

## 📋 Résumé

- ✅ L'URL est maintenant dans Supabase (table `boxtal_config`)
- ✅ Le composant récupère automatiquement l'URL au chargement
- ✅ Fallback vers l'URL par défaut si non trouvée dans Supabase
- ✅ Plus besoin de variable d'environnement pour l'URL du script
