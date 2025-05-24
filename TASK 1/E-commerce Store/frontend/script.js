
let allProducts = [];
const API_URL = 'http://localhost:5000/api';


const productList = document.getElementById('product-list');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const cartCount = document.getElementById('cart-count');
const productModal = document.getElementById('product-modal');
const productDetails = document.getElementById('product-details');
const closeModal = document.querySelector('.close-modal');

// Initialize the application
async function init() {
    try {
        await fetchProducts();
        updateCartCount();
        setupEventListeners();
    } catch (err) {
        showError('Failed to initialize the application');
    }
}

// Fetch products from the API
async function fetchProducts() {
    try {
        loading.style.display = 'block';
        error.style.display = 'none';
        
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        allProducts = await response.json();
        displayProducts(allProducts);
    } catch (err) {
        showError('Failed to load products. Please try again later.');
    } finally {
        loading.style.display = 'none';
    }
}

// Display products in the grid
function displayProducts(products) {
    productList.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image || 'https://via.placeholder.com/200'}" 
                 alt="${product.name}" 
                 class="product-image"
                 onclick="showProductDetails('${product._id}')">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price"><span>&#8377;</span>${product.price.toFixed(2)}</p>
                <button class="add-to-cart" onclick="addToCart('${product._id}')">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// Show product details in modal
function showProductDetails(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;

    productDetails.innerHTML = `
        <div class="product-detail">
            <img src="${product.image || 'https://via.placeholder.com/400'}" 
                 alt="${product.name}" 
                 class="product-detail-image">
            <div class="product-detail-info">
                <h2>${product.name}</h2>
                <p class="product-detail-price">$${product.price.toFixed(2)}</p>
                <p class="product-detail-description">${product.description || 'No description available.'}</p>
                <div class="quantity-selector">
                    <button onclick="updateQuantity('${product._id}', -1)">-</button>
                    <span id="quantity-${product._id}">1</span>
                    <button onclick="updateQuantity('${product._id}', 1)">+</button>
                </div>
                <button class="add-to-cart" onclick="addToCart('${product._id}', true)">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
    productModal.style.display = 'block';
}

// Update quantity in product details
function updateQuantity(productId, change) {
    const quantityElement = document.getElementById(`quantity-${productId}`);
    let quantity = parseInt(quantityElement.textContent) + change;
    quantity = Math.max(1, Math.min(quantity, 10)); // Limit between 1 and 10
    quantityElement.textContent = quantity;
}

// Add to cart functionality
function addToCart(productId, fromModal = false) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const quantity = fromModal ? 
        parseInt(document.getElementById(`quantity-${productId}`).textContent) : 1;
    
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ productId, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    if (fromModal) {
        productModal.style.display = 'none';
    }
    
    showNotification('Added to cart!');
}

// Update cart count in navigation
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Search functionality
function searchProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (!searchTerm) {
        displayProducts(allProducts);
        return;
    }

    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
    );
    
    displayProducts(filteredProducts);
}

// Show error message
function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Setup event listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', searchProducts);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchProducts();
    });
    
    closeModal.addEventListener('click', () => {
        productModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
    });
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
