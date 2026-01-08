-- ============================================
-- SCHEMA SUPABASE POUR DEVORBAITS
-- ============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- (Dashboard > SQL Editor > New Query)

-- ============================================
-- 1. TABLE PROFILES (Extension de auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) pour profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. TABLE STOCK
-- ============================================
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  variant_id TEXT,
  location TEXT DEFAULT 'general', -- 'general' pour livraison, 'amicale-blanc' pour retrait amicale
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location);

-- RLS pour stock (lecture publique, écriture admin uniquement)
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stock"
  ON stock FOR SELECT
  USING (true);

-- Note: Pour les opérations d'écriture, vous devrez créer des fonctions server-side
-- ou utiliser le service role key côté serveur

-- ============================================
-- 2.5. TABLE PRODUCTS
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_gamme ON products(gamme);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);

-- RLS pour products (lecture publique, écriture admin uniquement)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

-- Note: Pour les opérations d'écriture, vous devrez créer des fonctions server-side
-- ou utiliser le service role key côté serveur

-- ============================================
-- 3. TABLE ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  reference TEXT UNIQUE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- RLS pour orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 4. TABLE ORDER_ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- RLS pour order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. TABLE PAGE_VIEWS (Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_user ON page_views(user_id);

-- RLS pour page_views (lecture admin uniquement)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- Note: Pour la lecture, vous devrez créer une fonction ou utiliser le service role

-- ============================================
-- 6. TABLE PROMO_CODES
-- ============================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  allowed_user_ids UUID[],
  allowed_product_ids TEXT[],
  allowed_categories TEXT[],
  allowed_gammes TEXT[],
  allowed_conditionnements TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active);

-- RLS pour promo_codes (lecture publique, écriture admin)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes FOR SELECT
  USING (active = true);

-- ============================================
-- 7. STORAGE BUCKETS
-- ============================================
-- Créez ces buckets dans Supabase Dashboard > Storage
-- 
-- Bucket: product-images
--   - Public: Oui
--   - File size limit: 5MB
--   - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Bucket: site-assets
--   - Public: Oui
--   - File size limit: 2MB
--   - Allowed MIME types: image/jpeg, image/png, image/webp

-- ============================================
-- 8. FONCTIONS UTILES
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour stock
CREATE TRIGGER update_stock_updated_at
  BEFORE UPDATE ON stock
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. TABLE PROMO_CODE_USAGE (Suivi des utilisations)
-- ============================================
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  order_id UUID,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_user ON promo_code_usage(user_id);

-- RLS pour promo_code_usage
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promo code usage"
  ON promo_code_usage FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Après avoir exécuté ce script :
-- 1. Créez les buckets Storage (product-images et site-assets)
-- 2. Configurez les politiques RLS selon vos besoins
-- 3. Ajoutez vos variables d'environnement dans .env.local


-- ============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- (Dashboard > SQL Editor > New Query)

-- ============================================
-- 1. TABLE PROFILES (Extension de auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) pour profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. TABLE STOCK
-- ============================================
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  variant_id TEXT,
  location TEXT DEFAULT 'general', -- 'general' pour livraison, 'amicale-blanc' pour retrait amicale
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location);

-- RLS pour stock (lecture publique, écriture admin uniquement)
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stock"
  ON stock FOR SELECT
  USING (true);

-- Note: Pour les opérations d'écriture, vous devrez créer des fonctions server-side
-- ou utiliser le service role key côté serveur

-- ============================================
-- 2.5. TABLE PRODUCTS
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_gamme ON products(gamme);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);

-- RLS pour products (lecture publique, écriture admin uniquement)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

-- Note: Pour les opérations d'écriture, vous devrez créer des fonctions server-side
-- ou utiliser le service role key côté serveur

-- ============================================
-- 3. TABLE ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  reference TEXT UNIQUE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- RLS pour orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 4. TABLE ORDER_ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- RLS pour order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. TABLE PAGE_VIEWS (Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_user ON page_views(user_id);

-- RLS pour page_views (lecture admin uniquement)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- Note: Pour la lecture, vous devrez créer une fonction ou utiliser le service role

-- ============================================
-- 6. TABLE PROMO_CODES
-- ============================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  allowed_user_ids UUID[],
  allowed_product_ids TEXT[],
  allowed_categories TEXT[],
  allowed_gammes TEXT[],
  allowed_conditionnements TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active);

