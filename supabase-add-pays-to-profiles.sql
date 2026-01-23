-- ============================================
-- Ajouter le champ pays à profiles
-- ============================================
-- Permet de stocker le pays de l'utilisateur (FR, BE, etc.)

-- Ajouter la colonne pays si elle n'existe pas
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pays TEXT DEFAULT 'FR' CHECK (pays IN ('FR', 'BE'));

-- Mettre à jour les profils existants pour qu'ils soient en France par défaut
UPDATE profiles
  SET pays = 'FR'
  WHERE pays IS NULL OR pays = '';

-- Créer un index pour accélérer les recherches par pays
CREATE INDEX IF NOT EXISTS idx_profiles_pays ON profiles(pays);

-- Commentaire sur la colonne
COMMENT ON COLUMN profiles.pays IS 'Code pays: FR (France), BE (Belgique)';
