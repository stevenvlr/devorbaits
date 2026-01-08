// Adapter d'authentification Supabase avec fallback localStorage
import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string
  email: string
  nom: string
  prenom: string
  telephone?: string
  adresse?: string
  codePostal?: string
  ville?: string
  role?: 'user' | 'admin'  // ← AJOUTEZ CETTE LIGNE
  dateCreation: string
}

/**
 * Charge tous les utilisateurs (pour l'admin)
 * Note: Pour Supabase, on récupère uniquement les profils (sans les infos auth complètes)
 */
export async function getAllUsers(): Promise<User[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return []
    }

    try {
      // Récupérer tous les profils depuis Supabase
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error || !profiles) {
        console.error('Erreur lors du chargement des utilisateurs:', error)
        return []
      }

      // Convertir les profils en User (on utilise l'ID du profil comme ID utilisateur)
      const users: User[] = profiles.map((profile: any) => ({
        id: profile.id,
        email: profile.email || '',
        nom: profile.nom || '',
        prenom: profile.prenom || '',
        telephone: profile.telephone,
        adresse: profile.adresse,
        codePostal: profile.code_postal,
        ville: profile.ville,
        role: profile.role || 'user',
        dateCreation: profile.created_at || new Date().toISOString()
      }))

      return users
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
      return []
    }
  }

  // Plus de fallback localStorage - Supabase uniquement
  console.error('❌ Supabase non configuré. Impossible de charger les utilisateurs.')
  return []
}

/**
 * Convertit un utilisateur Supabase en User
 */
function supabaseUserToUser(supabaseUser: SupabaseUser, profile?: any): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    nom: profile?.nom || '',
    prenom: profile?.prenom || '',
    telephone: profile?.telephone,
    adresse: profile?.adresse,
    codePostal: profile?.code_postal,
    ville: profile?.ville,
    role: profile?.role || 'user',
    dateCreation: supabaseUser.created_at || new Date().toISOString()
  }
}

/**
 * Connexion avec Supabase ou localStorage
 */
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  console.log('[loginUser] Début de la connexion pour:', email)
  console.log('[loginUser] Supabase configuré?', isSupabaseConfigured())
  
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('[loginUser] Supabase client est null')
      return { success: false, error: 'Supabase non configuré' }
    }

    console.log('[loginUser] Tentative de connexion Supabase...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    console.log('[loginUser] Réponse Supabase - data:', data ? 'présente' : 'absente', 'error:', error ? error.message : 'aucune')

    if (error) {
      console.error('❌ Erreur Supabase Auth login:', error)
      // Messages d'erreur plus clairs
      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid')) {
        return { success: false, error: 'Email ou mot de passe incorrect' }
      }
      if (error.message.includes('Email not confirmed') || error.message.includes('confirmation')) {
        return { success: false, error: 'Votre email n\'a pas été confirmé. Vérifiez votre boîte mail.' }
      }
      if (error.message.includes('API key') || error.message.includes('apikey')) {
        return { success: false, error: 'Erreur de configuration Supabase. Vérifiez votre fichier .env.local et redémarrez le serveur.' }
      }
      return { success: false, error: error.message || 'Erreur de connexion' }
    }

    if (!data.user) {
      return { success: false, error: 'Erreur : utilisateur non trouvé' }
    }

    // Charger le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('❌ Erreur lors du chargement du profil:', profileError)
      // Si le profil n'existe pas, créer un profil minimal
      if (profileError.code === 'PGRST116') {
        console.log('⚠️ Profil non trouvé, création d\'un profil minimal...')
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email || email,
            nom: '',
            prenom: '',
            role: 'user'
          })
        
        if (insertError) {
          console.error('❌ Erreur lors de la création du profil:', insertError)
          return { success: false, error: 'Erreur lors de la création du profil. Contactez le support.' }
        }
        
        // Recharger le profil créé
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        const user = supabaseUserToUser(data.user, newProfile)
        return { success: true, user }
      }
      return { success: false, error: profileError.message || 'Erreur lors du chargement du profil' }
    }

    const user = supabaseUserToUser(data.user, profile)
    return { success: true, user }
  }

  // Plus de fallback localStorage - Supabase uniquement
  console.error('❌ Supabase non configuré. Impossible de se connecter.')
  return { success: false, error: 'Supabase non configuré. Impossible de se connecter.' }
}

/**
 * Inscription avec Supabase ou localStorage
 */
