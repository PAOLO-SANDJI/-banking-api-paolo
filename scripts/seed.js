/**
 * Seed — Données initiales camerounaises
 * Lance ce script après `npm start` pour pré-remplir la base :
 *   node scripts/seed.js
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.succes && res.status >= 400) {
    throw new Error(`POST ${path} → ${res.status}: ${data.message || JSON.stringify(data)}`);
  }
  return data.donnees;
}

async function postAuth(path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.succes && res.status >= 400) {
    throw new Error(`POST ${path} → ${res.status}: ${data.message || JSON.stringify(data)}`);
  }
  return data.donnees;
}

async function main() {
  console.log("\n🌍  Seed — Données bancaires camerounaises\n");

  // ─── Utilisateurs ─────────────────────────────────────────────────────────

  const utilisateurs = [
    { nom: "SANDJI",     prenom: "Paolo",    email: "paolo.sandji@bankapp.cm",    password: "Paolo2024!" },
    { nom: "MBALLA",     prenom: "Suzanne",  email: "suzanne.mballa@bankapp.cm",  password: "Suzanne2024!" },
    { nom: "NGUETSOP",   prenom: "Ernest",   email: "ernest.nguetsop@bankapp.cm", password: "Ernest2024!" },
    { nom: "FOMEKONG",   prenom: "Laure",    email: "laure.fomekong@bankapp.cm",  password: "Laure2024!" },
    { nom: "TCHINDA",    prenom: "Roland",   email: "roland.tchinda@bankapp.cm",  password: "Roland2024!" },
  ];

  const tokens = {};

  for (const u of utilisateurs) {
    try {
      await post("/auth/register", u);
      console.log(`  ✓ Inscription : ${u.prenom} ${u.nom}`);
    } catch (e) {
      if (e.message.includes("existe déjà")) {
        console.log(`  ~ Déjà inscrit : ${u.prenom} ${u.nom}`);
      } else {
        console.error(`  ✗ ${e.message}`);
        continue;
      }
    }
    const login = await post("/auth/login", { email: u.email, password: u.password });
    tokens[u.email] = login.token;
  }

  console.log();

  // ─── Comptes et transactions ───────────────────────────────────────────────

  const scenarios = [
    {
      email: "paolo.sandji@bankapp.cm",
      comptes: [
        {
          nom: "SANDJI", prenom: "Paolo",
          transactions: [
            { type: "depot",   montant: 500000 },
            { type: "depot",   montant: 250000 },
            { type: "retrait", montant: 75000  },
            { type: "depot",   montant: 100000 },
            { type: "retrait", montant: 50000  },
          ],
        },
        {
          nom: "SANDJI", prenom: "Épargne Paolo",
          transactions: [
            { type: "depot",   montant: 1000000 },
            { type: "depot",   montant:  500000 },
          ],
        },
      ],
    },
    {
      email: "suzanne.mballa@bankapp.cm",
      comptes: [
        {
          nom: "MBALLA", prenom: "Suzanne",
          transactions: [
            { type: "depot",   montant: 350000 },
            { type: "retrait", montant: 45000  },
            { type: "depot",   montant: 200000 },
            { type: "retrait", montant: 100000 },
            { type: "retrait", montant:  30000 },
          ],
        },
      ],
    },
    {
      email: "ernest.nguetsop@bankapp.cm",
      comptes: [
        {
          nom: "NGUETSOP", prenom: "Ernest",
          transactions: [
            { type: "depot",   montant: 800000 },
            { type: "retrait", montant: 200000 },
            { type: "depot",   montant: 150000 },
            { type: "retrait", montant:  80000 },
          ],
        },
        {
          nom: "NGUETSOP", prenom: "Pro Ernest",
          transactions: [
            { type: "depot",   montant: 2500000 },
            { type: "retrait", montant:  750000 },
            { type: "depot",   montant:  500000 },
          ],
        },
      ],
    },
    {
      email: "laure.fomekong@bankapp.cm",
      comptes: [
        {
          nom: "FOMEKONG", prenom: "Laure",
          transactions: [
            { type: "depot",   montant: 450000 },
            { type: "retrait", montant:  60000 },
            { type: "depot",   montant: 120000 },
            { type: "retrait", montant:  45000 },
            { type: "retrait", montant:  25000 },
          ],
        },
      ],
    },
    {
      email: "roland.tchinda@bankapp.cm",
      comptes: [
        {
          nom: "TCHINDA", prenom: "Roland",
          transactions: [
            { type: "depot",   montant: 650000 },
            { type: "depot",   montant: 300000 },
            { type: "retrait", montant: 150000 },
            { type: "retrait", montant:  50000 },
            { type: "depot",   montant:  75000 },
          ],
        },
      ],
    },
  ];

  for (const scenario of scenarios) {
    const token = tokens[scenario.email];
    if (!token) continue;

    for (const c of scenario.comptes) {
      // Créer le compte
      const compte = await postAuth("/api/comptes", { nom: c.nom, prenom: c.prenom }, token);
      console.log(`  💳 Compte créé : ${c.prenom} ${c.nom} (${compte.id.slice(0, 8)}…)`);

      // Effectuer les transactions
      for (const t of c.transactions) {
        await postAuth(`/api/comptes/${compte.id}/${t.type}`, { montant: t.montant }, token);
        const signe = t.type === "depot" ? "+" : "-";
        console.log(`     ${t.type === "depot" ? "📥" : "📤"} ${signe}${t.montant.toLocaleString("fr-FR")} FCFA`);
      }
    }
    console.log();
  }

  console.log("✅  Seed terminé. Démarrez l'interface React pour visualiser les données.\n");
}

main().catch((err) => {
  console.error("\n❌  Erreur seed :", err.message);
  process.exit(1);
});
