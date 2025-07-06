const { Telegraf, Markup } = require('telegraf');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// Initialisation des variables de rôles pour s'assurer qu'elles ne sont jamais undefined
let rolesSystem = {};
let rolesAssistant = {};
let rolesUser = {};

// --- Chargement des fichiers JSON de rôles Groq (avec robustesse) ---
try {
    const rolesSystemPath = path.join(__dirname, 'role/roles-system.json');
    const rolesAssistantPath = path.join(__dirname, 'role/roles-assistant.json');
    const rolesUserPath = path.join(__dirname, 'role/roles-user.json');

    // Tente de lire les fichiers
    rolesSystem = JSON.parse(fs.readFileSync(rolesSystemPath, 'utf8'));
    rolesAssistant = JSON.parse(fs.readFileSync(rolesAssistantPath, 'utf8'));
    rolesUser = JSON.parse(fs.readFileSync(rolesUserPath, 'utf8'));

    // Validation de la structure des rôles chargés
    if (!rolesSystem || !rolesSystem.system || typeof rolesSystem.system.content !== 'string') {
        console.warn('roles-system.json n\'a pas la structure attendue ou le contenu est manquant. Utilisation du rôle système par défaut.');
        rolesSystem = { system: { content: "You are a helpful general assistant for an e-commerce store." } };
    }
    if (!rolesAssistant || !rolesAssistant.assistant || typeof rolesAssistant.assistant.content !== 'string') {
        console.warn('roles-assistant.json n\'a pas la structure attendue ou le contenu est manquant. Utilisation du rôle assistant par défaut.');
        rolesAssistant = { assistant: { content: "You are a specialized e-commerce assistant, focused on sales, customer support, and product information." } };
    }
    if (!rolesUser || !rolesUser.user || typeof rolesUser.user.content !== 'string') {
        console.warn('roles-user.json n\'a pas la structure attendue ou le contenu est manquant. Utilisation du rôle utilisateur par défaut.');
        rolesUser = { user: { content: "I am a customer Browse your store." } };
    }

} catch (error) {
    console.error('Erreur lors du chargement des fichiers de rôles Groq (Tentative de créer les rôles par défaut):', error);
    console.error('Assurez-vous que les fichiers roles-system.json, roles-assistant.json et roles-user.json existent dans le dossier "role" et sont valides.');
    // Si la lecture des fichiers échoue complètement, utiliser les valeurs par défaut
    rolesSystem = { system: { content: "You are a helpful general assistant for an e-commerce store." } };
    rolesAssistant = { assistant: { content: "You are a specialized e-commerce assistant, focused on sales, customer support, and product information." } };
    rolesUser = { user: { content: "I am a customer Browse your store." } };
}


// --- Configuration du Serveur Express ---
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

app.use(express.static('docs'));
console.log('Serving static files from docs/');

// --- Configuration du Fichier de Données pour les Produits (db_article.json) ---
const PRODUCTS_FILE = 'docs/db_article.json';

async function readProductsData() {
    try {
        const data = await fs.promises.readFile(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Le fichier ${PRODUCTS_FILE} n'existe pas. Création d'un fichier vide.`);
            await fs.promises.writeFile(PRODUCTS_FILE, JSON.stringify([]), 'utf8');
            return [];
        }
        console.error('Erreur de lecture du fichier produits:', error);
        return [];
    }
}

async function writeProductsData(data) {
    try {
        await fs.promises.writeFile(PRODUCTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Erreur d\'écriture du fichier produits:', error);
    }
}

function generateRandomProduct(index) {
    const categories = ['Electronics', 'Books', 'Home Goods', 'Clothing', 'Sports'];
    const names = ['Smartphone X', 'Laptop Pro', 'Mystery Novel', 'Coffee Maker', 'T-Shirt', 'Running Shoes', 'Smartwatch', 'Gaming Headset'];
    return {
        id: `prod${Date.now()}-${index}`,
        name: `${names[Math.floor(Math.random() * names.length)]} ${index + 1}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
        stock: Math.floor(Math.random() * 100) + 1,
        description: `Description for ${names[Math.floor(Math.random() * names.length)]} ${index + 1}.`,
        imageUrl: `https://picsum.photos/200/300?random=${index}`
    };
}

async function updateArticlesDynamically() {
    console.log('Mise à jour dynamique des articles...');
    const newProducts = Array.from({ length: 10 }, (_, i) => generateRandomProduct(i));
    await writeProductsData(newProducts);
    console.log('Articles mis à jour avec succès.');
}

// --- Routes API REST ---

app.get('/api/products', async (req, res) => {
    const products = await readProductsData();
    res.json(products);
});

app.post('/api/products', async (req, res) => {
    const products = await readProductsData();
    const newProduct = { id: `prod${Date.now()}`, ...req.body };
    products.push(newProduct);
    await writeProductsData(products);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', async (req, res) => {
    const products = await readProductsData();
    const { id } = req.params;
    const updatedProduct = { id, ...req.body };
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = updatedProduct;
        await writeProductsData(products);
        res.json(updatedProduct);
    } else {
        res.status(404).send('Product not found');
    }
});

