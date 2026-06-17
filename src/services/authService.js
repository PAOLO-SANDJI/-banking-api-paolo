const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "banking_api_secret_dev_key";
const JWT_EXPIRES = "7d";

function trouverParEmail(email) {
  return getDb().prepare("SELECT * FROM utilisateurs WHERE email = ?").get(email.toLowerCase().trim());
}

function trouverParId(id) {
  return getDb().prepare("SELECT * FROM utilisateurs WHERE id = ?").get(id);
}

async function inscrire(nom, prenom, email, password) {
  const emailNormalise = email.toLowerCase().trim();
  if (trouverParEmail(emailNormalise)) {
    return { erreur: "Un compte existe déjà avec cet email." };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();
  const dateInscription = new Date().toISOString();

  getDb().prepare(
    "INSERT INTO utilisateurs (id, nom, prenom, email, password_hash, date_inscription) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, nom, prenom, emailNormalise, passwordHash, dateInscription);

  return { utilisateur: trouverParId(id) };
}

async function connecter(email, password) {
  const emailNormalise = email.toLowerCase().trim();
  const utilisateur = trouverParEmail(emailNormalise);
  if (!utilisateur) return { erreur: "Email ou mot de passe incorrect." };

  const valide = await bcrypt.compare(password, utilisateur.password_hash);
  if (!valide) return { erreur: "Email ou mot de passe incorrect." };

  const token = jwt.sign(
    { id: utilisateur.id, email: utilisateur.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  return { token, utilisateur };
}

function formaterUtilisateur(u) {
  return {
    id: u.id,
    nom: u.nom,
    prenom: u.prenom,
    email: u.email,
    dateInscription: new Date(u.date_inscription).toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }),
  };
}

module.exports = {
  inscrire,
  connecter,
  trouverParId,
  formaterUtilisateur,
  JWT_SECRET,
};