export async function registerUser(userData: Omit<User, 'id' | 'dateCreation'> & { password: string }): Promise<{ success: boolean; user?: User; error?: string }> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { success: false, error: 'Supabase non configuré' }
    }

    // Créer le compte auth
    // Note: Si Supabase nécessite une confirmation d'email, l'utilisateur devra confirmer avant de pouvoir se connecter
 
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/account/login` : undefined
      }
    })
 

    if (authError) {
      console.error('❌ Erreur Supabase Auth:', authError)
      // Messages d'erreur plus clairs
      if (authError.message.includes('API key') || authError.message.includes('apikey') || authError.message.includes('No API key')) {
        return { success: false, error: 'Erreur de configuration Supabase. Vérifiez votre fichier .env.local avec NEXT_PUBLIC_SUPABASE_ANON_KEY et redémarrez le serveur.' }
      }
      if (authError.message.includes('already registered') || authError.message.includes('already exists') || authError.message.includes('User already registered')) {
        return { success: false, error: 'Cet email est déjà utilisé. Essayez de vous connecter.' }
      }
      return { success: false, error: authError.message || 'Erreur lors de la création du compte' }
    }

    if (!authData.user) {
      return { success: false, error: 'Erreur : compte non créé. Vérifiez votre email (peut-être un email de confirmation requis).' }
    }

    // Créer ou mettre à jour le profil
    // Utiliser une fonction database pour éviter les problèmes de timing
    console.log('[registerUser] Création/mise à jour du profil pour:', authData.user.id, userData.email)
 
    // Le trigger crée automatiquement le profil de base (id + email + role)
    // On attend que le trigger s'exécute, puis on met à jour avec toutes les infos
    let profileData = null
    let profileError = null
    
    // Attendre que le trigger crée le profil de base (plusieurs tentatives)
    let profileExists = false
    let attempts = 0
    const maxAttempts = 5
    
    while (!profileExists && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Vérifier si le profil existe déjà (créé par le trigger)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()
      
      if (existingProfile) {
        profileExists = true
        console.log('✅ Profil créé par le trigger, mise à jour avec les infos complètes...')
        break
      }
      
      attempts++
      console.log(`⏳ Attente du trigger... (tentative ${attempts}/${maxAttempts})`)
    }
    
    // Essayer d'abord avec la fonction database (plus fiable)
    const { data: functionData, error: functionError } = await supabase.rpc('create_user_profile', {
      p_user_id: authData.user.id,
      p_email: userData.email,
      p_nom: userData.nom,
      p_prenom: userData.prenom,
      p_telephone: userData.telephone || null,
      p_adresse: userData.adresse || null,
      p_code_postal: userData.codePostal || null,
      p_ville: userData.ville || null
    })
    
    if (!functionError && functionData) {
      profileData = functionData
      console.log('✅ Profil créé/mis à jour avec la fonction database')
    } else {
      // Si la fonction n'existe pas ou échoue, utiliser upsert
      console.warn('⚠️ Fonction create_user_profile non disponible, utilisation de upsert:', functionError?.message)
      
      // Le trigger devrait avoir créé le profil de base, on met juste à jour avec les infos complètes
      const { data: upsertData, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: userData.email,
          nom: userData.nom,
          prenom: userData.prenom,
          telephone: userData.telephone,
          adresse: userData.adresse,
          code_postal: userData.codePostal,
          ville: userData.ville,
          role: 'user'
        }, {
          onConflict: 'id'
        })
        .select()
        .single()
      
      profileData = upsertData
      profileError = upsertError
      
      if (!upsertError && upsertData) {
        console.log('✅ Profil créé/mis à jour avec upsert')
      }
    }
    
    const finalError = profileError || functionError
    if (finalError) {
      console.error('❌ Erreur Supabase Profiles:', finalError)
      console.error('❌ Code erreur:', finalError.code)
      console.error('❌ Message:', finalError.message)
      console.error('❌ Détails:', finalError.details)
      console.error('❌ Hint:', finalError.hint)
      
      // Si l'erreur vient de la table profiles, c'est probablement RLS
      if (finalError.code === '42501' || finalError.message.includes('permission') || finalError.message.includes('policy') || finalError.message.includes('RLS')) {
        return { 
          success: false, 
          error: `Erreur de permissions RLS (code: ${finalError.code}). Vérifiez que les politiques RLS sur la table "profiles" permettent l'insertion. Exécutez le script supabase-fix-profiles-rls.sql dans Supabase SQL Editor.` 
        }
      }
      
      // Erreur de contrainte de clé étrangère (l'utilisateur n'existe pas encore dans auth.users)
      if (finalError.code === '23503' || finalError.message.includes('foreign key') || finalError.message.includes('fkey')) {
        return { 
          success: false, 
          error: `Erreur de contrainte de clé étrangère. L'utilisateur n'est peut-être pas encore créé dans auth.users. Exécutez le script supabase-create-profile-function.sql dans Supabase SQL Editor pour créer une fonction qui gère cela automatiquement. Erreur: ${finalError.message || finalError.code}` 
        }
      }
      
      // Erreur de contrainte (email déjà utilisé, etc.)
      if (finalError.code === '23505' || finalError.message.includes('duplicate') || finalError.message.includes('unique')) {
        return { success: false, error: 'Cet email est déjà utilisé. Essayez de vous connecter.' }
      }
      
      return { success: false, error: `Erreur lors de la création du profil: ${finalError.message || finalError.code || 'Erreur inconnue'}` }
    }
    
    console.log('✅ Profil créé avec succès:', profileData)

    const user = supabaseUserToUser(authData.user, {
      nom: userData.nom,
      prenom: userData.prenom,
      telephone: userData.telephone,
      adresse: userData.adresse,
      code_postal: userData.codePostal,
      ville: userData.ville
    })

    return { success: true, user }
  }

  // Plus de fallback localStorage - Supabase uniquement
  console.error('❌ Supabase non configuré. Impossible de s\'inscrire.')
  return { success: false, error: 'Supabase non configuré. Impossible de s\'inscrire.' }
}

