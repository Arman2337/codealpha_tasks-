import { api } from './api.js';
import { updateCartCount } from './ui.js';

let allProducts = [];

// Get references to the HTML elements
const productList = document.getElementById('product-list');
const searchInput = document.getElementById('search-input');
const loadingIndicator = document.getElementById('loading');
const searchBtn = document.getElementById('search-btn');

// Run the main function when the page is loaded
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        // Show the loading indicator and hide the product grid initially
        loadingIndicator.style.display = 'block';
        productList.style.display = 'none';

        // Fetch the product data from the server
        allProducts = await api.get('/products');

        // Once data is fetched, display the products
        displayProducts(allProducts);
        
    } catch (err) {
        console.error('Initialization failed:', err);
        loadingIndicator.textContent = 'Failed to load products. Please try again later.';
    } finally {
        // This 'finally' block always runs.
        // Hide the loading indicator and show the product grid.
        loadingIndicator.style.display = 'none';
        productList.style.display = 'grid'; // Use 'grid' to match the CSS
    }
    
    updateCartCount();
    setupEventListeners();
}

function displayProducts(products) {
    productList.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product._id}">
            <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">₹${product.price.toFixed(2)}</p>
                <button class="btn btn-primary add-to-cart" data-id="${product._id}">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ productId, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function filterAndDisplay() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm));
    displayProducts(filteredProducts);
}

function setupEventListeners() {
    // --- THIS IS THE FIX ---
    // Search instantly as the user types in the search bar.
    searchInput.addEventListener('input', filterAndDisplay);
    
    // We can keep the button click as a backup.
    searchBtn.addEventListener('click', filterAndDisplay);
    
    // --- End of Fix ---

    // Add to cart functionality using event delegation
    productList.addEventListener('click', (e) => {
        const addToCartButton = e.target.closest('.add-to-cart');
        if (addToCartButton) {
            const productId = addToCartButton.dataset.id;
            addToCart(productId);
        }
    });
}