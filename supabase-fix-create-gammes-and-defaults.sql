-- ============================================
-- FIX: Créer la table gammes + champ hidden + gammes par défaut
-- ============================================
-- À coller/exécuter dans Supabase > SQL Editor
--
-- Ce script est volontairement "robuste" :
-- - crée l'extension pgcrypto (pour gen_random_uuid)
-- - crée la table gammes si absente
-- - ajoute la colonne hidden si absente
-- - insère les gammes par défaut (dont Méga Tutti / Mure Cassis / Thon Curry)

-- 0) UUID helper (Supabase l'a généralement déjà, mais on sécurise)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Table gammes
CREATE TABLE IF NOT EXISTS public.gammes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2) Si la table existait déjà sans hidden
ALTER TABLE public.gammes
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- 3) Activer RLS (lecture publique). L'écriture peut être gérée plus tard selon ton setup admin.
ALTER TABLE public.gammes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Policy SELECT publique (si pas déjà là)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gammes'
      AND policyname = 'Anyone can view gammes'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view gammes" ON public.gammes FOR SELECT USING (true);';
  END IF;
END $$;

-- 4) Insérer les gammes par défaut
INSERT INTO public.gammes (name, hidden)
VALUES
  ('Méga Tutti', false),
  ('Krill Calamar', false),
  ('Red Devil', false),
  ('Robin Red Vers de vase', false),
  ('Mure Cassis', false),
  ('Thon Curry', false)
ON CONFLICT (name) DO NOTHING;

-- 5) Vérification (doit retourner au moins ces 3 lignes)
SELECT name, hidden, created_at, updated_at
FROM public.gammes
WHERE name IN ('Méga Tutti', 'Mure Cassis', 'Thon Curry')
ORDER BY name;

