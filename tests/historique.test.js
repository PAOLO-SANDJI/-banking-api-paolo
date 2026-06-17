import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { creerApp } = require('../src/app.js')

const app = creerApp()

async function setup() {
  await request(app).post('/auth/register').send({
    nom: 'Sandji', prenom: 'Paolo', email: 'hist@test.com', password: 'secret123',
  })
  const lr = await request(app).post('/auth/login').send({ email: 'hist@test.com', password: 'secret123' })
  const token = lr.body.donnees.token
  const cr = await request(app).post('/api/comptes').set('Authorization', `Bearer ${token}`).send({ nom: 'Sandji', prenom: 'Paolo' })
  return { token, id: cr.body.donnees.id }
}

describe('Historique des transactions', () => {
  it('TC-401 — Historique vide sur compte neuf', async () => {
    const { token, id } = await setup()
    const res = await request(app).get(`/api/comptes/${id}/transactions`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.donnees).toEqual([])
  })

  it('TC-402 — Après 1 dépôt — 1 transaction de type depot', async () => {
    const { token, id } = await setup()
    await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 5000 })
    const res = await request(app).get(`/api/comptes/${id}/transactions`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.donnees).toHaveLength(1)
    expect(res.body.donnees[0].type).toBe('depot')
  })

  it('TC-403 — Historique mixte — 1 dépôt + 1 retrait = 2 transactions', async () => {
    const { token, id } = await setup()
    await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 5000 })
    await request(app).post(`/api/comptes/${id}/retrait`).set('Authorization', `Bearer ${token}`).send({ montant: 2000 })
    const res = await request(app).get(`/api/comptes/${id}/transactions`).set('Authorization', `Bearer ${token}`)
    expect(res.body.donnees).toHaveLength(2)
    const types = res.body.donnees.map((t) => t.type)
    expect(types).toContain('depot')
    expect(types).toContain('retrait')
  })

  it('TC-404 — Compte inexistant retourne 404', async () => {
    const { token } = await setup()
    const res = await request(app).get('/api/comptes/00000000-0000-0000-0000-000000000000/transactions').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('TC-405 — Isolation entre comptes — les transactions ne se mélangent pas', async () => {
    const { token, id: idA } = await setup()
    const crB = await request(app).post('/api/comptes').set('Authorization', `Bearer ${token}`).send({ nom: 'Autre', prenom: 'Compte' })
    const idB = crB.body.donnees.id

    await request(app).post(`/api/comptes/${idA}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 1000 })

    const res = await request(app).get(`/api/comptes/${idB}/transactions`).set('Authorization', `Bearer ${token}`)
    expect(res.body.donnees).toHaveLength(0)
  })

  it('TC-406 — Chaque transaction a un ID UUID unique', async () => {
    const { token, id } = await setup()
    await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 100 })
    await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 200 })
    const res = await request(app).get(`/api/comptes/${id}/transactions`).set('Authorization', `Bearer ${token}`)
    const ids = res.body.donnees.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
