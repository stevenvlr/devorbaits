-- ============================================
-- CORRIGER LA TABLE STOCK
-- ============================================
-- Ce script corrige la table stock pour permettre les mises à jour
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Ajouter la contrainte UNIQUE si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stock_product_variant_location_unique'
  ) THEN
    ALTER TABLE stock 
    ADD CONSTRAINT stock_product_variant_location_unique 
    UNIQUE (product_id, variant_id, location);
    
    RAISE NOTICE 'Contrainte UNIQUE ajoutée à la table stock';
  ELSE
    RAISE NOTICE 'Contrainte UNIQUE existe déjà';
  END IF;
END $$;

-- 2. Vérifier et créer les politiques RLS pour permettre l'écriture
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can manage stock" ON stock;
DROP POLICY IF EXISTS "Admins can manage stock" ON stock;
DROP POLICY IF EXISTS "Service role can manage stock" ON stock;

-- Politique pour la lecture (publique)
DROP POLICY IF EXISTS "Anyone can view stock" ON stock;
CREATE POLICY "Anyone can view stock"
  ON stock FOR SELECT
  USING (true);

-- Politique pour l'écriture (admin uniquement)
-- Note: Cette politique nécessite que l'utilisateur soit admin dans la table profiles
CREATE POLICY "Admins can manage stock"
  ON stock FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Alternative: Si vous utilisez le service role key côté serveur,
-- vous pouvez aussi créer une politique qui permet l'écriture pour tous
-- (mais ce n'est pas recommandé pour la sécurité)
-- Décommentez seulement si vous savez ce que vous faites :
-- CREATE POLICY "Service can manage stock"
--   ON stock FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- 3. Vérifier la structure de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stock'
ORDER BY ordinal_position;

-- 4. Vérifier les contraintes
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'stock'::regclass;

-- 5. Vérifier les politiques RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'stock';



