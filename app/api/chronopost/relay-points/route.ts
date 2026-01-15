import { NextResponse } from 'next/server'

/**
 * Route API pour rechercher des points relais Chronopost
 * Utilise plusieurs méthodes pour garantir la fiabilité
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

    console.log(`🔍 Recherche points relais Chronopost pour ${codePostal} ${ville}`)

    // Méthode 1 : API Colissimo/Chronopost avec recherche par code postal
    const methods = [
      // Méthode 1.1 : API Colissimo widget
      async () => {
        try {
          const response = await fetch('https://ws.colissimo.fr/widget-colissimo/rest/findRDVPointRetraitAcheminement', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              zipCode: codePostal,
              city: ville,
              countryCode: 'FR',
              maxPointRetrait: 20
            })
          })

          if (response.ok) {
            const data = await response.json()
            const points = data.pointRetraitAcheminement || data.points || data.list || []
            if (Array.isArray(points) && points.length > 0) {
              return formatPoints(points, codePostal, ville)
            }
          }
        } catch (e) {
          console.log('Méthode 1.1 échouée')
        }
        return null
      },

      // Méthode 1.2 : API Chronopost tracking
      async () => {
        try {
          const response = await fetch('https://www.chronopost.fr/tracking-cxf/TrackingServiceWS/findRelayPoint', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              zipCode: codePostal,
              countryCode: 'FR',
              maxPointRelais: 20
            })
          })

          if (response.ok) {
            const data = await response.json()
            const points = data.pointRelais || data.points || data.list || data.return || []
            if (Array.isArray(points) && points.length > 0) {
              return formatPoints(points, codePostal, ville)
            }
          }
        } catch (e) {
          console.log('Méthode 1.2 échouée')
        }
        return null
      },

      // Méthode 2 : Désactivée (API Boxtal supprimée)
      async () => {
        return null
      }
    ]

    // Essayer chaque méthode jusqu'à ce qu'une fonctionne
    for (const method of methods) {
      try {
        const points = await method()
        if (points && points.length > 0) {
          console.log(`✅ ${points.length} points relais trouvés`)
          return NextResponse.json({
            success: true,
            points: points
          })
        }
      } catch (error) {
        console.log('Erreur méthode:', error)
        continue
      }
    }

    // Si aucune méthode ne fonctionne
    return NextResponse.json({
      success: false,
      error: 'Aucun point relais trouvé. Vous pouvez saisir manuellement les informations.',
      message: 'Les APIs publiques ne sont pas disponibles. Utilisez le formulaire de saisie manuelle.'
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

// Fonction pour formater les points relais
function formatPoints(points: any[], codePostal: string, ville: string) {
  return points
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
    .filter((p: any) => p.nom && p.identifiant) // Filtrer les points invalides
}
