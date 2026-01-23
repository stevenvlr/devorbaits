# ✅ Ajouter l'URL du script Boxtal dans Supabase

## ❌ Problème

Vous avez l'erreur : **"null value in column "api_key" violates not-null constraint"**

Cela signifie que la colonne `api_key` est obligatoire (NOT NULL) dans la table `boxtal_config`.

## ✅ Solution : Mettre à jour au lieu d'insérer

Au lieu d'insérer une nouvelle ligne, **mettez à jour la ligne existante** :

### Option 1 : Mettre à jour si une ligne existe déjà (RECOMMANDÉ)

```sql
-- Mettre à jour l'URL du script dans la ligne existante
UPDATE boxtal_config
SET 
  map_script_url = 'https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js',
  updated_at = NOW();
```

**Cette commande fonctionne même s'il y a plusieurs lignes** (elle met à jour toutes les lignes).

### Option 2 : Ajouter la colonne puis mettre à jour

```sql
-- 1. Ajouter la colonne si elle n'existe pas
ALTER TABLE boxtal_config 
ADD COLUMN IF NOT EXISTS map_script_url TEXT;

-- 2. Mettre à jour l'URL
UPDATE boxtal_config
SET 
  map_script_url = 'https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js',
  updated_at = NOW();
```

### Option 3 : Si la table est vraiment vide

Si la table `boxtal_config` est complètement vide, vous devez d'abord avoir vos clés Boxtal :

1. **Récupérez vos clés Boxtal** depuis votre compte Boxtal
2. **Insérez une ligne complète** :

```sql
INSERT INTO boxtal_config (
  api_key,
  secret_key,
  map_script_url,
  country_code
)
VALUES (
  'VOTRE_API_KEY',  -- Remplacez par votre vraie clé API
  'VOTRE_SECRET_KEY',  -- Remplacez par votre vraie clé secrète
  'https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js',
  'FR'
);
```

## 📝 Étapes simples (si vous avez déjà une ligne)

1. Allez dans **Supabase > SQL Editor**
2. Exécutez ce script :

```sql
-- Ajouter la colonne si elle n'existe pas
ALTER TABLE boxtal_config 
ADD COLUMN IF NOT EXISTS map_script_url TEXT;

-- Mettre à jour l'URL
UPDATE boxtal_config
SET 
  map_script_url = 'https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js',
  updated_at = NOW();
```

3. **Vérifiez** :

```sql
SELECT map_script_url FROM boxtal_config;
```

## ✅ Après configuration

1. **Commitez les changements du code** :
   ```bash
   git add components/BoxtalRelayMap.tsx
   git commit -m "Récupération URL script Boxtal depuis Supabase"
   git push
   ```

2. **Le site récupérera automatiquement l'URL** depuis Supabase au prochain chargement

## 🔄 URLs alternatives à tester

Si l'URL par défaut ne fonctionne pas, mettez à jour avec une autre :

```sql
UPDATE boxtal_config
SET map_script_url = 'https://cdn.jsdelivr.net/npm/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js'
WHERE map_script_url IS NOT NULL;
```

J'ai créé le fichier `supabase-add-boxtal-script-url.sql` avec un script complet que vous pouvez exécuter.
