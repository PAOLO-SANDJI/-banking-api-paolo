import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { creerApp } = require('../src/app.js')

const app = creerApp()

async function creerUtilisateur(suffix = '') {
  const email = `integration${suffix}@test.com`
  await request(app).post('/auth/register').send({
    nom: 'Test', prenom: 'User', email, password: 'secret123',
  })
  const lr = await request(app).post('/auth/login').send({ email, password: 'secret123' })
  return lr.body.donnees.token
}

describe('Intégration', () => {
  it('TC-601 — Flux complet : inscription → création → dépôt → retrait → historique', async () => {
    const token = await creerUtilisateur('601')

    // Créer un compte
    const crRes = await request(app)
      .post('/api/comptes')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Flux', prenom: 'Complet' })
    expect(crRes.status).toBe(201)
    const id = crRes.body.donnees.id

    // Dépôt
    const depotRes = await request(app)
      .post(`/api/comptes/${id}/depot`)
      .set('Authorization', `Bearer ${token}`)
      .send({ montant: 10000 })
    expect(depotRes.body.donnees.solde).toBe('10000.00 FCFA')

    // Retrait
    const retraitRes = await request(app)
      .post(`/api/comptes/${id}/retrait`)
      .set('Authorization', `Bearer ${token}`)
      .send({ montant: 4000 })
    expect(retraitRes.body.donnees.solde).toBe('6000.00 FCFA')

    // Historique
    const histRes = await request(app)
      .get(`/api/comptes/${id}/transactions`)
      .set('Authorization', `Bearer ${token}`)
    expect(histRes.body.donnees).toHaveLength(2)
  })

  it('TC-602 — Inscriptions concurrentes (×5) — 5 utilisateurs distincts', async () => {
    const emails = Array.from({ length: 5 }, (_, i) => `concurrent602_${i}@test.com`)
    const results = await Promise.all(
      emails.map((email) =>
        request(app).post('/auth/register').send({ nom: 'C', prenom: 'U', email, password: 'secret123' })
      )
    )
    results.forEach((r) => expect(r.status).toBe(201))
    const ids = results.map((r) => r.body.donnees.id)
    expect(new Set(ids).size).toBe(5)
  })

  it('TC-603 — Créations de comptes concurrentes (×5) — 5 UUIDs uniques', async () => {
    const token = await creerUtilisateur('603')
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        request(app).post('/api/comptes').set('Authorization', `Bearer ${token}`).send({ nom: `N${i}`, prenom: `P${i}` })
      )
    )
    results.forEach((r) => expect(r.status).toBe(201))
    const ids = results.map((r) => r.body.donnees.id)
    expect(new Set(ids).size).toBe(5)
  })

  it('TC-604 — Dépôts concurrents — solde final cohérent', async () => {
    const token = await creerUtilisateur('604')
    const cr = await request(app).post('/api/comptes').set('Authorization', `Bearer ${token}`).send({ nom: 'A', prenom: 'B' })
    const id = cr.body.donnees.id

    await Promise.all([
      request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 1000 }),
      request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token}`).send({ montant: 1000 }),
    ])

    const res = await request(app).get(`/api/comptes/${id}`).set('Authorization', `Bearer ${token}`)
    expect(res.body.donnees.solde).toBe('2000.00 FCFA')
  })

  it('TC-605 — Isolation totale entre deux utilisateurs', async () => {
    const token1 = await creerUtilisateur('605a')
    const token2 = await creerUtilisateur('605b')

    // Utilisateur 1 crée un compte et fait un dépôt
    const cr = await request(app).post('/api/comptes').set('Authorization', `Bearer ${token1}`).send({ nom: 'U1', prenom: 'Compte' })
    const id = cr.body.donnees.id
    await request(app).post(`/api/comptes/${id}/depot`).set('Authorization', `Bearer ${token1}`).send({ montant: 5000 })

    // Utilisateur 2 ne voit pas ce compte
    const listRes = await request(app).get('/api/comptes').set('Authorization', `Bearer ${token2}`)
    expect(listRes.body.donnees).toHaveLength(0)

    // Utilisateur 2 ne peut pas accéder directement au compte
    const getRes = await request(app).get(`/api/comptes/${id}`).set('Authorization', `Bearer ${token2}`)
    expect(getRes.status).toBe(404)
  })
})
