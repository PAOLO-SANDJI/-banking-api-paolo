import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { creerApp } = require('../src/app.js')

const app = creerApp()

async function setup() {
  await request(app).post('/auth/register').send({
    nom: 'Sandji', prenom: 'Paolo', email: 'txn@test.com', password: 'secret123',
  })
  const lr = await request(app).post('/auth/login').send({ email: 'txn@test.com', password: 'secret123' })
  const token = lr.body.donnees.token
  const cr = await request(app).post('/api/comptes').set('Authorization', `Bearer ${token}`).send({ nom: 'Sandji', prenom: 'Paolo' })
  return { token, id: cr.body.donnees.id }
}

// ─── Dépôts ──────────────────────────────────────────────────────────────────

describe('Dépôts', () => {
  it('TC-201 — Dépôt valide retourne 200 et solde à jour', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 5000 })
    expect(res.status).toBe(200)
    expect(res.body.donnees.solde).toBe('5000.00 FCFA')
  })

  it('TC-202 — Dépôt sur compte inexistant retourne 404', async () => {
    const { token } = await setup()
    const res = await request(app).post('/api/comptes/00000000-0000-0000-0000-000000000000/depot').set('Authorization', `Bearer ${token}`).send({ montant: 100 })
    expect(res.status).toBe(404)
  })

  it('TC-203 — Montant négatif retourne 400', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: -100 })
    expect(res.status).toBe(400)
  })

  it('TC-204 — Montant nul retourne 400', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 0 })
    expect(res.status).toBe(400)
  })

  it('TC-205 — Montant string retourne 400', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: '5000' })
    expect(res.status).toBe(400)
  })

  it('TC-206 — Montant absent retourne 400', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(400)
  })

  it('TC-207 — Montant null retourne 400', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: null })
    expect(res.status).toBe(400)
  })

  it('TC-208 — Dépôts successifs — solde cumulé', async () => {
    const { token, id } = await setup()
    await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 1000 })
    const res = await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 2000 })
    expect(res.body.donnees.solde).toBe('3000.00 FCFA')
  })

  it('TC-209 — Dépôt très grand retourne 200', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 1e9 })
    expect(res.status).toBe(200)
  })

  it('TC-210 — Dépôt décimal retourne solde formaté', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 1234.56 })
    expect(res.status).toBe(200)
    expect(res.body.donnees.solde).toBe('1234.56 FCFA')
  })
})

// ─── Retraits ─────────────────────────────────────────────────────────────────

describe('Retraits', () => {
  it('TC-301 — Retrait valide réduit le solde', async () => {
    const { token, id } = await setup()
    await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 10000 })
    const res = await request(app).post(`/api/comptes/${id}/retrait`).set('Authorization', `Bearer ${token}`).send({ montant: 3000 })
    expect(res.status).toBe(200)
    expect(res.body.donnees.solde).toBe('7000.00 FCFA')
  })

  it('TC-302 — Retrait sur compte inexistant retourne 404', async () => {
    const { token } = await setup()
    const res = await request(app).post('/api/comptes/00000000-0000-0000-0000-000000000000/retrait').set('Authorization', `Bearer ${token}`).send({ montant: 100 })
    expect(res.status).toBe(404)
  })

  it('TC-303 — Solde insuffisant retourne 400', async () => {
    const { token, id } = await setup()
    await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 1000 })
    const res = await request(app).post(`/api/comptes/${id}/retrait`).set('Authorization', `Bearer ${token}`).send({ montant: 5000 })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/insuffisant/i)
  })

  it('TC-304 — Retrait égal au solde — solde devient 0', async () => {
    const { token, id } = await setup()
    await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 5000 })
    const res = await request(app).post(`/api/comptes/${id}/retrait`).set('Authorization', `Bearer ${token}`).send({ montant: 5000 })
    expect(res.status).toBe(200)
    expect(res.body.donnees.solde).toBe('0.00 FCFA')
  })

  it('TC-305 — Montant négatif retourne 400', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/retrait`).set('Authorization', `Bearer ${token}`).send({ montant: -500 })
    expect(res.status).toBe(400)
  })

  it('TC-306 — Montant nul retourne 400', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/retrait`).set('Authorization', `Bearer ${token}`).send({ montant: 0 })
    expect(res.status).toBe(400)
  })

  it('TC-307 — Montant absent retourne 400', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/retrait`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(400)
  })

  it('TC-308 — Montant non numérique retourne 400', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/retrait`).set('Authorization', `Bearer ${token}`).send({ montant: 'abc' })
    expect(res.status).toBe(400)
  })

  it('TC-309 — Retraits successifs — solde décroît correctement', async () => {
    const { token, id } = await setup()
    await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 1000 })
    await request(app).post(`/api/comptes/${id}/retrait`).set('Authorization', `Bearer ${token}`).send({ montant: 500 })
    const res = await request(app).post(`/api/comptes/${id}/retrait`).set('Authorization', `Bearer ${token}`).send({ montant: 500 })
    expect(res.status).toBe(200)
    expect(res.body.donnees.solde).toBe('0.00 FCFA')
  })

  it('TC-310 — Retrait sur solde 0 retourne 400', async () => {
    const { token, id } = await setup()
    const res = await request(app).post(`/api/comptes/${id}/retrait`).set('Authorization', `Bearer ${token}`).send({ montant: 100 })
    expect(res.status).toBe(400)
  })
})
