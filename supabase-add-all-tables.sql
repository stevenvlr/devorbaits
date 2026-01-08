-- ============================================
-- CRÉER TOUTES LES TABLES NÉCESSAIRES POUR SUPABASE
-- ============================================
-- Ce script crée toutes les tables pour stocker les données sur Supabase
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================
-- 1. TABLE GAMMES (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS gammes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour gammes
ALTER TABLE gammes ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view gammes" ON gammes;
DROP POLICY IF EXISTS "Admins can manage gammes" ON gammes;

CREATE POLICY "Anyone can view gammes"
  ON gammes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage gammes"
  ON gammes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les gammes par défaut
INSERT INTO gammes (name)
VALUES 
  ('Méga Tutti'),
  ('Krill Calamar'),
  ('Red Devil'),
  ('Robin Red Vers de vase'),
  ('Mure Cassis'),
  ('Thon Curry')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. TABLE POPUP_VARIABLES (pour les variables Pop-up)
-- ============================================
CREATE TABLE IF NOT EXISTS popup_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- 'popup-duo-saveurs', 'popup-duo-formes', 'bar-popup-aromes', etc.
  value TEXT NOT NULL,
  metadata JSONB, -- Pour stocker des infos supplémentaires (couleur hex, type, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, value)
);

CREATE INDEX IF NOT EXISTS idx_popup_variables_category ON popup_variables(category);

-- RLS pour popup_variables
ALTER TABLE popup_variables ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view popup variables" ON popup_variables;
DROP POLICY IF EXISTS "Admins can manage popup variables" ON popup_variables;

CREATE POLICY "Anyone can view popup variables"
  ON popup_variables FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage popup variables"
  ON popup_variables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les variables par défaut pour Pop-up Duo, Bar à Pop-up, Flash Boost et Spray Plus
INSERT INTO popup_variables (category, value, metadata)
VALUES 
  -- Pop-up Duo - Saveurs
  ('popup-duo-saveurs', 'Mûre cassis', NULL),
  ('popup-duo-saveurs', 'Acid banane ananas', NULL),
  ('popup-duo-saveurs', 'Thon pêche', NULL),
  ('popup-duo-saveurs', 'Maïs crème', NULL),
  ('popup-duo-saveurs', 'Mangue bergamote', NULL),
  -- Pop-up Duo - Formes
  ('popup-duo-formes', '10mm', NULL),
  ('popup-duo-formes', '16mm', NULL),
  ('popup-duo-formes', 'Dumbels 12/16mm', NULL),
  ('popup-duo-formes', 'Cocoon 10/8mm', NULL),
  ('popup-duo-formes', 'Cocoon 15/12mm', NULL),
  ('popup-duo-formes', 'Snail shell', NULL),
  ('popup-duo-formes', 'Crub 18x13mm', NULL),
  ('popup-duo-formes', 'Maïs 14x10mm', NULL),
  -- Bar à Pop-up - Arômes
  ('bar-popup-aromes', 'Méga Tutti', NULL),
  ('bar-popup-aromes', 'Red devil', NULL),
  ('bar-popup-aromes', 'Pêche', NULL),
  ('bar-popup-aromes', 'Thon', NULL),
  ('bar-popup-aromes', 'Monster crab', NULL),
  ('bar-popup-aromes', 'Scopex', NULL),
  ('bar-popup-aromes', 'Fraise', NULL),
  ('bar-popup-aromes', 'Krill', NULL),
  ('bar-popup-aromes', 'Ananas', NULL),
  ('bar-popup-aromes', 'Banane', NULL),
  ('bar-popup-aromes', 'neutre', NULL),
  -- Bar à Pop-up - Couleurs Fluo
  ('bar-popup-couleurs-fluo', 'Jaune fluo', '{"type": "fluo", "value": "#FFFF00"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Blanc', '{"type": "fluo", "value": "#FFFFFF"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Rose fluo', '{"type": "fluo", "value": "#FF1493"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Vert fluo', '{"type": "fluo", "value": "#00FF00"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Violet', '{"type": "fluo", "value": "#A855F7"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Orange fluo', '{"type": "fluo", "value": "#FF6600"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Bleu fluo', '{"type": "fluo", "value": "#00BFFF"}'::jsonb),
  -- Bar à Pop-up - Couleurs Pastel
  ('bar-popup-couleurs-pastel', 'Rose pastel', '{"type": "pastel", "value": "#FFB6C1"}'::jsonb),
  ('bar-popup-couleurs-pastel', 'Jaune pastel', '{"type": "pastel", "value": "#FFEB3B"}'::jsonb),
  ('bar-popup-couleurs-pastel', 'Orange pastel', '{"type": "pastel", "value": "#FF9800"}'::jsonb),
  -- Bar à Pop-up - Tailles Fluo
  ('bar-popup-tailles-fluo', '10mm', NULL),
  ('bar-popup-tailles-fluo', '12mm', NULL),
  ('bar-popup-tailles-fluo', 'Dumbells 12/15', NULL),
  ('bar-popup-tailles-fluo', '15mm', NULL),
  ('bar-popup-tailles-fluo', '20mm', NULL),
  -- Bar à Pop-up - Tailles Pastel
  ('bar-popup-tailles-pastel', '12mm', NULL),
  ('bar-popup-tailles-pastel', '15mm', NULL),
  -- Flash Boost - Arômes (gammes par défaut)
  ('flash-boost-aromes', 'Méga Tutti', NULL),
  ('flash-boost-aromes', 'Krill Calamar', NULL),
  ('flash-boost-aromes', 'Red Devil', NULL),
  ('flash-boost-aromes', 'Robin Red Vers de vase', NULL),
  ('flash-boost-aromes', 'Mure Cassis', NULL),
  ('flash-boost-aromes', 'Thon Curry', NULL),
  -- Flash Boost - Formats
  ('flash-boost-formats', '100 ml', NULL),
  -- Spray Plus - Arômes (gammes par défaut)
  ('spray-plus-aromes', 'Méga Tutti', NULL),
  ('spray-plus-aromes', 'Krill Calamar', NULL),
  ('spray-plus-aromes', 'Red Devil', NULL),
  ('spray-plus-aromes', 'Robin Red Vers de vase', NULL),
  ('spray-plus-aromes', 'Mure Cassis', NULL),
  ('spray-plus-aromes', 'Thon Curry', NULL),
  -- Spray Plus - Formats
  ('spray-plus-formats', '30 ml', NULL)
