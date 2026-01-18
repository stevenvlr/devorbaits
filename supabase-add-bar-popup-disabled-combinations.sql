-- ============================================
-- TABLE BAR_POPUP_DISABLED_COMBINATIONS
-- ============================================
-- Cette table permet de désactiver certaines combinaisons taille/couleur pour le bar à pop-up

CREATE TABLE IF NOT EXISTS bar_popup_disabled_combinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couleur_name TEXT NOT NULL,
  taille TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(couleur_name, taille)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_bar_popup_disabled_couleur ON bar_popup_disabled_combinations(couleur_name);
CREATE INDEX IF NOT EXISTS idx_bar_popup_disabled_taille ON bar_popup_disabled_combinations(taille);

-- RLS pour bar_popup_disabled_combinations
ALTER TABLE bar_popup_disabled_combinations ENABLE ROW LEVEL SECURITY;

-- Politique : Lecture publique (pour vérifier les combinaisons désactivées)
CREATE POLICY "Anyone can view disabled combinations"
  ON bar_popup_disabled_combinations FOR SELECT
  USING (true);

-- Politique : Seuls les admins peuvent gérer les combinaisons désactivées
CREATE POLICY "Admins can manage disabled combinations"
  ON bar_popup_disabled_combinations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Commentaire pour clarifier la table
COMMENT ON TABLE bar_popup_disabled_combinations IS 
'Stocke les combinaisons taille/couleur désactivées pour le bar à pop-up. Ces combinaisons ne seront pas disponibles à la sélection.';

COMMENT ON COLUMN bar_popup_disabled_combinations.couleur_name IS 
'Nom de la couleur (ex: "Jaune fluo", "Rose pastel")';

COMMENT ON COLUMN bar_popup_disabled_combinations.taille IS 
'Taille désactivée pour cette couleur (ex: "20mm", "15mm")';
