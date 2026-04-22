const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DOCS = path.join(ROOT, "docs");
const mdPath = path.join(DOCS, "CAHIER_DES_CHARGES.md");
const htmlPath = path.join(DOCS, "CAHIER_DES_CHARGES.html");
const pdfPath = path.join(DOCS, "CAHIER_DES_CHARGES.pdf");

async function main() {
  const { marked } = await import("marked");
  const md = fs.readFileSync(mdPath, "utf-8");
  const body = marked.parse(md);

  // Style différent du NYAJ : thème vert/émeraude et plus épuré
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Cahier des charges - Paolo Banking API</title>
<style>
  @page { size: A4; margin: 20mm 15mm; }
  body {
    font-family: "Helvetica Neue", Arial, sans-serif;
    color: #1a2b3c;
    line-height: 1.6;
    font-size: 11pt;
  }
  h1, h2, h3, h4 { color: #065f46; page-break-after: avoid; font-weight: 600; }
  h1 {
    font-size: 24pt;
    border-bottom: 4px double #10b981;
    padding-bottom: 8px;
    margin-top: 0;
  }
  h2 {
    font-size: 15pt;
    border-left: 4px solid #10b981;
    padding-left: 10px;
    margin-top: 24px;
  }
  h3 { font-size: 12.5pt; margin-top: 20px; color: #047857; }
  h4 { font-size: 11pt; margin-top: 14px; color: #065f46; }
  code {
    background: #ecfdf5;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9.5pt;
    color: #064e3b;
    font-family: "Courier New", monospace;
  }
  pre {
    background: #064e3b;
    color: #d1fae5;
    padding: 12px 14px;
    border-radius: 6px;
    font-size: 9pt;
    overflow-x: auto;
    page-break-inside: avoid;
  }
  pre code { background: transparent; color: inherit; padding: 0; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 9.5pt;
    page-break-inside: auto;
  }
  tr { page-break-inside: avoid; }
  thead {
    display: table-header-group;
    background: #10b981;
    color: #fff;
  }
  th, td {
    border: 1px solid #a7f3d0;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  tbody tr:nth-child(even) { background: #f0fdf4; }
  strong { color: #065f46; }
  ul, ol { margin: 6px 0 6px 22px; }
  li { margin: 3px 0; }
  hr { border: none; border-top: 1px dashed #10b981; margin: 20px 0; }
  .footer {
    text-align: center;
    font-size: 8pt;
    color: #6b7280;
    margin-top: 32px;
    border-top: 1px solid #a7f3d0;
    padding-top: 10px;
    font-style: italic;
  }
</style>
</head>
<body>
${body}
<div class="footer">
  Paolo Banking API — Cahier des charges — Généré le ${new Date().toLocaleDateString("fr-FR")}
</div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, html, "utf-8");
  console.log(`HTML généré : ${htmlPath}`);

  try {
    execSync(
      `google-chrome --headless --disable-gpu --no-sandbox --print-to-pdf="${pdfPath}" --no-pdf-header-footer "file://${htmlPath}"`,
      { stdio: "inherit" }
    );
    console.log(`PDF généré : ${pdfPath}`);
  } catch (err) {
    console.error("Échec génération PDF :", err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
