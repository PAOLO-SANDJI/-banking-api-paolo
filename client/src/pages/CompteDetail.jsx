import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { comptesAPI, transactionsAPI } from '../api/banking'
import Layout from '../components/Layout'
import AlertMessage from '../components/AlertMessage'

export default function CompteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [compte, setCompte] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [montantDepot, setMontantDepot] = useState('')
  const [montantRetrait, setMontantRetrait] = useState('')
  const [alert, setAlert] = useState({ type: '', message: '' })
  const [actionLoading, setActionLoading] = useState(null)

  async function charger() {
    try {
      const [cRes, tRes] = await Promise.all([
        comptesAPI.consulter(id),
        transactionsAPI.historique(id),
      ])
      setCompte(cRes.data.donnees)
      setTransactions(tRes.data.donnees || [])
    } catch {
      navigate('/comptes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger() }, [id])

  function showAlert(type, message) {
    setAlert({ type, message })
    setTimeout(() => setAlert({ type: '', message: '' }), 4000)
  }

  async function handleDepot(e) {
    e.preventDefault()
    const montant = parseFloat(montantDepot)
    if (isNaN(montant) || montant <= 0) return showAlert('error', 'Montant invalide.')
    setActionLoading('depot')
    try {
      const res = await transactionsAPI.depot(id, montant)
      setCompte(res.data.donnees)
      setMontantDepot('')
      showAlert('success', res.data.message)
      await charger()
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Erreur lors du dépôt.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRetrait(e) {
    e.preventDefault()
    const montant = parseFloat(montantRetrait)
    if (isNaN(montant) || montant <= 0) return showAlert('error', 'Montant invalide.')
    setActionLoading('retrait')
    try {
      const res = await transactionsAPI.retrait(id, montant)
      setCompte(res.data.donnees)
      setMontantRetrait('')
      showAlert('success', res.data.message)
      await charger()
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Erreur lors du retrait.')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </Layout>
    )
  }

  if (!compte) return null

  return (
    <Layout>
      <div className="p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/comptes" className="hover:text-blue-600">Mes comptes</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">{compte.prenom} {compte.nom}</span>
        </div>

        {/* Header compte */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-200 text-sm">Compte de</p>
              <h1 className="text-2xl font-bold mt-1">{compte.prenom} {compte.nom}</h1>
              <p className="text-blue-300 font-mono text-xs mt-1">{compte.id}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-sm">Solde disponible</p>
              <p className="text-3xl font-bold mt-1">{compte.solde}</p>
            </div>
          </div>
          <p className="text-blue-300 text-xs mt-4">Créé le {compte.dateCreation}</p>
        </div>

        <AlertMessage type={alert.type || 'info'} message={alert.message} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Dépôt */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">📥</div>
              <h2 className="text-lg font-bold text-gray-900">Effectuer un dépôt</h2>
            </div>
            <form onSubmit={handleDepot} className="space-y-3">
              <div>
                <label className="label">Montant (FCFA)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={montantDepot}
                  onChange={(e) => setMontantDepot(e.target.value)}
                  placeholder="Ex : 5000"
                  className="input"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading === 'depot'}
                className="btn-success w-full"
              >
                {actionLoading === 'depot' ? 'Traitement...' : 'Déposer'}
              </button>
            </form>
          </div>

          {/* Retrait */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl">📤</div>
              <h2 className="text-lg font-bold text-gray-900">Effectuer un retrait</h2>
            </div>
            <form onSubmit={handleRetrait} className="space-y-3">
              <div>
                <label className="label">Montant (FCFA)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={montantRetrait}
                  onChange={(e) => setMontantRetrait(e.target.value)}
                  placeholder="Ex : 2000"
                  className="input"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading === 'retrait'}
                className="btn-danger w-full"
              >
                {actionLoading === 'retrait' ? 'Traitement...' : 'Retirer'}
              </button>
            </form>
          </div>
        </div>

        {/* Historique */}
        <div className="card mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Historique des transactions
            <span className="ml-2 text-sm font-normal text-gray-400">({transactions.length})</span>
          </h2>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-gray-400 text-sm">Aucune transaction sur ce compte</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Type</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Montant</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {[...transactions].reverse().map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          t.type === 'depot'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {t.type === 'depot' ? '📥' : '📤'} {t.type}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${
                        t.type === 'depot' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {t.type === 'depot' ? '+' : '-'}{t.montant}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-500 text-xs">{t.date}</td>
                      <td className="py-3 px-3 text-gray-300 font-mono text-xs">{t.id.slice(0, 8)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
