# Cahier des Charges - API Bancaire Paolo

**Étudiant :** PAOLO SANDJI
**Niveau :** L3
**Filière :** ICT4D
**Matière :** ICT304 - Software Testing and Quality Assurance

---

## 1. Contexte et objectifs

Conception d'une API REST **modulaire** pour un système de transactions bancaires.
L'architecture est volontairement découpée en couches (routes / services / utils)
afin de faciliter la testabilité et l'évolution future (ajout d'une base de données,
d'une couche d'authentification, etc.).

---

## 2. Architecture du projet

```
banking-api-paolo/
├── index.js                   # Point d'entrée minimal
├── src/
│   ├── app.js                 # Configuration Express
│   ├── swagger.js             # Spécification OpenAPI
│   ├── routes/
│   │   ├── general.js         # Route racine
│   │   ├── comptes.js         # CRUD comptes + DELETE
│   │   └── transactions.js    # Dépôts, retraits, historique
│   ├── services/
│   │   ├── store.js           # Stockage en mémoire partagé
│   │   ├── compteService.js   # Logique comptes
│   │   └── transactionService.js
│   └── utils/format.js        # Formatage FCFA, dates, réponses
├── docs/                      # Cahier des charges (MD/HTML/PDF)
├── tests/                     # Tests modulaires par domaine
└── tools/                     # Script génération PDF
```

**Différence avec une architecture monolithique** :
chaque domaine métier est isolé et testable indépendamment.

---

## 3. Besoins

### 3.1 Besoins fonctionnels

| ID   | Besoin                                  | Priorité |
|------|-----------------------------------------|----------|
| BF01 | Créer un compte bancaire                | Haute    |
| BF02 | Consulter la liste des comptes          | Haute    |
| BF03 | Consulter un compte par ID              | Haute    |
| BF04 | Effectuer un dépôt                      | Haute    |
| BF05 | Effectuer un retrait                    | Haute    |
| BF06 | Consulter l'historique des transactions | Moyenne  |
| BF07 | Supprimer un compte (cascade)           | Moyenne  |

### 3.2 Besoins non fonctionnels

| ID    | Besoin                                              | Priorité |
|-------|-----------------------------------------------------|----------|
| BNF01 | Temps de réponse < 500ms                            | Haute    |
| BNF02 | Validation stricte des entrées                      | Haute    |
| BNF03 | Codes HTTP conformes aux conventions REST           | Haute    |
| BNF04 | Retrait impossible si solde insuffisant             | Haute    |
| BNF05 | Documentation Swagger/OpenAPI 3.0                   | Moyenne  |
| BNF06 | Architecture modulaire (séparation des préoccupations) | Haute    |
| BNF07 | Suppression en cascade des données liées            | Moyenne  |

---

## 4. Cas d'utilisation

### CU01 - Créer un compte
- **Acteur** : Client
- **Scénario** : POST /api/comptes avec `{nom, prenom}` → compte créé avec UUID, solde 0.
- **Alternatif** : champs manquants → HTTP 400.

### CU02 - Consulter les comptes
- GET /api/comptes (liste) ou GET /api/comptes/:id (détail).
- Alternatif : ID inexistant → HTTP 404.

### CU03 - Déposer
- POST /api/comptes/:id/depot avec `{montant}` (nombre > 0).
- Alternatif : montant invalide → 400, compte inexistant → 404.

### CU04 - Retirer
- POST /api/comptes/:id/retrait avec `{montant}`.
- Pré-condition : solde ≥ montant.
- Alternatifs : solde insuffisant → 400, montant invalide → 400.

### CU05 - Historique
- GET /api/comptes/:id/transactions retourne toutes les transactions du compte.

### CU06 - Supprimer un compte (nouveau)
- DELETE /api/comptes/:id supprime le compte **et** ses transactions associées.
- Opération irréversible.
- Retourne `{compteSupprime, transactionsSupprimees}`.

---

## 5. Endpoints

