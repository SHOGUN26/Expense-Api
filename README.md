# Expenses API

API REST de gestion de dépenses : chaque utilisateur gère uniquement **ses propres dépenses** et obtient un résumé par catégorie. Authentification par Better Auth.

**Stack** : NestJS 11, TypeScript, PostgreSQL, Prisma, Better Auth, Zod, Swagger, Vitest + Supertest, Bruno.

## Prérequis

- [Bun](https://bun.sh)
- Node.js >= 22.12
- Git
- PostgreSQL (local ou Docker)

## Installation

```bash
git clone <url-du-repo> expenses-api
cd expenses-api
bun install
```

## Configuration

Copie `.env.example` vers `.env` et renseigne les valeurs :

| Variable             | Rôle                                               |
| -------------------- | -------------------------------------------------- |
| `DATABASE_URL`       | adresse de connexion PostgreSQL                    |
| `BETTER_AUTH_SECRET` | secret de signature des sessions                   |
| `BETTER_AUTH_URL`    | URL de base de l'API (ex. `http://localhost:3000`) |
| `PORT`               | port d'écoute                                      |

Le fichier `.env` ne doit jamais être versionné.

## Lancement

```bash
bun run db:migrate   # applique les migrations
bun run dev          # lance l'API en mode watch
```

- API : `http://localhost:3000`
- Documentation Swagger : `http://localhost:3000/docs`

## Endpoints

Authentification (Better Auth) : `POST /api/auth/sign-up/email`, `POST /api/auth/sign-in/email`.

| Méthode | Route               | Description                                              |
| ------- | ------------------- | -------------------------------------------------------- |
| POST    | `/expenses`         | Créer une dépense                                        |
| GET     | `/expenses`         | Lister mes dépenses (filtres : `category`, `from`, `to`) |
| GET     | `/expenses/summary` | Total par catégorie                                      |
| GET     | `/expenses/:id`     | Détail d'une dépense                                     |
| PUT     | `/expenses/:id`     | Modifier une dépense                                     |
| DELETE  | `/expenses/:id`     | Supprimer une dépense                                    |

Catégories : `food`, `transport`, `leisure`, `bills`, `health`, `other`.
Une dépense inexistante ou appartenant à un autre utilisateur renvoie **404**.

## Tests

### Tests automatisés (e2e)

```bash
bun run test:e2e
```

Les tests démarrent l'application eux-mêmes : il n'est pas nécessaire de lancer le serveur. Ils créent deux utilisateurs et vérifient la création, la validation (400), l'accès sans session (401), les filtres, le résumé et l'**isolation entre utilisateurs** (404).

> Les tests utilisent la base définie dans `DATABASE_URL`. Utilise une base dédiée (ex. `expenses_test`) pour ne pas polluer ta base de développement.

### Collection Bruno

1. Ouvre Bruno, puis _Open Collection_ et sélectionne le dossier de la collection.
2. Choisis l'environnement actif (variables `base_url`, `access_token`).
3. Lance dans l'ordre : `Auth/Register`, `Auth/Login`, puis les requêtes du dossier `Expenses/`.

Le login enregistre automatiquement `token` et `userId` dans l'environnement.

## Déploiement

Non déployé pour le moment. L'API se lance en local (voir « Lancement »).

## Commandes utiles

| Commande                          | Rôle                                  |
| --------------------------------- | ------------------------------------- |
| `bun run dev`                     | API en mode watch                     |
| `bun run build` / `bun run start` | compiler / lancer la version compilée |
| `bun run db:migrate`              | créer et appliquer une migration      |
| `bun run db:studio`               | explorer les données                  |
| `bun run test`                    | tests unitaires                       |
| `bun run test:e2e`                | tests end-to-end                      |
| `bun run check`                   | lint et format (Biome)                |
