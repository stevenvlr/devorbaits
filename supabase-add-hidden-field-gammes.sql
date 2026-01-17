-- ============================================
-- AJOUT DU CHAMP HIDDEN POUR MASQUER LES GAMMES
-- ============================================
-- Ce script ajoute un champ pour masquer/afficher les gammes sans les supprimer

-- Ajouter la colonne hidden (par défaut false = visible)
ALTER TABLE gammes 
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- Mettre à jour les enregistrements existants pour qu'ils soient visibles par défaut
-- Cela garantit que toutes les gammes existantes sont visibles après l'ajout du champ
UPDATE gammes 
SET hidden = false 
WHERE hidden IS NULL;

-- S'assurer que toutes les gammes par défaut existent et sont visibles
-- Si elles existent déjà, on ne modifie pas leur statut hidden (on garde la valeur existante)
INSERT INTO gammes (name, hidden)
VALUES 
  ('Méga Tutti', false),
  ('Krill Calamar', false),
  ('Red Devil', false),
  ('Robin Red Vers de vase', false),
  ('Mure Cassis', false),
  ('Thon Curry', false)
ON CONFLICT (name) DO NOTHING;

-- Commentaire pour clarifier le champ
COMMENT ON COLUMN gammes.hidden IS 
'Si true, la gamme est masquée et ne sera pas visible pour les clients. Si false, la gamme est visible.';
