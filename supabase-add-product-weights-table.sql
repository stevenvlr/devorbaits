-- ============================================
-- TABLE PRODUCT_WEIGHTS - Poids des produits pour l'expédition
-- ============================================
-- Cette table stocke les poids des produits pour calculer
-- les frais d'expédition de manière précise

CREATE TABLE IF NOT EXISTS product_weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Type de produit (bouillette, spray, etc.)
  product_type TEXT NOT NULL,
  
  -- Conditionnement (pour les bouillettes: 1kg, 2.5kg, 5kg, 10kg)
  conditionnement TEXT,
  
  -- Poids en KG (incluant l'emballage)
  weight_kg DECIMAL(10, 3) NOT NULL,
  
  -- Description pour l'admin
  description TEXT,
  
  -- Actif ou non
  active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte d'unicité sur type + conditionnement
  UNIQUE(product_type, conditionnement)
);

-- RLS pour product_weights
ALTER TABLE product_weights ENABLE ROW LEVEL SECURITY;

-- Politique : Lecture publique (nécessaire pour le calcul des frais)
CREATE POLICY "Anyone can view product_weights"
  ON product_weights FOR SELECT
  USING (true);

-- Politique : Seuls les admins peuvent modifier
CREATE POLICY "Admins can manage product_weights"
  ON product_weights FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_product_weights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_weights_updated_at
  BEFORE UPDATE ON product_weights
  FOR EACH ROW
  EXECUTE FUNCTION update_product_weights_updated_at();

-- ============================================
-- INSERTION DES POIDS PAR DÉFAUT
-- ============================================

-- Bouillettes (conditionnement + 10% emballage)
INSERT INTO product_weights (product_type, conditionnement, weight_kg, description) VALUES
  ('bouillette', '1kg', 1.1, 'Bouillettes 1kg (avec emballage +10%)'),
  ('bouillette', '2.5kg', 2.75, 'Bouillettes 2.5kg (avec emballage +10%)'),
  ('bouillette', '5kg', 5.5, 'Bouillettes 5kg (avec emballage +10%)'),
  ('bouillette', '10kg', 11.0, 'Bouillettes 10kg (avec emballage +10%)')
ON CONFLICT (product_type, conditionnement) DO UPDATE SET
  weight_kg = EXCLUDED.weight_kg,
  description = EXCLUDED.description;

-- Pop-ups et équilibrées
INSERT INTO product_weights (product_type, conditionnement, weight_kg, description) VALUES
  ('pop-up duo', NULL, 0.055, 'Pop-up Duo (55g avec emballage)'),
  ('bar à pop-up', NULL, 0.075, 'Bar à Pop-up (75g avec emballage)'),
  ('equilibre', NULL, 0.110, 'Équilibrées (110g avec emballage)')
ON CONFLICT (product_type, conditionnement) DO UPDATE SET
  weight_kg = EXCLUDED.weight_kg,
  description = EXCLUDED.description;

-- Sprays et boosts
INSERT INTO product_weights (product_type, conditionnement, weight_kg, description) VALUES
  ('flash boost', NULL, 0.150, 'Flash Boost (150g avec emballage)'),
  ('spray plus', NULL, 0.100, 'Spray Plus (100g avec emballage)')
ON CONFLICT (product_type, conditionnement) DO UPDATE SET
  weight_kg = EXCLUDED.weight_kg,
  description = EXCLUDED.description;

-- Liquides
INSERT INTO product_weights (product_type, conditionnement, weight_kg, description) VALUES
  ('booster', NULL, 0.700, 'Booster liquide (700g avec emballage)'),
  ('huile', NULL, 0.700, 'Huiles et liquides 500ml (700g avec emballage)'),
  ('liquide', NULL, 0.700, 'Liquides 500ml (700g avec emballage)')
ON CONFLICT (product_type, conditionnement) DO UPDATE SET
  weight_kg = EXCLUDED.weight_kg,
  description = EXCLUDED.description;

-- Stick mix et farines
INSERT INTO product_weights (product_type, conditionnement, weight_kg, description) VALUES
  ('stick mix', NULL, 1.1, 'Stick Mix 1kg (avec emballage)'),
  ('farine', '1kg', 1.1, 'Farine 1kg (avec emballage)'),
  ('farine', '500g', 0.580, 'Farine 500g (580g avec emballage)'),
  ('bird food', NULL, 1.1, 'Bird Food 1kg (avec emballage)'),
  ('robin red', NULL, 0.580, 'Robin Red 500g (580g avec emballage)')
ON CONFLICT (product_type, conditionnement) DO UPDATE SET
  weight_kg = EXCLUDED.weight_kg,
  description = EXCLUDED.description;

-- ============================================
-- VÉRIFICATION
-- ============================================
-- SELECT * FROM product_weights ORDER BY product_type, conditionnement;
