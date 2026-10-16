#Image de base
FROM node:22-alpine

# Bun sert uniquement à installer les dépendances et lancer les scripts
RUN npm install -g bun

#Répertoire de travail
WORKDIR /src

#Copie des fichier dans l'image
COPY package.json bun.lock* ./

#Commande éxercutée lors du build
RUN bun install --frozen-lockfile --ignore-scripts

# Copie des fichiers dans l'image
COPY . .

# Génère le client Prisma et compile Nest
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" bun run db:generate \
    && bun run build

#Documente les ports utilisés
EXPOSE 3000

# Migrations, puis démarrage de l'API compilée avec Node
CMD ["sh", "-c", "bun run db:deploy && node dist/src/main.js"]

