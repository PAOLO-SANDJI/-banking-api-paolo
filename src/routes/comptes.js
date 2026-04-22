const { Router } = require("express");
const compteService = require("../services/compteService");
const { formaterCompte, reponse } = require("../utils/format");

const router = Router();

/**
 * @openapi
 * /api/comptes:
 *   post:
 *     summary: Créer un nouveau compte bancaire
 *     description: |
 *       Crée un compte bancaire avec un solde initial de 0 FCFA.
 *       Un UUID v4 est généré automatiquement.
 *       **Validation** : les champs `nom` et `prenom` sont requis et non vides.
 *     tags: [Comptes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreerCompteRequete'
 *           examples:
 *             valide:
 *               summary: Requête valide
 *               value: { nom: "Sandji", prenom: "Paolo" }
 *             manquant:
 *               summary: Champ manquant
 *               value: { nom: "Sandji" }
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Reponse'
 *                 - type: object
 *                   properties:
 *                     donnees: { $ref: '#/components/schemas/Compte' }
 *       400:
 *         $ref: '#/components/responses/ChampsManquants'
 */
router.post("/", (req, res) => {
  const { nom, prenom } = req.body || {};
  if (!nom || !prenom) {
    return res.status(400).json({ erreur: "Les champs 'nom' et 'prenom' sont requis." });
  }
  const compte = compteService.creer(nom, prenom);
  reponse(res, 201, "Compte créé avec succès.", formaterCompte(compte));
});

/**
 * @openapi
 * /api/comptes:
 *   get:
 *     summary: Lister tous les comptes
 *     tags: [Comptes]
 *     responses:
 *       200:
 *         description: Liste des comptes (peut être vide)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Reponse'
 *                 - type: object
 *                   properties:
 *                     donnees:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Compte' }
 */
router.get("/", (req, res) => {
  const tous = compteService.lister();
  reponse(res, 200, `${tous.length} compte(s) trouvé(s).`, tous.map(formaterCompte));
});

/**
 * @openapi
 * /api/comptes/{id}:
 *   get:
 *     summary: Consulter un compte par son ID
 *     tags: [Comptes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Compte trouvé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Reponse'
 *                 - type: object
 *                   properties:
 *                     donnees: { $ref: '#/components/schemas/Compte' }
 *       404:
 *         $ref: '#/components/responses/CompteIntrouvable'
 */
router.get("/:id", (req, res) => {
  const compte = compteService.trouverParId(req.params.id);
  if (!compte) return reponse(res, 404, "Compte introuvable.", null);
  reponse(res, 200, "Compte trouvé.", formaterCompte(compte));
});

/**
 * @openapi
 * /api/comptes/{id}:
 *   delete:
 *     summary: Supprimer un compte bancaire (cascade)
 *     description: |
 *       Supprime définitivement un compte et toutes ses transactions associées.
 *       L'opération est irréversible.
 *     tags: [Comptes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Compte supprimé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Reponse'
 *                 - type: object
 *                   properties:
 *                     donnees:
 *                       type: object
 *                       properties:
 *                         compteSupprime: { type: string, format: uuid }
 *                         transactionsSupprimees: { type: integer }
 *       404:
 *         $ref: '#/components/responses/CompteIntrouvable'
 */
router.delete("/:id", (req, res) => {
  const resultat = compteService.supprimer(req.params.id);
  if (!resultat) return reponse(res, 404, "Compte introuvable.", null);
  reponse(res, 200, "Compte supprimé avec succès.", {
    compteSupprime: resultat.compte.id,
    transactionsSupprimees: resultat.transactionsSupprimees,
  });
});

module.exports = router;
