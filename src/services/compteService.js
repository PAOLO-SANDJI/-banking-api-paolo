const crypto = require("crypto");
const { comptes, transactions } = require("./store");

function creer(nom, prenom) {
  const compte = {
    id: crypto.randomUUID(),
    nom,
    prenom,
    solde: 0,
    dateCreation: new Date().toISOString(),
  };
  comptes.push(compte);
  return compte;
}

function lister() {
  return comptes;
}

function trouverParId(id) {
  return comptes.find((c) => c.id === id);
}

function supprimer(id) {
  const index = comptes.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const compteSupprime = comptes[index];
  comptes.splice(index, 1);

  const avant = transactions.length;
  for (let i = transactions.length - 1; i >= 0; i--) {
    if (transactions[i].compteId === compteSupprime.id) {
      transactions.splice(i, 1);
    }
  }

  return {
    compte: compteSupprime,
    transactionsSupprimees: avant - transactions.length,
  };
}

module.exports = { creer, lister, trouverParId, supprimer };
