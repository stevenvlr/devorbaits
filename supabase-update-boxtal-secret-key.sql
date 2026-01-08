-- ============================================
-- METTRE À JOUR LA CLÉ SECRÈTE BOXTAL
-- ============================================
-- Ce script met à jour la clé secrète (api_secret) Boxtal dans Supabase
-- Exécutez ce script dans Supabase SQL Editor

-- Mettre à jour la clé secrète
UPDATE boxtal_config
SET 
  api_secret = '9d8f7e6c5b4a3f2e1d0c',
  updated_at = NOW()
WHERE id IN (SELECT id FROM boxtal_config LIMIT 1);

-- Si aucune configuration n'existe, en créer une avec la nouvelle clé secrète
-- (Vous devrez remplir les autres champs manuellement via l'interface admin)
INSERT INTO boxtal_config (
  api_key,
  api_secret,
  environment
)
SELECT 
  'VOTRE_CLE_API_ICI',  -- Remplacez par votre clé API
  '9d8f7e6c5b4a3f2e1d0c',
  'test'
WHERE NOT EXISTS (SELECT 1 FROM boxtal_config);

-- Afficher la configuration mise à jour
SELECT 
  id,
  api_key,
  api_secret,
  environment,
  updated_at
FROM boxtal_config
ORDER BY updated_at DESC
LIMIT 1;



