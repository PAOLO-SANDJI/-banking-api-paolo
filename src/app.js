const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const generalRoutes = require("./routes/general");
const comptesRoutes = require("./routes/comptes");
const transactionsRoutes = require("./routes/transactions");

function creerApp() {
  const app = express();
  app.use(express.json());

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use("/", generalRoutes);
  app.use("/api/comptes", comptesRoutes);
  app.use("/api/comptes", transactionsRoutes);

  return app;
}

module.exports = { creerApp };
