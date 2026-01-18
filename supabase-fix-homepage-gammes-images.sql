-- ============================================
-- FIX: Autoriser l’enregistrement des images
--      - Photo d’accueil (homepage-image)
--      - Photos des gammes (gamme-image)
-- dans la table popup_variables
-- ============================================
-- À exécuter dans Supabase > SQL Editor

-- 1) Voir les policies existantes sur popup_variables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'popup_variables'
ORDER BY policyname;

-- 2) Policy admin spécifique (recommandée)
-- Permet aux comptes admin (profiles.role = 'admin') de gérer UNIQUEMENT ces 2 catégories.
CREATE POLICY IF NOT EXISTS "Admins can manage homepage and gamme images"
  ON popup_variables
  FOR ALL
  USING (
    category IN ('homepage-image', 'gamme-image')
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    category IN ('homepage-image', 'gamme-image')
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3) Vérifier que les lignes s’écrivent bien après un upload dans l’admin
-- Photo d’accueil:
SELECT id, category, value, metadata, created_at, updated_at
FROM popup_variables
WHERE category = 'homepage-image'
ORDER BY updated_at DESC
LIMIT 10;

-- Images des gammes:
SELECT id, category, value, metadata, created_at, updated_at
FROM popup_variables
WHERE category = 'gamme-image'
ORDER BY updated_at DESC
LIMIT 50;

