const { http, BASE_URL, creerRegistre } = require("./helpers");

async function run() {
  const { results, tc } = creerRegistre();
  console.log("\n[General]");

  await tc("TC-001", "Page d'accueil", async () => {
    const r = await http("GET", "/");
    return (r.status === 200 && r.data.message && r.data.documentation === "/api-docs")
      || `status=${r.status}`;
  });

  await tc("TC-002", "Documentation Swagger", async () => {
    const r = await fetch(`${BASE_URL}/api-docs/`);
    const txt = await r.text();
    return (r.status === 200 && /swagger/i.test(txt)) || `status=${r.status}`;
  });

  return results;
}

module.exports = { run };
