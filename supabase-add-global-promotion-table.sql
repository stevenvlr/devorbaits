-- ============================================
-- TABLE GLOBAL_PROMOTION
-- ============================================
-- Cette table permet de gérer une promotion globale sur le site
-- avec choix du pourcentage et sélection des types de produits

CREATE TABLE IF NOT EXISTS global_promotion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  active BOOLEAN DEFAULT false,
  discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  apply_to_all BOOLEAN DEFAULT true,
  -- Si apply_to_all = false, on utilise les filtres ci-dessous
  allowed_categories TEXT[],
  allowed_gammes TEXT[],
  description TEXT,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_global_promotion_active ON global_promotion(active);
CREATE INDEX IF NOT EXISTS idx_global_promotion_dates ON global_promotion(valid_from, valid_until);

-- RLS pour global_promotion
ALTER TABLE global_promotion ENABLE ROW LEVEL SECURITY;

-- Politique : Lecture publique (pour vérifier la promotion active)
CREATE POLICY "Anyone can view active promotion"
  ON global_promotion FOR SELECT
  USING (active = true);

-- Politique : Seuls les admins peuvent gérer la promotion
CREATE POLICY "Admins can manage global promotion"
  ON global_promotion FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Commentaire pour clarifier la table
COMMENT ON TABLE global_promotion IS 
'Stocke la promotion globale du site. Permet de définir un pourcentage de réduction et de choisir si elle s''applique à tout le site ou seulement à certains types de produits.';

COMMENT ON COLUMN global_promotion.active IS 
'Indique si la promotion est active ou non';

COMMENT ON COLUMN global_promotion.discount_percentage IS 
'Pourcentage de réduction (ex: 10.00 pour 10%)';

COMMENT ON COLUMN global_promotion.apply_to_all IS 
'Si true, la promotion s''applique à tout le site. Si false, utilise les filtres allowed_categories et allowed_gammes';

COMMENT ON COLUMN global_promotion.allowed_categories IS 
'Liste des catégories éligibles si apply_to_all = false (ex: ["bouillettes", "huiles"])';

COMMENT ON COLUMN global_promotion.allowed_gammes IS 
'Liste des gammes éligibles si apply_to_all = false (ex: ["Méga Tutti", "Krill Calamar"])';