ON CONFLICT (category, value) DO NOTHING;

-- ============================================
-- 3. VÉRIFIER QUE LA TABLE STOCK EXISTE
-- ============================================
-- La table stock devrait déjà exister, mais on vérifie
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  variant_id TEXT,
  location TEXT DEFAULT 'general',
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, variant_id, location)
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location);

-- RLS pour stock
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view stock" ON stock;
DROP POLICY IF EXISTS "Admins can manage stock" ON stock;

CREATE POLICY "Anyone can view stock"
  ON stock FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stock"
  ON stock FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 4. VÉRIFICATIONS
-- ============================================
SELECT 'Tables créées avec succès' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('gammes', 'popup_variables', 'stock', 'products', 'profiles')
ORDER BY table_name;


-- ============================================
-- Ce script crée toutes les tables pour stocker les données sur Supabase
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================
-- 1. TABLE GAMMES (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS gammes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour gammes
ALTER TABLE gammes ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view gammes" ON gammes;
DROP POLICY IF EXISTS "Admins can manage gammes" ON gammes;

CREATE POLICY "Anyone can view gammes"
  ON gammes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage gammes"
  ON gammes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les gammes par défaut
INSERT INTO gammes (name)
VALUES 
  ('Méga Tutti'),
  ('Krill Calamar'),
  ('Red Devil'),
  ('Robin Red Vers de vase'),
  ('Mure Cassis'),
  ('Thon Curry')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. TABLE POPUP_VARIABLES (pour les variables Pop-up)
-- ============================================
CREATE TABLE IF NOT EXISTS popup_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- 'popup-duo-saveurs', 'popup-duo-formes', 'bar-popup-aromes', etc.
  value TEXT NOT NULL,
  metadata JSONB, -- Pour stocker des infos supplémentaires (couleur hex, type, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, value)
);

CREATE INDEX IF NOT EXISTS idx_popup_variables_category ON popup_variables(category);

-- RLS pour popup_variables
ALTER TABLE popup_variables ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view popup variables" ON popup_variables;
DROP POLICY IF EXISTS "Admins can manage popup variables" ON popup_variables;

CREATE POLICY "Anyone can view popup variables"
  ON popup_variables FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage popup variables"
  ON popup_variables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les variables par défaut pour Pop-up Duo, Bar à Pop-up, Flash Boost et Spray Plus
