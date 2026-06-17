const crypto = require("crypto");
const { getDb } = require("./db");
const { mettreAJourSolde } = require("./compteService");

function enregistrer(compteId, type, montant) {
  const id = crypto.randomUUID();
  const date = new Date().toISOString();
  getDb().prepare(
    "INSERT INTO transactions (id, compte_id, type, montant, date) VALUES (?, ?, ?, ?, ?)"
  ).run(id, compteId, type, montant, date);
  return getDb().prepare("SELECT * FROM transactions WHERE id = ?").get(id);
}

function historique(compteId) {
  return getDb().prepare(
    "SELECT * FROM transactions WHERE compte_id = ? ORDER BY date ASC"
  ).all(compteId);
}

function effectuerDepot(compte, montant) {
  const nouveauSolde = compte.solde + montant;
  const compteMAJ = mettreAJourSolde(compte.id, nouveauSolde);
  const transaction = enregistrer(compte.id, "depot", montant);
  // Mettre à jour l'objet en mémoire pour le retour immédiat
  compte.solde = nouveauSolde;
  return { compte: compteMAJ, transaction };
}

function effectuerRetrait(compte, montant) {
  const nouveauSolde = compte.solde - montant;
  const compteMAJ = mettreAJourSolde(compte.id, nouveauSolde);
  const transaction = enregistrer(compte.id, "retrait", montant);
  compte.solde = nouveauSolde;
  return { compte: compteMAJ, transaction };
}

function estMontantValide(montant) {
  return typeof montant === "number" && montant > 0;
}

module.exports = {
  enregistrer,
  historique,
  effectuerDepot,
  effectuerRetrait,
  estMontantValide,
};
