const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// --- Configuration du Serveur Express ---
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Configurez cela pour la production : ex: 'https://mon-boutique.github.io'
app.use(express.static('docs'));
console.log('Serving static files from docs/');

// --- Configuration du Fichier de Données pour les Produits ---
const PRODUCTS_FILE = 'db_article.json';

// Fonction utilitaire pour lire les données des produits
async function readProductsData() {
    try {
        if (!fs.existsSync(PRODUCTS_FILE)) {
            console.warn(`File ${PRODUCTS_FILE} not found. Creating with empty array.`);
            await fs.promises.writeFile(PRODUCTS_FILE, '[]', 'utf8');
            return [];
        }
        const data = await fs.promises.readFile(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading products data:', error);
        return []; // Retourne un tableau vide en cas d'erreur
    }
}

// Fonction utilitaire pour écrire les données des produits
async function writeProductsData(data) {
    try {
        await fs.promises.writeFile(PRODUCTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing products data:', error);
    }
}

// --- Nouvelles fonctions pour la génération dynamique d'articles ---

// Fonction pour générer un produit aléatoire
function generateRandomProduct(index) {
    const categories = ['Tech', 'Maison', 'Bureau', 'Sport', 'Bien-être', 'Santé', 'Éducation', 'Divertissement', 'Sécurité', 'Mode'];
    const adjs = ['Innovant', 'Intelligent', 'Écologique', 'Portable', 'Connecté', 'Intuitif', 'Performant', 'Élégant', 'Robuste', 'Compact'];
    const nouns = ['Assistant', 'Capteur', 'Kit', 'Module', 'Solution', 'Dispositif', 'Système', 'Plateforme', 'Robot', 'Logiciel'];
    
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomAdj = adjs[Math.floor(Math.random() * adjs.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    const productName = `${randomAdj} ${randomNoun} ${randomCategory} ${index + 1}`;
    const productDescription = `Découvrez notre ${randomNoun} ${randomAdj}, une solution avancée pour optimiser votre quotidien dans le domaine de ${randomCategory.toLowerCase()}. Conçu pour la performance et la simplicité, il intègre une IA de pointe pour une expérience utilisateur sans précédent.`;

    return {
        id: `prod-${Date.now()}-${index}`, // ID unique basé sur le timestamp et l'index
        name: productName,
        description: productDescription,
        price: parseFloat((Math.random() * 100 + 20).toFixed(2)), // Prix entre 20 et 120
        imageUrl: `https://via.placeholder.com/300x200?text=${encodeURIComponent(productName.substring(0,20))}`,
        stock: Math.floor(Math.random() * 50) + 1 // Stock entre 1 et 50
    };
}

// Fonction pour mettre à jour la base de données avec 10 nouveaux articles dynamiques
async function updateArticlesDynamically() {
    const newArticles = [];
    for (let i = 0; i < 10; i++) {
        newArticles.push(generateRandomProduct(i));
    }
    await writeProductsData(newArticles);
    console.log('Database updated with 10 new dynamic articles.');
    return newArticles; // Retourne les nouveaux articles générés
}


// --- Routes API pour la Gestion des Produits (avec Stock) ---

// GET tous les produits
app.get('/api/products', async (req, res) => {
    const products = await readProductsData();
    res.json(products);
});

// POST un nouveau produit
app.post('/api/products', async (req, res) => {
    const { name, description, price, imageUrl, stock } = req.body;
    if (!name || !price) {
        return res.status(400).json({ error: 'Le nom et le prix du produit sont requis.' });
    }

    const products = await readProductsData();
    const newProduct = {
        id: `prod-${Date.now()}`, // ID unique basé sur le timestamp
        name,
        description: description || '',
        price: parseFloat(price),
        imageUrl: imageUrl || '',
        stock: parseInt(stock) >= 0 ? parseInt(stock) : 0 // Stock par défaut à 0 si non fourni ou invalide
    };
    products.push(newProduct);
    await writeProductsData(products);
    res.status(201).json(newProduct);
});

// PUT (Mettre à jour) un produit existant (y compris le stock)
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, imageUrl, stock } = req.body;
    let products = await readProductsData();
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    // Mise à jour des champs
    if (name) products[productIndex].name = name;
    if (description !== undefined) products[productIndex].description = description;
    if (price !== undefined) products[productIndex].price = parseFloat(price);
    if (imageUrl !== undefined) products[productIndex].imageUrl = imageUrl;
    if (stock !== undefined) products[productIndex].stock = parseInt(stock) >= 0 ? parseInt(stock) : products[productIndex].stock; // Ne change pas si stock est invalide

    await writeProductsData(products);
    res.json(products[productIndex]);
});

// PATCH (Mettre à jour partiellement) le stock d'un produit
app.patch('/api/products/:id/stock', async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || parseInt(stock) < 0) {
        return res.status(400).json({ error: 'Le stock doit être un nombre positif.' });
    }

    let products = await readProductsData();
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    products[productIndex].stock = parseInt(stock);
    await writeProductsData(products);
    res.json(products[productIndex]);
});


