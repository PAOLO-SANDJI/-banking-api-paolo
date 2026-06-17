const jwt = require("jsonwebtoken");
const { JWT_SECRET, trouverParId } = require("../services/authService");
const { reponse } = require("../utils/format");

function authentifier(req, res, next) {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) {
    return reponse(res, 401, "Authentification requise. Veuillez vous connecter.", null);
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const utilisateur = trouverParId(payload.id);
    if (!utilisateur) {
      return reponse(res, 401, "Session invalide. Veuillez vous reconnecter.", null);
    }
    req.utilisateur = utilisateur;
    next();
  } catch {
    return reponse(res, 401, "Token invalide ou expiré.", null);
  }
}

module.exports = { authentifier };
