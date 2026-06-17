const { Router } = require("express");
const authService = require("../services/authService");
const { authentifier } = require("../middleware/auth");
const { reponse } = require("../utils/format");

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InscriptionRequete'
 *     responses:
 *       201:
 *         description: Inscription réussie
 *       400:
 *         description: Données invalides ou email déjà utilisé
 */
router.post("/register", async (req, res) => {
  const { nom, prenom, email, password } = req.body || {};

  if (!nom || !prenom || !email || !password) {
    return reponse(res, 400, "Les champs nom, prenom, email et password sont requis.", null);
  }
  if (password.length < 6) {
    return reponse(res, 400, "Le mot de passe doit contenir au moins 6 caractères.", null);
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return reponse(res, 400, "L'adresse email est invalide.", null);
  }

  const resultat = await authService.inscrire(nom, prenom, email, password);
  if (resultat.erreur) {
    return reponse(res, 400, resultat.erreur, null);
  }

  reponse(res, 201, "Inscription réussie. Bienvenue !", authService.formaterUtilisateur(resultat.utilisateur));
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConnexionRequete'
 *     responses:
 *       200:
 *         description: Connexion réussie, retourne un JWT
 *       401:
 *         description: Email ou mot de passe incorrect
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return reponse(res, 400, "Email et password sont requis.", null);
  }

  const resultat = await authService.connecter(email, password);
  if (resultat.erreur) {
    return reponse(res, 401, resultat.erreur, null);
  }

  reponse(res, 200, "Connexion réussie.", {
    token: resultat.token,
    utilisateur: authService.formaterUtilisateur(resultat.utilisateur),
  });
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Profil de l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil retourné
 *       401:
 *         description: Non authentifié
 */
router.get("/me", authentifier, (req, res) => {
  reponse(res, 200, "Profil récupéré.", authService.formaterUtilisateur(req.utilisateur));
});

module.exports = router;
