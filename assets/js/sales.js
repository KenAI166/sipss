// Sales & Reports JavaScript

let currentSaleId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
});

function initializeCharts() {
    // Sales Trend Chart
    const salesTrendCtx = document.getElementById('salesTrendChart').getContext('2d');
    new Chart(salesTrendCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sales',
                data: [12000, 19000, 15000, 22000, 18000, 25000, 20000],
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
    
    // Payment Method Chart
    const paymentMethodCtx = document.getElementById('paymentMethodChart').getContext('2d');
    new Chart(paymentMethodCtx, {
        type: 'doughnut',
        data: {
            labels: ['Cash', 'Card', 'GCash', 'Maya'],
            datasets: [{
                data: [45, 30, 15, 10],
                backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

async function filterSales() {
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const status = document.getElementById('statusFilter').value;
    
    let url = '../../api/sales.php?action=get_sales';
    const params = new URLSearchParams();
    
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (status) params.append('status', status);
    
    if (params.toString()) {
        url += '&' + params.toString();
    }
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            updateSalesTable(result.sales);
        } else {
            alert('Error loading sales: ' + result.message);
        }
    } catch (error) {
        alert('Error loading sales: ' + error.message);
    }
}

function updateSalesTable(sales) {
    const tbody = document.getElementById('salesTable');
    
    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">No sales found</td></tr>';
        return;
    }
    
    tbody.innerHTML = sales.map(sale => `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-800">${sale.receipt_number}</td>
            <td class="px-6 py-4 text-gray-600">${new Date(sale.created_at).toLocaleString()}</td>
            <td class="px-6 py-4 text-gray-600">${sale.cashier_name}</td>
            <td class="px-6 py-4 text-gray-600">${sale.customer_name || '-'}</td>
            <td class="px-6 py-4 font-bold text-green-600">₱${parseFloat(sale.total_amount).toFixed(2)}</td>
            <td class="px-6 py-4 text-gray-600">${sale.payment_method}</td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-sm font-medium 
                    ${sale.status === 'completed' ? 'bg-green-100 text-green-700' : (sale.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}">
                    ${sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                    <button onclick="viewSale(${sale.id})" class="text-blue-500 hover:text-blue-700" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="printReceipt(${sale.id})" class="text-green-500 hover:text-green-700" title="Print Receipt">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function viewSale(saleId) {
    try {
        const response = await fetch(`../../api/sales.php?action=get_sale&id=${saleId}`);
        const result = await response.json();
        
        if (result.success) {
            currentSaleId = saleId;
            displaySaleDetails(result.sale);
            document.getElementById('saleDetailsModal').classList.remove('hidden');
            document.getElementById('saleDetailsModal').classList.add('flex');
        } else {
            alert('Error loading sale details: ' + result.message);
        }
    } catch (error) {
        alert('Error loading sale details: ' + error.message);
    }
}

function displaySaleDetails(sale) {
    const content = document.getElementById('saleDetailsContent');
    
    content.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-500">Receipt Number</p>
                    <p class="font-bold text-gray-800">${sale.receipt_number}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Date</p>
                    <p class="font-medium text-gray-800">${new Date(sale.created_at).toLocaleString()}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Cashier</p>
                    <p class="font-medium text-gray-800">${sale.cashier_name}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Customer</p>
                    <p class="font-medium text-gray-800">${sale.customer_name || 'N/A'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Payment Method</p>
                    <p class="font-medium text-gray-800">${sale.payment_method.toUpperCase()}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Status</p>
                    <span class="px-3 py-1 rounded-full text-sm font-medium 
                        ${sale.status === 'completed' ? 'bg-green-100 text-green-700' : (sale.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}">
                        ${sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </span>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h3 class="font-bold text-gray-800 mb-3">Items</h3>
                <div class="space-y-2">
                    ${sale.items.map(item => `
                        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <div>
                                <p class="font-medium text-gray-800">${item.product_name}</p>
                                <p class="text-sm text-gray-500">Qty: ${item.quantity} × ₱${parseFloat(item.unit_price).toFixed(2)}</p>
                            </div>
                            <p class="font-bold text-green-600">₱${(item.quantity * item.unit_price).toFixed(2)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="border-t pt-4 space-y-2">
                <div class="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>₱${(sale.total_amount / 1.12).toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                    <span>Tax (12%):</span>
                    <span>₱${sale.tax.toFixed(2)}</span>
                </div>
                ${sale.discount > 0 ? `
                <div class="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span>₱${sale.discount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="flex justify-between text-xl font-bold text-gray-800 border-t pt-2">
                    <span>Total:</span>
                    <span>₱${sale.total_amount.toFixed(2)}</span>
                </div>
            </div>
            
            ${sale.notes ? `
            <div class="border-t pt-4">
                <p class="text-sm text-gray-500">Notes:</p>
                <p class="text-gray-800">${sale.notes}</p>
            </div>
            ` : ''}
        </div>
    `;
}

function closeSaleDetailsModal() {
    document.getElementById('saleDetailsModal').classList.add('hidden');
    document.getElementById('saleDetailsModal').classList.remove('flex');
    currentSaleId = null;
}

function printReceipt(saleId) {
    viewSale(saleId).then(() => {
        printReceiptFromModal();
    });
}

function printReceiptFromModal() {
    if (!currentSaleId) return;
    
    const content = document.getElementById('saleDetailsContent').innerHTML;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Receipt</title>
            <style>
                body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; }
                .text-center { text-align: center; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Sip Station</h1>
                <p>POS & IBMS</p>
            </div>
            ${content}
            <p class="text-center" style="margin-top: 20px;">Thank you for your purchase!</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function exportReport(period) {
    alert(`Exporting ${period} report... This feature would generate a PDF/Excel report for the ${period} period.`);
    // In production, this would call an API endpoint to generate and download the report
}
