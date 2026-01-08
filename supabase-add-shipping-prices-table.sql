-- ============================================
-- TABLE SHIPPING_PRICES - Tarifs d'expédition personnalisés
-- ============================================
-- Cette table permet de gérer les tarifs d'expédition depuis l'interface admin
-- Vous pouvez définir des tarifs fixes, des marges, ou des surcharges

CREATE TABLE IF NOT EXISTS shipping_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- Nom du tarif (ex: "Livraison Standard")
  type TEXT NOT NULL CHECK (type IN ('fixed', 'margin_percent', 'margin_fixed', 'weight_ranges', 'boxtal_only')),
  -- fixed: Prix fixe pour tous les envois
  -- margin_percent: Marge en pourcentage sur le prix Boxtal
  -- margin_fixed: Marge fixe en euros sur le prix Boxtal
  -- weight_ranges: Tarifs par tranches de poids
  -- boxtal_only: Utiliser uniquement le prix Boxtal (pas de modification)
  
  -- Pour type = 'fixed'
  fixed_price DECIMAL(10,2),
  
  -- Pour type = 'margin_percent'
  margin_percent DECIMAL(5,2), -- Ex: 10.00 pour 10%
  
  -- Pour type = 'margin_fixed'
  margin_fixed DECIMAL(10,2), -- Ex: 2.50 pour +2.50€
  
  -- Pour type = 'weight_ranges' (stocké en JSON)
  weight_ranges JSONB, -- Ex: [{"min": 0, "max": 0.5, "price": 4.50}, {"min": 0.5, "max": 1, "price": 5.50}]
  
  active BOOLEAN DEFAULT true,
  min_weight DECIMAL(10,2) DEFAULT 0,
  max_weight DECIMAL(10,2), -- NULL = pas de limite
  min_order_value DECIMAL(10,2), -- Prix minimum de commande pour appliquer ce tarif
  free_shipping_threshold DECIMAL(10,2), -- Livraison gratuite si commande >= ce montant
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour shipping_prices
ALTER TABLE shipping_prices ENABLE ROW LEVEL SECURITY;

-- Politique : Seuls les admins peuvent gérer les tarifs
CREATE POLICY "Admins can manage shipping_prices"
  ON shipping_prices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique : Lecture publique pour le calcul des prix
CREATE POLICY "Anyone can view active shipping_prices"
  ON shipping_prices FOR SELECT
  USING (active = true);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_shipping_prices_updated_at
  BEFORE UPDATE ON shipping_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer un tarif par défaut (utiliser uniquement Boxtal)
INSERT INTO shipping_prices (
  name,
  type,
  active,
  free_shipping_threshold
)
VALUES (
  'Tarif Boxtal Standard',
  'boxtal_only',
  true,
  100.00 -- Livraison gratuite à partir de 100€
)
ON CONFLICT DO NOTHING;






