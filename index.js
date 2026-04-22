const { creerApp } = require("./src/app");

const PORT = process.env.PORT || 3000;
const app = creerApp();

app.listen(PORT, () => {
  console.log(`API Paolo demarree sur le port ${PORT}`);
  console.log(`Documentation Swagger : /api-docs`);
});
