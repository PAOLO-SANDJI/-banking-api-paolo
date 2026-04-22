const { Router } = require("express");
const compteService = require("../services/compteService");
const transactionService = require("../services/transactionService");
const { formaterCompte, formaterTransaction, formaterMontant, reponse } = require("../utils/format");

const router = Router({ mergeParams: true });

/**
 * @openapi
 * /api/comptes/{id}/depot:
 *   post:
 *     summary: Effectuer un dépôt
 *     description: Ajoute un montant au solde du compte et enregistre la transaction.
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MontantRequete' }
 *           examples:
 *             valide: { value: { montant: 5000 } }
 *             negatif: { value: { montant: -100 } }
 *     responses:
 *       200:
 *         description: Dépôt effectué
 *       400:
 *         $ref: '#/components/responses/MontantInvalide'
 *       404:
 *         $ref: '#/components/responses/CompteIntrouvable'
 */
router.post("/:id/depot", (req, res) => {
  const compte = compteService.trouverParId(req.params.id);
  if (!compte) return reponse(res, 404, "Compte introuvable.", null);

  const { montant } = req.body || {};
  if (!transactionService.estMontantValide(montant)) {
    return reponse(res, 400, "Le montant doit être un nombre positif.", null);
  }

  transactionService.effectuerDepot(compte, montant);
  reponse(res, 200, `Dépôt de ${formaterMontant(montant)} effectué.`, formaterCompte(compte));
});

/**
 * @openapi
 * /api/comptes/{id}/retrait:
 *   post:
 *     summary: Effectuer un retrait
 *     description: |
 *       Soustrait un montant du solde si suffisant.
 *       Le retrait ne peut pas rendre le solde négatif.
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MontantRequete' }
 *     responses:
 *       200:
 *         description: Retrait effectué
 *       400:
 *         description: Montant invalide OU solde insuffisant
 *       404:
 *         $ref: '#/components/responses/CompteIntrouvable'
 */
router.post("/:id/retrait", (req, res) => {
  const compte = compteService.trouverParId(req.params.id);
  if (!compte) return reponse(res, 404, "Compte introuvable.", null);

  const { montant } = req.body || {};
  if (!transactionService.estMontantValide(montant)) {
    return reponse(res, 400, "Le montant doit être un nombre positif.", null);
  }
  if (montant > compte.solde) {
    return reponse(res, 400, "Solde insuffisant.", null);
  }

  transactionService.effectuerRetrait(compte, montant);
  reponse(res, 200, `Retrait de ${formaterMontant(montant)} effectué.`, formaterCompte(compte));
});

/**
 * @openapi
 * /api/comptes/{id}/transactions:
 *   get:
 *     summary: Historique des transactions d'un compte
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Liste des transactions
 *       404:
 *         $ref: '#/components/responses/CompteIntrouvable'
 */
router.get("/:id/transactions", (req, res) => {
  const compte = compteService.trouverParId(req.params.id);
  if (!compte) return reponse(res, 404, "Compte introuvable.", null);

  const hist = transactionService.historique(compte.id);
  reponse(res, 200, `${hist.length} transaction(s) trouvée(s).`, hist.map(formaterTransaction));
});

module.exports = router;
