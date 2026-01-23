-- ============================================
-- FIX: Ajout / gestion des codes promo depuis l'admin
-- ============================================
-- À exécuter dans Supabase Dashboard > SQL Editor
--
-- Objectif:
-- 1) Ajouter profiles.role (si absent) pour gérer admin/user
-- 2) Ajouter promo_codes.updated_at (si absent)
-- 3) Autoriser via RLS: lecture publique des codes actifs, et gestion complète par les admins
--
-- IMPORTANT:
-- - Ensuite, mettre votre compte en admin: UPDATE profiles SET role = 'admin' WHERE email = '...';
--

-- 1) Assurer la colonne role dans profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- (optionnel) normaliser les valeurs existantes
UPDATE public.profiles
SET role = COALESCE(NULLIF(role, ''), 'user')
WHERE role IS NULL OR role = '';

-- 2) Assurer updated_at dans promo_codes (utile pour l'UI)
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3) Trigger: mettre à jour updated_at automatiquement sur UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_promo_codes_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_promo_codes_set_updated_at
      BEFORE UPDATE ON public.promo_codes
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 4) RLS policies pour promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Nettoyer d'anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admins can view all promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;

-- Lecture publique: seulement les codes actifs
CREATE POLICY "Anyone can view active promo codes"
  ON public.promo_codes
  FOR SELECT
  USING (active = true);

-- Lecture admin: tout voir (actifs + inactifs)
CREATE POLICY "Admins can view all promo codes"
  ON public.promo_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    )
  );

-- Gestion admin: INSERT/UPDATE/DELETE
CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    )
  );

-- 5) Aide: mettre un compte en admin (modifiez l'email)
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'votre-email@exemple.com';

SELECT 'OK: promo_codes RLS admin + profiles.role + updated_at' AS status;