// DELETE un produit
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    let products = await readProductsData();
    const initialLength = products.length;
    products = products.filter(p => p.id !== id);

    if (products.length === initialLength) {
        return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    await writeProductsData(products);
    res.status(204).send(); // 204 No Content pour une suppression réussie
});


// --- Données et Routes pour les Clients (restent en mémoire pour cet exemple) ---
let customers = [
    { id: 'cust-1', name: 'Alice Dubois', email: 'alice.d@example.com', phone: '0612345678' },
    { id: 'cust-2', name: 'Bob Martin', email: 'bob.m@example.com', phone: '0787654321' }
];

// GET tous les clients
app.get('/api/customers', (req, res) => {
    res.json(customers);
});

// POST un nouveau client
app.post('/api/customers', (req, res) => {
    const { name, email, phone } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Le nom et l\'email du client sont requis.' });
    }
    const newCustomer = { id: `cust-${Date.now()}`, name, email, phone: phone || '' };
    customers.push(newCustomer);
    res.status(201).json(newCustomer);
});


// --- Configuration du Bot Telegram ---
// --- Configuration du Bot Telegram ---
const bot = new Telegraf('7097263805:AAHBgLY4BvfkpYFyLkA5u1G6hYd4XF2xFe0', {
    telegram: {
      webhookReply: true,
    },
  });

// Gestion collaborative entre @worker_Pibot, @neofs_Pibot et @Pi-ia_bot
const botsNetwork = {
    workerPibot: {
        processBackend: async (task) => {
            console.log("Processing backend task in @worker_Pibot:", task);
            return `@worker_Pibot a exécuté la tâche backend: ${task}`;
        }
    },
    neofsPibot: {
        processFrontend: async (uiTask) => {
            console.log("Processing UI/UX task in @neofs_Pibot:", uiTask);
            return `@neofs_Pibot a généré une nouvelle interface pour la tâche: ${uiTask}`;
        }
    },
    piIaBot: {
        processVisualAnalysis: async (input) => {
            console.log("Processing visual analysis in @Pi-ia_bot:", input);
            const imageUrl = await generateImage(input); // Supposons que generateImage est défini
            return `@Pi-ia_bot a analysé l'image et voici le résultat : ${imageUrl}`;
        }
    }
};

const card = "update"; // Variable non utilisée dans ce contexte précis, mais conservée

// --- Nouvelle fonction pour la génération de contenu via Groq ---
// (Fonctionnement similaire aux outils IA)
async function generateCardContent(prompt) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: "Tu es un assistant IA spécialisé dans la génération de contenu pour des fiches produits ou des cartes d'informations. Tu génères des réponses concises et informatives." },
                { role: 'user', content: prompt },
            ],
            model: 'llama-3.1-8b-instant', // Ou un autre modèle Groq pertinent
            temperature: 0.7,
            max_tokens: 1024,
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error('Failed to generate card content with Groq:', error);
        return 'Une erreur est survenue lors de la génération de contenu IA.';
    }
}

