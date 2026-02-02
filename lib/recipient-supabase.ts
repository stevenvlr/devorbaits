// Récupération du destinataire pour une commande (profil + adresse, fallback billing_address)
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/** Entrée minimale pour récupérer le destinataire (user_id + billing_address) */
export type OrderForRecipient = {
  user_id?: string | null
  billing_address?: unknown
}

/** Objet destinataire normalisé (expédition, facture, etc.) */
export interface Recipient {
  full_name: string
  email: string
  phone?: string
  country_code?: string
  address1?: string
  address2?: string
  zip?: string
  city?: string
  state?: string
}

/** Profil Supabase (colonnes connues de la table profiles) */
interface ProfileRow {
  id?: string
  email?: string | null
  nom?: string | null
  prenom?: string | null
  telephone?: string | null
  adresse?: string | null
  code_postal?: string | null
  ville?: string | null
  country_code?: string | null
  state?: string | null
  address2?: string | null
  [key: string]: unknown
}

/** billing_address sur la commande (format possible) */
interface BillingAddressLike {
  nom?: string | null
  prenom?: string | null
  adresse?: string | null
  address1?: string | null
  address2?: string | null
  codePostal?: string | null
  code_postal?: string | null
  zip?: string | null
  ville?: string | null
  city?: string | null
  pays?: string | null
  country_code?: string | null
  state?: string | null
  telephone?: string | null
  phone?: string | null
  email?: string | null
  [key: string]: unknown
}

function safeStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v.trim()
  return String(v).trim()
}

/** Construit un Recipient à partir d'un objet type billing_address */
function recipientFromBillingAddress(ba: BillingAddressLike | null | undefined, fallbackEmail = ''): Recipient {
  if (!ba || typeof ba !== 'object') {
    return { full_name: '', email: fallbackEmail }
  }
  const nom = safeStr(ba.nom)
  const prenom = safeStr(ba.prenom)
  const fullName = [prenom, nom].filter(Boolean).join(' ').trim() || safeStr((ba as any).full_name)
  return {
    full_name: fullName,
    email: safeStr(ba.email) || fallbackEmail,
    phone: safeStr(ba.telephone || ba.phone) || undefined,
    country_code: safeStr(ba.country_code || ba.pays) || undefined,
    address1: safeStr(ba.address1 || ba.adresse) || undefined,
    address2: safeStr(ba.address2) || undefined,
    zip: safeStr(ba.zip || ba.codePostal || ba.code_postal) || undefined,
    city: safeStr(ba.city || ba.ville) || undefined,
    state: safeStr(ba.state) || undefined,
  }
}

/** Indique si l'adresse du profil est vide (pas de ligne 1, code postal, ville) */
function profileAddressEmpty(p: ProfileRow | null): boolean {
  if (!p) return true
  const a1 = safeStr(p.adresse)
  const zip = safeStr(p.code_postal)
  const city = safeStr(p.ville)
  return !a1 && !zip && !city
}

/** Construit un Recipient à partir du profil (nom, prénom, email, téléphone, adresse) */
function recipientFromProfile(p: ProfileRow | null, fallbackEmail = ''): Recipient {
  if (!p || typeof p !== 'object') {
    return { full_name: '', email: fallbackEmail }
  }
  const nom = safeStr(p.nom)
  const prenom = safeStr(p.prenom)
  const fullName = [prenom, nom].filter(Boolean).join(' ').trim()
  return {
    full_name: fullName,
    email: safeStr(p.email) || fallbackEmail,
    phone: safeStr(p.telephone) || undefined,
    country_code: safeStr(p.country_code) || undefined,
    address1: safeStr(p.adresse) || undefined,
    address2: safeStr(p.address2) || undefined,
    zip: safeStr(p.code_postal) || undefined,
    city: safeStr(p.ville) || undefined,
    state: safeStr(p.state) || undefined,
  }
}

/** Fusionne l'adresse de billing dans un Recipient (sans écraser nom/email si déjà remplis) */
function mergeBillingAddressIntoRecipient(
  recipient: Recipient,
  ba: BillingAddressLike | null | undefined
): Recipient {
  if (!ba || typeof ba !== 'object') return recipient
  return {
    ...recipient,
    address1: recipient.address1 || safeStr(ba.address1 || ba.adresse) || undefined,
    address2: recipient.address2 || safeStr(ba.address2) || undefined,
    zip: recipient.zip || safeStr(ba.zip || ba.codePostal || ba.code_postal) || undefined,
    city: recipient.city || safeStr(ba.city || ba.ville) || undefined,
    state: recipient.state || safeStr(ba.state) || undefined,
    country_code: recipient.country_code || safeStr(ba.country_code || ba.pays) || undefined,
    phone: recipient.phone || safeStr(ba.telephone || ba.phone) || undefined,
  }
}

/**
 * Crée un client Supabase avec la clé service role (à n'appeler que côté serveur).
 * Nécessite NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY.
 */
function getSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Récupère le destinataire pour une commande :
 * - Lit le profil via order.user_id (full_name, email, phone, country_code, adresse)
 * - Si l'adresse manque sur le profil, complète avec order.billing_address
 * - Retourne un objet Recipient normalisé
 *
 * À appeler uniquement côté serveur (utilise la clé service role).
 */
export async function getRecipientForOrder(order: OrderForRecipient): Promise<Recipient> {
  const supabase = getSupabaseServiceClient()
  const billing = (order?.billing_address as BillingAddressLike) ?? null

  // Pas de Supabase : uniquement depuis billing_address si présent
  if (!supabase) {
    return recipientFromBillingAddress(billing)
  }

  // Avec user_id : charger le profil
  // Colonnes optionnelles (country_code, state, address2) : les ajouter au select si présentes dans la table profiles
  if (order?.user_id) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email, nom, prenom, telephone, adresse, code_postal, ville')
      .eq('id', order.user_id)
      .maybeSingle()

    if (error) {
      console.warn('[getRecipientForOrder] Erreur lecture profil:', error.message)
      return recipientFromBillingAddress(billing)
    }

    const baseEmail = (profile as ProfileRow)?.email
      ? safeStr((profile as ProfileRow).email)
      : ''
    let recipient = recipientFromProfile(profile as ProfileRow, baseEmail)

    // Fallback adresse : si le profil n'a pas d'adresse, prendre billing_address
    if (profileAddressEmpty(profile as ProfileRow) && billing) {
      recipient = mergeBillingAddressIntoRecipient(recipient, billing)
    }

    return recipient
  }

  // Pas de user_id : destinataire uniquement depuis billing_address
  return recipientFromBillingAddress(billing)
}
