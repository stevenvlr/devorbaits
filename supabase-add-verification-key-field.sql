-- ============================================
-- AJOUTER LE CHAMP VERIFICATION_KEY
-- ============================================
-- Ce script ajoute le champ verification_key à la table boxtal_config
-- Exécutez ce script dans Supabase SQL Editor

-- Ajouter la colonne verification_key si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'boxtal_config' 
    AND column_name = 'verification_key'
  ) THEN
    ALTER TABLE boxtal_config 
    ADD COLUMN verification_key TEXT;
    
    RAISE NOTICE 'Colonne verification_key ajoutée avec succès';
  ELSE
    RAISE NOTICE 'La colonne verification_key existe déjà';
  END IF;
END $$;

-- Vérifier que la colonne a été ajoutée
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'boxtal_config'
AND column_name = 'verification_key';



