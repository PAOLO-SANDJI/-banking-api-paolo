const { http, creerCompte, creerRegistre } = require("./helpers");

async function run() {
  const { results, tc } = creerRegistre();
  console.log("\n[Intégration]");

  await tc("TC-601", "Scénario complet", async () => {
    const id = await creerCompte("E2E", "Test");
    await http("POST", `/api/comptes/${id}/depot`, { montant: 5000 });
    await http("POST", `/api/comptes/${id}/retrait`, { montant: 2000 });
    const compte = await http("GET", `/api/comptes/${id}`);
    const hist = await http("GET", `/api/comptes/${id}/transactions`);
    return (compte.data.donnees.solde === "3000.00 FCFA" && hist.data.donnees.length === 2)
      || `solde=${compte.data.donnees?.solde} hist=${hist.data.donnees?.length}`;
  });

  await tc("TC-602", "Créations simultanées (5)", async () => {
    const proms = Array.from({ length: 5 }, (_, i) =>
      http("POST", "/api/comptes", { nom: `P${i}`, prenom: `P${i}` })
    );
    const rs = await Promise.all(proms);
    const ids = rs.map((r) => r.data.donnees?.id);
    const uniques = new Set(ids).size === 5;
    return (rs.every((r) => r.status === 201) && uniques) || "ids non uniques ou erreur";
  });

  await tc("TC-603", "Dépôts concurrents", async () => {
    const id = await creerCompte();
    await Promise.all([
      http("POST", `/api/comptes/${id}/depot`, { montant: 1000 }),
      http("POST", `/api/comptes/${id}/depot`, { montant: 1000 }),
    ]);
    const r = await http("GET", `/api/comptes/${id}`);
    return r.data.donnees.solde === "2000.00 FCFA" || `solde=${r.data.donnees?.solde}`;
  });

  return results;
}

module.exports = { run };
