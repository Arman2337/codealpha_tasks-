// frontend/js/admin.js
import { api } from './api.js';
import { showNotification } from './ui.js';

let allProducts = [];
let editingProductId = null;

const productFormContainer = document.getElementById('product-form-container');
const addProductForm = document.getElementById('add-product-form');
const formTitle = document.getElementById('form-title');
const addProductBtn = document.getElementById('add-product-btn');
const cancelBtn = document.getElementById('cancel-btn');
const tableBody = document.getElementById('products-table-body');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');

async function initAdmin() {
    try {
        await fetchProducts();
        setupEventListeners();
    } catch (err) {
        alert('Failed to initialize admin panel');
    }
}

async function fetchProducts() {
    try {
        allProducts = await api.get('/products');
        displayProducts(allProducts);
    } catch (err) {
        alert('Failed to load products');
    }
}

function displayProducts(products) {
    tableBody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.image || 'https://via.placeholder.com/50'}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>₹${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td><span class="status-badge ${getStockStatusClass(product.stock)}">${getStockStatus(product.stock)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" data-id="${product._id}"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${product._id}"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getStockStatus(stock) {
    if (stock > 10) return 'In Stock';
    if (stock > 0) return 'Low Stock';
    return 'Out of Stock';
}

function getStockStatusClass(stock) {
    if (stock > 10) return 'status-in-stock';
    if (stock > 0) return 'status-low-stock';
    return 'status-out-of-stock';
}

function showProductForm(product = null) {
    if (product) {
        editingProductId = product._id;
        formTitle.textContent = 'Edit Product';
        document.getElementById('product-id').value = product._id;
        document.getElementById('name').value = product.name;
        document.getElementById('price').value = product.price;
        document.getElementById('category').value = product.category;
        document.getElementById('stock').value = product.stock;
        document.getElementById('description').value = product.description || '';
        document.getElementById('image').value = product.image || '';
    } else {
        editingProductId = null;
        formTitle.textContent = 'Add New Product';
        addProductForm.reset();
    }
    productFormContainer.style.display = 'block';
}

function hideProductForm() {
    productFormContainer.style.display = 'none';
    addProductForm.reset();
    editingProductId = null;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('name').value,
        price: parseFloat(document.getElementById('price').value),
        category: document.getElementById('category').value,
        stock: parseInt(document.getElementById('stock').value),
        description: document.getElementById('description').value,
        image: document.getElementById('image').value,
    };

    try {
        if (editingProductId) {
            await api.put(`/products/${editingProductId}`, formData);
            showNotification('Product updated successfully');
        } else {
            await api.post('/products', formData);
            showNotification('Product added successfully');
        }
        hideProductForm();
        fetchProducts();
    } catch (err) {
        alert(`Failed to save product: ${err.message}`);
    }
}

async function handleDeleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        await api.del(`/products/${productId}`);
        showNotification('Product deleted successfully');
        fetchProducts();
    } catch (err) {
        alert('Failed to delete product');
    }
}

function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const filtered = allProducts.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(searchTerm);
        const categoryMatch = !category || p.category === category;
        return nameMatch && categoryMatch;
    });
    displayProducts(filtered);
}

function setupEventListeners() {
    addProductBtn.addEventListener('click', () => showProductForm());
    cancelBtn.addEventListener('click', hideProductForm);
    addProductForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);

    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        if (editBtn) {
            const product = allProducts.find(p => p._id === editBtn.dataset.id);
            showProductForm(product);
        }
        if (deleteBtn) {
            handleDeleteProduct(deleteBtn.dataset.id);
        }
    });
}   

document.addEventListener('DOMContentLoaded', initAdmin);