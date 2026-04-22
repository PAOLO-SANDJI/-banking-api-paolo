const { Router } = require("express");

const router = Router();

/**
 * @openapi
 * /:
 *   get:
 *     summary: Page d'accueil de l'API Paolo
 *     description: Message de bienvenue et lien vers la documentation Swagger.
 *     tags: [Général]
 *     responses:
 *       200:
 *         description: Informations sur l'API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Bienvenue sur l'API Bancaire - Paolo" }
 *                 documentation: { type: string, example: "/api-docs" }
 *                 auteur: { type: string, example: "Paolo Sandji" }
 */
router.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'API Bancaire - Paolo",
    documentation: "/api-docs",
    auteur: "Paolo Sandji",
  });
});

module.exports = router;
