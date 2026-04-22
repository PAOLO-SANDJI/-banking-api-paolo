const crypto = require("crypto");
const { transactions } = require("./store");

function enregistrer(compteId, type, montant) {
  const transaction = {
    id: crypto.randomUUID(),
    compteId,
    type,
    montant,
    date: new Date().toISOString(),
  };
  transactions.push(transaction);
  return transaction;
}

function historique(compteId) {
  return transactions.filter((t) => t.compteId === compteId);
}

function effectuerDepot(compte, montant) {
  compte.solde += montant;
  return enregistrer(compte.id, "depot", montant);
}

function effectuerRetrait(compte, montant) {
  compte.solde -= montant;
  return enregistrer(compte.id, "retrait", montant);
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
