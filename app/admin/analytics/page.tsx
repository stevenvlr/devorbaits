'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart3, TrendingUp, ShoppingCart, Package, DollarSign, Filter } from 'lucide-react'
import { getAllOrders, type Order } from '@/lib/revenue-supabase'
import { getPageViewsCount } from '@/lib/analytics-supabase'

type DateFilterType = 'all' | 'month' | 'year' | 'custom'

type RevenueLine = {
  date: string
  reference: string
  customer?: string
  paymentMethod?: string
  type: 'article' | 'frais_de_port'
  itemName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [visitsCount, setVisitsCount] = useState<number>(0)
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('all')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [lineTypeFilter, setLineTypeFilter] = useState<'all' | 'article' | 'frais_de_port'>('all')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const allOrders = await getAllOrders()
      setOrders(allOrders)
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRangeForViews = () => {
    // Retourne { startIso, endIso } inclusifs (end en fin de journée)
    if (dateFilterType === 'month') {
      const start = new Date(selectedYear, selectedMonth - 1, 1)
      const end = new Date(selectedYear, selectedMonth, 0)
      end.setHours(23, 59, 59, 999)
      return { startIso: start.toISOString(), endIso: end.toISOString() }
    }
    if (dateFilterType === 'year') {
      const start = new Date(selectedYear, 0, 1)
      const end = new Date(selectedYear, 11, 31)
      end.setHours(23, 59, 59, 999)
      return { startIso: start.toISOString(), endIso: end.toISOString() }
    }
    if (dateFilterType === 'custom') {
      if (!startDate || !endDate) return {}
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      return { startIso: start.toISOString(), endIso: end.toISOString() }
    }
    return {}
  }

  useEffect(() => {
    const loadViews = async () => {
      const range = getDateRangeForViews()
      const count = await getPageViewsCount({
        startDate: range.startIso,
        endDate: range.endIso
      })
      setVisitsCount(count)
    }
    loadViews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilterType, selectedMonth, selectedYear, startDate, endDate])

  // Filtrer les commandes selon les critères de date
  const getFilteredOrders = () => {
    let filtered = orders.filter(order => order.status === 'completed') // Seulement les commandes terminées

    if (dateFilterType === 'month') {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate.getMonth() + 1 === selectedMonth && orderDate.getFullYear() === selectedYear
      })
    } else if (dateFilterType === 'year') {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate.getFullYear() === selectedYear
      })
    } else if (dateFilterType === 'custom') {
      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999) // Fin de journée
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.created_at)
          return orderDate >= start && orderDate <= end
        })
      }
    }

    return filtered
  }

  const filteredOrders = useMemo(() => getFilteredOrders(), [
    orders,
    dateFilterType,
    selectedMonth,
    selectedYear,
    startDate,
    endDate
  ])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString('fr-FR') : iso
  }

  const buildItemName = (item: any): string => {
    const baseName = item?.produit || item?.product_name || item?.product_id || 'Article'

    const variantParts: string[] = []
    // Pop-up Duo : saveur + forme
    if (item?.saveur) variantParts.push(item.saveur)
    if (item?.forme) variantParts.push(item.forme)
    // Fallback ancien format
    if (!item?.saveur && item?.arome) variantParts.push(item.arome)
    if (!item?.forme && item?.taille) variantParts.push(item.taille)

    // Bar à Pop-up / autres : couleur, taille, arôme
    if (item?.couleur) variantParts.push(item.couleur)
    if (item?.taille && !variantParts.includes(item.taille)) variantParts.push(item.taille)
    if (item?.arome && !variantParts.includes(item.arome)) variantParts.push(item.arome)

    // Bouillettes : diamètre, conditionnement
    if (item?.diametre) variantParts.push(item.diametre)
    if (item?.conditionnement) variantParts.push(item.conditionnement)

    return variantParts.length > 0 ? `${baseName} - ${variantParts.join(' - ')}` : baseName
  }

  const escapeCsv = (value: any) => {
    const s = String(value ?? '')
    if (s.includes('"') || s.includes(';') || s.includes('\n')) {
      return `"${s.replaceAll('"', '""')}"`
    }
    return s
  }

  const getInferredShippingCost = (order: Order): number => {
    const explicit =
      order.shipping_cost !== undefined && order.shipping_cost !== null
        ? parseFloat(order.shipping_cost.toString())
        : 0
    if (Number.isFinite(explicit) && explicit > 0) return explicit

    // Fallback pour les anciennes commandes: total - somme des items
    const orderTotal = parseFloat(order.total?.toString?.() ?? '0') || 0
    const items: any[] = (order as any).items
    if (Array.isArray(items) && items.length > 0) {
      const itemsTotal = items.reduce((sum, it) => {
        const qty = parseFloat((it?.quantity ?? 0).toString()) || 0
        const price = parseFloat((it?.price ?? 0).toString()) || 0
        return sum + qty * price
      }, 0)
      const inferred = orderTotal - itemsTotal
      return Number.isFinite(inferred) && inferred > 0 ? inferred : 0
    }

    return 0
  }

  const revenueLines: RevenueLine[] = useMemo(() => {
    const lines: RevenueLine[] = []

    for (const order of filteredOrders) {
      const date = formatDate(order.created_at)
      const customer = (order as any).user_name || (order as any).user_email
      const paymentMethod = (order as any).payment_method
      const items: any[] = Array.isArray((order as any).items) ? (order as any).items : []

      for (const item of items) {
        const qty = parseFloat((item?.quantity ?? 0).toString()) || 0
        const unit = parseFloat((item?.price ?? 0).toString()) || 0
        lines.push({
          date,
          reference: order.reference,
          customer,
          paymentMethod,
          type: 'article',
          itemName: buildItemName(item),
          quantity: qty,
          unitPrice: unit,
          lineTotal: qty * unit
        })
      }

      const shipping = getInferredShippingCost(order)
      if (shipping > 0) {
        lines.push({
          date,
          reference: order.reference,
          customer,
          paymentMethod,
          type: 'frais_de_port',
          itemName: 'Frais de port',
          quantity: 1,
          unitPrice: shipping,
          lineTotal: shipping
        })
      }
    }

    return lines
  }, [filteredOrders])

  const visibleRevenueLines = useMemo(() => {
    if (lineTypeFilter === 'all') return revenueLines
    return revenueLines.filter((l) => l.type === lineTypeFilter)
  }, [revenueLines, lineTypeFilter])

  const exportCsv = () => {
    const header = [
      'Date',
      'Référence',
      'Client',
      'Paiement',
      'Type',
      'Article',
      'Quantité',
      'Prix unitaire',
      'Total ligne'
    ]

    const rows = visibleRevenueLines.map((l) => [
      escapeCsv(l.date),
      escapeCsv(l.reference),
      escapeCsv(l.customer ?? ''),
      escapeCsv(l.paymentMethod ?? ''),
      escapeCsv(l.type === 'article' ? 'Article' : 'Frais de port'),
      escapeCsv(l.itemName),
      escapeCsv(l.quantity),
      escapeCsv(l.unitPrice.toFixed(2)),
      escapeCsv(l.lineTotal.toFixed(2))
    ])

    const csv = ['\uFEFF' + header.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ca-detaille-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Calculer les statistiques
  const stats = {
    totalOrders: filteredOrders.length,
    totalRevenue: filteredOrders.reduce((sum, order) => {
      const orderTotal = parseFloat(order.total.toString()) || 0
      const shippingCost = getInferredShippingCost(order)
      return sum + (orderTotal - shippingCost) // CA sans frais d'expédition
    }, 0),
    totalShippingCosts: filteredOrders.reduce((sum, order) => {
      return sum + getInferredShippingCost(order)
    }, 0),
    totalWithShipping: filteredOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.total.toString()) || 0)
    }, 0)
  }

  // Générer les années disponibles (dernières 5 années)
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // Générer les mois
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics</h1>
          <p className="text-gray-400">Statistiques et analyses de votre boutique</p>
        </div>

        {/* Filtres de date */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Filtres de date</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type de filtre */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Période</label>
              <select
                value={dateFilterType}
                onChange={(e) => setDateFilterType(e.target.value as DateFilterType)}
                className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
              >
                <option value="all">Toutes les périodes</option>
                <option value="month">Par mois</option>
                <option value="year">Par année</option>
                <option value="custom">Dates personnalisées</option>
              </select>
            </div>

            {/* Filtre par mois */}
            {dateFilterType === 'month' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Mois</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Année</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Filtre par année */}
            {dateFilterType === 'year' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Année</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtre par dates personnalisées */}
            {dateFilterType === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Date de début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Commandes</h3>
              <ShoppingCart className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalOrders}</p>
            <p className="text-xs text-gray-500 mt-1">Commandes terminées</p>
          </div>

          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Visites</h3>
              <BarChart3 className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-white">{visitsCount}</p>
            <p className="text-xs text-gray-500 mt-1">Pages vues (période)</p>
          </div>

          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Chiffre d'affaires</h3>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalRevenue.toFixed(2)} €</p>
            <p className="text-xs text-gray-500 mt-1">Sans frais d'expédition</p>
          </div>

          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Frais d'expédition</h3>
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalShippingCosts.toFixed(2)} €</p>
            <p className="text-xs text-gray-500 mt-1">Total des frais</p>
          </div>

          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Total avec expédition</h3>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalWithShipping.toFixed(2)} €</p>
            <p className="text-xs text-gray-500 mt-1">CA brut</p>
          </div>
        </div>

        {/* Détails */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Détails</h2>
          </div>
          
          {loading ? (
            <p className="text-gray-400">Chargement des données...</p>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-noir-900/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Période sélectionnée</p>
                  <p className="text-lg font-semibold text-white">
                    {dateFilterType === 'all' && 'Toutes les périodes'}
                    {dateFilterType === 'month' && `${months[selectedMonth - 1]} ${selectedYear}`}
                    {dateFilterType === 'year' && `Année ${selectedYear}`}
                    {dateFilterType === 'custom' && startDate && endDate && `${new Date(startDate).toLocaleDateString('fr-FR')} - ${new Date(endDate).toLocaleDateString('fr-FR')}`}
                    {dateFilterType === 'custom' && (!startDate || !endDate) && 'Sélectionnez des dates'}
                  </p>
                </div>
                <div className="bg-noir-900/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Panier moyen</p>
                  <p className="text-lg font-semibold text-white">
                    {stats.totalOrders > 0 
                      ? (stats.totalRevenue / stats.totalOrders).toFixed(2) + ' €'
                      : '0.00 €'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Liste détaillée du CA */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 mt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-bold">Liste détaillée du chiffre d&apos;affaires</h2>
              <p className="text-gray-400 text-sm">
                Lignes par article + frais de port (export CSV compatible Excel).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex flex-col sm:flex-row gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-300">Du</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setDateFilterType('custom')
                      setStartDate(e.target.value)
                    }}
                    className="px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-300">Au</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setDateFilterType('custom')
                      setEndDate(e.target.value)
                    }}
                    className="px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-300">Afficher</label>
                <select
                  value={lineTypeFilter}
                  onChange={(e) => setLineTypeFilter(e.target.value as any)}
                  className="px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                >
                  <option value="all">Tout</option>
                  <option value="article">Articles uniquement</option>
                  <option value="frais_de_port">Frais de port uniquement</option>
                </select>
              </div>

              <button
                onClick={exportCsv}
                disabled={loading || visibleRevenueLines.length === 0}
                className="px-4 py-2 rounded-lg bg-yellow-500 text-noir-950 font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Exporter en CSV
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-400">Chargement des lignes...</p>
          ) : visibleRevenueLines.length === 0 ? (
            <p className="text-gray-400">Aucune donnée sur la période sélectionnée.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-300 border-b border-noir-700">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Référence</th>
                    <th className="py-2 pr-4">Client</th>
                    <th className="py-2 pr-4">Paiement</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Article</th>
                    <th className="py-2 pr-4">Qté</th>
                    <th className="py-2 pr-4">PU</th>
                    <th className="py-2 pr-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRevenueLines.map((l, idx) => (
                    <tr key={`${l.reference}-${l.type}-${idx}`} className="border-b border-noir-900/60">
                      <td className="py-2 pr-4 text-gray-300">{l.date}</td>
                      <td className="py-2 pr-4 text-white font-medium">{l.reference}</td>
                      <td className="py-2 pr-4 text-gray-300">{l.customer || '-'}</td>
                      <td className="py-2 pr-4 text-gray-300">{l.paymentMethod || '-'}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            l.type === 'article'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {l.type === 'article' ? 'Article' : 'Frais de port'}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-white">{l.itemName}</td>
                      <td className="py-2 pr-4 text-gray-300">{l.quantity}</td>
                      <td className="py-2 pr-4 text-gray-300">{l.unitPrice.toFixed(2)} €</td>
                      <td className="py-2 pr-4 text-white font-semibold">{l.lineTotal.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

