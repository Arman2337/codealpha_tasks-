import { api } from './api.js';
import { updateCartCount } from './ui.js';

let cartItems = [];
let allProducts = [];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        allProducts = await api.get('/products');
        loadCartFromStorage();
        renderFullCartPage();
        setupEventListeners();
    } catch (err) {
        console.error('Failed to initialize cart page:', err);
        alert('Could not load cart. Please try refreshing the page.');
    }
});

// --- Data Management ---
function loadCartFromStorage() {
    cartItems = JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cartItems));
}

// --- UI Rendering ---
function renderFullCartPage() {
    updateCartCount();

    const itemsContainer = document.getElementById('cart-items-container');
    const checkoutContainer = document.getElementById('cart-checkout-container');
    const emptyCartElement = document.getElementById('empty-cart');
    const summaryElement = document.getElementById('cart-summary');
    const checkoutFormElement = document.getElementById('checkout-form');

    if (cartItems.length === 0) {
        itemsContainer.innerHTML = ''; // only clear products
        emptyCartElement.style.display = 'block';
        if (checkoutContainer) checkoutContainer.style.display = 'none';
        return;
    }

    emptyCartElement.style.display = 'none';
    if (checkoutContainer) {
        checkoutContainer.style.display = 'block';
        summaryElement.style.display = 'block';
        checkoutFormElement.style.display = 'block';
    }
    
    let subtotal = 0;
    itemsContainer.innerHTML = cartItems.map(item => {
        const product = allProducts.find(p => p._id === item.productId);
        if (!product) return '';
        subtotal += product.price * item.quantity;

        return `
            <div class="cart-item" data-id="${item.productId}">
                <img src="${product.image || 'https://via.placeholder.com/100'}" alt="${product.name}">
                <div class="cart-item-info">
                    <h3>${product.name}</h3>
                    <p class="cart-item-price">₹${product.price.toFixed(2)}</p>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-change" data-change="-1" title="Decrease quantity">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-change" data-change="1" title="Increase quantity">+</button>
                </div>
                <button class="remove-item" title="Remove item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    renderOrderSummary(subtotal);
}

function renderOrderSummary(subtotal) {
    const shipping = subtotal > 500 ? 0 : 50; 
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `₹${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
}

// --- Events ---
function setupEventListeners() {
    const itemsContainer = document.getElementById('cart-items-container');
    itemsContainer.addEventListener('click', (event) => {
        const target = event.target;
        const quantityButton = target.closest('.quantity-change');
        const removeButton = target.closest('.remove-item');
        
        if (quantityButton) {
            const itemElement = target.closest('.cart-item');
            const productId = itemElement.dataset.id;
            const change = parseInt(quantityButton.dataset.change, 10);
            handleUpdateQuantity(productId, change);
        }
        
        if (removeButton) {
            const itemElement = target.closest('.cart-item');
            const productId = itemElement.dataset.id;
            handleRemoveItem(productId);
        }
    });

    document.getElementById('order-form').addEventListener('submit', handleOrderSubmit);
}

function handleUpdateQuantity(productId, change) {
    const item = cartItems.find(item => item.productId === productId);
    if (!item) return;

    if (item.quantity + change >= 1) {
        item.quantity += change;
    }

    saveCartToStorage();
    renderFullCartPage();
}

function handleRemoveItem(productId) {
    cartItems = cartItems.filter(item => item.productId !== productId);
    saveCartToStorage();
    renderFullCartPage();
}

async function handleOrderSubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('submit-order');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
        const orderData = {
            customer: {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                zip: document.getElementById('zip').value,
            },
            items: cartItems.map(item => {
                const product = allProducts.find(p => p._id === item.productId);
                return { productId: item.productId, quantity: item.quantity, price: product.price };
            }),
        };

        await api.post('/orders', orderData);
        
        localStorage.removeItem('cart');
        alert('Order placed successfully! Thank you.');
        window.location.href = 'index.html';

    } catch (err) {
        alert('Failed to place order. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Place Order';
    }
}
