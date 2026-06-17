const crypto = require("crypto");
const { getDb } = require("./db");

function creer(nom, prenom, utilisateurId = null) {
  const id = crypto.randomUUID();
  const dateCreation = new Date().toISOString();
  getDb().prepare(
    "INSERT INTO comptes (id, nom, prenom, solde, utilisateur_id, date_creation) VALUES (?, ?, ?, 0, ?, ?)"
  ).run(id, nom, prenom, utilisateurId, dateCreation);
  return trouverParId(id);
}

function lister(utilisateurId = null) {
  if (utilisateurId) {
    return getDb().prepare("SELECT * FROM comptes WHERE utilisateur_id = ? ORDER BY date_creation DESC").all(utilisateurId);
  }
  return getDb().prepare("SELECT * FROM comptes ORDER BY date_creation DESC").all();
}

function trouverParId(id, utilisateurId = null) {
  if (utilisateurId) {
    return getDb().prepare("SELECT * FROM comptes WHERE id = ? AND utilisateur_id = ?").get(id, utilisateurId) || null;
  }
  return getDb().prepare("SELECT * FROM comptes WHERE id = ?").get(id) || null;
}

function mettreAJourSolde(id, nouveauSolde) {
  getDb().prepare("UPDATE comptes SET solde = ? WHERE id = ?").run(nouveauSolde, id);
  return trouverParId(id);
}

function supprimer(id) {
  const compte = trouverParId(id);
  if (!compte) return null;

  // Compter les transactions avant suppression
  const nb = getDb().prepare("SELECT COUNT(*) AS nb FROM transactions WHERE compte_id = ?").get(id).nb;

  // Supprimer en cascade (transactions puis compte)
  getDb().prepare("DELETE FROM transactions WHERE compte_id = ?").run(id);
  getDb().prepare("DELETE FROM comptes WHERE id = ?").run(id);

  return { compte, transactionsSupprimees: nb };
}

module.exports = { creer, lister, trouverParId, mettreAJourSolde, supprimer };
