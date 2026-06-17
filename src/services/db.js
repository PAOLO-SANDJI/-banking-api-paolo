const Database = require("better-sqlite3");
const path = require("path");

// En test, on utilise une base en mémoire pour l'isolation
// En production, un fichier persistant à la racine du projet
const DB_PATH = process.env.NODE_ENV === "test"
  ? ":memory:"
  : path.join(__dirname, "../../banking.db");

let _db = null;

function getDb() {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Création des tables si elles n'existent pas
  _db.exec(`
    CREATE TABLE IF NOT EXISTS utilisateurs (
      id           TEXT PRIMARY KEY,
      nom          TEXT NOT NULL,
      prenom       TEXT NOT NULL,
      email        TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      date_inscription TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comptes (
      id             TEXT PRIMARY KEY,
      nom            TEXT NOT NULL,
      prenom         TEXT NOT NULL,
      solde          REAL NOT NULL DEFAULT 0,
      utilisateur_id TEXT NOT NULL,
      date_creation  TEXT NOT NULL,
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id         TEXT PRIMARY KEY,
      compte_id  TEXT NOT NULL,
      type       TEXT NOT NULL CHECK(type IN ('depot', 'retrait')),
      montant    REAL NOT NULL,
      date       TEXT NOT NULL,
      FOREIGN KEY (compte_id) REFERENCES comptes(id)
    );
  `);

  return _db;
}

// Pour les tests : réinitialiser la connexion (permet de créer une nouvelle base :memory:)
function resetDb() {
  if (_db) {
    _db.close();
    _db = null;
  }
}

module.exports = { getDb, resetDb };