app.patch('/api/products/:id/stock', async (req, res) => {
    const products = await readProductsData();
    const { id } = req.params;
    const { stock } = req.body;
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index].stock = stock;
        await writeProductsData(products);
        res.json(products[index]);
    } else {
        res.status(404).send('Product not found');
    }
});

app.delete('/api/products/:id', async (req, res) => {
    let products = await readProductsData();
    const { id } = req.params;
    const initialLength = products.length;
    products = products.filter(p => p.id !== id);
    if (products.length < initialLength) {
        await writeProductsData(products);
        res.status(204).send();
    } else {
        res.status(404).send('Product not found');
    }
});

let customers = [
    { id: 'cust1', name: 'Alice Smith', email: 'alice@example.com' },
    { id: 'cust2', name: 'Bob Johnson', email: 'bob@example.com' }
];

app.get('/api/customers', (req, res) => {
    res.json(customers);
});

app.post('/api/customers', (req, res) => {
    const newCustomer = { id: `cust${Date.now()}`, ...req.body };
    customers.push(newCustomer);
    res.status(201).json(newCustomer);
});

app.post('/api/generate-product-description', async (req, res) => {
    const { productName, productFeatures } = req.body;
    if (!productName || !productFeatures) {
        return res.status(400).send('Product name and features are required.');
    }
    const prompt = `Génère une description de produit attrayante pour un produit nommé "${productName}" avec les caractéristiques suivantes : ${productFeatures}. La description doit être concise et inciter à l'achat.`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-8b-8192',
            temperature: 0.7,
            max_tokens: 500,
        });
        res.json({ description: chatCompletion.choices[0].message.content });
    } catch (error) {
        console.error('Failed to generate product description:', error);
        res.status(500).send('Erreur lors de la génération de la description du produit.');
    }
});

app.post('/api/generate-business-plan', async (req, res) => {
    const { companyName, industry, productOrService } = req.body;
    if (!companyName || !industry || !productOrService) {
        return res.status(400).send('Company name, industry, and product/service are required.');
    }
    const prompt = `Crée un plan d'affaires simple pour une entreprise nommée "${companyName}" opérant dans le secteur "${industry}", offrant "${productOrService}". Incluez un résumé, une analyse du marché, une stratégie marketing et un plan financier de base.`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-8b-8192',
            temperature: 0.7,
            max_tokens: 1000,
        });
        res.json({ plan: chatCompletion.choices[0].message.content });
    } catch (error) {
        console.error('Failed to generate business plan:', error);
        res.status(500).send('Erreur lors de la génération du plan d\'affaires.');
    }
});


// --- Configuration du Bot Telegram ---
const bot = new Telegraf('7097263805:AAHBgLY4BvfkpYFyLkA5u1G6hYd4XF2xFe0', {
    telegram: {
      webhookReply: true,
    },
  });

const TARGET_TELEGRAM_GROUP_ID = '-1001234567890'; // REMPLACEZ CET ID PAR L'ID RÉEL DE VOTRE GROUPE TÉLÉGRAM !

function escapeHtmlCharacters(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#039;');
}

async function generateCardContent(prompt) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-8b-8192',
            temperature: 0.7,
            max_tokens: 500,
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error('Failed to generate card content (Telegram):', error);
        return 'Désolé, je n\'ai pas pu générer le contenu de la carte pour le moment.';
    }
}

async function getGroqChatResponse(promptInput, model, systemMessage) {
    try {
        const messages = [];
        if (systemMessage) {
            messages.push({ role: 'system', content: systemMessage });
        }
        messages.push({ role: 'user', content: promptInput });

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: model,
            temperature: 0.7,
            max_tokens: 2048,
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Failed to generate chat completion (Groq model: ${model}):`, error);
        return 'Une erreur est survenue lors du traitement de votre demande de conversation IA.';
    }
}

// Commandes du bot Telegram
bot.start(async (ctx) => {
    const welcomeMessage = `Bonjour ! 👋 Enchanté de vous accueillir dans notre boutique en ligne.
Comment puis-je vous aider aujourd'hui ? 😊 N'hésitez pas à me poser toutes vos questions concernant nos produits, vos commandes, ou tout autre besoin. Je suis là pour vous guider et vous offrir une expérience d'achat agréable.`;

    const inlineKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🛒 Voir les produits', 'show_products')],
        [Markup.button.url('🌐 Visiter la Boutique en ligne', 'https://t.me/meta_Pibot/todo_list')],
        [Markup.button.callback('🤖 À propos de l\'IA', 'about_ai')],
        [Markup.button.callback('❓ Aide & Commandes', 'show_help')]
    ]);

    await ctx.reply(welcomeMessage, inlineKeyboard);
});

