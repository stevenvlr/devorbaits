import { NextResponse } from 'next/server'
import { searchBoxtalPickupPoints } from '@/lib/boxtal-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postalCode = searchParams.get('postalCode')
    const city = searchParams.get('city') || undefined
    const country = searchParams.get('country') || 'FR'
    const radius = parseInt(searchParams.get('radius') || '10')

    if (!postalCode) {
      return NextResponse.json(
        { success: false, error: 'Le code postal est requis' },
        { status: 400 }
      )
    }

    const result = await searchBoxtalPickupPoints(postalCode, city, country, radius)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erreur lors de la recherche' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, points: result.points })
  } catch (error: any) {
    console.error('Erreur API recherche points relais:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}




