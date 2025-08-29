import { api } from './api.js';
import { updateCartCount } from './ui.js';

let allProducts = [];

// Get references to the HTML elements
const productList = document.getElementById('product-list');
const searchInput = document.getElementById('search-input');
const loadingIndicator = document.getElementById('loading');
const searchBtn = document.getElementById('search-btn');

// Product modal elements
const productModal = document.getElementById('product-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductDescription = document.getElementById('modal-product-description');
const modalAddToCartBtn = document.getElementById('modal-add-to-cart');
const modalProductStock = document.getElementById('modal-product-stock'); // Added for stock display

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

function showProductModal(product) {
    // Populate modal with product information
    modalProductTitle.textContent = product.name;
    modalProductImage.src = product.image || 'https://via.placeholder.com/300';
    modalProductImage.alt = product.name;
    modalProductPrice.textContent = `₹${product.price.toFixed(2)}`;
    modalProductCategory.textContent = product.category || 'other';
    
    // Handle stock display - show status only, no quantity numbers
    if (product.stock > 10) {
        modalProductStock.textContent = 'In Stock';
        modalProductStock.style.color = 'var(--success-color)';
    } else if (product.stock > 0) {
        modalProductStock.textContent = 'Low Stock';
        modalProductStock.style.color = 'var(--warning-color)';
    } else {
        modalProductStock.textContent = 'Out of Stock';
        modalProductStock.style.color = 'var(--danger-color)';
    }
    
    // Handle description
    if (product.description) {
        modalProductDescription.textContent = product.description;
    } else {
        modalProductDescription.textContent = 'No description available for this product.';
    }
    
    // Set the product ID for the add to cart button
    modalAddToCartBtn.dataset.id = product._id;
    
    // Show the modal
    productModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function hideProductModal() {
    productModal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
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

    // Product card click to show details
    productList.addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-card');
        const addToCartButton = e.target.closest('.add-to-cart');
        
        if (productCard && !addToCartButton) {
            const productId = productCard.dataset.id;
            const product = allProducts.find(p => p._id === productId);
            if (product) {
                showProductModal(product);
            }
        }
        
        if (addToCartButton) {
            const productId = addToCartButton.dataset.id;
            addToCart(productId);
        }
    });
    
    // Modal close button
    modalCloseBtn.addEventListener('click', hideProductModal);
    
    // Close modal when clicking outside
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            hideProductModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && productModal.classList.contains('show')) {
            hideProductModal();
        }
    });
    
    // Modal add to cart button
    modalAddToCartBtn.addEventListener('click', (e) => {
        const productId = e.target.dataset.id;
        addToCart(productId);
        hideProductModal();
    });
}