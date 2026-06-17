import { beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// Forcer le mode test pour utiliser SQLite en mémoire
process.env.NODE_ENV = 'test'

// Réinitialiser la connexion SQLite avant chaque test
// afin que chaque test repart d'une base vide fraîche
beforeEach(() => {
  const { resetDb } = require('../src/services/db.js')
  resetDb()
})

afterEach(() => {
  const { resetDb } = require('../src/services/db.js')
  resetDb()
})
