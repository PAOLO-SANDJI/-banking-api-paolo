const { http, creerCompte, creerRegistre } = require("./helpers");

async function run() {
  const { results, tc } = creerRegistre();
  console.log("\n[Transactions]");

  // --- Dépôts ---
  await tc("TC-201", "Dépôt valide", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: 5000 });
    return (r.status === 200 && r.data.donnees.solde === "5000.00 FCFA") || `status=${r.status}`;
  });

  await tc("TC-202", "Dépôt compte inexistant", async () => {
    const r = await http("POST", "/api/comptes/00000000-0000-0000-0000-000000000000/depot", { montant: 5000 });
    return r.status === 404 || `status=${r.status}`;
  });

  await tc("TC-203", "Montant négatif", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: -100 });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-204", "Montant zéro", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: 0 });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-205", "Montant en chaîne", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: "5000" });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-206", "Sans montant", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, {});
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-207", "Montant null", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: null });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-208", "Dépôts successifs (cumul)", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 1000 });
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: 2000 });
    return r.data.donnees.solde === "3000.00 FCFA" || `solde=${r.data.donnees?.solde}`;
  });

  await tc("TC-209", "Montant très grand", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: 1000000000 });
    return r.status === 200 || `status=${r.status}`;
  });

  await tc("TC-210", "Montant décimal", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/depot`, { montant: 1234.56 });
    return (r.status === 200 && r.data.donnees.solde === "1234.56 FCFA") || `solde=${r.data.donnees?.solde}`;
  });

  // --- Retraits ---
  await tc("TC-301", "Retrait valide", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 10000 });
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: 3000 });
    return (r.status === 200 && r.data.donnees.solde === "7000.00 FCFA") || `solde=${r.data.donnees?.solde}`;
  });

  await tc("TC-302", "Retrait compte inexistant", async () => {
    const r = await http("POST", "/api/comptes/00000000-0000-0000-0000-000000000000/retrait", { montant: 1000 });
    return r.status === 404 || `status=${r.status}`;
  });

  await tc("TC-303", "Solde insuffisant", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 1000 });
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: 5000 });
    return (r.status === 400 && /insuffisant/i.test(r.data.message)) || `status=${r.status}`;
  });

  await tc("TC-304", "Retrait = solde (limite)", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 5000 });
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: 5000 });
    return (r.status === 200 && r.data.donnees.solde === "0.00 FCFA") || `solde=${r.data.donnees?.solde}`;
  });

  await tc("TC-305", "Montant négatif", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: -500 });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-306", "Montant zéro", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: 0 });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-307", "Sans montant", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/retrait`, {});
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-308", "Montant non numérique", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: "abc" });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-309", "Retraits successifs", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 1000 });
    await http("POST", `/api/comptes/${id}/retrait`, { montant: 500 });
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: 500 });
    return r.data.donnees.solde === "0.00 FCFA" || `solde=${r.data.donnees?.solde}`;
  });

  await tc("TC-310", "Retrait sur solde=0", async () => {
    const id = await creerCompte();
    const r = await http("POST", `/api/comptes/${id}/retrait`, { montant: 100 });
    return (r.status === 400 && /insuffisant/i.test(r.data.message)) || `status=${r.status}`;
  });

  // --- Historique ---
  await tc("TC-401", "Historique vide", async () => {
    const id = await creerCompte();
    const r = await http("GET", `/api/comptes/${id}/transactions`);
    return (r.status === 200 && Array.isArray(r.data.donnees) && r.data.donnees.length === 0)
      || `len=${r.data.donnees?.length}`;
  });

  await tc("TC-402", "Après 1 dépôt", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 5000 });
    const r = await http("GET", `/api/comptes/${id}/transactions`);
    return (r.data.donnees.length === 1 && r.data.donnees[0].type === "depot") || `len=${r.data.donnees?.length}`;
  });

  await tc("TC-403", "Historique mixte", async () => {
    const id = await creerCompte();
    await http("POST", `/api/comptes/${id}/depot`, { montant: 5000 });
    await http("POST", `/api/comptes/${id}/retrait`, { montant: 1000 });
    const r = await http("GET", `/api/comptes/${id}/transactions`);
    const types = r.data.donnees.map((t) => t.type);
    return (r.data.donnees.length === 2 && types.includes("depot") && types.includes("retrait"))
      || `types=${types}`;
  });

  await tc("TC-404", "Historique compte inexistant", async () => {
    const r = await http("GET", "/api/comptes/00000000-0000-0000-0000-000000000000/transactions");
    return r.status === 404 || `status=${r.status}`;
  });

  await tc("TC-405", "Isolation entre comptes", async () => {
    const idA = await creerCompte("A", "A");
    const idB = await creerCompte("B", "B");
    await http("POST", `/api/comptes/${idA}/depot`, { montant: 5000 });
    const r = await http("GET", `/api/comptes/${idB}/transactions`);
    return r.data.donnees.length === 0 || `B.len=${r.data.donnees?.length}`;
  });

  return results;
}

module.exports = { run };
