import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { creerApp } = require('../src/app.js')

const app = creerApp()

async function getToken() {
  await request(app).post('/auth/register').send({
    nom: 'Sandji', prenom: 'Paolo', email: 'test@comptes.com', password: 'secret123',
  })
  const res = await request(app).post('/auth/login').send({
    email: 'test@comptes.com', password: 'secret123',
  })
  return res.body.donnees.token
}

describe('Comptes — Création', () => {
  it('TC-101 — Création valide retourne 201 + UUID + solde 0 FCFA', async () => {
    const token = await getToken()
    const res = await request(app)
      .post('/api/comptes')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Sandji', prenom: 'Paolo' })
    expect(res.status).toBe(201)
    expect(res.body.donnees.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(res.body.donnees.solde).toBe('0.00 FCFA')
  })

  it('TC-102 — Nom manquant retourne 400', async () => {
    const token = await getToken()
    const res = await request(app)
      .post('/api/comptes')
      .set('Authorization', `Bearer ${token}`)
      .send({ prenom: 'Paolo' })
    expect(res.status).toBe(400)
  })

  it('TC-103 — Prénom manquant retourne 400', async () => {
    const token = await getToken()
    const res = await request(app)
      .post('/api/comptes')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Sandji' })
    expect(res.status).toBe(400)
  })

  it('TC-104 — Corps vide retourne 400', async () => {
    const token = await getToken()
    const res = await request(app)
      .post('/api/comptes')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(res.status).toBe(400)
  })

  it('TC-105 — Nom vide retourne 400', async () => {
    const token = await getToken()
    const res = await request(app)
      .post('/api/comptes')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: '', prenom: 'P' })
    expect(res.status).toBe(400)
  })

  it('TC-106 — Prénom vide retourne 400', async () => {
    const token = await getToken()
    const res = await request(app)
      .post('/api/comptes')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'S', prenom: '' })
    expect(res.status).toBe(400)
  })

  it('TC-107 — Deux créations produisent des UUIDs différents', async () => {
    const token = await getToken()
    const r1 = await request(app).post('/api/comptes').set('Authorization', `Bearer ${token}`).send({ nom: 'A', prenom: 'B' })
    const r2 = await request(app).post('/api/comptes').set('Authorization', `Bearer ${token}`).send({ nom: 'C', prenom: 'D' })
    expect(r1.body.donnees.id).not.toBe(r2.body.donnees.id)
  })

  it('TC-108 — Sans token retourne 401', async () => {
    const res = await request(app).post('/api/comptes').send({ nom: 'A', prenom: 'B' })
    expect(res.status).toBe(401)
  })
})

describe('Comptes — Listing et consultation', () => {
  it('TC-109 — GET /api/comptes retourne un tableau', async () => {
    const token = await getToken()
    const res = await request(app).get('/api/comptes').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.donnees)).toBe(true)
  })

  it('TC-110 — Listing isolé par utilisateur', async () => {
    const token = await getToken()
    await request(app).post('/api/comptes').set('Authorization', `Bearer ${token}`).send({ nom: 'A', prenom: 'B' })

    // Deuxième utilisateur
    await request(app).post('/auth/register').send({ nom: 'X', prenom: 'Y', email: 'autre@test.com', password: 'pass123' })
    const r2 = await request(app).post('/auth/login').send({ email: 'autre@test.com', password: 'pass123' })
    const token2 = r2.body.donnees.token

    const res = await request(app).get('/api/comptes').set('Authorization', `Bearer ${token2}`)
    expect(res.body.donnees).toHaveLength(0)
  })

  it('TC-111 — Consultation ID valide retourne 200', async () => {
    const token = await getToken()
    const cr = await request(app).post('/api/comptes').set('Authorization', `Bearer ${token}`).send({ nom: 'A', prenom: 'B' })
    const id = cr.body.donnees.id
    const res = await request(app).get(`/api/comptes/${id}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.donnees.id).toBe(id)
  })

  it('TC-112 — Consultation ID inexistant retourne 404', async () => {
    const token = await getToken()
    const res = await request(app).get('/api/comptes/00000000-0000-0000-0000-000000000000').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('TC-113 — Consultation ID malformé retourne 404', async () => {
    const token = await getToken()
    const res = await request(app).get('/api/comptes/abc').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
