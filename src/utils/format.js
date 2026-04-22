function formaterMontant(montant) {
  return `${montant.toFixed(2)} FCFA`;
}

function formaterDate(dateISO) {
  return new Date(dateISO).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formaterCompte(compte) {
  return {
    id: compte.id,
    nom: compte.nom,
    prenom: compte.prenom,
    solde: formaterMontant(compte.solde),
    dateCreation: formaterDate(compte.dateCreation),
  };
}

function formaterTransaction(transaction) {
  return {
    id: transaction.id,
    compteId: transaction.compteId,
    type: transaction.type,
    montant: formaterMontant(transaction.montant),
    date: formaterDate(transaction.date),
  };
}

function reponse(res, status, message, donnees) {
  return res.status(status).json({
    succes: status >= 200 && status < 300,
    message,
    donnees,
  });
}

module.exports = {
  formaterMontant,
  formaterDate,
  formaterCompte,
  formaterTransaction,
  reponse,
};
