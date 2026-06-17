import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { creerApp } = require('../src/app.js')

const app = creerApp()

async function setup() {
  await request(app).post('/auth/register').send({
    nom: 'Sandji', prenom: 'Paolo', email: 'supp@test.com', password: 'secret123',
  })
  const lr = await request(app).post('/auth/login').send({ email: 'supp@test.com', password: 'secret123' })
  const token = lr.body.donnees.token
  const cr = await request(app).post('/api/comptes').set('Authorization', `Bearer ${token}`).send({ nom: 'Sandji', prenom: 'Paolo' })
  return { token, id: cr.body.donnees.id }
}

describe('Suppression de compte', () => {
  it('TC-501 — Suppression valide retourne 200 avec compteSupprime', async () => {
    const { token, id } = await setup()
    const res = await request(app).delete(`/api/comptes/${id}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.donnees.compteSupprime).toBe(id)
  })

  it('TC-502 — Suppression compte inexistant retourne 404', async () => {
    const { token } = await setup()
    const res = await request(app).delete('/api/comptes/00000000-0000-0000-0000-000000000000').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('TC-503 — GET après suppression retourne 404', async () => {
    const { token, id } = await setup()
    await request(app).delete(`/api/comptes/${id}`).set('Authorization', `Bearer ${token}`)
    const res = await request(app).get(`/api/comptes/${id}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('TC-504 — Cascade : suppression efface les transactions associées', async () => {
    const { token, id } = await setup()
    await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 1000 })
    await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 2000 })
    const res = await request(app).delete(`/api/comptes/${id}`).set('Authorization', `Bearer ${token}`)
    expect(res.body.donnees.transactionsSupprimees).toBe(2)
  })

  it('TC-505 — Suppression ne touche pas les autres comptes', async () => {
    const { token, id: idA } = await setup()
    const crB = await request(app).post('/api/comptes').set('Authorization', `Bearer ${token}`).send({ nom: 'B', prenom: 'B' })
    const idB = crB.body.donnees.id

    await request(app).delete(`/api/comptes/${idA}`).set('Authorization', `Bearer ${token}`)

    const res = await request(app).get(`/api/comptes/${idB}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.donnees.id).toBe(idB)
  })

  it('TC-506 — Impossible de supprimer le compte d\'un autre utilisateur', async () => {
    const { token, id } = await setup()

    // Deuxième utilisateur
    await request(app).post('/auth/register').send({ nom: 'X', prenom: 'Y', email: 'autre2@test.com', password: 'pass123' })
    const r2 = await request(app).post('/auth/login').send({ email: 'autre2@test.com', password: 'pass123' })
    const token2 = r2.body.donnees.token

    const res = await request(app).delete(`/api/comptes/${id}`).set('Authorization', `Bearer ${token2}`)
    expect(res.status).toBe(404)
  })
})