| Méthode | Endpoint                        | Description                  |
|---------|---------------------------------|------------------------------|
| GET     | /                               | Accueil                      |
| GET     | /api-docs                       | Documentation Swagger        |
| POST    | /api/comptes                    | Créer un compte              |
| GET     | /api/comptes                    | Lister tous les comptes      |
| GET     | /api/comptes/:id                | Consulter un compte          |
| DELETE  | /api/comptes/:id                | Supprimer un compte          |
| POST    | /api/comptes/:id/depot          | Effectuer un dépôt           |
| POST    | /api/comptes/:id/retrait        | Effectuer un retrait         |
| GET     | /api/comptes/:id/transactions   | Historique transactions      |

---

## 6. Stack technique

- **Runtime** : Node.js 18+
- **Framework** : Express.js 5
- **Documentation** : swagger-jsdoc + swagger-ui-express (OpenAPI 3.0)
- **Stockage** : en mémoire (arrays partagés via `store.js`)
- **Déploiement** : Render (plan Free)
- **Tests** : runner natif Node.js (sans framework externe)

---

## 7. Plan de tests

Les cas de tests suivent le **Test Case Format (Template 1)** du cours ICT304 et
appliquent le principe du **Defensive Testing**.

Organisation différente de l'approche monolithique : les tests sont **répartis
par module** dans le dossier `tests/` (comptes.test.js, transactions.test.js,
suppression.test.js, integration.test.js), puis orchestrés par `tests/runner.js`.

### 7.1 Module Général

| ID     | Description                           | Input        | Attendu                  | Statut |
|--------|---------------------------------------|--------------|--------------------------|--------|
| TC-001 | Page d'accueil                        | GET /        | 200 + message Paolo      | Pass   |
| TC-002 | Documentation Swagger                 | GET /api-docs| 200 + UI Swagger chargée | Pass   |

### 7.2 Module Comptes

| ID     | Description                           | Input                              | Attendu                  | Statut |
|--------|---------------------------------------|------------------------------------|--------------------------|--------|
| TC-101 | Création valide                       | `{nom:"Sandji",prenom:"Paolo"}`    | 201 + UUID + 0 FCFA      | Pass   |
| TC-102 | Nom manquant                          | `{prenom:"Paolo"}`                 | 400                      | Pass   |
| TC-103 | Prénom manquant                       | `{nom:"Sandji"}`                   | 400                      | Pass   |
| TC-104 | Corps vide                            | `{}`                               | 400                      | Pass   |
| TC-105 | Nom vide                              | `{nom:"",prenom:"P"}`              | 400                      | Pass   |
| TC-106 | Prénom vide                           | `{nom:"S",prenom:""}`              | 400                      | Pass   |
| TC-107 | IDs uniques                           | 2 créations                        | UUIDs différents         | Pass   |
| TC-108 | Liste vide/partielle                  | GET /api/comptes                   | 200 + array              | Pass   |
| TC-109 | Consultation ID valide                | GET /api/comptes/:uuid             | 200 + données            | Pass   |
| TC-110 | Consultation ID inexistant            | GET /api/comptes/00000000-...      | 404                      | Pass   |
| TC-111 | Consultation ID malformé              | GET /api/comptes/abc               | 404                      | Pass   |

### 7.3 Module Dépôt

| ID     | Description                           | Input                   | Attendu               | Statut |
|--------|---------------------------------------|-------------------------|-----------------------|--------|
| TC-201 | Dépôt valide                          | `{montant:5000}`        | 200 + solde maj       | Pass   |
| TC-202 | Dépôt compte inexistant               | ID inconnu              | 404                   | Pass   |
| TC-203 | Montant négatif                       | `{montant:-100}`        | 400                   | Pass   |
| TC-204 | Montant zéro                          | `{montant:0}`           | 400                   | Pass   |
| TC-205 | Montant en chaîne                     | `{montant:"5000"}`      | 400                   | Pass   |
| TC-206 | Sans montant                          | `{}`                    | 400                   | Pass   |
| TC-207 | Montant null                          | `{montant:null}`        | 400                   | Pass   |
| TC-208 | Dépôts successifs (cumul)             | 1000 + 2000             | Solde = 3000.00 FCFA  | Pass   |
| TC-209 | Montant très grand                    | `{montant:1e9}`         | 200                   | Pass   |
| TC-210 | Montant décimal                       | `{montant:1234.56}`     | 200 + "1234.56 FCFA"  | Pass   |

### 7.4 Module Retrait

