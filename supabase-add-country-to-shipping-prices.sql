-- ============================================
-- Ajouter le champ country à shipping_prices
-- ============================================
-- Permet de différencier les tarifs par pays (FR, BE, etc.)

-- Ajouter la colonne country si elle n'existe pas
ALTER TABLE shipping_prices
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'FR' CHECK (country IN ('FR', 'BE', 'ALL'));

-- Mettre à jour les tarifs existants pour qu'ils soient valides pour la France par défaut
UPDATE shipping_prices
  SET country = 'FR'
  WHERE country IS NULL OR country = '';

-- Créer un index pour accélérer les recherches par pays
CREATE INDEX IF NOT EXISTS idx_shipping_prices_country ON shipping_prices(country);

-- Commentaire sur la colonne
COMMENT ON COLUMN shipping_prices.country IS 'Code pays: FR (France), BE (Belgique), ALL (Tous les pays)';
