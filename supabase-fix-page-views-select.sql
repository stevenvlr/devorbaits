-- ============================================
-- CORRECTION LECTURE PAGE_VIEWS (Analytics)
-- ============================================
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- Ce script permet de lire les visites pour afficher les analytics

-- Supprime la politique existante si elle existe (évite les doublons)
DROP POLICY IF EXISTS "Allow read page_views" ON page_views;

-- Crée la politique qui permet à tous les utilisateurs authentifiés de lire les visites
-- (La page admin/analytics est déjà protégée par votre authentification)
CREATE POLICY "Allow read page_views"
  ON page_views FOR SELECT
  USING (true);

-- Vérification : affiche le nombre de visites enregistrées
SELECT COUNT(*) as total_visites FROM page_views;
