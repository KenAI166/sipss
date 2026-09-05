// Products JavaScript

const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // Search
    searchInput.addEventListener('input', filterProducts);
    
    // Filters
    categoryFilter.addEventListener('change', filterProducts);
    statusFilter.addEventListener('change', filterProducts);
    
    // Form submit
    productForm.addEventListener('submit', saveProduct);
}

function openModal(productId = null) {
    productModal.classList.remove('hidden');
    productModal.classList.add('flex');
    
    if (productId) {
        modalTitle.textContent = 'Edit Product';
        loadProduct(productId);
    } else {
        modalTitle.textContent = 'Add Product';
        productForm.reset();
        document.getElementById('productId').value = '';
        document.getElementById('productActive').checked = true;
        document.getElementById('productColor').value = '#22c55e';
    }
}

function closeModal() {
    productModal.classList.add('hidden');
    productModal.classList.remove('flex');
    productForm.reset();
}

async function loadProduct(productId) {
    try {
        const response = await fetch(`../../api/products.php?action=get_product&id=${productId}`);
        const result = await response.json();
        
        if (result.success) {
            const product = result.product;
            
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productSku').value = product.sku || '';
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productCostPrice').value = product.cost_price || '';
            document.getElementById('productBarcode').value = product.barcode || '';
            document.getElementById('productColor').value = product.color || '#22c55e';
            document.getElementById('productShape').value = product.shape || 'rectangle';
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productActive').checked = product.is_active;
        } else {
            alert('Error loading product: ' + result.message);
        }
    } catch (error) {
        alert('Error loading product: ' + error.message);
    }
}

async function saveProduct(e) {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const formData = new FormData();
    
    formData.append('name', document.getElementById('productName').value);
    formData.append('category', document.getElementById('productCategory').value);
    formData.append('sku', document.getElementById('productSku').value);
    formData.append('price', document.getElementById('productPrice').value);
    formData.append('cost_price', document.getElementById('productCostPrice').value);
    formData.append('barcode', document.getElementById('productBarcode').value);
    formData.append('color', document.getElementById('productColor').value);
    formData.append('shape', document.getElementById('productShape').value);
    formData.append('description', document.getElementById('productDescription').value);
    formData.append('is_active', document.getElementById('productActive').checked ? '1' : '0');
    
    const imageInput = document.getElementById('productImage');
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }
    
    const action = productId ? 'update_product' : 'create_product';
    const url = `../../api/products.php?action=${action}${productId ? '&id=' + productId : ''}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(productId ? 'Product updated successfully!' : 'Product created successfully!');
            closeModal();
            location.reload();
        } else {
            alert('Error saving product: ' + result.message);
        }
    } catch (error) {
        alert('Error saving product: ' + error.message);
    }
}

function editProduct(productId) {
    openModal(productId);
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`../../api/products.php?action=delete_product&id=${productId}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Product deleted successfully!');
            location.reload();
        } else {
            alert('Error deleting product: ' + result.message);
        }
    } catch (error) {
        alert('Error deleting product: ' + error.message);
    }
}

function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const status = statusFilter.value;
    
    const rows = document.querySelectorAll('.product-row');
    
    rows.forEach(row => {
        const name = row.dataset.name.toLowerCase();
        const rowCategory = row.dataset.category;
        const rowStatus = row.dataset.status;
        
        const matchesSearch = name.includes(searchTerm);
        const matchesCategory = !category || rowCategory === category;
        const matchesStatus = !status || rowStatus === status;
        
        row.style.display = matchesSearch && matchesCategory && matchesStatus ? '' : 'none';
    });
}
