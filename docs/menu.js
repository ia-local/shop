// Fonction pour créer un élément DOM de carte produit
function createProductCardElement(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.id);

    card.innerHTML = `
        <img src="${product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${product.name}">
        <div class="product-card-content">
            <h3>${product.name}</h3>
            <p class="description">${product.description || 'Aucune description disponible.'}</p>
            <p class="price">${product.price.toFixed(2)}€</p>
            <p class="stock">Stock: ${product.stock}</p>
            <button class="add-to-cart-btn" data-product-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>
                ${product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
            </button>
        </div>
    `;

    const addToCartButton = card.querySelector('.add-to-cart-btn');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            console.log(`Produit ajouté au panier: ${product.name} (ID: ${product.id})`);
            alert(`"${product.name}" ajouté au panier !`); // Exemple simple
        });
    }

    return card;
}

// Script pour lire les produits depuis l'API et les afficher
document.addEventListener('DOMContentLoaded', async () => {
    const productsContainer = document.getElementById('products-container');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');

    productsContainer.innerHTML = ''; // Nettoie le conteneur
    loadingMessage.style.display = 'block'; // Affiche le message de chargement
    errorMessage.style.display = 'none'; // Cache les messages d'erreur précédents

    try {
        // Tente de récupérer les produits via l'API Express
        const response = await fetch('/api/products'); 
        
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement des produits: ${response.status} - ${response.statusText}`);
        }
        const articlesData = await response.json(); // Récupère les données JSON

        loadingMessage.style.display = 'none'; // Cache le message de chargement

        if (articlesData.length === 0) {
            productsContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Aucun produit disponible pour le moment.</p>';
        } else {
            articlesData.forEach(product => {
                const productCard = createProductCardElement(product);
                productsContainer.appendChild(productCard);
            });
        }
    } catch (error) {
        console.error('Erreur lors du chargement ou de l\'affichage des produits:', error);
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'block';
        errorMessage.textContent = `Échec de l'affichage des produits : ${error.message}. Assurez-vous que le serveur est démarré et que l'API /api/products fonctionne correctement.`;
    }

    // Highlight active nav item in footer for mobile
    const currentPath = window.location.pathname;
    const footerNavItems = document.querySelectorAll('.footer-nav a');
    footerNavItems.forEach(item => {
        const itemHref = new URL(item.href).pathname.replace(/\/$/, '');
        const normalizedCurrentPath = currentPath.replace(/\/$/, '');

        if (itemHref === normalizedCurrentPath || 
            (normalizedCurrentPath === '/' && itemHref === '/')) { // Gère la page d'accueil (root / ou /index.html)
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Highlight active nav item in header for desktop
    const headerNavItems = document.querySelectorAll('header nav ul li a');
    headerNavItems.forEach(item => {
        const itemHref = new URL(item.href).pathname.replace(/\/$/, '');
        const normalizedCurrentPath = currentPath.replace(/\/$/, '');

        if (itemHref === normalizedCurrentPath || 
            (normalizedCurrentPath === '/' && itemHref === '/')) { // Gère la page d'accueil (root / ou /index.html)
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Toggle desktop footer text visibility based on initial load
    const desktopFooterText = document.querySelector('.desktop-footer-text');
    if (window.innerWidth >= 768) {
        desktopFooterText.style.display = 'block';
    } else {
        desktopFooterText.style.display = 'none';
    }

    // Listen for window resize to adjust desktop footer text visibility
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            desktopFooterText.style.display = 'block';
        } else {
            desktopFooterText.style.display = 'none';
        }
    });
});