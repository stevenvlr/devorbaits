-- Script pour créer automatiquement un profil quand un utilisateur s'inscrit
-- À exécuter dans Supabase SQL Editor

-- 1. Créer la fonction qui crée le profil automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Créer le trigger qui appelle la fonction à chaque inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Vérifier que la table profiles a les bonnes colonnes
-- (Ajouter les colonnes manquantes si nécessaire)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prenom TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telephone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS code_postal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ville TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Permettre les insertions depuis l'application
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leur propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Politique pour permettre aux utilisateurs de mettre à jour leur profil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Politique pour permettre l'insertion lors de l'inscription (via trigger)
DROP POLICY IF EXISTS "Enable insert for service role" ON profiles;
CREATE POLICY "Enable insert for service role" ON profiles
  FOR INSERT WITH CHECK (true);

-- Message de confirmation
SELECT 'Script exécuté avec succès ! Les profils seront maintenant créés automatiquement.' as message;