-- RLS pour promo_codes (lecture publique, écriture admin)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes FOR SELECT
  USING (active = true);

-- ============================================
-- 7. STORAGE BUCKETS
-- ============================================
-- Créez ces buckets dans Supabase Dashboard > Storage
-- 
-- Bucket: product-images
--   - Public: Oui
--   - File size limit: 5MB
--   - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Bucket: site-assets
--   - Public: Oui
--   - File size limit: 2MB
--   - Allowed MIME types: image/jpeg, image/png, image/webp

-- ============================================
-- 8. FONCTIONS UTILES
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour stock
CREATE TRIGGER update_stock_updated_at
  BEFORE UPDATE ON stock
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. TABLE PROMO_CODE_USAGE (Suivi des utilisations)
-- ============================================
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  order_id UUID,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_user ON promo_code_usage(user_id);

-- RLS pour promo_code_usage
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promo code usage"
  ON promo_code_usage FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Après avoir exécuté ce script :
-- 1. Créez les buckets Storage (product-images et site-assets)
-- 2. Configurez les politiques RLS selon vos besoins
-- 3. Ajoutez vos variables d'environnement dans .env.local


-- ============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- (Dashboard > SQL Editor > New Query)

-- ============================================
-- 1. TABLE PROFILES (Extension de auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) pour profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. TABLE STOCK
-- ============================================
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  variant_id TEXT,
  location TEXT DEFAULT 'general', -- 'general' pour livraison, 'amicale-blanc' pour retrait amicale
  quantity INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location);

-- RLS pour stock (lecture publique, écriture admin uniquement)
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stock"
  ON stock FOR SELECT
  USING (true);

-- Note: Pour les opérations d'écriture, vous devrez créer des fonctions server-side
-- ou utiliser le service role key côté serveur

-- ============================================
-- 2.5. TABLE PRODUCTS
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_gamme ON products(gamme);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);

-- RLS pour products (lecture publique, écriture admin uniquement)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

-- Note: Pour les opérations d'écriture, vous devrez créer des fonctions server-side
-- ou utiliser le service role key côté serveur

-- ============================================
-- 3. TABLE ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  reference TEXT UNIQUE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- RLS pour orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 4. TABLE ORDER_ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- RLS pour order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. TABLE PAGE_VIEWS (Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_user ON page_views(user_id);

-- RLS pour page_views (lecture admin uniquement)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- Note: Pour la lecture, vous devrez créer une fonction ou utiliser le service role

-- ============================================
-- 6. TABLE PROMO_CODES
-- ============================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  allowed_user_ids UUID[],
  allowed_product_ids TEXT[],
  allowed_categories TEXT[],
  allowed_gammes TEXT[],
  allowed_conditionnements TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active);

-- RLS pour promo_codes (lecture publique, écriture admin)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes FOR SELECT
  USING (active = true);

-- ============================================
-- 7. STORAGE BUCKETS
-- ============================================
-- Créez ces buckets dans Supabase Dashboard > Storage
-- 
-- Bucket: product-images
--   - Public: Oui
--   - File size limit: 5MB
--   - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Bucket: site-assets
--   - Public: Oui
--   - File size limit: 2MB
--   - Allowed MIME types: image/jpeg, image/png, image/webp

-- ============================================
-- 8. FONCTIONS UTILES
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour stock
CREATE TRIGGER update_stock_updated_at
  BEFORE UPDATE ON stock
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. TABLE PROMO_CODE_USAGE (Suivi des utilisations)
-- ============================================
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  order_id UUID,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_user ON promo_code_usage(user_id);

-- RLS pour promo_code_usage
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promo code usage"
  ON promo_code_usage FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Après avoir exécuté ce script :
-- 1. Créez les buckets Storage (product-images et site-assets)
-- 2. Configurez les politiques RLS selon vos besoins
-- 3. Ajoutez vos variables d'environnement dans .env.local
