import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { comptesAPI, transactionsAPI } from '../api/banking'
import Layout from '../components/Layout'

function StatCard({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
  }
  return (
    <div className={`card border ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [comptes, setComptes] = useState([])
  const [recentTxns, setRecentTxns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await comptesAPI.lister()
        const liste = res.data.donnees || []
        setComptes(liste)

        // Récupérer les dernières transactions de tous les comptes
        const txnsPromises = liste.map((c) =>
          transactionsAPI.historique(c.id).then((r) => r.data.donnees || []).catch(() => [])
        )
        const allTxns = (await Promise.all(txnsPromises)).flat()
        // Trier par date décroissante et prendre les 5 dernières
        allTxns.sort((a, b) => new Date(b.date) - new Date(a.date))
        setRecentTxns(allTxns.slice(0, 5))
      } catch {
        // silencieux
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Calculer le solde total (extraire le nombre depuis "XXXX.XX FCFA")
  const soldeTotalRaw = comptes.reduce((acc, c) => {
    const n = parseFloat(c.solde?.replace(' FCFA', '').replace(',', '.') || 0)
    return acc + (isNaN(n) ? 0 : n)
  }, 0)

  const heure = new Date().getHours()
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bonsoir' : 'Bonsoir'

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {salutation}, {user?.prenom} 👋
          </h1>
          <p className="text-gray-500 mt-1">Voici un aperçu de vos finances</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Solde total"
                value={`${soldeTotalRaw.toFixed(2)} FCFA`}
                sub="Tous comptes confondus"
                color="blue"
                icon="💰"
              />
              <StatCard
                label="Comptes actifs"
                value={comptes.length}
                sub={comptes.length === 0 ? 'Aucun compte' : 'compte(s)'}
                color="green"
                icon="💳"
              />
              <StatCard
                label="Transactions récentes"
                value={recentTxns.length}
                sub="Dernières opérations"
                color="purple"
                icon="↔️"
              />
              <StatCard
                label="Dépôts récents"
                value={recentTxns.filter((t) => t.type === 'depot').length}
                sub="Sur les 5 dernières"
                color="orange"
                icon="📥"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mes comptes */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Mes comptes</h2>
                  <Link to="/comptes" className="text-blue-600 text-sm font-medium hover:underline">
                    Voir tout →
                  </Link>
                </div>
                {comptes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">Aucun compte bancaire</p>
                    <Link to="/comptes" className="btn-primary inline-block mt-3 text-sm">
                      Créer un compte
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comptes.slice(0, 4).map((c) => (
                      <Link
                        key={c.id}
                        to={`/comptes/${c.id}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                            {c.prenom?.[0]}{c.nom?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{c.prenom} {c.nom}</p>
                            <p className="text-xs text-gray-400 font-mono">{c.id.slice(0, 8)}…</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{c.solde}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Transactions récentes */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Dernières transactions</h2>
                  <Link to="/transactions" className="text-blue-600 text-sm font-medium hover:underline">
                    Voir tout →
                  </Link>
                </div>
                {recentTxns.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">Aucune transaction</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTxns.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${
                            t.type === 'depot' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {t.type === 'depot' ? '📥' : '📤'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 capitalize">{t.type}</p>
                            <p className="text-xs text-gray-400">{t.date}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${
                          t.type === 'depot' ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {t.type === 'depot' ? '+' : '-'}{t.montant}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
