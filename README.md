# shop
/--------- menu BotFather --------->>
start - Bienvenue sur Couz-ia Bot
shop - Voir la liste des produits
updatedb - Mettre à jour la base de données des produits
aboutai - En savoir plus sur l'IA Couz-ia
help - Afficher les commandes disponibles

# 🤖 Couz-ia E-Boutique IA & Telegram Bot 🚀

Bienvenue sur le dépôt de Couz-ia, une e-boutique innovante propulsée par l'intelligence artificielle et intégrée à un bot Telegram pour une gestion et une interaction dynamiques.

## ✨ Fonctionnalités Clés

* **Gestion de Produits & Stock** : CRUD complet pour les articles de la boutique, avec persistance dans un fichier `db_article.json`. Chaque produit inclut un stock.
* **Interface Web Interactive** : Un frontend moderne et responsive (mobile-first) hébergé sur GitHub Pages, permettant aux utilisateurs d'explorer les produits.
* **Intégration AI (Groq SDK)** :
    * Génération de descriptions de produits basées sur l'IA.
    * Génération de plans d'affaires concis.
    * Réponses intelligentes du bot Telegram via le modèle `llama-3.1-8b-instant`.
* **Bot Telegram (`@worker_Pibot`)** :
    * Commandes simplifiées pour la navigation et la gestion.
    * Mise à jour dynamique de la base de données des articles via commande.
    * Interaction conversationnelle basée sur l'IA.
* **Architecture Séparee** : Frontend statique (GitHub Pages) et Backend Node.js (API + Bot) déployés indépendamment.
* **Thèmes Dynamiques** : Bascule entre thème clair et sombre sur l'interface web.

## 🏗️ Architecture du Projet

Le projet est divisé en deux composants principaux :

1.  **Backend (Serveur Node.js)** :
    * Fichier principal : `srv.js`
    * Technologies : Node.js, Express.js, Telegraf.js (pour le bot Telegram), Groq SDK (pour l'IA), `fs` (pour la gestion des fichiers), `dotenv` (pour les variables d'environnement), `body-parser`, `cors`.
    * Base de données : `db_article.json` (base de données locale simple).
    * Rôle : Gère les requêtes API (produits, clients), les interactions avec le bot Telegram, et l'intégration de l'IA pour la génération de contenu.
    * **Déploiement** : Doit être hébergé sur une plateforme supportant Node.js (ex: Render.com, Heroku, Vercel Functions, un VPS).