INSERT INTO popup_variables (category, value, metadata)
VALUES 
  -- Pop-up Duo - Saveurs
  ('popup-duo-saveurs', 'Mûre cassis', NULL),
  ('popup-duo-saveurs', 'Acid banane ananas', NULL),
  ('popup-duo-saveurs', 'Thon pêche', NULL),
  ('popup-duo-saveurs', 'Maïs crème', NULL),
  ('popup-duo-saveurs', 'Mangue bergamote', NULL),
  -- Pop-up Duo - Formes
  ('popup-duo-formes', '10mm', NULL),
  ('popup-duo-formes', '16mm', NULL),
  ('popup-duo-formes', 'Dumbels 12/16mm', NULL),
  ('popup-duo-formes', 'Cocoon 10/8mm', NULL),
  ('popup-duo-formes', 'Cocoon 15/12mm', NULL),
  ('popup-duo-formes', 'Snail shell', NULL),
  ('popup-duo-formes', 'Crub 18x13mm', NULL),
  ('popup-duo-formes', 'Maïs 14x10mm', NULL),
  -- Bar à Pop-up - Arômes
  ('bar-popup-aromes', 'Méga Tutti', NULL),
  ('bar-popup-aromes', 'Red devil', NULL),
  ('bar-popup-aromes', 'Pêche', NULL),
  ('bar-popup-aromes', 'Thon', NULL),
  ('bar-popup-aromes', 'Monster crab', NULL),
  ('bar-popup-aromes', 'Scopex', NULL),
  ('bar-popup-aromes', 'Fraise', NULL),
  ('bar-popup-aromes', 'Krill', NULL),
  ('bar-popup-aromes', 'Ananas', NULL),
  ('bar-popup-aromes', 'Banane', NULL),
  ('bar-popup-aromes', 'neutre', NULL),
  -- Bar à Pop-up - Couleurs Fluo
  ('bar-popup-couleurs-fluo', 'Jaune fluo', '{"type": "fluo", "value": "#FFFF00"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Blanc', '{"type": "fluo", "value": "#FFFFFF"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Rose fluo', '{"type": "fluo", "value": "#FF1493"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Vert fluo', '{"type": "fluo", "value": "#00FF00"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Violet', '{"type": "fluo", "value": "#A855F7"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Orange fluo', '{"type": "fluo", "value": "#FF6600"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Bleu fluo', '{"type": "fluo", "value": "#00BFFF"}'::jsonb),
  -- Bar à Pop-up - Couleurs Pastel
  ('bar-popup-couleurs-pastel', 'Rose pastel', '{"type": "pastel", "value": "#FFB6C1"}'::jsonb),
  ('bar-popup-couleurs-pastel', 'Jaune pastel', '{"type": "pastel", "value": "#FFEB3B"}'::jsonb),
  ('bar-popup-couleurs-pastel', 'Orange pastel', '{"type": "pastel", "value": "#FF9800"}'::jsonb),
  -- Bar à Pop-up - Tailles Fluo
  ('bar-popup-tailles-fluo', '10mm', NULL),
  ('bar-popup-tailles-fluo', '12mm', NULL),
  ('bar-popup-tailles-fluo', 'Dumbells 12/15', NULL),
  ('bar-popup-tailles-fluo', '15mm', NULL),
  ('bar-popup-tailles-fluo', '20mm', NULL),
  -- Bar à Pop-up - Tailles Pastel
  ('bar-popup-tailles-pastel', '12mm', NULL),
  ('bar-popup-tailles-pastel', '15mm', NULL),
  -- Flash Boost - Arômes (gammes par défaut)
  ('flash-boost-aromes', 'Méga Tutti', NULL),
  ('flash-boost-aromes', 'Krill Calamar', NULL),
  ('flash-boost-aromes', 'Red Devil', NULL),
  ('flash-boost-aromes', 'Robin Red Vers de vase', NULL),
  ('flash-boost-aromes', 'Mure Cassis', NULL),
  ('flash-boost-aromes', 'Thon Curry', NULL),
  -- Flash Boost - Formats
  ('flash-boost-formats', '100 ml', NULL),
  -- Spray Plus - Arômes (gammes par défaut)
  ('spray-plus-aromes', 'Méga Tutti', NULL),
  ('spray-plus-aromes', 'Krill Calamar', NULL),
  ('spray-plus-aromes', 'Red Devil', NULL),
  ('spray-plus-aromes', 'Robin Red Vers de vase', NULL),
  ('spray-plus-aromes', 'Mure Cassis', NULL),
  ('spray-plus-aromes', 'Thon Curry', NULL),
  -- Spray Plus - Formats
  ('spray-plus-formats', '30 ml', NULL)
ON CONFLICT (category, value) DO NOTHING;

-- ============================================
-- 3. VÉRIFIER QUE LA TABLE STOCK EXISTE
-- ============================================
-- La table stock devrait déjà exister, mais on vérifie
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  variant_id TEXT,
  location TEXT DEFAULT 'general',
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, variant_id, location)
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location);

-- RLS pour stock
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view stock" ON stock;
DROP POLICY IF EXISTS "Admins can manage stock" ON stock;

CREATE POLICY "Anyone can view stock"
  ON stock FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stock"
  ON stock FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 4. VÉRIFICATIONS
-- ============================================
SELECT 'Tables créées avec succès' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('gammes', 'popup_variables', 'stock', 'products', 'profiles')
ORDER BY table_name;


-- ============================================
-- Ce script crée toutes les tables pour stocker les données sur Supabase
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================
-- 1. TABLE GAMMES (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS gammes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour gammes
ALTER TABLE gammes ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view gammes" ON gammes;
DROP POLICY IF EXISTS "Admins can manage gammes" ON gammes;

CREATE POLICY "Anyone can view gammes"
  ON gammes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage gammes"
  ON gammes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les gammes par défaut
INSERT INTO gammes (name)
VALUES 
  ('Méga Tutti'),
  ('Krill Calamar'),
  ('Red Devil'),
  ('Robin Red Vers de vase'),
  ('Mure Cassis'),
  ('Thon Curry')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. TABLE POPUP_VARIABLES (pour les variables Pop-up)
-- ============================================
CREATE TABLE IF NOT EXISTS popup_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- 'popup-duo-saveurs', 'popup-duo-formes', 'bar-popup-aromes', etc.
  value TEXT NOT NULL,
  metadata JSONB, -- Pour stocker des infos supplémentaires (couleur hex, type, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, value)
);

CREATE INDEX IF NOT EXISTS idx_popup_variables_category ON popup_variables(category);

-- RLS pour popup_variables
ALTER TABLE popup_variables ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view popup variables" ON popup_variables;
DROP POLICY IF EXISTS "Admins can manage popup variables" ON popup_variables;

CREATE POLICY "Anyone can view popup variables"
  ON popup_variables FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage popup variables"
  ON popup_variables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les variables par défaut pour Pop-up Duo, Bar à Pop-up, Flash Boost et Spray Plus