| ID     | Description                           | Input                     | Attendu                 | Statut |
|--------|---------------------------------------|---------------------------|-------------------------|--------|
| TC-301 | Retrait valide                        | solde=10000, montant=3000 | 200 + solde=7000        | Pass   |
| TC-302 | Retrait compte inexistant             | ID inconnu                | 404                     | Pass   |
| TC-303 | Solde insuffisant                     | solde=1000, montant=5000  | 400 "Solde insuffisant" | Pass   |
| TC-304 | Retrait = solde (limite)              | solde=5000, montant=5000  | 200 + solde=0           | Pass   |
| TC-305 | Montant négatif                       | `{montant:-500}`          | 400                     | Pass   |
| TC-306 | Montant zéro                          | `{montant:0}`             | 400                     | Pass   |
| TC-307 | Sans montant                          | `{}`                      | 400                     | Pass   |
| TC-308 | Montant non numérique                 | `{montant:"abc"}`         | 400                     | Pass   |
| TC-309 | Retraits successifs                   | 2x500 sur 1000            | Solde = 0               | Pass   |
| TC-310 | Retrait sur solde=0                   | `{montant:100}`           | 400                     | Pass   |

### 7.5 Module Historique

| ID     | Description                           | Input                     | Attendu                 | Statut |
|--------|---------------------------------------|---------------------------|-------------------------|--------|
| TC-401 | Historique vide                       | Compte neuf               | 200 + []                | Pass   |
| TC-402 | Après 1 dépôt                         | 1 dépôt 5000              | 200 + 1 txn "depot"     | Pass   |
| TC-403 | Historique mixte                      | 1 dépôt + 1 retrait       | 200 + 2 transactions    | Pass   |
| TC-404 | Compte inexistant                     | ID inconnu                | 404                     | Pass   |
| TC-405 | Isolation entre comptes               | A txns, B vide            | B reste vide            | Pass   |

### 7.6 Module Suppression (DELETE)

| ID     | Description                                      | Input                 | Attendu                          | Statut |
|--------|--------------------------------------------------|-----------------------|----------------------------------|--------|
| TC-501 | Suppression valide                               | ID UUID existant      | 200 + compteSupprime             | Pass   |
| TC-502 | Suppression compte inexistant                    | UUID non créé         | 404                              | Pass   |
| TC-503 | Compte absent après suppression                  | DELETE puis GET       | 404 sur GET                      | Pass   |
| TC-504 | Cascade des transactions                         | Compte + 2 txns + DEL | transactionsSupprimees = 2       | Pass   |
| TC-505 | Suppression n'affecte pas les autres comptes     | A + B, DEL A          | B toujours présent               | Pass   |

### 7.7 Scénarios d'intégration

| ID     | Description                                        | Input                              | Attendu                  | Statut |
|--------|----------------------------------------------------|------------------------------------|--------------------------|--------|
| TC-601 | Scénario complet                                   | Création + dépôt + retrait + hist. | Toute la chaîne cohérente| Pass   |
| TC-602 | Créations simultanées (5 parallèles)               | Promise.all × 5                    | 5 UUIDs uniques          | Pass   |
| TC-603 | Dépôts concurrents                                 | 2 dépôts de 1000 en parallèle      | Solde = 2000             | Pass   |

### 7.8 Matrice de traçabilité (RTM)

| Besoin | Cas de tests                            |
|--------|-----------------------------------------|
| BF01   | TC-101 à TC-107                         |
| BF02   | TC-108                                  |
| BF03   | TC-109 à TC-111                         |
| BF04   | TC-201 à TC-210                         |
| BF05   | TC-301 à TC-310                         |
| BF06   | TC-401 à TC-405                         |
| BF07   | TC-501 à TC-505                         |
| BNF02  | TC-102-106, TC-203-207, TC-305-308      |
| BNF04  | TC-303, TC-304, TC-310                  |
| BNF05  | TC-001, TC-002                          |
| BNF07  | TC-504, TC-505                          |

### 7.9 Synthèse

- **Total** : 36 cas de tests (plus léger que le monolithique car mieux structuré)
- **Couverture** : normale + anormale + limites + intégration
- **Types d'erreurs** : syntaxiques, logiques, sémantiques, de limites
- **Automatisation** : runner Node.js natif sans dépendance externe
