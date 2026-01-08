-- ============================================
-- CORRIGER LES POLITIQUES RLS POUR ORDERS ET ORDER_ITEMS
-- ============================================
-- Ce script ajoute les politiques INSERT manquantes pour permettre
-- aux utilisateurs authentifiés de créer leurs propres commandes

-- Supprimer les anciennes politiques si elles existent (pour éviter les doublons)
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

-- ============================================
-- POLITIQUES POUR ORDERS
-- ============================================

-- Permettre aux utilisateurs de créer leurs propres commandes
CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permettre aux utilisateurs de mettre à jour leurs propres commandes
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- POLITIQUES POUR ORDER_ITEMS
-- ============================================

-- Permettre aux utilisateurs de créer des items pour leurs propres commandes
CREATE POLICY "Users can insert own order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Permettre aux utilisateurs de mettre à jour les items de leurs propres commandes
CREATE POLICY "Users can update own order items"
  ON order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Pour vérifier que les politiques sont bien créées, exécutez :
-- SELECT * FROM pg_policies WHERE tablename IN ('orders', 'order_items');






