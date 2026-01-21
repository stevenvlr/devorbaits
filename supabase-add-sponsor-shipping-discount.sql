-- ============================================
-- SYSTÈME SPONSOR : TARIFS FIXES EXPÉDITION
-- ============================================
-- Ce script crée une grille tarifaire GLOBALE pour tous les sponsors
-- + un champ is_sponsored dans profiles

-- 1. Ajouter le champ is_sponsored dans profiles (si pas déjà fait)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.is_sponsored IS 'Indique si le membre est sponsorisé (bénéficie des tarifs préférentiels)';

-- Supprimer l'ancienne colonne si elle existe (on utilise maintenant une table globale)
ALTER TABLE profiles DROP COLUMN IF EXISTS sponsor_shipping_rates;

-- 2. Créer la table pour la grille tarifaire sponsor GLOBALE
CREATE TABLE IF NOT EXISTS sponsor_shipping_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_weight DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_weight DECIMAL(10,2), -- NULL = pas de limite
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_is_sponsored ON profiles(is_sponsored) WHERE is_sponsored = true;
CREATE INDEX IF NOT EXISTS idx_sponsor_shipping_rates_weight ON sponsor_shipping_rates(min_weight, max_weight);

-- RLS pour sponsor_shipping_rates
ALTER TABLE sponsor_shipping_rates ENABLE ROW LEVEL SECURITY;

-- Lecture publique (pour le checkout)
CREATE POLICY "Anyone can read sponsor_shipping_rates"
  ON sponsor_shipping_rates FOR SELECT
  USING (true);

-- Seuls les admins peuvent modifier
CREATE POLICY "Admins can manage sponsor_shipping_rates"
  ON sponsor_shipping_rates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. Insérer des tarifs par défaut (si table vide)
INSERT INTO sponsor_shipping_rates (min_weight, max_weight, price)
SELECT * FROM (VALUES
  (0::decimal, 5::decimal, 5.00::decimal),
  (5::decimal, 10::decimal, 8.00::decimal),
  (10::decimal, 20::decimal, 12.00::decimal),
  (20::decimal, NULL::decimal, 15.00::decimal)
) AS default_rates(min_weight, max_weight, price)
WHERE NOT EXISTS (SELECT 1 FROM sponsor_shipping_rates LIMIT 1);

-- 4. Politique RLS pour permettre aux admins de modifier is_sponsored sur profiles
-- (Important : sans ça, l'ajout de sponsors depuis l'admin ne fonctionne pas)
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Vérification
SELECT 'Table sponsor_shipping_rates créée' AS status;
SELECT * FROM sponsor_shipping_rates ORDER BY min_weight;