INSERT INTO popup_variables (category, value, metadata)
VALUES 
  -- Pop-up Duo - Saveurs
  ('popup-duo-saveurs', 'Mûre cassis', NULL),
  ('popup-duo-saveurs', 'Acid banane ananas', NULL),
  ('popup-duo-saveurs', 'Thon pêche', NULL),
  ('popup-duo-saveurs', 'Maïs crème', NULL),
  ('popup-duo-saveurs', 'Mangue bergamote', NULL),
  -- Pop-up Duo - Formes
  ('popup-duo-formes', '10mm', NULL),
  ('popup-duo-formes', '16mm', NULL),
  ('popup-duo-formes', 'Dumbels 12/16mm', NULL),
  ('popup-duo-formes', 'Cocoon 10/8mm', NULL),
  ('popup-duo-formes', 'Cocoon 15/12mm', NULL),
  ('popup-duo-formes', 'Snail shell', NULL),
  ('popup-duo-formes', 'Crub 18x13mm', NULL),
  ('popup-duo-formes', 'Maïs 14x10mm', NULL),
  -- Bar à Pop-up - Arômes
  ('bar-popup-aromes', 'Méga Tutti', NULL),
  ('bar-popup-aromes', 'Red devil', NULL),
  ('bar-popup-aromes', 'Pêche', NULL),
  ('bar-popup-aromes', 'Thon', NULL),
  ('bar-popup-aromes', 'Monster crab', NULL),
  ('bar-popup-aromes', 'Scopex', NULL),
  ('bar-popup-aromes', 'Fraise', NULL),
  ('bar-popup-aromes', 'Krill', NULL),
  ('bar-popup-aromes', 'Ananas', NULL),
  ('bar-popup-aromes', 'Banane', NULL),
  ('bar-popup-aromes', 'neutre', NULL),
  -- Bar à Pop-up - Couleurs Fluo
  ('bar-popup-couleurs-fluo', 'Jaune fluo', '{"type": "fluo", "value": "#FFFF00"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Blanc', '{"type": "fluo", "value": "#FFFFFF"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Rose fluo', '{"type": "fluo", "value": "#FF1493"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Vert fluo', '{"type": "fluo", "value": "#00FF00"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Violet', '{"type": "fluo", "value": "#A855F7"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Orange fluo', '{"type": "fluo", "value": "#FF6600"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Bleu fluo', '{"type": "fluo", "value": "#00BFFF"}'::jsonb),
  -- Bar à Pop-up - Couleurs Pastel
  ('bar-popup-couleurs-pastel', 'Rose pastel', '{"type": "pastel", "value": "#FFB6C1"}'::jsonb),
  ('bar-popup-couleurs-pastel', 'Jaune pastel', '{"type": "pastel", "value": "#FFEB3B"}'::jsonb),
  ('bar-popup-couleurs-pastel', 'Orange pastel', '{"type": "pastel", "value": "#FF9800"}'::jsonb),
  -- Bar à Pop-up - Tailles Fluo
  ('bar-popup-tailles-fluo', '10mm', NULL),
  ('bar-popup-tailles-fluo', '12mm', NULL),
  ('bar-popup-tailles-fluo', 'Dumbells 12/15', NULL),
  ('bar-popup-tailles-fluo', '15mm', NULL),
  ('bar-popup-tailles-fluo', '20mm', NULL),
  -- Bar à Pop-up - Tailles Pastel
  ('bar-popup-tailles-pastel', '12mm', NULL),
  ('bar-popup-tailles-pastel', '15mm', NULL),
  -- Flash Boost - Arômes (gammes par défaut)
  ('flash-boost-aromes', 'Méga Tutti', NULL),
  ('flash-boost-aromes', 'Krill Calamar', NULL),
  ('flash-boost-aromes', 'Red Devil', NULL),
  ('flash-boost-aromes', 'Robin Red Vers de vase', NULL),
  ('flash-boost-aromes', 'Mure Cassis', NULL),
  ('flash-boost-aromes', 'Thon Curry', NULL),
  -- Flash Boost - Formats
  ('flash-boost-formats', '100 ml', NULL),
  -- Spray Plus - Arômes (gammes par défaut)
  ('spray-plus-aromes', 'Méga Tutti', NULL),
  ('spray-plus-aromes', 'Krill Calamar', NULL),
  ('spray-plus-aromes', 'Red Devil', NULL),
  ('spray-plus-aromes', 'Robin Red Vers de vase', NULL),
  ('spray-plus-aromes', 'Mure Cassis', NULL),
  ('spray-plus-aromes', 'Thon Curry', NULL),
  -- Spray Plus - Formats
  ('spray-plus-formats', '30 ml', NULL)
ON CONFLICT (category, value) DO NOTHING;

-- ============================================
-- 3. VÉRIFIER QUE LA TABLE STOCK EXISTE
-- ============================================
-- La table stock devrait déjà exister, mais on vérifie
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  variant_id TEXT,
  location TEXT DEFAULT 'general',
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, variant_id, location)
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location);

-- RLS pour stock
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view stock" ON stock;
DROP POLICY IF EXISTS "Admins can manage stock" ON stock;

CREATE POLICY "Anyone can view stock"
  ON stock FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stock"
  ON stock FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 4. VÉRIFICATIONS
-- ============================================
SELECT 'Tables créées avec succès' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('gammes', 'popup_variables', 'stock', 'products', 'profiles')
ORDER BY table_name;


