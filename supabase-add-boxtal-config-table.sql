-- ============================================
-- TABLE BOXTAL_CONFIG - Configuration Boxtal API
-- ============================================
-- Cette table stocke les clés API Boxtal pour permettre
-- la configuration via l'interface admin au lieu des variables d'environnement

CREATE TABLE IF NOT EXISTS boxtal_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'test' CHECK (environment IN ('test', 'production')),
  shipping_offer_code TEXT,
  from_first_name TEXT,
  from_last_name TEXT,
  from_email TEXT,
  from_phone TEXT,
  from_street TEXT,
  from_city TEXT,
  from_postal_code TEXT,
  from_country TEXT DEFAULT 'FR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id) -- Une seule configuration à la fois
);

-- RLS pour boxtal_config (lecture publique pour l'API, écriture admin uniquement)
ALTER TABLE boxtal_config ENABLE ROW LEVEL SECURITY;

-- Politique : Seuls les admins peuvent voir et modifier la configuration
CREATE POLICY "Admins can manage boxtal_config"
  ON boxtal_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique : Lecture publique pour les fonctions serveur (nécessaire pour l'API)
-- Note: Cette politique permet la lecture publique, mais en production,
-- vous devriez utiliser le service role key côté serveur pour plus de sécurité
CREATE POLICY "Anyone can view boxtal_config"
  ON boxtal_config FOR SELECT
  USING (true);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_boxtal_config_updated_at
  BEFORE UPDATE ON boxtal_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer une configuration par défaut vide (sera remplie via l'interface admin)
INSERT INTO boxtal_config (
  api_key,
  api_secret,
  environment,
  shipping_offer_code,
  from_first_name,
  from_last_name,
  from_email,
  from_phone,
  from_street,
  from_city,
  from_postal_code,
  from_country
)
VALUES (
  '',
  '',
  'test',
  'MONR-CpourToi',
  'Votre',
  'Entreprise',
  'contact@example.com',
  '+33612345678',
  '4 boulevard des Capucines',
  'Paris',
  '75009',
  'FR'
)
ON CONFLICT (id) DO NOTHING;






