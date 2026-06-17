import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { creerApp } = require('../src/app.js')

const app = creerApp()

describe('Général', () => {
  it('TC-001 — GET / répond 200 avec message et auteur', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body.message).toContain('Paolo')
    expect(res.body.auteur).toBeDefined()
    expect(res.body.documentation).toBe('/api-docs')
  })

  it('TC-002 — GET /api-docs répond 200 avec HTML Swagger', async () => {
    const res = await request(app).get('/api-docs/')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/html/)
  })
})