-- ============================================
-- Ce script crée toutes les tables pour stocker les données sur Supabase
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================
-- 1. TABLE GAMMES (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS gammes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour gammes
ALTER TABLE gammes ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view gammes" ON gammes;
DROP POLICY IF EXISTS "Admins can manage gammes" ON gammes;

CREATE POLICY "Anyone can view gammes"
  ON gammes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage gammes"
  ON gammes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les gammes par défaut
INSERT INTO gammes (name)
VALUES 
  ('Méga Tutti'),
  ('Krill Calamar'),
  ('Red Devil'),
  ('Robin Red Vers de vase'),
  ('Mure Cassis'),
  ('Thon Curry')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. TABLE POPUP_VARIABLES (pour les variables Pop-up)
-- ============================================
CREATE TABLE IF NOT EXISTS popup_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- 'popup-duo-saveurs', 'popup-duo-formes', 'bar-popup-aromes', etc.
  value TEXT NOT NULL,
  metadata JSONB, -- Pour stocker des infos supplémentaires (couleur hex, type, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, value)
);

CREATE INDEX IF NOT EXISTS idx_popup_variables_category ON popup_variables(category);

-- RLS pour popup_variables
ALTER TABLE popup_variables ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view popup variables" ON popup_variables;
DROP POLICY IF EXISTS "Admins can manage popup variables" ON popup_variables;

CREATE POLICY "Anyone can view popup variables"
  ON popup_variables FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage popup variables"
  ON popup_variables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les variables par défaut pour Pop-up Duo, Bar à Pop-up, Flash Boost et Spray Plus
INSERT INTO popup_variables (category, value, metadata)
VALUES 
  -- Pop-up Duo - Saveurs
  ('popup-duo-saveurs', 'Mûre cassis', NULL),
  ('popup-duo-saveurs', 'Acid banane ananas', NULL),
  ('popup-duo-saveurs', 'Thon pêche', NULL),
  ('popup-duo-saveurs', 'Maïs crème', NULL),
  ('popup-duo-saveurs', 'Mangue bergamote', NULL),
  -- Pop-up Duo - Formes
  ('popup-duo-formes', '10mm', NULL),
  ('popup-duo-formes', '16mm', NULL),
  ('popup-duo-formes', 'Dumbels 12/16mm', NULL),
  ('popup-duo-formes', 'Cocoon 10/8mm', NULL),
  ('popup-duo-formes', 'Cocoon 15/12mm', NULL),
  ('popup-duo-formes', 'Snail shell', NULL),
  ('popup-duo-formes', 'Crub 18x13mm', NULL),
  ('popup-duo-formes', 'Maïs 14x10mm', NULL),
  -- Bar à Pop-up - Arômes
  ('bar-popup-aromes', 'Méga Tutti', NULL),
  ('bar-popup-aromes', 'Red devil', NULL),
  ('bar-popup-aromes', 'Pêche', NULL),
  ('bar-popup-aromes', 'Thon', NULL),
  ('bar-popup-aromes', 'Monster crab', NULL),
  ('bar-popup-aromes', 'Scopex', NULL),
  ('bar-popup-aromes', 'Fraise', NULL),
  ('bar-popup-aromes', 'Krill', NULL),
  ('bar-popup-aromes', 'Ananas', NULL),
  ('bar-popup-aromes', 'Banane', NULL),
  ('bar-popup-aromes', 'neutre', NULL),
  -- Bar à Pop-up - Couleurs Fluo
  ('bar-popup-couleurs-fluo', 'Jaune fluo', '{"type": "fluo", "value": "#FFFF00"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Blanc', '{"type": "fluo", "value": "#FFFFFF"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Rose fluo', '{"type": "fluo", "value": "#FF1493"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Vert fluo', '{"type": "fluo", "value": "#00FF00"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Violet', '{"type": "fluo", "value": "#A855F7"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Orange fluo', '{"type": "fluo", "value": "#FF6600"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Bleu fluo', '{"type": "fluo", "value": "#00BFFF"}'::jsonb),
  -- Bar à Pop-up - Couleurs Pastel
  ('bar-popup-couleurs-pastel', 'Rose pastel', '{"type": "pastel", "value": "#FFB6C1"}'::jsonb),
  ('bar-popup-couleurs-pastel', 'Jaune pastel', '{"type": "pastel", "value": "#FFEB3B"}'::jsonb),
  ('bar-popup-couleurs-pastel', 'Orange pastel', '{"type": "pastel", "value": "#FF9800"}'::jsonb),
  -- Bar à Pop-up - Tailles Fluo
  ('bar-popup-tailles-fluo', '10mm', NULL),
  ('bar-popup-tailles-fluo', '12mm', NULL),
  ('bar-popup-tailles-fluo', 'Dumbells 12/15', NULL),
  ('bar-popup-tailles-fluo', '15mm', NULL),
  ('bar-popup-tailles-fluo', '20mm', NULL),
  -- Bar à Pop-up - Tailles Pastel
  ('bar-popup-tailles-pastel', '12mm', NULL),
  ('bar-popup-tailles-pastel', '15mm', NULL),
  -- Flash Boost - Arômes (gammes par défaut)
  ('flash-boost-aromes', 'Méga Tutti', NULL),
  ('flash-boost-aromes', 'Krill Calamar', NULL),
  ('flash-boost-aromes', 'Red Devil', NULL),
  ('flash-boost-aromes', 'Robin Red Vers de vase', NULL),
  ('flash-boost-aromes', 'Mure Cassis', NULL),
  ('flash-boost-aromes', 'Thon Curry', NULL),
  -- Flash Boost - Formats
  ('flash-boost-formats', '100 ml', NULL),
  -- Spray Plus - Arômes (gammes par défaut)
  ('spray-plus-aromes', 'Méga Tutti', NULL),
  ('spray-plus-aromes', 'Krill Calamar', NULL),
  ('spray-plus-aromes', 'Red Devil', NULL),
  ('spray-plus-aromes', 'Robin Red Vers de vase', NULL),
  ('spray-plus-aromes', 'Mure Cassis', NULL),
  ('spray-plus-aromes', 'Thon Curry', NULL),
  -- Spray Plus - Formats
  ('spray-plus-formats', '30 ml', NULL)
