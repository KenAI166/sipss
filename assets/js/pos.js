// POS JavaScript

let cart = [];
let currentCategory = 'all';

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartItems = document.getElementById('cartItems');
const emptyCart = document.getElementById('emptyCart');
const searchInput = document.getElementById('searchInput');
const categoryChips = document.querySelectorAll('.category-chip');
const discountInput = document.getElementById('discountInput');
const paymentMethod = document.getElementById('paymentMethod');
const customerName = document.getElementById('customerName');
const notes = document.getElementById('notes');
const checkoutBtn = document.getElementById('checkoutBtn');
const clearCartBtn = document.getElementById('clearCartBtn');
const checkoutModal = document.getElementById('checkoutModal');
const modalTotal = document.getElementById('modalTotal');
const modalPaymentMethod = document.getElementById('modalPaymentMethod');
const amountReceived = document.getElementById('amountReceived');
const changeAmount = document.getElementById('changeAmount');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateCartDisplay();
});

function initializeEventListeners() {
    // Product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function() {
            const productId = this.dataset.id;
            const productName = this.dataset.name;
            const productPrice = parseFloat(this.dataset.price);
            const productStock = parseInt(this.dataset.stock);
            
            if (productStock <= 0) {
                alert('This product is out of stock!');
                return;
            }
            
            addToCart(productId, productName, productPrice, productStock);
        });
    });
    
    // Search
    searchInput.addEventListener('input', function() {
        filterProducts(this.value, currentCategory);
    });
    
    // Category filters
    categoryChips.forEach(chip => {
        chip.addEventListener('click', function() {
            categoryChips.forEach(c => {
                c.classList.remove('bg-green-500', 'text-white');
                c.classList.add('bg-gray-200', 'text-gray-700');
            });
            this.classList.remove('bg-gray-200', 'text-gray-700');
            this.classList.add('bg-green-500', 'text-white');
            
            currentCategory = this.dataset.category;
            filterProducts(searchInput.value, currentCategory);
        });
    });
    
    // Discount input
    discountInput.addEventListener('input', updateTotals);
    
    // Checkout button
    checkoutBtn.addEventListener('click', openCheckoutModal);
    
    // Clear cart button
    clearCartBtn.addEventListener('click', clearCart);
    
    // Modal buttons
    confirmPaymentBtn.addEventListener('click', processPayment);
    cancelPaymentBtn.addEventListener('click', closeCheckoutModal);
    
    // Amount received
    amountReceived.addEventListener('input', calculateChange);
}

function filterProducts(searchTerm, category) {
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        const productName = card.dataset.name.toLowerCase();
        const productCategory = card.dataset.category;
        
        const matchesSearch = productName.includes(searchTerm.toLowerCase());
        const matchesCategory = category === 'all' || productCategory === category;
        
        card.style.display = matchesSearch && matchesCategory ? 'block' : 'none';
    });
}

function addToCart(productId, productName, productPrice, productStock) {
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity >= productStock) {
            alert('Maximum stock reached for this item!');
            return;
        }
        existingItem.quantity++;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: 1,
            maxStock: productStock
        });
    }
    
    updateCartDisplay();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        const newQuantity = item.quantity + change;
        
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else if (newQuantity <= item.maxStock) {
            item.quantity = newQuantity;
            updateCartDisplay();
        } else {
            alert('Maximum stock reached for this item!');
        }
    }
}

function updateCartDisplay() {
    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartItems.innerHTML = '';
        cartItems.appendChild(emptyCart);
        checkoutBtn.disabled = true;
    } else {
        emptyCart.style.display = 'none';
        checkoutBtn.disabled = false;
        
        cartItems.innerHTML = cart.map(item => `
            <div class="bg-gray-50 rounded-lg p-3 mb-2">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-medium text-gray-800">${item.name}</h4>
                    <button onclick="removeFromCart(${item.id})" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <button onclick="updateQuantity(${item.id}, -1)" class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center">
                            <i class="fas fa-minus text-sm"></i>
                        </button>
                        <span class="font-medium w-8 text-center">${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)" class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center">
                            <i class="fas fa-plus text-sm"></i>
                        </button>
                    </div>
                    <span class="font-bold text-green-600">₱${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            </div>
        `).join('');
    }
    
    updateTotals();
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = parseFloat(discountInput.value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * 0.12;
    const total = taxableAmount + tax;
    
    document.getElementById('subtotal').textContent = `₱${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `₱${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `₱${total.toFixed(2)}`;
    
    return total;
}

function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear the cart?')) {
        cart = [];
        updateCartDisplay();
    }
}