2.  **Frontend (Application Web Statique)** :
    * Dossier : `docs/`
    * Fichiers : `index.html` (page d'accueil), `shop.html` (boutique), `style.css` (global), `shop.css` (spécifique boutique), `script.js` (logique accueil), `shop.js` (logique boutique).
    * Technologies : HTML5, CSS3 (avec Bootstrap 5), JavaScript.
    * Rôle : Fournit l'interface utilisateur graphique pour la boutique, affiche les produits et interagit avec le backend via des requêtes API.
    * **Déploiement** : Idéalement hébergé sur **GitHub Pages**.

### Schéma Conceptuel
```
    +------------------+     +--------------------+     +------------------+
    |                  |     |                    |     |                  |
    | Frontend (docs/) | <-> | Backend (srv.js)   | <-> | db_article.json  |
    | GitHub Pages     |     | Node.js Server     |     | (Data Storage)   |
    | (Static Files)   |     | (e.g., Render.com) |     |                  |
    |                  |     |                    |     |                  |
    +------------------+     +--------------------+     +------------------+
            ^                       ^
            |                       |
            |                       |
    +-----------------------------------+
    |          Telegram Bot             |
    |       (via @BotFather API)        |
    +-----------------------------------+
```

## 🚀 Démarrage Rapide

Suivez ces étapes pour mettre en place et exécuter le projet.

### Prérequis

* Node.js (version 18 ou supérieure recommandée)
* npm (normalement inclus avec Node.js)
* Un compte Telegram et un bot créé via `@BotFather`
* Une clé API Groq (obtenue sur [Groq Cloud](https://console.groq.com/))
* Un dépôt GitHub

### 1. Cloner le Dépôt

```bash
git clone [https://github.com/votre_utilisateur/votre_repo.git](https://github.com/votre_utilisateur/votre_repo.git)
cd votre_repo
2. Configuration du Backend (srv.js)
a. Installation des Dépendances
Bash

npm install express telegraf groq-sdk body-parser cors dotenv
b. Configuration des Variables d'Environnement
Créez un fichier nommé .env à la racine de votre projet (là où se trouve srv.js) et ajoutez-y vos clés API :

Extrait de code

TELEGRAM_BOT_TOKEN=VOTRE_TOKEN_BOT_TELEGRAM
GROQ_API_KEY=VOTRE_CLE_API_GROQ
PORT=3000 # Optionnel, le port par défaut est 3000
IMPORTANT : Ajoutez .env à votre fichier .gitignore pour éviter de le commettre sur GitHub :

# .gitignore
.env
node_modules/
c. Initialisation de la Base de Données
Assurez-vous d'avoir un fichier db_article.json à la racine de votre projet. Son contenu initial doit être un tableau JSON vide :

JSON

[]
d. Démarrer le Serveur Backend
Bash

node srv.js
Le serveur Express sera lancé sur http://localhost:3000 et le bot Telegram sera actif.

e. Déploiement du Backend
Pour rendre votre backend accessible depuis l'extérieur (et depuis votre frontend GitHub Pages), vous devrez le déployer sur un service d'hébergement Node.js (ex: Render.com). Suivez les instructions de la plateforme choisie. Une fois déployé, notez son URL publique (ex: https://votre-backend.onrender.com).

3. Configuration du Frontend (docs/)
a. Structure du Dossier docs/
Assurez-vous que votre répertoire docs/ contient tous les fichiers HTML, CSS et JS de votre frontend :

docs/
├── index.html
├── style.css
├── script.js
├── shop.html
├── shop.css
└── shop.js
b. Mettre à Jour l'URL de l'API dans le Frontend
Ouvrez docs/shop.js (et docs/script.js si ce dernier fait des appels API) et mettez à jour la constante BASE_URL avec l'URL publique de votre backend déployé :

JavaScript

// docs/shop.js (et/ou docs/script.js)
const BASE_URL = '[https://votre-backend-deploye.onrender.com](https://votre-backend-deploye.onrender.com)'; // REMPLACEZ CETTE URL !
c. Configurer CORS sur le Backend
Pour permettre à votre frontend (hébergé sur GitHub Pages) de communiquer avec votre backend, vous devez configurer CORS. Dans srv.js, modifiez le middleware cors() :

JavaScript

// srv.js
const corsOptions = {
    origin: 'https://votre_utilisateur.github.io', // REMPLACEZ par l'URL exacte de votre GitHub Pages
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
Si votre GitHub Pages est pour un sous-répertoire (ex: https://votre_utilisateur.github.io/votre_repo/), utilisez l'URL complète dans origin.

Redéployez votre backend après cette modification de CORS.

d. Déploiement du Frontend sur GitHub Pages
Assurez-vous que tous les fichiers du dossier docs/ sont commis et poussés vers la branche main (ou master) de votre dépôt GitHub.

Dans votre dépôt GitHub, allez dans Settings > Pages.

Sous "Build and deployment", sélectionnez "Deploy from a branch".

Sous "Branch", choisissez main (ou master) et le dossier /docs.

Cliquez sur "Save".

GitHub Pages va déployer votre site. L'URL sera affichée dans cette même section (ex: https://votre_utilisateur.github.io/votre_repo/).

4. Configuration du Bot Telegram
Via @BotFather :

Envoyez /start à @BotFather.

Envoyez /setcommands.

Sélectionnez votre bot.

Collez la liste de commandes suivante :

start - Bienvenue sur Couz-ia Bot
shop - Voir la liste des produits
updatedb - Mettre à jour la base de données des produits
aboutai - En savoir plus sur l'IA Couz-ia
help - Afficher les commandes disponibles
5. Utilisation de l'Application
Accès à la Boutique Web : Ouvrez l'URL de votre GitHub Pages (https://votre_utilisateur.github.io/votre_repo/) dans votre navigateur.

Interaction avec le Bot Telegram : Trouvez votre bot dans Telegram et utilisez les commandes définies :

/start : Pour commencer.

/shop : Pour lister les produits.

/updatedb : Pour générer 10 nouveaux articles dans la base de données (nécessite de rafraîchir la page web après).

/aboutai : Pour en savoir plus sur l'IA.

/help : Pour afficher la liste des commandes.

Envoyez n'importe quel autre texte pour interagir avec l'IA conversationnelle.

🛣️ Prochaines Étapes Possibles
Authentification Utilisateur : Ajouter un système de connexion/inscription pour les clients.

Panier d'Achat : Implémenter un panier et un processus de commande.

Base de Données Plus Robuste : Migrer de db_article.json vers une base de données NoSQL (ex: MongoDB, Firebase) ou SQL (ex: PostgreSQL) pour une meilleure scalabilité et persistance.

Automatisation updatedb : Utiliser GitHub Actions ou un service de planification externe pour déclencher la commande /updatedb hebdomadairement.

Amélioration de l'UI/UX : Affiner le design, ajouter des filtres de produits, des fonctionnalités de recherche.

Images Réelles : Utiliser un service de stockage d'images (Cloudinary, AWS S3) au lieu de via.placeholder.com.

N'hésitez pas si vous avez des questions ou si vous rencontrez des problèmes lors de l'une de ces étapes !