const { Router } = require("express");
const compteService = require("../services/compteService");
const { authentifier } = require("../middleware/auth");
const { formaterCompte, reponse } = require("../utils/format");

const router = Router();

/**
 * @openapi
 * /api/comptes:
 *   post:
 *     summary: Créer un nouveau compte bancaire
 *     tags: [Comptes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreerCompteRequete'
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *       400:
 *         $ref: '#/components/responses/ChampsManquants'
 *       401:
 *         description: Non authentifié
 */
router.post("/", authentifier, (req, res) => {
  const { nom, prenom } = req.body || {};
  if (!nom || !prenom) {
    return res.status(400).json({ erreur: "Les champs 'nom' et 'prenom' sont requis." });
  }
  const compte = compteService.creer(nom, prenom, req.utilisateur.id);
  reponse(res, 201, "Compte créé avec succès.", formaterCompte(compte));
});

/**
 * @openapi
 * /api/comptes:
 *   get:
 *     summary: Lister mes comptes
 *     tags: [Comptes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des comptes de l'utilisateur connecté
 *       401:
 *         description: Non authentifié
 */
router.get("/", authentifier, (req, res) => {
  const tous = compteService.lister(req.utilisateur.id);
  reponse(res, 200, `${tous.length} compte(s) trouvé(s).`, tous.map(formaterCompte));
});

/**
 * @openapi
 * /api/comptes/{id}:
 *   get:
 *     summary: Consulter un compte par son ID
 *     tags: [Comptes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Compte trouvé
 *       404:
 *         $ref: '#/components/responses/CompteIntrouvable'
 *       401:
 *         description: Non authentifié
 */
router.get("/:id", authentifier, (req, res) => {
  const compte = compteService.trouverParId(req.params.id, req.utilisateur.id);
  if (!compte) return reponse(res, 404, "Compte introuvable.", null);
  reponse(res, 200, "Compte trouvé.", formaterCompte(compte));
});

/**
 * @openapi
 * /api/comptes/{id}:
 *   delete:
 *     summary: Supprimer un compte bancaire (cascade)
 *     tags: [Comptes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Compte supprimé
 *       404:
 *         $ref: '#/components/responses/CompteIntrouvable'
 *       401:
 *         description: Non authentifié
 */
router.delete("/:id", authentifier, (req, res) => {
  // Vérifier que le compte appartient à l'utilisateur
  const compte = compteService.trouverParId(req.params.id, req.utilisateur.id);
  if (!compte) return reponse(res, 404, "Compte introuvable.", null);

  const resultat = compteService.supprimer(req.params.id);
  if (!resultat) return reponse(res, 404, "Compte introuvable.", null);
  reponse(res, 200, "Compte supprimé avec succès.", {
    compteSupprime: resultat.compte.id,
    transactionsSupprimees: resultat.transactionsSupprimees,
  });
});

module.exports = router;
