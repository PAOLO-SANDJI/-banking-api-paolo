const { http, creerCompte, creerRegistre } = require("./helpers");

async function run() {
  const { results, tc } = creerRegistre();
  console.log("\n[Suppression]");

  await tc("TC-501", "Suppression valide", async () => {
    const id = await creerCompte("Del", "Valid");
    const r = await http("DELETE", `/api/comptes/${id}`);
    return (r.status === 200 && r.data.succes === true && r.data.donnees.compteSupprime === id)
      || `status=${r.status}`;
  });

  await tc("TC-502", "Suppression compte inexistant", async () => {
    const r = await http("DELETE", "/api/comptes/00000000-0000-0000-0000-000000000000");
    return r.status === 404 || `status=${r.status}`;
  });

  await tc("TC-503", "Compte absent après suppression", async () => {
    const id = await creerCompte("Del", "Absent");
    await http("DELETE", `/api/comptes/${id}`);
    const r = await http("GET", `/api/comptes/${id}`);
    return r.status === 404 || `status=${r.status}`;
  });

  await tc("TC-504", "Cascade des transactions", async () => {
    const id = await creerCompte("Del", "Cascade");
    await http("POST", `/api/comptes/${id}/depot`, { montant: 5000 });
    await http("POST", `/api/comptes/${id}/retrait`, { montant: 1000 });
    const r = await http("DELETE", `/api/comptes/${id}`);
    return (r.status === 200 && r.data.donnees.transactionsSupprimees === 2)
      || `supprimees=${r.data.donnees?.transactionsSupprimees}`;
  });

  await tc("TC-505", "Ne touche pas les autres comptes", async () => {
    const idA = await creerCompte("Keep", "A");
    const idB = await creerCompte("Keep", "B");
    await http("DELETE", `/api/comptes/${idA}`);
    const r = await http("GET", `/api/comptes/${idB}`);
    return r.status === 200 || `status=${r.status}`;
  });

  return results;
}

module.exports = { run };
