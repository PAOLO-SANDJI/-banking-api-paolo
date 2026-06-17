import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { comptesAPI } from '../api/banking'
import Layout from '../components/Layout'
import AlertMessage from '../components/AlertMessage'

function ModalCreer({ onClose, onCreated }) {
  const [form, setForm] = useState({ nom: '', prenom: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await comptesAPI.creer(form)
      onCreated(res.data.donnees)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.erreur || 'Erreur lors de la création.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Nouveau compte bancaire</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prénom</label>
              <input
                className="input"
                placeholder="Paolo"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Nom</label>
              <input
                className="input"
                placeholder="Sandji"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
              />
            </div>
          </div>
          <AlertMessage type="error" message={error} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Comptes() {
  const [comptes, setComptes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [success, setSuccess] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  async function charger() {
    try {
      const res = await comptesAPI.lister()
      setComptes(res.data.donnees || [])
    } catch {
      // silencieux
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger() }, [])

  function handleCreated(compte) {
    setComptes((prev) => [compte, ...prev])
    setShowModal(false)
    setSuccess(`Compte de ${compte.prenom} ${compte.nom} créé avec succès.`)
    setTimeout(() => setSuccess(''), 4000)
  }

  async function handleDelete(id) {
    try {
      await comptesAPI.supprimer(id)
      setComptes((prev) => prev.filter((c) => c.id !== id))
      setSuccess('Compte supprimé avec succès.')
      setTimeout(() => setSuccess(''), 4000)
    } catch {
      // silencieux
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes comptes</h1>
            <p className="text-gray-500 text-sm mt-1">{comptes.length} compte(s) bancaire(s)</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <span className="text-lg">+</span> Nouveau compte
          </button>
        </div>

        <AlertMessage type="success" message={success} />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : comptes.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">💳</p>
            <p className="text-gray-500 font-medium">Aucun compte bancaire</p>
            <p className="text-gray-400 text-sm mt-1">Créez votre premier compte pour commencer</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
              Créer un compte
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {comptes.map((c) => (
              <div key={c.id} className="card hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold">
                      {c.prenom?.[0]}{c.nom?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{c.prenom} {c.nom}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.id.slice(0, 12)}…</p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Actif</span>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white mb-4">
                  <p className="text-blue-200 text-xs mb-1">Solde disponible</p>
                  <p className="text-2xl font-bold">{c.solde}</p>
                </div>

                <p className="text-xs text-gray-400 mb-4">Créé le {c.dateCreation}</p>

                <div className="flex gap-2">
                  <Link
                    to={`/comptes/${c.id}`}
                    className="btn-primary flex-1 text-center text-sm py-2"
                  >
                    Gérer
                  </Link>
                  {deleteId === c.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="btn-danger text-xs px-3 py-2"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="btn-secondary text-xs px-3 py-2"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteId(c.id)}
                      className="btn-danger text-sm px-3 py-2"
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <ModalCreer onClose={() => setShowModal(false)} onCreated={handleCreated} />
        )}
      </div>
    </Layout>
  )
}
