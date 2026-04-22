const { http, creerCompte, creerRegistre } = require("./helpers");

async function run() {
  const { results, tc } = creerRegistre();
  console.log("\n[Comptes]");

  await tc("TC-101", "Création valide", async () => {
    const r = await http("POST", "/api/comptes", { nom: "Sandji", prenom: "Paolo" });
    return (r.status === 201 && r.data.succes === true && r.data.donnees.solde === "0.00 FCFA")
      || `status=${r.status}`;
  });

  await tc("TC-102", "Nom manquant", async () => {
    const r = await http("POST", "/api/comptes", { prenom: "Paolo" });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-103", "Prénom manquant", async () => {
    const r = await http("POST", "/api/comptes", { nom: "Sandji" });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-104", "Corps vide", async () => {
    const r = await http("POST", "/api/comptes", {});
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-105", "Nom vide", async () => {
    const r = await http("POST", "/api/comptes", { nom: "", prenom: "P" });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-106", "Prénom vide", async () => {
    const r = await http("POST", "/api/comptes", { nom: "S", prenom: "" });
    return r.status === 400 || `status=${r.status}`;
  });

  await tc("TC-107", "IDs uniques", async () => {
    const id1 = await creerCompte("A", "A");
    const id2 = await creerCompte("B", "B");
    return id1 !== id2 || "ids identiques";
  });

  await tc("TC-108", "Liste non-null (array)", async () => {
    const r = await http("GET", "/api/comptes");
    return (r.status === 200 && Array.isArray(r.data.donnees)) || `status=${r.status}`;
  });

  await tc("TC-109", "Consultation ID valide", async () => {
    const id = await creerCompte("Consult", "Test");
    const r = await http("GET", `/api/comptes/${id}`);
    return (r.status === 200 && r.data.donnees.id === id) || `status=${r.status}`;
  });

  await tc("TC-110", "Consultation ID inexistant", async () => {
    const r = await http("GET", "/api/comptes/00000000-0000-0000-0000-000000000000");
    return r.status === 404 || `status=${r.status}`;
  });

  await tc("TC-111", "Consultation ID malformé", async () => {
    const r = await http("GET", "/api/comptes/abc");
    return r.status === 404 || `status=${r.status}`;
  });

  return results;
}

module.exports = { run };