/**
 * Déconnexion
 */
export async function logoutUser(): Promise<void> {
  console.log('[logoutUser] Début de la déconnexion')
  
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (supabase) {
      try {
        console.log('[logoutUser] Déconnexion Supabase...')
        // Déconnexion Supabase
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('[logoutUser] Erreur lors de la déconnexion Supabase:', error)
        } else {
          console.log('[logoutUser] Déconnexion Supabase réussie')
        }
      } catch (error) {
        console.error('[logoutUser] Erreur lors de la déconnexion:', error)
      }
    } else {
      console.log('[logoutUser] Supabase client non disponible')
    }
  } else {
    console.log('[logoutUser] Supabase non configuré, déconnexion localStorage uniquement')
  }

  // Nettoyer les tokens Supabase du localStorage (Supabase les stocke automatiquement)
  if (typeof window !== 'undefined') {
    console.log('[logoutUser] Nettoyage des tokens Supabase du localStorage...')
    // Nettoyer les tokens Supabase si présents
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => {
      console.log('[logoutUser] Suppression de la clé localStorage:', key)
      localStorage.removeItem(key)
    })
    console.log('[logoutUser] Déconnexion terminée')
  }
}

/**
 * Obtient l'utilisateur actuel
 */
export async function getCurrentUser(): Promise<User | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (!supabase) return null

    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    if (!supabaseUser) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single()

    return supabaseUserToUser(supabaseUser, profile)
  }

  // Plus de fallback localStorage - Supabase uniquement
  console.error('❌ Supabase non configuré. Impossible de récupérer l\'utilisateur actuel.')
  return null
}

/**
 * Met à jour le profil utilisateur
 */
export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { success: false, error: 'Supabase non configuré' }
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        nom: updates.nom,
        prenom: updates.prenom,
        telephone: updates.telephone,
        adresse: updates.adresse,
        code_postal: updates.codePostal,
        ville: updates.ville,
        role: updates.role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    if (!supabaseUser) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }

    const user = supabaseUserToUser(supabaseUser, profile)
    return { success: true, user }
  }

  // Plus de fallback localStorage - Supabase uniquement
  console.error('❌ Supabase non configuré. Impossible de mettre à jour le profil.')
  return { success: false, error: 'Supabase non configuré. Impossible de mettre à jour le profil.' }
}

/**
 * Change le mot de passe de l'utilisateur
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { success: false, error: 'Supabase non configuré' }
    }

    // Vérifier le mot de passe actuel en essayant de se connecter
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    // Vérifier le mot de passe actuel
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })

    if (signInError) {
      return { success: false, error: 'Mot de passe actuel incorrect' }
    }

    // Changer le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      return { success: false, error: updateError.message || 'Erreur lors du changement de mot de passe' }
    }

    return { success: true }
  }

  // Fallback localStorage
  if (typeof window === 'undefined') {
    return { success: false, error: 'Non disponible côté serveur' }
  }

  const users = JSON.parse(localStorage.getItem('users') || '[]')
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
  
  if (!currentUser) {
    return { success: false, error: 'Utilisateur non connecté' }
  }

  const userIndex = users.findIndex((u: any) => u.id === currentUser.id)
  if (userIndex === -1) {
    return { success: false, error: 'Utilisateur non trouvé' }
  }

  // Vérifier le mot de passe actuel
  if (users[userIndex].password !== currentPassword) {
    return { success: false, error: 'Mot de passe actuel incorrect' }
  }

  // Mettre à jour le mot de passe
  users[userIndex].password = newPassword
  localStorage.setItem('users', JSON.stringify(users))

  return { success: true }
}

/**
 * Vérifie si un utilisateur est admin
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin' || false
}

/**
 * Vérifie si l'utilisateur actuel est admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return isAdmin(user)
}
