-- ============================================
-- Promo codes: 1 utilisation par compte (user)
-- ============================================
-- À exécuter dans Supabase > SQL Editor
--
-- Objectif:
-- - Empêcher qu'un même utilisateur réutilise le même code promo
-- - Permettre l'INSERT par l'utilisateur connecté (RLS) dans promo_code_usage
--
-- Remarque:
-- - On utilise un index UNIQUE partiel (WHERE user_id IS NOT NULL) pour éviter
--   de casser d'éventuelles lignes historiques avec user_id = NULL.

-- 1) Table (au cas où elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  order_id UUID,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assurer l'existence du compteur global (utile pour max_uses côté client)
ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;

-- 2) Index pour accélérer les vérifications
CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_user ON promo_code_usage(user_id);

-- 3) Contrainte: 1 seule utilisation par user et par code promo
--    (partiel pour ignorer user_id NULL)
CREATE UNIQUE INDEX IF NOT EXISTS promo_code_usage_one_per_user
  ON promo_code_usage(promo_code_id, user_id)
  WHERE user_id IS NOT NULL;

-- 4) RLS + policies (sécurisé)
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Lecture: l'utilisateur peut voir SES utilisations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'promo_code_usage'
      AND policyname = 'Users can view own promo code usage'
  ) THEN
    CREATE POLICY "Users can view own promo code usage"
      ON promo_code_usage FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Insertion: l'utilisateur ne peut enregistrer que SES utilisations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'promo_code_usage'
      AND policyname = 'Users can insert own promo code usage'
  ) THEN
    CREATE POLICY "Users can insert own promo code usage"
      ON promo_code_usage FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 5) Trigger: incrémenter promo_codes.used_count à chaque utilisation enregistrée
CREATE OR REPLACE FUNCTION increment_promo_code_used_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE promo_codes
    SET used_count = COALESCE(used_count, 0) + 1
    WHERE id = NEW.promo_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_increment_promo_code_used_count'
  ) THEN
    CREATE TRIGGER trg_increment_promo_code_used_count
      AFTER INSERT ON promo_code_usage
      FOR EACH ROW
      EXECUTE FUNCTION increment_promo_code_used_count();
  END IF;
END $$;