ON CONFLICT (category, value) DO NOTHING;

-- ============================================
-- 3. VÉRIFIER QUE LA TABLE STOCK EXISTE
-- ============================================
-- La table stock devrait déjà exister, mais on vérifie
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  variant_id TEXT,
  location TEXT DEFAULT 'general',
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, variant_id, location)
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location);

-- RLS pour stock
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view stock" ON stock;
DROP POLICY IF EXISTS "Admins can manage stock" ON stock;

CREATE POLICY "Anyone can view stock"
  ON stock FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stock"
  ON stock FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 4. VÉRIFICATIONS
-- ============================================
SELECT 'Tables créées avec succès' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('gammes', 'popup_variables', 'stock', 'products', 'profiles')
ORDER BY table_name;


-- ============================================
-- Ce script crée toutes les tables pour stocker les données sur Supabase
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================
-- 1. TABLE GAMMES (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS gammes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour gammes
ALTER TABLE gammes ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view gammes" ON gammes;
DROP POLICY IF EXISTS "Admins can manage gammes" ON gammes;

CREATE POLICY "Anyone can view gammes"
  ON gammes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage gammes"
  ON gammes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les gammes par défaut
INSERT INTO gammes (name)
VALUES 
  ('Méga Tutti'),
  ('Krill Calamar'),
  ('Red Devil'),
  ('Robin Red Vers de vase'),
  ('Mure Cassis'),
  ('Thon Curry')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. TABLE POPUP_VARIABLES (pour les variables Pop-up)
-- ============================================
CREATE TABLE IF NOT EXISTS popup_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- 'popup-duo-saveurs', 'popup-duo-formes', 'bar-popup-aromes', etc.
  value TEXT NOT NULL,
  metadata JSONB, -- Pour stocker des infos supplémentaires (couleur hex, type, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, value)
);

CREATE INDEX IF NOT EXISTS idx_popup_variables_category ON popup_variables(category);

-- RLS pour popup_variables
ALTER TABLE popup_variables ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view popup variables" ON popup_variables;
DROP POLICY IF EXISTS "Admins can manage popup variables" ON popup_variables;

CREATE POLICY "Anyone can view popup variables"
  ON popup_variables FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage popup variables"
  ON popup_variables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les variables par défaut pour Pop-up Duo, Bar à Pop-up, Flash Boost et Spray Plus