// Routes API pour les outils IA
app.post('/api/generate-product-description', async (req, res) => {
    const { productName, productDetails } = req.body;
    if (!productName) {
        return res.status(400).json({ error: 'Le nom du produit est requis pour la description IA.' });
    }
    const prompt = `Génère une description de produit détaillée pour "${productName}". Détails additionnels : ${productDetails || 'Aucun.'}. Format: Description de 3-4 phrases, incluant 3 points clés, et 2 phrases sur les avantages.`;
    const description = await generateCardContent(prompt);
    res.json({ description });
});

app.post('/api/generate-business-plan', async (req, res) => {
    const { projectDetails } = req.body;
    if (!projectDetails) {
        return res.status(400).json({ error: 'Les détails du projet sont requis pour le business plan IA.' });
    }
    const prompt = `Crée un plan d'affaires concis basé sur les détails suivants: "${projectDetails}". Le plan doit inclure: un résumé, une analyse du marché, un plan de marketing, et une section financière (très brève). Format: en 5-7 paragraphes, clair et structuré.`;
    const content = await generateCardContent(prompt);
    res.json({ content });
});

// Commande /start du bot Telegram
bot.start(async (ctx) => {
    await ctx.reply('Bienvenue sur le bot de gestion de votre e-boutique ! Utilisez les commandes pour interagir.');
});

// Nouvelle commande Telegram pour mettre à jour les articles dynamiquement
bot.command('update_articles', async (ctx) => {
    await ctx.reply('Mise à jour des articles en cours... Cela peut prendre un moment.');
    try {
        const newArticles = await updateArticlesDynamically();
        const articleNames = newArticles.map(a => a.name).join(', ');
        await ctx.reply(`Base de données mise à jour avec 10 nouveaux articles dynamiques : ${articleNames}.`);
        await ctx.reply('Veuillez rafraîchir la page de la boutique pour voir les changements !');
    } catch (error) {
        console.error('Erreur lors de la mise à jour des articles via Telegram:', error);
        await ctx.reply('Désolé, une erreur est survenue lors de la mise à jour des articles.');
    }
});


// Commande /products_list du bot Telegram
bot.command('products_list', async (ctx) => {
    const products = await readProductsData();
    if (products.length === 0) {
        return ctx.reply('Aucun produit n\'est enregistré pour le moment.');
    }
    const productList = products.map(p => `- ${p.name} (${p.price}€) - Stock: ${p.stock}`).join('\n');
    await ctx.reply(`Voici la liste de vos produits:\n${productList}`);
});

// Gestion des messages texte pour le bot Telegram (si pas une commande)
bot.on('text', async (ctx) => {
    const userInput = ctx.message.text;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: `Tu es Morad-AI, une intelligence artificielle de haut potentiel maîtrisant les normes du Web sémantique W3C, langage de programmation associée les techniques et les méthodes d'apprentissage automatique. Tu es au cœur de notre salon télégram pour le compte de Morad-ai.` },
                { role: 'user', content: userInput },
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 4048,
        });

        await ctx.reply(chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error('Failed to generate chat completion (Telegram):', error);
        await ctx.reply('Une erreur est survenue lors du traitement de votre demande.');
    }
});


// --- Lancement des serveurs ---

// Lance le serveur Express
app.listen(PORT, () => {
    console.log(`E-boutique backend & API running on http://localhost:${PORT}`);
    console.log(`Server Telegram running ✨.Worker-ia_Pibot.`);
});

// Lance le bot Telegram
// Assurez-vous que process.env.TELEGRAM_BOT_TOKEN est bien configuré
if (process.env.TELEGRAM_BOT_TOKEN) {
    bot.launch().then(() => console.log('Telegram bot launched!'))
                 .catch(err => console.error('Failed to launch Telegram bot:', err));
} else {
    console.warn('TELEGRAM_BOT_TOKEN is not set. Telegram bot will not be launched.');
}


// Gérer l'arrêt propre du bot et du serveur
process.once('SIGINT', () => {
    console.log('Stopping bot and server (SIGINT)');
    bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    console.log('Stopping bot and server (SIGTERM)');
    bot.stop('SIGTERM');
    process.exit(0);
});

// Fonction placeholder si generateImage n'est pas définie ailleurs
async function generateImage(input) {
    console.warn("generateImage function is a placeholder and needs implementation.");
    return `URL_image_pour_${input.replace(/\s/g, '_')}.jpg`;
}