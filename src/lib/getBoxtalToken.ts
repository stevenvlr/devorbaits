/**
 * Récupère un token d'accès Boxtal depuis l'Edge Function Supabase
 * @returns {Promise<string>} Le token d'accès Boxtal
 * @throws {Error} Si la requête échoue ou si le token n'est pas retourné
 */
export async function getBoxtalToken(): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Vérifier que les variables d'environnement sont configurées
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL n\'est pas configuré')
  }

  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY n\'est pas configuré')
  }

  const endpoint = `${supabaseUrl}/functions/v1/boxtal-token`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    // Si la réponse n'est pas OK, throw avec le message d'erreur
    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // Si le body n'est pas du JSON, utiliser le texte brut
        const errorText = await response.text().catch(() => '')
        if (errorText) {
          errorMessage = errorText
        }
      }

      throw new Error(`Échec de la récupération du token Boxtal: ${errorMessage} (status: ${response.status})`)
    }

    // Parser la réponse JSON
    const data = await response.json()

    // Vérifier que le token est présent
    if (!data.accessToken) {
      throw new Error('Le token d\'accès n\'a pas été retourné par l\'Edge Function')
    }

    return data.accessToken
  } catch (error) {
    // Si c'est déjà une Error avec un message, la relancer
    if (error instanceof Error) {
      throw error
    }
    
    // Sinon, créer une nouvelle Error
    throw new Error(`Erreur lors de l'appel à l'Edge Function Boxtal: ${String(error)}`)
  }
}
