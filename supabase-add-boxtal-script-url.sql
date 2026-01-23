-- ============================================
-- Ajouter l'URL du script Boxtal dans boxtal_config
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor

-- Étape 1 : Ajouter la colonne map_script_url si elle n'existe pas
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

-- Étape 2 : Mettre à jour l'URL du script si une ligne existe déjà
-- (Cette commande ne fait rien si la table est vide)
UPDATE boxtal_config
SET 
  map_script_url = 'https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js',
  updated_at = NOW()
WHERE id = (SELECT id FROM boxtal_config LIMIT 1);

-- Étape 3 : Si aucune ligne n'existe, en créer une
-- ⚠️ IMPORTANT : Remplacez 'VOTRE_API_KEY' et 'VOTRE_SECRET_KEY' par vos vraies clés Boxtal
INSERT INTO boxtal_config (
  api_key,
  secret_key,
  map_script_url,
  country_code
)
SELECT 
  'VOTRE_API_KEY',  -- ⚠️ REMPLACEZ par votre vraie clé API Boxtal
  'VOTRE_SECRET_KEY',  -- ⚠️ REMPLACEZ par votre vraie clé secrète Boxtal
  'https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js',
  'FR'
WHERE NOT EXISTS (SELECT 1 FROM boxtal_config);

-- Vérification
SELECT 
  id,
  api_key IS NOT NULL as "API Key présente",
  secret_key IS NOT NULL as "Secret Key présente",
  map_script_url as "URL Script",
  country_code,
  updated_at
FROM boxtal_config;
