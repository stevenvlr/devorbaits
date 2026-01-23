-- ============================================
-- FIX: Autoriser l'enregistrement des images de gammes
--      (category = 'gamme-image') dans popup_variables
-- ============================================
-- Objectif:
-- - Quand vous uploadez une photo de gamme dans /admin/gammes,
--   l'app fait un INSERT/UPDATE dans popup_variables.
-- - Si RLS/policies bloquent, aucune ligne n'apparait et la photo ne se sauvegarde pas.
--
-- À exécuter dans Supabase > SQL Editor
--
-- Ce script crée une policy simple qui autorise tout utilisateur authentifié
-- à gérer UNIQUEMENT ces catégories:
-- - 'homepage-image'
-- - 'gamme-image'
--
-- (Alternative plus stricte possible: baser sur profiles.role='admin' comme dans
--  supabase-fix-homepage-gammes-images.sql)

-- 0) Vérifier les policies existantes sur popup_variables
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

-- 1) Créer une policy permissive ciblée (authentifié uniquement)
CREATE POLICY IF NOT EXISTS "Authenticated users can manage homepage and gamme images"
  ON popup_variables
  FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND category IN ('homepage-image', 'gamme-image')
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND category IN ('homepage-image', 'gamme-image')
  );

-- 2) Vérifier que les lignes apparaissent après un upload
-- Images des gammes:
SELECT id, category, value, metadata, created_at, updated_at
FROM popup_variables
WHERE category = 'gamme-image'
ORDER BY updated_at DESC
LIMIT 50;

-- 3) Vérifier que les 3 gammes existent bien dans la table gammes
SELECT name, hidden, created_at, updated_at
FROM gammes
WHERE name IN ('Méga Tutti', 'Mure Cassis', 'Thon Curry')
ORDER BY name;

