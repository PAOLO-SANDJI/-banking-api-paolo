const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const generalRoutes = require("./routes/general");
const authRoutes = require("./routes/auth");
const comptesRoutes = require("./routes/comptes");
const transactionsRoutes = require("./routes/transactions");

function creerApp() {
  const app = express();

  // CORS — autorise le client React en développement
  app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }));

  app.use(express.json());

  // Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Routes
  app.use("/", generalRoutes);
  app.use("/auth", authRoutes);
  app.use("/api/comptes", comptesRoutes);
  app.use("/api/comptes", transactionsRoutes);

  return app;
}

module.exports = { creerApp };
