import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { creerApp } = require('../src/app.js')

const app = creerApp()

async function inscrireEtConnecter(agent, data = {}) {
  const user = { nom: 'Sandji', prenom: 'Paolo', email: 'paolo@test.com', password: 'secret123', ...data }
  await request(app).post('/auth/register').send(user)
  const res = await request(app).post('/auth/login').send({ email: user.email, password: user.password })
  return res.body.donnees.token
}

describe('Auth — Inscription', () => {
  it('TC-A01 — Inscription valide retourne 201 et profil', async () => {
    const res = await request(app).post('/auth/register').send({
      nom: 'Sandji', prenom: 'Paolo', email: 'paolo@test.com', password: 'secret123',
    })
    expect(res.status).toBe(201)
    expect(res.body.succes).toBe(true)
    expect(res.body.donnees.email).toBe('paolo@test.com')
    expect(res.body.donnees.passwordHash).toBeUndefined()
  })

  it('TC-A02 — Email déjà utilisé retourne 400', async () => {
    await request(app).post('/auth/register').send({
      nom: 'Sandji', prenom: 'Paolo', email: 'double@test.com', password: 'secret123',
    })
    const res = await request(app).post('/auth/register').send({
      nom: 'Autre', prenom: 'User', email: 'double@test.com', password: 'autre123',
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/existe déjà/i)
  })

  it('TC-A03 — Champs manquants retournent 400', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'x@x.com' })
    expect(res.status).toBe(400)
  })

  it('TC-A04 — Email invalide retourne 400', async () => {
    const res = await request(app).post('/auth/register').send({
      nom: 'A', prenom: 'B', email: 'pas-un-email', password: 'secret123',
    })
    expect(res.status).toBe(400)
  })

  it('TC-A05 — Mot de passe trop court retourne 400', async () => {
    const res = await request(app).post('/auth/register').send({
      nom: 'A', prenom: 'B', email: 'court@test.com', password: '123',
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/6 caractères/i)
  })

  it("TC-A06 — Le passwordHash n'est jamais exposé", async () => {
    const res = await request(app).post('/auth/register').send({
      nom: 'A', prenom: 'B', email: 'hash@test.com', password: 'secret123',
    })
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')
  })
})

describe('Auth — Connexion', () => {
  it('TC-A07 — Connexion valide retourne 200 et token JWT', async () => {
    await request(app).post('/auth/register').send({
      nom: 'Sandji', prenom: 'Paolo', email: 'login@test.com', password: 'secret123',
    })
    const res = await request(app).post('/auth/login').send({
      email: 'login@test.com', password: 'secret123',
    })
    expect(res.status).toBe(200)
    expect(res.body.donnees.token).toBeDefined()
    expect(typeof res.body.donnees.token).toBe('string')
    expect(res.body.donnees.utilisateur.email).toBe('login@test.com')
  })

  it('TC-A08 — Mauvais mot de passe retourne 401', async () => {
    await request(app).post('/auth/register').send({
      nom: 'A', prenom: 'B', email: 'wrong@test.com', password: 'correct',
    })
    const res = await request(app).post('/auth/login').send({
      email: 'wrong@test.com', password: 'faux',
    })
    expect(res.status).toBe(401)
  })

  it('TC-A09 — Email inconnu retourne 401', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'inconnu@test.com', password: 'secret',
    })
    expect(res.status).toBe(401)
  })

  it('TC-A10 — Email insensible à la casse', async () => {
    await request(app).post('/auth/register').send({
      nom: 'A', prenom: 'B', email: 'Case@Test.COM', password: 'secret123',
    })
    const res = await request(app).post('/auth/login').send({
      email: 'case@test.com', password: 'secret123',
    })
    expect(res.status).toBe(200)
    expect(res.body.donnees.token).toBeDefined()
  })
})

describe('Auth — Profil /auth/me', () => {
  it('TC-A11 — GET /auth/me avec token valide retourne le profil', async () => {
    const token = await inscrireEtConnecter(app)
    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.donnees.email).toBe('paolo@test.com')
  })

  it('TC-A12 — GET /auth/me sans token retourne 401', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })

  it('TC-A13 — GET /auth/me avec token invalide retourne 401', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', 'Bearer token_bidon')
    expect(res.status).toBe(401)
  })
})
