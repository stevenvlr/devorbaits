-- ============================================
-- FIX: Autoriser l'admin à lire tous les profils (table profiles)
-- ============================================
-- À exécuter dans Supabase Dashboard > SQL Editor
--
-- Objectif:
-- - Conserver l'accès normal (un utilisateur lit son profil)
-- - Ajouter un accès admin: lecture de tous les profils
--
-- Prérequis:
-- - Avoir une colonne profiles.role ('user' / 'admin')
-- - Mettre votre compte en admin:
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'votre-email@exemple.com';
--

-- 1) Assurer la colonne role dans profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

UPDATE public.profiles
SET role = COALESCE(NULLIF(role, ''), 'user')
WHERE role IS NULL OR role = '';

-- 2) Activer RLS (si pas déjà fait)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3) Policy: admin peut lire tous les profils
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Note:
-- On ne supprime pas les policies existantes "Users can view own profile".
-- Les policies s'additionnent: un user voit son profil, un admin voit tout.

SELECT 'OK: profiles admin SELECT policy added' AS status;

