const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Paolo - Banking API",
      version: "1.0.0",
      description: `
API REST modulaire pour la gestion de comptes bancaires.

## Architecture
- **Routes** : domaine séparé (comptes / transactions / général)
- **Services** : logique métier isolée des handlers HTTP
- **Utils** : helpers de formatage réutilisables

## Fonctionnalités
- Création, consultation et suppression de comptes
- Dépôts et retraits avec validation stricte
- Historique des transactions
- Suppression en cascade

## Règles métier
- Solde initial : 0 FCFA
- Montant : nombre strictement positif
- Retrait impossible si solde insuffisant
- IDs générés côté serveur (UUID v4)

© Paolo Sandji — Cours ICT304
      `,
      contact: {
        name: "Paolo Sandji",
      },
      license: { name: "Académique - ICT4D" },
    },
    tags: [
      { name: "Général", description: "Informations sur l'API" },
      { name: "Auth", description: "Inscription, connexion et profil" },
      { name: "Comptes", description: "Gestion des comptes bancaires" },
      { name: "Transactions", description: "Dépôts, retraits et historique" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        InscriptionRequete: {
          type: "object",
          required: ["nom", "prenom", "email", "password"],
          properties: {
            nom: { type: "string", example: "Sandji" },
            prenom: { type: "string", example: "Paolo" },
            email: { type: "string", format: "email", example: "paolo@exemple.com" },
            password: { type: "string", minLength: 6, example: "secret123" },
          },
        },
        ConnexionRequete: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "paolo@exemple.com" },
            password: { type: "string", example: "secret123" },
          },
        },
        Utilisateur: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            nom: { type: "string" },
            prenom: { type: "string" },
            email: { type: "string", format: "email" },
            dateInscription: { type: "string" },
          },
        },
        Compte: {
          type: "object",
          required: ["id", "nom", "prenom", "solde", "dateCreation"],
          properties: {
            id: { type: "string", format: "uuid" },
            nom: { type: "string", example: "Sandji" },
            prenom: { type: "string", example: "Paolo" },
            solde: { type: "string", example: "10000.00 FCFA" },
            dateCreation: { type: "string", example: "19 avril 2026 à 10:30" },
          },
        },
        Transaction: {
          type: "object",
          required: ["id", "compteId", "type", "montant", "date"],
          properties: {
            id: { type: "string", format: "uuid" },
            compteId: { type: "string", format: "uuid" },
            type: { type: "string", enum: ["depot", "retrait"] },
            montant: { type: "string", example: "5000.00 FCFA" },
            date: { type: "string" },
          },
        },
        Reponse: {
          type: "object",
          required: ["succes", "message"],
          properties: {
            succes: { type: "boolean" },
            message: { type: "string" },
            donnees: { nullable: true },
          },
        },
        Erreur: {
          type: "object",
          properties: {
            erreur: { type: "string", example: "Les champs 'nom' et 'prenom' sont requis." },
          },
        },
        CreerCompteRequete: {
          type: "object",
          required: ["nom", "prenom"],
          properties: {
            nom: { type: "string", example: "Sandji", minLength: 1 },
            prenom: { type: "string", example: "Paolo", minLength: 1 },
          },
        },
        MontantRequete: {
          type: "object",
          required: ["montant"],
          properties: {
            montant: { type: "number", minimum: 0.01, example: 5000 },
          },
        },
      },
      responses: {
        CompteIntrouvable: {
          description: "Compte introuvable",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Reponse" },
              example: { succes: false, message: "Compte introuvable.", donnees: null },
            },
          },
        },
        MontantInvalide: {
          description: "Montant invalide (non numérique, nul ou négatif)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Reponse" },
              example: { succes: false, message: "Le montant doit être un nombre positif.", donnees: null },
            },
          },
        },
        ChampsManquants: {
          description: "Champs requis manquants",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Erreur" },
              example: { erreur: "Les champs 'nom' et 'prenom' sont requis." },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