bot.action('show_products', async (ctx) => {
    await ctx.answerCbQuery();
    const products = await readProductsData();
    if (products.length === 0) {
        await ctx.reply('Aucun produit disponible pour le moment.');
        return;
    }
    const productList = products.map(p => `<b>${escapeHtmlCharacters(p.name)}</b>\nPrix: ${p.price}€\nStock: ${p.stock}\n`).join('\n');
    await ctx.replyWithHTML(`Voici nos produits disponibles :\n\n${productList}`);
});

bot.action('about_ai', async (ctx) => {
    await ctx.answerCbQuery();
    const aboutAIMessage = `Je suis un assistant IA basé sur les modèles de langage Groq (comme Llama 3 et Gemma). Je peux vous aider avec des informations sur les produits, des suggestions et répondre à vos questions.`;
    await ctx.reply(aboutAIMessage);
});

bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au message de bienvenue
/shop - Voir la liste des produits
/updatedb - (Admin) Mettre à jour les articles dynamiquement
/aboutai - En savoir plus sur l'IA
/send_topic [votre sujet] - Envoyer un sujet au groupe désigné
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});

bot.command('shop', async (ctx) => {
    const products = await readProductsData();
    if (products.length === 0) {
        await ctx.reply('Aucun produit disponible pour le moment.');
        return;
    }
    const productList = products.map(p => `<b>${escapeHtmlCharacters(p.name)}</b>\nPrix: ${p.price}€\nStock: ${p.stock}\n`).join('\n');
    await ctx.replyWithHTML(`Voici nos produits disponibles :\n\n${productList}`);
});

bot.command('updatedb', async (ctx) => {
    await ctx.reply('Mise à jour de la base de données des produits...');
    await updateArticlesDynamically();
    await ctx.reply('Base de données des produits mise à jour avec 10 nouveaux articles aléatoires.');
});

bot.command('aboutai', async (ctx) => {
    const aboutAIMessage = `Je suis un assistant IA basé sur les modèles de langage Groq (comme Llama 3 et Gemma). Je peux vous aider avec des informations sur les produits, des suggestions et répondre à vos questions.`;
    await ctx.reply(aboutAIMessage);
});

bot.command('send_topic', async (ctx) => {
    const message = ctx.message.text.split(' ').slice(1).join(' ');
    if (!message) {
        await ctx.reply('Veuillez fournir un sujet à envoyer. Exemple: /send_topic Problème de livraison.');
        return;
    }
    if (TARGET_TELEGRAM_GROUP_ID && TARGET_TELEGRAM_GROUP_ID !== '-1001234567890') {
        try {
            await bot.telegram.sendMessage(TARGET_TELEGRAM_GROUP_ID, `Nouveau sujet de l'utilisateur ${ctx.from.first_name} (${ctx.from.username || 'N/A'}) : \n\n${message}`);
            await ctx.reply('Votre sujet a été envoyé au groupe de support.');
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message au groupe:', error);
            await ctx.reply('Désolé, je n\'ai pas pu envoyer votre sujet au groupe. Veuillez réessayer plus tard.');
        }
    } else {
        await ctx.reply('L\'ID du groupe cible n\'est pas configuré ou est invalide. Veuillez contacter l\'administrateur.');
    }
});

bot.command('help', async (ctx) => {
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au message de bienvenue
/shop - Voir la liste des produits
/updatedb - (Admin) Mettre à jour les articles dynamiquement
/aboutai - En savoir plus sur l'IA
/send_topic [votre sujet] - Envoyer un sujet au groupe désigné
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});

bot.on('text', async (ctx) => {
    if (ctx.message.text.startsWith('/')) {
        return;
    }
    await ctx.replyWithChatAction('typing');

    try {
        const userMessage = ctx.message.text;
        // Utilisation du rôle assistant pour le bot Telegram
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: rolesAssistant.assistant.content }, // Rôle Assistant pour Telegram
                { role: 'user', content: userMessage }
            ],
            model: 'gemma2-9b-it',
            temperature: 0.7,
            max_tokens: 4048,
        });

        await ctx.reply(chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error('Failed to generate chat completion (Telegram) withgemma2-9b-it:', error);
        await ctx.reply('Une erreur est survenue lors du traitement de votre demande de conversation IA.');
    }
});


// Fonction placeholder si generateImage n'est pas définie ailleurs
async function generateImage(input) {
    console.warn("generateImage function is a placeholder and needs implementation if used.");
    return `URL_image_pour_${input.replace(/\s/g, '_')}.png`;
}


