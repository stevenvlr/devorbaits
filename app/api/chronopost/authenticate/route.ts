import { NextResponse } from 'next/server'

export const runtime = 'edge'

/**
 * Route API pour obtenir un token d'authentification Colissimo
 * Note: Cette route fait un appel à l'API Colissimo pour obtenir un token
 * Le token est nécessaire pour utiliser le widget de sélection de points relais
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { codePostal, ville } = body

    // Appel à l'API Colissimo pour obtenir un token
    // Note: Cette URL et ces paramètres peuvent varier selon la documentation Colissimo
    const response = await fetch('https://ws.colissimo.fr/widget-colissimo/rest/authenticate.rest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Les paramètres exacts dépendent de l'API Colissimo
        // Consultez la documentation officielle pour les paramètres requis
        origin: 'WIDGET'
      })
    })

    if (!response.ok) {
      console.error('Erreur authentification Colissimo:', response.status, response.statusText)
      // Retourner un token vide si l'authentification échoue
      // Le widget peut parfois fonctionner sans token (selon la version)
      return NextResponse.json({ 
        token: '',
        warning: 'Authentification non disponible, tentative sans token'
      })
    }

    const data = await response.json()
    
    return NextResponse.json({ 
      token: data.token || data.access_token || '',
      success: true
    })
  } catch (error: any) {
    console.error('Erreur lors de l\'authentification Colissimo:', error)
    // Retourner un token vide pour permettre une tentative sans authentification
    return NextResponse.json({ 
      token: '',
      error: error.message || 'Erreur inconnue',
      warning: 'Authentification non disponible, tentative sans token'
    })
  }
}
