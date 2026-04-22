const fs = require("fs");
const path = require("path");
const { BASE_URL, warmup } = require("./helpers");

const modules = [
  require("./general.test"),
  require("./comptes.test"),
  require("./transactions.test"),
  require("./suppression.test"),
  require("./integration.test"),
];

async function main() {
  await warmup();
  console.log("═══ Exécution des tests Paolo Banking API ═══");

  const all = {};
  for (const mod of modules) {
    const res = await mod.run();
    Object.assign(all, res);
  }

  const pass = Object.values(all).filter((s) => s === "Pass").length;
  const fail = Object.keys(all).length - pass;
  console.log(`\n═══ Résultat : ${pass} Pass / ${fail} Fail sur ${Object.keys(all).length} tests ═══`);

  const reportPath = path.resolve(__dirname, "..", "reports", "test-report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, results: all, summary: { pass, fail } },
      null,
      2
    )
  );
  console.log(`\nRapport : ${reportPath}`);

  // Mise à jour du cahier des charges (statuts dans les tableaux)
  const mdPath = path.resolve(__dirname, "..", "docs", "CAHIER_DES_CHARGES.md");
  if (fs.existsSync(mdPath)) {
    let md = fs.readFileSync(mdPath, "utf-8");
    for (const [id, status] of Object.entries(all)) {
      const short = status === "Pass" ? "Pass" : "Fail";
      const re = new RegExp(`(\\|\\s*${id}\\s*\\|[^\\n]*\\|\\s*)(Not Executed|Pass|Fail)(\\s*\\|)`, "g");
      md = md.replace(re, `$1${short}$3`);
    }
    fs.writeFileSync(mdPath, md, "utf-8");
    console.log(`Cahier des charges mis à jour : ${mdPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