INSERT INTO popup_variables (category, value, metadata)
VALUES 
  -- Pop-up Duo - Saveurs
  ('popup-duo-saveurs', 'Mûre cassis', NULL),
  ('popup-duo-saveurs', 'Acid banane ananas', NULL),
  ('popup-duo-saveurs', 'Thon pêche', NULL),
  ('popup-duo-saveurs', 'Maïs crème', NULL),
  ('popup-duo-saveurs', 'Mangue bergamote', NULL),
  -- Pop-up Duo - Formes
  ('popup-duo-formes', '10mm', NULL),
  ('popup-duo-formes', '16mm', NULL),
  ('popup-duo-formes', 'Dumbels 12/16mm', NULL),
  ('popup-duo-formes', 'Cocoon 10/8mm', NULL),
  ('popup-duo-formes', 'Cocoon 15/12mm', NULL),
  ('popup-duo-formes', 'Snail shell', NULL),
  ('popup-duo-formes', 'Crub 18x13mm', NULL),
  ('popup-duo-formes', 'Maïs 14x10mm', NULL),
  -- Bar à Pop-up - Arômes
  ('bar-popup-aromes', 'Méga Tutti', NULL),
  ('bar-popup-aromes', 'Red devil', NULL),
  ('bar-popup-aromes', 'Pêche', NULL),
  ('bar-popup-aromes', 'Thon', NULL),
  ('bar-popup-aromes', 'Monster crab', NULL),
  ('bar-popup-aromes', 'Scopex', NULL),
  ('bar-popup-aromes', 'Fraise', NULL),
  ('bar-popup-aromes', 'Krill', NULL),
  ('bar-popup-aromes', 'Ananas', NULL),
  ('bar-popup-aromes', 'Banane', NULL),
  ('bar-popup-aromes', 'neutre', NULL),
  -- Bar à Pop-up - Couleurs Fluo
  ('bar-popup-couleurs-fluo', 'Jaune fluo', '{"type": "fluo", "value": "#FFFF00"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Blanc', '{"type": "fluo", "value": "#FFFFFF"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Rose fluo', '{"type": "fluo", "value": "#FF1493"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Vert fluo', '{"type": "fluo", "value": "#00FF00"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Violet', '{"type": "fluo", "value": "#A855F7"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Orange fluo', '{"type": "fluo", "value": "#FF6600"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Bleu fluo', '{"type": "fluo", "value": "#00BFFF"}'::jsonb),
  -- Bar à Pop-up - Couleurs Pastel
  ('bar-popup-couleurs-pastel', 'Rose pastel', '{"type": "pastel", "value": "#FFB6C1"}'::jsonb),
  ('bar-popup-couleurs-pastel', 'Jaune pastel', '{"type": "pastel", "value": "#FFEB3B"}'::jsonb),
  ('bar-popup-couleurs-pastel', 'Orange pastel', '{"type": "pastel", "value": "#FF9800"}'::jsonb),
  -- Bar à Pop-up - Tailles Fluo
  ('bar-popup-tailles-fluo', '10mm', NULL),
  ('bar-popup-tailles-fluo', '12mm', NULL),
  ('bar-popup-tailles-fluo', 'Dumbells 12/15', NULL),
  ('bar-popup-tailles-fluo', '15mm', NULL),
  ('bar-popup-tailles-fluo', '20mm', NULL),
  -- Bar à Pop-up - Tailles Pastel
  ('bar-popup-tailles-pastel', '12mm', NULL),
  ('bar-popup-tailles-pastel', '15mm', NULL),
  -- Flash Boost - Arômes (gammes par défaut)
  ('flash-boost-aromes', 'Méga Tutti', NULL),
  ('flash-boost-aromes', 'Krill Calamar', NULL),
  ('flash-boost-aromes', 'Red Devil', NULL),
  ('flash-boost-aromes', 'Robin Red Vers de vase', NULL),
  ('flash-boost-aromes', 'Mure Cassis', NULL),
  ('flash-boost-aromes', 'Thon Curry', NULL),
  -- Flash Boost - Formats
  ('flash-boost-formats', '100 ml', NULL),
  -- Spray Plus - Arômes (gammes par défaut)
  ('spray-plus-aromes', 'Méga Tutti', NULL),
  ('spray-plus-aromes', 'Krill Calamar', NULL),
  ('spray-plus-aromes', 'Red Devil', NULL),
  ('spray-plus-aromes', 'Robin Red Vers de vase', NULL),
  ('spray-plus-aromes', 'Mure Cassis', NULL),
  ('spray-plus-aromes', 'Thon Curry', NULL),
  -- Spray Plus - Formats
  ('spray-plus-formats', '30 ml', NULL)
ON CONFLICT (category, value) DO NOTHING;

-- ============================================
-- 3. VÉRIFIER QUE LA TABLE STOCK EXISTE
-- ============================================
-- La table stock devrait déjà exister, mais on vérifie
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  variant_id TEXT,
  location TEXT DEFAULT 'general',
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, variant_id, location)
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location);

-- RLS pour stock
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view stock" ON stock;
DROP POLICY IF EXISTS "Admins can manage stock" ON stock;

CREATE POLICY "Anyone can view stock"
  ON stock FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stock"
  ON stock FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 4. VÉRIFICATIONS
-- ============================================
SELECT 'Tables créées avec succès' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('gammes', 'popup_variables', 'stock', 'products', 'profiles')
ORDER BY table_name;


-- ============================================
-- Ce script crée toutes les tables pour stocker les données sur Supabase
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================
-- 1. TABLE GAMMES (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS gammes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour gammes
ALTER TABLE gammes ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view gammes" ON gammes;
DROP POLICY IF EXISTS "Admins can manage gammes" ON gammes;

CREATE POLICY "Anyone can view gammes"
  ON gammes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage gammes"
  ON gammes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les gammes par défaut
INSERT INTO gammes (name)
VALUES 
  ('Méga Tutti'),
  ('Krill Calamar'),
  ('Red Devil'),
  ('Robin Red Vers de vase'),
  ('Mure Cassis'),
  ('Thon Curry')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. TABLE POPUP_VARIABLES (pour les variables Pop-up)
-- ============================================
CREATE TABLE IF NOT EXISTS popup_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- 'popup-duo-saveurs', 'popup-duo-formes', 'bar-popup-aromes', etc.
  value TEXT NOT NULL,
  metadata JSONB, -- Pour stocker des infos supplémentaires (couleur hex, type, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, value)
);

CREATE INDEX IF NOT EXISTS idx_popup_variables_category ON popup_variables(category);

-- RLS pour popup_variables
ALTER TABLE popup_variables ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view popup variables" ON popup_variables;
DROP POLICY IF EXISTS "Admins can manage popup variables" ON popup_variables;

CREATE POLICY "Anyone can view popup variables"
  ON popup_variables FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage popup variables"
  ON popup_variables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les variables par défaut pour Pop-up Duo, Bar à Pop-up, Flash Boost et Spray Plus
