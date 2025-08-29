// frontend/js/admin.js
import { api } from './api.js';
import { showNotification } from './ui.js';

let allProducts = [];
let editingProductId = null;

// Modal elements
const productFormModal = document.getElementById('product-form-modal');
const productFormModalContent = document.querySelector('.product-form-modal-content');
const formModalCloseBtn = document.getElementById('form-modal-close-btn');
const addProductForm = document.getElementById('add-product-form');
const formTitle = document.getElementById('form-title');
const addProductBtn = document.getElementById('add-product-btn');
const cancelBtn = document.getElementById('cancel-btn');
const saveProductBtn = document.getElementById('save-product-btn');
const tableBody = document.getElementById('products-table-body');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');

async function initAdmin() {
    try {
        await fetchProducts();
        setupEventListeners();
    } catch (err) {
        showNotification('Failed to initialize admin panel', 'error');
    }
}

async function fetchProducts() {
    try {
        allProducts = await api.get('/products');
        displayProducts(allProducts);
    } catch (err) {
        showNotification('Failed to load products', 'error');
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
                    <button class="action-btn edit-btn" data-id="${product._id}" title="Edit Product">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${product._id}" title="Delete Product">
                        <i class="fas fa-trash"></i>
                    </button>
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

function showProductFormModal(product = null) {
    if (product) {
        // Editing existing product
        editingProductId = product._id;
        formTitle.textContent = 'Edit Product';
        document.getElementById('product-id').value = product._id;
        document.getElementById('name').value = product.name;
        document.getElementById('price').value = product.price;
        document.getElementById('category').value = product.category;
        document.getElementById('stock').value = product.stock;
        document.getElementById('description').value = product.description || '';
        document.getElementById('image').value = product.image || '';
        saveProductBtn.innerHTML = '<i class="fas fa-save"></i> Update Product';
    } else {
        // Adding new product
        editingProductId = null;
        formTitle.textContent = 'Add New Product';
        addProductForm.reset();
        document.getElementById('product-id').value = '';
        saveProductBtn.innerHTML = '<i class="fas fa-save"></i> Save Product';
    }
    
    // Show modal with animation
    productFormModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Add entrance animation
    setTimeout(() => {
        productFormModalContent.style.transform = 'scale(1)';
    }, 10);
}

function hideProductFormModal() {
    productFormModal.classList.remove('show');
    document.body.style.overflow = '';
    addProductForm.reset();
    editingProductId = null;
    
    // Reset form title and button
    formTitle.textContent = 'Add New Product';
    saveProductBtn.innerHTML = '<i class="fas fa-save"></i> Save Product';
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Show loading state
    const originalText = saveProductBtn.innerHTML;
    saveProductBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveProductBtn.disabled = true;
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        price: parseFloat(document.getElementById('price').value),
        category: document.getElementById('category').value,
        stock: parseInt(document.getElementById('stock').value),
        description: document.getElementById('description').value.trim(),
        image: document.getElementById('image').value.trim(),
    };

    // Validation
    if (!formData.name || formData.price <= 0 || formData.stock < 0) {
        showNotification('Please fill all required fields correctly', 'error');
        saveProductBtn.innerHTML = originalText;
        saveProductBtn.disabled = false;
        return;
    }

    try {
        if (editingProductId) {
            await api.put(`/products/${editingProductId}`, formData);
            showNotification('Product updated successfully!', 'success');
        } else {
            await api.post('/products', formData);
            showNotification('Product added successfully!', 'success');
        }
        hideProductFormModal();
        await fetchProducts();
    } catch (err) {
        showNotification(`Failed to save product: ${err.message}`, 'error');
    } finally {
        // Restore button state
        saveProductBtn.innerHTML = originalText;
        saveProductBtn.disabled = false;
    }
}

async function handleDeleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }
    
    try {
        await api.del(`/products/${productId}`);
        showNotification('Product deleted successfully!', 'success');
        await fetchProducts();
    } catch (err) {
        showNotification('Failed to delete product', 'error');
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
    
    // Show results count
    if (searchTerm || category) {
        showNotification(`Found ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`, 'info');
    }
}

function setupEventListeners() {
    // Modal controls
    addProductBtn.addEventListener('click', () => showProductFormModal());
    formModalCloseBtn.addEventListener('click', hideProductFormModal);
    cancelBtn.addEventListener('click', hideProductFormModal);
    
    // Close modal when clicking outside
    productFormModal.addEventListener('click', (e) => {
        if (e.target === productFormModal) {
            hideProductFormModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && productFormModal.classList.contains('show')) {
            hideProductFormModal();
        }
    });
    
    // Form submission
    addProductForm.addEventListener('submit', handleFormSubmit);
    
    // Search and filters
    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);
    
    // Table actions
    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (editBtn) {
            const product = allProducts.find(p => p._id === editBtn.dataset.id);
            if (product) {
                showProductFormModal(product);
            }
        }
        
        if (deleteBtn) {
            handleDeleteProduct(deleteBtn.dataset.id);
        }
    });
    
    // Enter key in search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            filterProducts();
        }
    });
}   

document.addEventListener('DOMContentLoaded', initAdmin);