import { NextResponse } from 'next/server'

/**
 * Route API pour rechercher des points relais Chronopost
 * Utilise le site web Chronopost pour récupérer les points relais
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const codePostal = searchParams.get('codePostal')
    const ville = searchParams.get('ville') || ''

    if (!codePostal || codePostal.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Code postal requis (5 chiffres minimum)' },
        { status: 400 }
      )
    }

    // Méthode : Récupérer les données depuis la page de recherche Chronopost
    try {
      // URL de la page de recherche Chronopost
      const searchUrl = `https://www.chronopost.fr/point-relais/recherche?codePostal=${codePostal}${ville ? `&ville=${encodeURIComponent(ville)}` : ''}`
      
      // Récupérer le HTML de la page
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9'
        }
      })

      if (response.ok) {
        const html = await response.text()
        
        // Essayer d'extraire les données JSON depuis le HTML (si Chronopost les inclut)
        // Chercher des scripts JSON ou des données structurées
        // Utilisation de [\s\S] au lieu de . avec flag s pour compatibilité ES5
        const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});/) || 
                         html.match(/var\s+relayPoints\s*=\s*(\[[\s\S]+?\]);/) ||
                         html.match(/data-relay-points=["']([^"']+)["']/)
        
        if (jsonMatch) {
          try {
            const data = JSON.parse(jsonMatch[1])
            const points = Array.isArray(data) ? data : (data.points || data.relayPoints || [])
            
            if (points.length > 0) {
              const formattedPoints = points
                .map((point: any) => ({
                  identifiant: point.code || point.id || point.identifiant || '',
                  nom: point.name || point.nom || point.libelle || '',
                  adresse: point.address || point.adresse || point.street || '',
                  codePostal: point.postalCode || point.codePostal || codePostal,
                  ville: point.city || point.ville || ville,
                  telephone: point.phone || point.telephone || '',
                  horaires: point.openingHours || point.horaires || ''
                }))
                .filter((p: any) => p.nom)
              
              if (formattedPoints.length > 0) {
                return NextResponse.json({
                  success: true,
                  points: formattedPoints
                })
              }
            }
          } catch (parseError) {
            console.log('Erreur parsing JSON:', parseError)
          }
        }
        
        // Si pas de JSON, essayer de parser le HTML pour extraire les points relais
        // Cette méthode est plus fragile mais peut fonctionner
        const points: any[] = []
        
        // Chercher les éléments de points relais dans le HTML
        // Format typique : divs avec des classes spécifiques
        // Utilisation de exec() au lieu de matchAll() pour compatibilité ES5
        const relayRegex = /<div[^>]*class="[^"]*relay[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
        let match: RegExpExecArray | null
        
        while ((match = relayRegex.exec(html)) !== null) {
          const pointHtml = match[1]
          const nameMatch = pointHtml.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i)
          const addressMatch = pointHtml.match(/<p[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)<\/p>/i)
          
          if (nameMatch) {
            points.push({
              identifiant: `AUTO-${points.length + 1}`,
              nom: nameMatch[1].trim(),
              adresse: addressMatch ? addressMatch[1].trim() : '',
              codePostal: codePostal,
              ville: ville
            })
          }
        }
        
        if (points.length > 0) {
          return NextResponse.json({
            success: true,
            points: points.slice(0, 20) // Limiter à 20 points
          })
        }
      }
    } catch (scrapeError) {
      console.log('Erreur scraping:', scrapeError)
    }

    // Essayer plusieurs méthodes pour récupérer les points relais
    
    // Méthode 1 : API publique Chronopost (POST)
    try {
      const postResponse = await fetch('https://www.chronopost.fr/tracking-cxf/TrackingServiceWS/findRelayPoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({
          zipCode: codePostal,
          countryCode: 'FR',
          maxPointRelais: 20
        })
      })

      if (postResponse.ok) {
        const data = await postResponse.json()
        console.log('Réponse API Chronopost:', JSON.stringify(data).substring(0, 500))
        
        // Adapter selon le format de réponse
        const rawPoints = data.pointRelais || data.points || data.list || data.return || data || []
        const pointsArray = Array.isArray(rawPoints) ? rawPoints : [rawPoints]
        
        const formattedPoints = pointsArray
          .map((point: any) => ({
            identifiant: point.code || point.id || point.identifiant || point.codeRelais || point.codePointRelais || '',
            nom: point.name || point.nom || point.libelle || point.nomPointRelais || point.namePointRelais || '',
            adresse: point.address?.street || point.adresse || point.street || point.adressePointRelais || point.addressPointRelais || point.adresseComplete || '',
            codePostal: point.address?.postalCode || point.codePostal || point.postalCode || point.codePostalPointRelais || point.postalCodePointRelais || codePostal,
            ville: point.address?.city || point.ville || point.city || point.localite || point.villePointRelais || point.cityPointRelais || ville,
            coordonnees: (point.coordinates || point.coordonnees || point.latitude) ? {
              latitude: point.coordinates?.latitude || point.coordonnees?.latitude || point.latitude || 0,
              longitude: point.coordinates?.longitude || point.coordonnees?.longitude || point.longitude || 0
            } : undefined,
            horaires: point.openingHours || point.horaires || point.horairesOuverture || point.horairesPointRelais || point.openingHoursPointRelais || '',
            telephone: point.phone || point.telephone || point.telephonePointRelais || point.phonePointRelais || ''
          }))
          .filter((p: any) => p.identifiant && p.nom)
        
        if (formattedPoints.length > 0) {
          return NextResponse.json({
            success: true,
            points: formattedPoints
          })
        }
      }
    } catch (postErr) {
      console.log('Méthode POST échouée:', postErr)
    }

    // Méthode 2 : Essayer avec GET
    const possibleEndpoints = [
      `https://www.chronopost.fr/tracking-cxf/TrackingServiceWS/findRelayPoint?zipCode=${codePostal}&countryCode=FR&maxPointRelais=20`,
      `https://www.chronopost.fr/point-relais/ws/pointRelais/findRelayPoint?zipCode=${codePostal}&countryCode=FR`,
      `https://api.chronopost.fr/point-relais/ws/pointRelais/findRelayPoint?zipCode=${codePostal}&countryCode=FR`
    ]

    for (const endpoint of possibleEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Réponse GET:', JSON.stringify(data).substring(0, 500))
          
          // Adapter selon le format de réponse
          const rawPoints = data.pointRelais || data.points || data.list || data.return || data || []
          const pointsArray = Array.isArray(rawPoints) ? rawPoints : [rawPoints]
          
          const formattedPoints = pointsArray
            .map((point: any) => ({
              identifiant: point.code || point.id || point.identifiant || point.codeRelais || point.codePointRelais || '',
              nom: point.name || point.nom || point.libelle || point.nomPointRelais || point.namePointRelais || '',
              adresse: point.address?.street || point.adresse || point.street || point.adressePointRelais || point.addressPointRelais || point.adresseComplete || '',
              codePostal: point.address?.postalCode || point.codePostal || point.postalCode || point.codePostalPointRelais || point.postalCodePointRelais || codePostal,
              ville: point.address?.city || point.ville || point.city || point.localite || point.villePointRelais || point.cityPointRelais || ville,
              coordonnees: (point.coordinates || point.coordonnees || point.latitude) ? {
                latitude: point.coordinates?.latitude || point.coordonnees?.latitude || point.latitude || 0,
                longitude: point.coordinates?.longitude || point.coordonnees?.longitude || point.longitude || 0
              } : undefined,
              horaires: point.openingHours || point.horaires || point.horairesOuverture || point.horairesPointRelais || point.openingHoursPointRelais || '',
              telephone: point.phone || point.telephone || point.telephonePointRelais || point.phonePointRelais || ''
            }))
            .filter((p: any) => p.identifiant && p.nom)
          
          if (formattedPoints.length > 0) {
            return NextResponse.json({
              success: true,
              points: formattedPoints
            })
          }
        }
      } catch (err) {
        console.log(`Endpoint ${endpoint} échoué, essai suivant...`)
        continue
      }
    }

    // Si aucun endpoint ne fonctionne
    return NextResponse.json({
      success: false,
      error: 'Impossible de récupérer les points relais depuis l\'API Chronopost',
      message: 'Vous pouvez rechercher manuellement sur chronopost.fr',
      link: `https://www.chronopost.fr/point-relais/recherche?codePostal=${codePostal}`
    })

  } catch (error: any) {
    console.error('Erreur recherche points relais Chronopost:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erreur lors de la recherche de points relais'
      },
      { status: 500 }
    )
  }
}
