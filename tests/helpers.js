const BASE_URL = process.env.API_URL || "https://banking-api-paolo.onrender.com";

async function http(method, urlPath, body, headers) {
  const opts = {
    method,
    headers: headers || { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${urlPath}`, opts);
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function creerCompte(nom = "Test", prenom = "User") {
  const r = await http("POST", "/api/comptes", { nom, prenom });
  if (r.status !== 201) throw new Error(`création compte échouée (${r.status})`);
  return r.data.donnees.id;
}

async function warmup() {
  console.log(`\n→ Réveil du service ${BASE_URL} (jusqu'à 60s)...`);
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(BASE_URL, { signal: AbortSignal.timeout(30000) });
      if (r.ok) { console.log("  Service actif.\n"); return; }
    } catch {}
    console.log(`  tentative ${i + 1}/5...`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.log("  Continue malgré tout.\n");
}

function creerRegistre() {
  const results = {};
  async function tc(id, description, fn) {
    try {
      const ok = await fn();
      results[id] = ok === true || ok === undefined ? "Pass" : `Fail (${ok})`;
    } catch (err) {
      results[id] = `Fail (${err.message})`;
    }
    console.log(`  ${id} — ${description}: ${results[id]}`);
  }
  return { results, tc };
}

module.exports = { BASE_URL, http, creerCompte, warmup, creerRegistre };