function openCheckoutModal() {
    const total = updateTotals();
    modalTotal.textContent = `₱${total.toFixed(2)}`;
    modalPaymentMethod.textContent = paymentMethod.options[paymentMethod.selectedIndex].text;
    amountReceived.value = '';
    changeAmount.textContent = '₱0.00';
    
    checkoutModal.classList.remove('hidden');
    checkoutModal.classList.add('flex');
    
    if (paymentMethod.value === 'cash') {
        amountReceived.parentElement.style.display = 'block';
        changeAmount.parentElement.style.display = 'flex';
    } else {
        amountReceived.parentElement.style.display = 'none';
        changeAmount.parentElement.style.display = 'none';
    }
}

function closeCheckoutModal() {
    checkoutModal.classList.add('hidden');
    checkoutModal.classList.remove('flex');
}

function calculateChange() {
    const total = parseFloat(document.getElementById('total').textContent.replace('₱', ''));
    const received = parseFloat(amountReceived.value) || 0;
    const change = received - total;
    
    changeAmount.textContent = `₱${change.toFixed(2)}`;
}

async function processPayment() {
    const total = parseFloat(document.getElementById('total').textContent.replace('₱', ''));
    const received = parseFloat(amountReceived.value) || 0;
    
    if (paymentMethod.value === 'cash' && received < total) {
        alert('Insufficient payment amount!');
        return;
    }
    
    const saleData = {
        items: cart,
        total_amount: total,
        payment_method: paymentMethod.value,
        discount: parseFloat(discountInput.value) || 0,
        tax: total * 0.12 / 1.12,
        customer_name: customerName.value || null,
        notes: notes.value || null
    };
    
    try {
        const response = await fetch('../../api/sales.php?action=create_sale', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(saleData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`Sale completed successfully!\nReceipt #: ${result.receipt_number}`);
            cart = [];
            updateCartDisplay();
            customerName.value = '';
            notes.value = '';
            discountInput.value = '0';
            closeCheckoutModal();
            
            // Print receipt (optional)
            if (confirm('Would you like to print the receipt?')) {
                printReceipt(result.receipt_number, saleData);
            }
        } else {
            alert('Error processing sale: ' + result.message);
        }
    } catch (error) {
        alert('Error processing sale: ' + error.message);
    }
}

function printReceipt(receiptNumber, saleData) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Receipt #${receiptNumber}</title>
            <style>
                body { font-family: monospace; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .item { display: flex; justify-content: space-between; }
                .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Sip Station</h1>
                <p>POS & IBMS</p>
                <p>Receipt #: ${receiptNumber}</p>
                <p>Date: ${new Date().toLocaleString()}</p>
            </div>
            ${saleData.items.map(item => `
                <div class="item">
                    <span>${item.name} x${item.quantity}</span>
                    <span>₱${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
            <div class="total">
                <div class="item"><span>Subtotal:</span><span>₱${(saleData.total_amount / 1.12).toFixed(2)}</span></div>
                <div class="item"><span>Tax (12%):</span><span>₱${saleData.tax.toFixed(2)}</span></div>
                <div class="item"><span>Total:</span><span>₱${saleData.total_amount.toFixed(2)}</span></div>
                <div class="item"><span>Payment:</span><span>${saleData.payment_method.toUpperCase()}</span></div>
            </div>
            <p style="text-align: center; margin-top: 20px;">Thank you for your purchase!</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}