// --- Lancement des serveurs et du chatbot terminal ---

// Lance le serveur Express en premier
app.listen(PORT, () => {
    console.log(`✨ ----------------------------------------------------------->`);
    console.log(`✨ E-boutique backend & API running on http://localhost:${PORT}`);
    console.log(`✨ Serveur Express prêt.`);
    console.log(`✨ ----------------------------------------------------------->`);

    // Lancement du chatbot terminal juste après le démarrage du serveur Express
    // Ceci s'assure qu'il se lance toujours, indépendamment du bot Telegram
    startTerminalChatbot();

    // Lancement du bot Telegram (peut se faire en parallèle ou après le chatbot terminal)
    if (process.env.TELEGRAM_BOT_TOKEN) {
        console.log('Tentative de lancement du bot Telegram...');
        bot.launch().then(() => {
            console.log('Telegram bot launched! ✨ Worker-ia_Pibot.');
            console.log(`✨ ----------------------------------------------------------->`);
        })
        .catch(err => {
            console.error('Failed to launch Telegram bot:', err);
            console.warn('Le bot Telegram n\'a pas pu démarrer.');
            console.log(`✨ ----------------------------------------------------------->`);
        });
    } else {
        console.warn('TELEGRAM_BOT_TOKEN n\'est pas configuré dans votre .env. Le bot Telegram ne sera pas lancé.');
        console.log(`✨ ----------------------------------------------------------->`);
    }

}).on('error', (err) => {
    // Gestion spécifique de l'erreur "adresse déjà utilisée"
    if (err.code === 'EADDRINUSE') {
        console.error(`Erreur: Le port ${PORT} est déjà utilisé.`);
        console.error('Veuillez libérer le port (fermez les autres applications l\'utilisant) ou choisir un autre port (ex: 3001) dans votre fichier .env.');
    } else {
        console.error('Erreur inattendue lors du démarrage du serveur Express:', err);
    }
    process.exit(1);
});

// Nouvelle fonction pour le chatbot directement dans le terminal
async function startTerminalChatbot() {
    console.log('\n--- Chatbot Groq en mode Terminal ---');
    console.log('Ce chatbot est propulsé par Groq. Tapez vos messages et appuyez sur Entrée.');
    console.log('Pour quitter le chatbot et le serveur, appuyez sur Ctrl+C.');

    process.stdin.setEncoding('utf8');
    process.stdin.setRawMode(false); // Permet de lire l'entrée ligne par ligne
    process.stdin.resume(); // Commence à lire l'entrée

    // --- Envoi d'un message initial à Groq pour vérifier la connexion et l'API ---
    console.log('\nIA (Groq): (Initialisation de la conversation...)');
    try {
        // Utilisation du rôle système pour le chatbot terminal
        const initialResponse = await getGroqChatResponse(
            "Bonjour, en tant qu'assistant pour une boutique en ligne, présentez-vous et demandez comment vous pouvez aider.",
            'gemma2-9b-it', // Utilisation degemma2-9b-it
            rolesSystem.system.content // Rôle Système pour le terminal
        );
        console.log(`IA (Groq): ${initialResponse}`);
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la communication avec Groq:', error);
        console.log('IA (Groq): Impossible de démarrer la conversation. Veuillez vérifier votre clé API Groq et votre connexion internet.');
    }
    // --- Fin de l'initialisation ---

    process.stdout.write('\nVous: '); // Premier prompt pour l'utilisateur après l'initialisation

    process.stdin.on('data', async (input) => {
        const message = input.trim(); // Supprime les espaces et les retours chariot (newline)

        if (!message) {
            process.stdout.write('Veuillez taper un message. Vous: ');
            return;
        }

        console.log('IA (Groq): (Réflexion...)');

        try {
            // Utilisation du rôle système pour le chatbot terminal
            const aiResponse = await getGroqChatResponse(
                message,
                'gemma2-9b-it', // Utilisation degemma2-9b-it
                rolesSystem.system.content // Rôle Système pour le terminal
            );
            console.log(`IA (Groq): ${aiResponse}`);
        } catch (error) {
            console.error('Erreur lors de la communication avec Groq (terminal):', error);
            console.log('IA (Groq): Désolé, une erreur est survenue lors du traitement de votre demande.');
        }
        process.stdout.write('Vous: '); // Réinvite l'utilisateur après la réponse
    });
}


// Gérer l'arrêt propre du bot et du serveur
process.once('SIGINT', () => {
    console.log('Stopping bot and server (SIGINT)');
    if (bot) bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    console.log('Stopping bot and server (SIGTERM)');
    if (bot) bot.stop('SIGTERM');
    process.exit(0);
});