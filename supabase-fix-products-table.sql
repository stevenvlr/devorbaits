-- Script pour créer/corriger la table products dans Supabase
-- Exécutez ce script dans SQL Editor de Supabase

-- 1. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image TEXT, -- base64 ou URL (compatibilité ancien système)
  images TEXT[], -- Tableau d'images (base64 ou URLs)
  gamme TEXT,
  format TEXT,
  available BOOLEAN DEFAULT true,
  variants JSONB, -- Tableau de variantes en JSON
  created_at BIGINT NOT NULL, -- Timestamp en millisecondes
  updated_at BIGINT NOT NULL
);

-- 2. Créer les index (ignore si existent déjà)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_gamme ON products(gamme);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);

-- 3. Activer RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer TOUTES les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Allow insert for migration" ON products;
DROP POLICY IF EXISTS "Allow update for migration" ON products;
DROP POLICY IF EXISTS "Users can view own profile" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Public can insert products" ON products;
DROP POLICY IF EXISTS "Public can update products" ON products;
DROP POLICY IF EXISTS "Public can delete products" ON products;

-- 5. Créer les nouvelles politiques (permissives pour le développement)
-- IMPORTANT: Ces politiques permettent TOUTES les opérations à TOUS les utilisateurs
-- Pour la production, vous devrez les restreindre selon vos besoins

-- Politique pour permettre la lecture publique
CREATE POLICY "Public can view products"
  ON products FOR SELECT
  USING (true);

-- Politique pour permettre l'insertion (nécessaire pour ajouter des produits)
CREATE POLICY "Public can insert products"
  ON products FOR INSERT
  WITH CHECK (true);

-- Politique pour permettre la mise à jour
CREATE POLICY "Public can update products"
  ON products FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Politique pour permettre la suppression
CREATE POLICY "Public can delete products"
  ON products FOR DELETE
  USING (true);



-- 1. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image TEXT, -- base64 ou URL (compatibilité ancien système)
  images TEXT[], -- Tableau d'images (base64 ou URLs)
  gamme TEXT,
  format TEXT,
  available BOOLEAN DEFAULT true,
  variants JSONB, -- Tableau de variantes en JSON
  created_at BIGINT NOT NULL, -- Timestamp en millisecondes
  updated_at BIGINT NOT NULL
);

-- 2. Créer les index (ignore si existent déjà)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_gamme ON products(gamme);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);

-- 3. Activer RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer TOUTES les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Allow insert for migration" ON products;
DROP POLICY IF EXISTS "Allow update for migration" ON products;
DROP POLICY IF EXISTS "Users can view own profile" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Public can insert products" ON products;
DROP POLICY IF EXISTS "Public can update products" ON products;
DROP POLICY IF EXISTS "Public can delete products" ON products;

-- 5. Créer les nouvelles politiques (permissives pour le développement)
-- IMPORTANT: Ces politiques permettent TOUTES les opérations à TOUS les utilisateurs
-- Pour la production, vous devrez les restreindre selon vos besoins

-- Politique pour permettre la lecture publique
CREATE POLICY "Public can view products"
  ON products FOR SELECT
  USING (true);

-- Politique pour permettre l'insertion (nécessaire pour ajouter des produits)
CREATE POLICY "Public can insert products"
  ON products FOR INSERT
  WITH CHECK (true);

-- Politique pour permettre la mise à jour
CREATE POLICY "Public can update products"
  ON products FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Politique pour permettre la suppression
CREATE POLICY "Public can delete products"
  ON products FOR DELETE
  USING (true);



-- 1. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image TEXT, -- base64 ou URL (compatibilité ancien système)
  images TEXT[], -- Tableau d'images (base64 ou URLs)
  gamme TEXT,
  format TEXT,
  available BOOLEAN DEFAULT true,
  variants JSONB, -- Tableau de variantes en JSON
  created_at BIGINT NOT NULL, -- Timestamp en millisecondes
  updated_at BIGINT NOT NULL
);

-- 2. Créer les index (ignore si existent déjà)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_gamme ON products(gamme);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);

-- 3. Activer RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer TOUTES les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Allow insert for migration" ON products;
DROP POLICY IF EXISTS "Allow update for migration" ON products;
DROP POLICY IF EXISTS "Users can view own profile" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Public can insert products" ON products;
DROP POLICY IF EXISTS "Public can update products" ON products;
DROP POLICY IF EXISTS "Public can delete products" ON products;

-- 5. Créer les nouvelles politiques (permissives pour le développement)
-- IMPORTANT: Ces politiques permettent TOUTES les opérations à TOUS les utilisateurs
-- Pour la production, vous devrez les restreindre selon vos besoins

-- Politique pour permettre la lecture publique
CREATE POLICY "Public can view products"
  ON products FOR SELECT
  USING (true);

-- Politique pour permettre l'insertion (nécessaire pour ajouter des produits)
CREATE POLICY "Public can insert products"
  ON products FOR INSERT
  WITH CHECK (true);

-- Politique pour permettre la mise à jour
CREATE POLICY "Public can update products"
  ON products FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Politique pour permettre la suppression
CREATE POLICY "Public can delete products"
  ON products FOR DELETE
  USING (true);
