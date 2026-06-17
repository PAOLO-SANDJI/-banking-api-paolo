import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { comptesAPI, transactionsAPI } from '../api/banking'
import Layout from '../components/Layout'

export default function Transactions() {
  const [comptes, setComptes] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('tous')

  useEffect(() => {
    async function load() {
      try {
        const res = await comptesAPI.lister()
        const liste = res.data.donnees || []
        setComptes(liste)

        const txnsPromises = liste.map((c) =>
          transactionsAPI.historique(c.id)
            .then((r) => (r.data.donnees || []).map((t) => ({
              ...t,
              compteNom: `${c.prenom} ${c.nom}`,
              compteId: c.id,
            })))
            .catch(() => [])
        )
        const all = (await Promise.all(txnsPromises)).flat()
        all.sort((a, b) => new Date(b.date) - new Date(a.date))
        setTransactions(all)
      } catch {
        // silencieux
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = filtre === 'tous'
    ? transactions
    : transactions.filter((t) => t.type === filtre)

  const totalDepots = transactions
    .filter((t) => t.type === 'depot')
    .reduce((s, t) => s + parseFloat(t.montant?.replace(' FCFA', '') || 0), 0)

  const totalRetraits = transactions
    .filter((t) => t.type === 'retrait')
    .reduce((s, t) => s + parseFloat(t.montant?.replace(' FCFA', '') || 0), 0)

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">Historique de toutes vos opérations</p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card border border-gray-100">
            <p className="text-sm text-gray-500">Total opérations</p>
            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
          </div>
          <div className="card border border-green-100">
            <p className="text-sm text-green-600">Total dépôts</p>
            <p className="text-2xl font-bold text-green-700">+{totalDepots.toFixed(2)} FCFA</p>
          </div>
          <div className="card border border-red-100">
            <p className="text-sm text-red-500">Total retraits</p>
            <p className="text-2xl font-bold text-red-600">-{totalRetraits.toFixed(2)} FCFA</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-4">
          {['tous', 'depot', 'retrait'].map((f) => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtre === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'tous' ? 'Toutes' : f === 'depot' ? 'Dépôts' : 'Retraits'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500">Aucune transaction</p>
            {comptes.length === 0 && (
              <Link to="/comptes" className="btn-primary inline-block mt-3 text-sm">
                Créer un compte
              </Link>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Compte</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">Montant</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          t.type === 'depot' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {t.type === 'depot' ? '📥' : '📤'} {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/comptes/${t.compteId}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {t.compteNom}
                        </Link>
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${
                        t.type === 'depot' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {t.type === 'depot' ? '+' : '-'}{t.montant}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 text-xs">{t.date}</td>
                      <td className="py-3 px-4 text-gray-300 font-mono text-xs">{t.id.slice(0, 8)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
