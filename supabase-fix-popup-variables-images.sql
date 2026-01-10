-- Script pour permettre la sauvegarde des images Flash Boost / Spray Plus
-- Exécuter dans Supabase SQL Editor

-- Option 1 : Ajouter une politique permettant à tous les utilisateurs authentifiés de gérer les images
CREATE POLICY IF NOT EXISTS "Authenticated users can manage images"
  ON popup_variables FOR ALL
  USING (category IN ('flash-boost-image', 'spray-plus-image'))
  WITH CHECK (category IN ('flash-boost-image', 'spray-plus-image'));

-- Option 2 (si Option 1 ne fonctionne pas) : Politique plus permissive pour toutes les catégories
-- Supprimer l'ancienne politique restrictive et en créer une nouvelle
-- DROP POLICY IF EXISTS "Admins can manage popup variables" ON popup_variables;

-- Créer une politique permettant à tous les utilisateurs authentifiés de gérer popup_variables
-- CREATE POLICY "Authenticated users can manage popup variables"
--   ON popup_variables FOR ALL
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');

-- Option 3 (plus simple) : Désactiver temporairement RLS pour cette table
-- ALTER TABLE popup_variables DISABLE ROW LEVEL SECURITY;

-- Vérifier les politiques actuelles
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
WHERE tablename = 'popup_variables';