INSERT INTO popup_variables (category, value, metadata)
VALUES 
  -- Pop-up Duo - Saveurs
  ('popup-duo-saveurs', 'Mûre cassis', NULL),
  ('popup-duo-saveurs', 'Acid banane ananas', NULL),
  ('popup-duo-saveurs', 'Thon pêche', NULL),
  ('popup-duo-saveurs', 'Maïs crème', NULL),
  ('popup-duo-saveurs', 'Mangue bergamote', NULL),
  -- Pop-up Duo - Formes
  ('popup-duo-formes', '10mm', NULL),
  ('popup-duo-formes', '16mm', NULL),
  ('popup-duo-formes', 'Dumbels 12/16mm', NULL),
  ('popup-duo-formes', 'Cocoon 10/8mm', NULL),
  ('popup-duo-formes', 'Cocoon 15/12mm', NULL),
  ('popup-duo-formes', 'Snail shell', NULL),
  ('popup-duo-formes', 'Crub 18x13mm', NULL),
  ('popup-duo-formes', 'Maïs 14x10mm', NULL),
  -- Bar à Pop-up - Arômes
  ('bar-popup-aromes', 'Méga Tutti', NULL),
  ('bar-popup-aromes', 'Red devil', NULL),
  ('bar-popup-aromes', 'Pêche', NULL),
  ('bar-popup-aromes', 'Thon', NULL),
  ('bar-popup-aromes', 'Monster crab', NULL),
  ('bar-popup-aromes', 'Scopex', NULL),
  ('bar-popup-aromes', 'Fraise', NULL),
  ('bar-popup-aromes', 'Krill', NULL),
  ('bar-popup-aromes', 'Ananas', NULL),
  ('bar-popup-aromes', 'Banane', NULL),
  ('bar-popup-aromes', 'neutre', NULL),
  -- Bar à Pop-up - Couleurs Fluo
  ('bar-popup-couleurs-fluo', 'Jaune fluo', '{"type": "fluo", "value": "#FFFF00"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Blanc', '{"type": "fluo", "value": "#FFFFFF"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Rose fluo', '{"type": "fluo", "value": "#FF1493"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Vert fluo', '{"type": "fluo", "value": "#00FF00"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Violet', '{"type": "fluo", "value": "#A855F7"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Orange fluo', '{"type": "fluo", "value": "#FF6600"}'::jsonb),
  ('bar-popup-couleurs-fluo', 'Bleu fluo', '{"type": "fluo", "value": "#00BFFF"}'::jsonb),
  -- Bar à Pop-up - Couleurs Pastel
  ('bar-popup-couleurs-pastel', 'Rose pastel', '{"type": "pastel", "value": "#FFB6C1"}'::jsonb),
  ('bar-popup-couleurs-pastel', 'Jaune pastel', '{"type": "pastel", "value": "#FFEB3B"}'::jsonb),
  ('bar-popup-couleurs-pastel', 'Orange pastel', '{"type": "pastel", "value": "#FF9800"}'::jsonb),
  -- Bar à Pop-up - Tailles Fluo
  ('bar-popup-tailles-fluo', '10mm', NULL),
  ('bar-popup-tailles-fluo', '12mm', NULL),
  ('bar-popup-tailles-fluo', 'Dumbells 12/15', NULL),
  ('bar-popup-tailles-fluo', '15mm', NULL),
  ('bar-popup-tailles-fluo', '20mm', NULL),
  -- Bar à Pop-up - Tailles Pastel
  ('bar-popup-tailles-pastel', '12mm', NULL),
  ('bar-popup-tailles-pastel', '15mm', NULL),
  -- Flash Boost - Arômes (gammes par défaut)
  ('flash-boost-aromes', 'Méga Tutti', NULL),
  ('flash-boost-aromes', 'Krill Calamar', NULL),
  ('flash-boost-aromes', 'Red Devil', NULL),
  ('flash-boost-aromes', 'Robin Red Vers de vase', NULL),
  ('flash-boost-aromes', 'Mure Cassis', NULL),
  ('flash-boost-aromes', 'Thon Curry', NULL),
  -- Flash Boost - Formats
  ('flash-boost-formats', '100 ml', NULL),
  -- Spray Plus - Arômes (gammes par défaut)
  ('spray-plus-aromes', 'Méga Tutti', NULL),
  ('spray-plus-aromes', 'Krill Calamar', NULL),
  ('spray-plus-aromes', 'Red Devil', NULL),
  ('spray-plus-aromes', 'Robin Red Vers de vase', NULL),
  ('spray-plus-aromes', 'Mure Cassis', NULL),
  ('spray-plus-aromes', 'Thon Curry', NULL),
  -- Spray Plus - Formats
  ('spray-plus-formats', '30 ml', NULL)
ON CONFLICT (category, value) DO NOTHING;

-- ============================================
-- 3. VÉRIFIER QUE LA TABLE STOCK EXISTE
-- ============================================
-- La table stock devrait déjà exister, mais on vérifie
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  variant_id TEXT,
  location TEXT DEFAULT 'general',
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, variant_id, location)
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location);

-- RLS pour stock
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view stock" ON stock;
DROP POLICY IF EXISTS "Admins can manage stock" ON stock;

CREATE POLICY "Anyone can view stock"
  ON stock FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stock"
  ON stock FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 4. VÉRIFICATIONS
-- ============================================
SELECT 'Tables créées avec succès' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('gammes', 'popup_variables', 'stock', 'products', 'profiles')
ORDER BY table_name;
