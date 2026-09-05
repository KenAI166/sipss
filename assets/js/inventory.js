// Inventory JavaScript

const restockModal = document.getElementById('restockModal');
const editStockModal = document.getElementById('editStockModal');
const restockForm = document.getElementById('restockForm');
const editStockForm = document.getElementById('editStockForm');
const searchInput = document.getElementById('searchInput');
const stockFilter = document.getElementById('stockFilter');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // Search
    searchInput.addEventListener('input', filterInventory);
    
    // Stock filter
    stockFilter.addEventListener('change', filterInventory);
    
    // Restock form
    restockForm.addEventListener('submit', processRestock);
    
    // Edit stock form
    editStockForm.addEventListener('submit', saveStockEdit);
    
    // Restock quantity input
    document.getElementById('restockQuantity').addEventListener('input', updateNewTotal);
}

function filterInventory() {
    const searchTerm = searchInput.value.toLowerCase();
    const stockLevel = stockFilter.value;
    
    const rows = document.querySelectorAll('.inventory-row');
    
    rows.forEach(row => {
        const name = row.dataset.name.toLowerCase();
        const stock = parseInt(row.dataset.stock);
        const minimum = parseInt(row.dataset.minimum);
        
        const matchesSearch = name.includes(searchTerm);
        
        let matchesStock = true;
        if (stockLevel === 'low') {
            matchesStock = stock <= minimum;
        } else if (stockLevel === 'normal') {
            matchesStock = stock > minimum && stock <= minimum * 2;
        } else if (stockLevel === 'high') {
            matchesStock = stock > minimum * 2;
        }
        
        row.style.display = matchesSearch && matchesStock ? '' : 'none';
    });
}

function restock(productId) {
    const row = document.querySelector(`tr[data-product-id="${productId}"]`);
    if (!row) return;
    
    const productName = row.querySelector('td:first-child p').textContent;
    const currentStock = parseInt(row.querySelector('td:nth-child(4)').textContent);
    
    document.getElementById('restockProductId').value = productId;
    document.getElementById('restockProductName').value = productName;
    document.getElementById('restockCurrentStock').value = currentStock;
    document.getElementById('restockQuantity').value = '';
    document.getElementById('restockNewTotal').value = currentStock;
    
    restockModal.classList.remove('hidden');
    restockModal.classList.add('flex');
}

function closeRestockModal() {
    restockModal.classList.add('hidden');
    restockModal.classList.remove('flex');
    restockForm.reset();
}

function updateNewTotal() {
    const current = parseInt(document.getElementById('restockCurrentStock').value);
    const add = parseInt(document.getElementById('restockQuantity').value) || 0;
    document.getElementById('restockNewTotal').value = current + add;
}

async function processRestock(e) {
    e.preventDefault();
    
    const productId = document.getElementById('restockProductId').value;
    const quantity = parseInt(document.getElementById('restockQuantity').value);
    
    if (quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
    }
    
    try {
        const response = await fetch('../../api/inventory.php?action=restock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Stock updated successfully!');
            closeRestockModal();
            location.reload();
        } else {
            alert('Error updating stock: ' + result.message);
        }
    } catch (error) {
        alert('Error updating stock: ' + error.message);
    }
}

function editStock(productId) {
    const row = document.querySelector(`tr[data-product-id="${productId}"]`);
    if (!row) return;
    
    const productName = row.querySelector('td:first-child p').textContent;
    const currentStock = parseInt(row.querySelector('td:nth-child(4)').textContent);
    const minimumStock = parseInt(row.querySelector('td:nth-child(5)').textContent);
    
    document.getElementById('editStockProductId').value = productId;
    document.getElementById('editStockProductName').value = productName;
    document.getElementById('editStockCurrent').value = currentStock;
    document.getElementById('editStockMinimum').value = minimumStock;
    
    editStockModal.classList.remove('hidden');
    editStockModal.classList.add('flex');
}

function closeEditStockModal() {
    editStockModal.classList.add('hidden');
    editStockModal.classList.remove('flex');
    editStockForm.reset();
}

async function saveStockEdit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('editStockProductId').value;
    const currentStock = parseInt(document.getElementById('editStockCurrent').value);
    const minimumStock = parseInt(document.getElementById('editStockMinimum').value);
    
    if (currentStock < 0 || minimumStock < 0) {
        alert('Stock values cannot be negative');
        return;
    }
    
    try {
        const response = await fetch('../../api/inventory.php?action=update_stock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId,
                current_quantity: currentStock,
                minimum_quantity: minimumStock
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Stock updated successfully!');
            closeEditStockModal();
            location.reload();
        } else {
            alert('Error updating stock: ' + result.message);
        }
    } catch (error) {
        alert('Error updating stock: ' + error.message);
    }
}
