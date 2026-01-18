'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Mail, MapPin, Phone, RefreshCw, Search, Shield, User as UserIcon, Users } from 'lucide-react'
import { getAllUsers, type User } from '@/lib/auth-supabase'

export default function AdminClientsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await getAllUsers()
      setUsers(all)
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && (u.role || 'user') !== roleFilter) return false
      if (!q) return true
      const haystack = [
        u.email,
        u.nom,
        u.prenom,
        u.telephone || '',
        u.adresse || '',
        u.codePostal || '',
        u.ville || '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [users, search, roleFilter])

  const stats = useMemo(() => {
    const admins = users.filter((u) => (u.role || 'user') === 'admin').length
    const clients = users.filter((u) => (u.role || 'user') !== 'admin').length
    return { total: users.length, admins, clients }
  }, [users])

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'admin
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-4">
            <Users className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">GESTION DES CLIENTS</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Comptes clients</h1>
          <p className="text-gray-400">Consultez tous les comptes (email, téléphone, adresse, rôle).</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-noir-800/50 border border-noir-700 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Clients</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.clients}</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Admins</p>
            <p className="text-2xl font-bold text-purple-400">{stats.admins}</p>
          </div>
        </div>

        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (email, nom, téléphone, ville...)"
                className="w-full pl-10 pr-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="all">Tous</option>
                <option value="user">Clients</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <button
              type="button"
              onClick={loadUsers}
              className="inline-flex items-center gap-2 px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white hover:border-yellow-500/50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement des clients...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun compte trouvé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => (
              <div key={u.id} className="bg-noir-800/50 border border-noir-700 rounded-xl p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <UserIcon className="w-4 h-4 text-yellow-500" />
                      <p className="text-lg font-bold text-white">
                        {(u.nom || u.prenom) ? `${u.nom} ${u.prenom}`.trim() : u.email}
                      </p>
                      {(u.role || 'user') === 'admin' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          admin
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{u.email}</span>
                      </p>
                      {u.telephone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{u.telephone}</span>
                        </p>
                      )}
                      {(u.adresse || u.codePostal || u.ville) && (
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>
                            {[u.adresse, [u.codePostal, u.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Créé le : {new Date(u.dateCreation).toLocaleString('fr-FR')}
                      </p>
                      <p className="text-xs text-gray-500 font-mono break-all">
                        ID : {u.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

