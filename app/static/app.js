const state = {
    currentPage: 'dashboard',
    cart: [],
    products: [],
    invoices: [],
    settings: {}
};

// DOM Elements
const pageContent = document.getElementById('page-content');
const navItems = document.querySelectorAll('.sidebar-nav li');
const modalContainer = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadPage('dashboard');
    fetchInitialData();
});

function initNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const page = item.getAttribute('data-page');
            loadPage(page);
        });
    });

    document.getElementById('quick-bill-btn').addEventListener('click', () => {
        loadPage('billing');
        updateNavActive('billing');
    });

    document.querySelector('.close-modal').addEventListener('click', closeModal);
}

function updateNavActive(page) {
    navItems.forEach(item => {
        if (item.getAttribute('data-page') === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

async function fetchInitialData() {
    try {
        const [prodRes, invRes, setRes] = await Promise.all([
            fetch('/api/products/'),
            fetch('/api/billing/invoices'),
            fetch('/api/settings')
        ]);
        state.products = await prodRes.json();
        state.invoices = await invRes.json();
        state.settings = await setRes.json();
        
        updateNotifications();
        renderDashboard();
    } catch (error) {
        console.error('Failed to fetch data:', error);
    }
}

function loadPage(page) {
    state.currentPage = page;
    switch (page) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'billing':
            renderBilling();
            break;
        case 'inventory':
            renderInventory();
            break;
        case 'reports':
            renderReports();
            break;
        case 'settings':
            renderSettings();
            break;
        default:
            pageContent.innerHTML = `<h1>${page.charAt(0).toUpperCase() + page.slice(1)} Coming Soon</h1>`;
    }
}

// --- Dashboard ---
function renderDashboard() {
    const totalSales = state.invoices.reduce((acc, inv) => acc + inv.total_amount, 0);
    const todaySales = state.invoices.filter(inv => {
        const date = new Date(inv.created_at);
        return date.toDateString() === new Date().toDateString();
    }).reduce((acc, inv) => acc + inv.total_amount, 0);

    pageContent.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-indian-rupee-sign"></i></div>
                <div class="stat-details">
                    <h3>Total Revenue</h3>
                    <p>₹${totalSales.toFixed(2)}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-shopping-bag"></i></div>
                <div class="stat-details">
                    <h3>Today's Sales</h3>
                    <p>₹${todaySales.toFixed(2)}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i class="fas fa-box"></i></div>
                <div class="stat-details">
                    <h3>Total Products</h3>
                    <p>${state.products.length}</p>
                </div>
            </div>
        </div>
        <div class="dashboard-charts">
            <div class="card" style="padding: 24px; background: white; border-radius: 12px; box-shadow: var(--shadow);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>Recent Transactions</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.invoices.slice(-5).reverse().map(inv => `
                            <tr style="cursor: pointer;" onclick="viewInvoice(${inv.id})">
                                <td><strong>${inv.invoice_number}</strong></td>
                                <td>${inv.customer_name}</td>
                                <td>₹${inv.total_amount.toFixed(2)}</td>
                                <td>${new Date(inv.created_at).toLocaleDateString()}</td>
                                <td>${new Date(inv.created_at).toLocaleTimeString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- Billing ---
function renderBilling() {
    pageContent.innerHTML = `
        <div class="billing-container">
            <div class="cart-table-wrapper">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>Current Cart</h2>
                    <div style="position: relative;">
                        <input type="text" id="scan-barcode" placeholder="Scan Barcode or Type Name..." style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); width: 250px;">
                        <div id="search-results" class="search-popup hidden"></div>
                    </div>
                </div>
                <table id="cart-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Subtotal</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="cart-items">
                        <!-- Items will be added here -->
                    </tbody>
                </table>
            </div>
            <div class="summary-card">
                <h3>Order Summary</h3>
                <div class="summary-item" style="display: flex; justify-content: space-between; margin: 20px 0;">
                    <span>Subtotal</span>
                    <span id="sum-subtotal">₹0.00</span>
                </div>
                <div class="summary-item" style="display: flex; justify-content: space-between; margin: 20px 0;">
                    <span>GST (18%)</span>
                    <span id="sum-gst">₹0.00</span>
                </div>
                <div class="summary-item" style="display: flex; justify-content: space-between; margin: 20px 0;">
                    <span>Discount (₹)</span>
                    <input type="number" id="bill-discount" value="0.00" step="0.01" style="width: 80px; text-align: right;" onchange="calculateTotals()">
                </div>
                <div class="summary-item" style="display: flex; justify-content: space-between; margin: 20px 0; font-weight: 700; font-size: 1.2rem; border-top: 2px solid var(--border); padding-top: 15px;">
                    <span>Total</span>
                    <span id="sum-total">₹0.00</span>
                </div>
                <div class="form-group" style="margin-top: 20px;">
                    <label>Customer Name</label>
                    <input type="text" id="cust-name" value="Walk-in Customer">
                </div>
                <button class="primary-btn" id="checkout-btn" style="width: 100%; justify-content: center; margin-top: 20px;">
                    <i class="fas fa-check-circle"></i> Complete Checkout
                </button>
            </div>
        </div>
    `;

    document.getElementById('checkout-btn').addEventListener('click', handleCheckout);
    const searchInput = document.getElementById('scan-barcode');
    searchInput.focus();

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) {
            document.getElementById('search-results').classList.add('hidden');
            return;
        }

        const filtered = state.products.filter(p =>
            p.name.toLowerCase().includes(query) || (p.barcode && p.barcode.toLowerCase().includes(query))
        );

        showSearchResults(filtered);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.toLowerCase().trim();
            if (!query) return;

            // Try to find exact barcode match first (barcode scanner behavior)
            const product = state.products.find(p => p.barcode && p.barcode.toLowerCase() === query);
            
            if (product) {
                addToCartById(product.id);
                e.target.value = '';
                document.getElementById('search-results').classList.add('hidden');
            } else {
                // If not an exact barcode, maybe it's the first result in the search list
                const firstResult = state.products.find(p => 
                    p.name.toLowerCase().includes(query) || (p.barcode && p.barcode.toLowerCase().includes(query))
                );
                if (firstResult) {
                    addToCartById(firstResult.id);
                    e.target.value = '';
                    document.getElementById('search-results').classList.add('hidden');
                }
            }
        }
    });
}

function showSearchResults(results) {
    const resultsDiv = document.getElementById('search-results');
    if (results.length === 0) {
        resultsDiv.classList.add('hidden');
        return;
    }

    resultsDiv.innerHTML = results.map(p => `
        <div class="search-item" onclick="addToCartById(${p.id})">
            <div><strong>${p.name}</strong></div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
                <span>₹${p.price_per_unit}/${p.unit}</span>
                <span>Stock: ${p.stock} ${p.unit}</span>
            </div>
        </div>
    `).join('');
    resultsDiv.classList.remove('hidden');
}

window.addToCartById = (id) => {
    const product = state.products.find(p => p.id === id);
    if (!product) return;

    if (product.stock <= 0) {
        showNotification('Product out of stock', 'error');
        return;
    }

    const existing = state.cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
    document.getElementById('search-results').classList.add('hidden');
    document.getElementById('scan-barcode').value = '';
}

function updateCartUI() {
    const tbody = document.getElementById('cart-items');
    if (!tbody) return;

    tbody.innerHTML = state.cart.map((item, index) => `
        <tr>
            <td>${item.name}</td>
            <td>₹${item.price_per_unit.toFixed(2)} per ${item.unit}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="number" class="qty-input" value="${item.quantity}" min="0.01" step="0.01" onchange="updateQty(${index}, this.value)" style="width: 80px;">
                    <span>${item.unit}</span>
                </div>
            </td>
            <td>₹${(item.price_per_unit * item.quantity).toFixed(2)}</td>
            <td><button class="icon-btn" onclick="removeFromCart(${index})" style="color: var(--danger)"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');

    calculateTotals();
}

window.updateQty = (index, val) => {
    state.cart[index].quantity = parseFloat(val);
    updateCartUI();
}

window.removeFromCart = (index) => {
    state.cart.splice(index, 1);
    updateCartUI();
}

function calculateTotals() {
    const subtotal = state.cart.reduce((acc, item) => acc + (item.price_per_unit * item.quantity), 0);
    const discountEl = document.getElementById('bill-discount');
    const discount = discountEl ? parseFloat(discountEl.value) || 0 : 0;
    const total = subtotal - discount; // Apply discount

    document.getElementById('sum-subtotal').innerText = `₹${subtotal.toFixed(2)}`;
    // Hide or set GST to 0 in UI
    const gstElement = document.getElementById('sum-gst');
    if (gstElement) gstElement.innerText = `₹0.00`;

    document.getElementById('sum-total').innerText = `₹${Math.max(0, total).toFixed(2)}`;
}

async function handleCheckout() {
    if (state.cart.length === 0) {
        showNotification('Cart is empty', 'warning');
        return;
    }

    const discountEl = document.getElementById('bill-discount');
    const discountValue = discountEl ? parseFloat(discountEl.value) || 0 : 0;

    const invoiceData = {
        customer_name: document.getElementById('cust-name').value,
        items: state.cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
        discount: discountValue
    };

    try {
        const res = await fetch('/api/billing/invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData)
        });

        if (res.ok) {
            const invoice = await res.json();
            showNotification('Invoice generated successfully!', 'success');
            showPrintPreview(invoice);
            state.cart = [];
            fetchInitialData();
            // Don't switch page immediately so they can see/print
        } else {
            const err = await res.json();
            showNotification(err.detail, 'error');
        }
    } catch (error) {
        showNotification('Checkout failed', 'error');
    }
}

function showPrintPreview(inv) {
    modalTitle.innerText = "";
    modalBody.innerHTML = `
        <div class="print-preview" id="printable-invoice" style="border: 2px solid #333; padding: 30px; width: 100%; max-width: 450px; margin: 0 auto; background: white; font-family: 'Courier New', Courier, monospace;">
            <div style="text-align: center; border-bottom: 2px double #333; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="margin: 0; color: #000; font-size: 24px; text-transform: uppercase;">${state.settings.SHOP_NAME || 'SmartBill Store'}</h1>
                <p style="margin: 5px 0; font-weight: bold; font-size: 14px;">${state.settings.SHOP_LOCATION || 'Retail Store'}</p>
                <p style="margin: 2px 0; font-size: 13px;">Tel: ${state.settings.SHOP_PHONE || '+91 00000 00000'}</p>
                <p style="margin: 2px 0; font-weight: bold; font-size: 13px;">GSTIN: ${state.settings.GST_NUMBER || 'N/A'}</p>
                <div style="margin-top: 10px; border-top: 1px dashed #666; padding-top: 5px; font-style: italic; font-size: 12px;">Retail Sale Invoice</div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px;">
                <div>
                    <p style="margin: 3px 0;"><strong>Inv:</strong> ${inv.invoice_number}</p>
                    <p style="margin: 3px 0;"><strong>Cust:</strong> ${inv.customer_name}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 3px 0;">${new Date(inv.created_at).toLocaleDateString()}</p>
                    <p style="margin: 3px 0;">${new Date(inv.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <thead>
                    <tr style="border-top: 1px solid #333; border-bottom: 1px solid #333;">
                        <th style="text-align: left; padding: 8px 2px;">ITEM</th>
                        <th style="text-align: center; padding: 8px 2px;">QTY</th>
                        <th style="text-align: right; padding: 8px 2px;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${inv.items.map(item => `
                        <tr style="border-bottom: 1px dotted #ccc;">
                            <td style="padding: 8px 2px;">
                                <strong>${item.product ? item.product.name : 'Product'}</strong><br>
                                <small>@ ₹${item.unit_price}</small>
                            </td>
                            <td style="text-align: center; padding: 8px 2px;">${item.quantity}</td>
                            <td style="text-align: right; padding: 8px 2px;">₹${item.subtotal.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="border-top: 2px solid #333; padding-top: 15px;">
                ${inv.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Subtotal</span>
                    <span>₹${(inv.total_amount + inv.discount).toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #ef4444;">
                    <span>Discount</span>
                    <span>-₹${inv.discount.toFixed(2)}</span>
                </div>` : ''}
                <div class="grand-total" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-size: 16px; font-weight: bold;">GRAND TOTAL</span>
                    <span style="font-size: 20px; font-weight: 900;">₹${inv.total_amount.toFixed(2)}</span>
                </div>
                <div style="border-top: 1px dashed #666; margin-top: 10px; padding-top: 10px; text-align: center; font-size: 13px;">
                    Amount in words: ${numberToWords(Math.round(inv.total_amount))} Rupees Only
                </div>
            </div>

            <div style="text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                <div style="font-weight: bold; margin-bottom: 5px;">THANK YOU FOR SHOPPING!</div>
                <div style="font-size: 12px; color: #666;">Please Visit Again</div>
            </div>
            
            <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #999;">
                Generated by SmartBill Software
            </div>
        </div>
        <div class="no-print" style="text-align: center; margin-top: 30px; display: flex; flex-direction: column; gap: 10px; align-items: center;">
            <button class="primary-btn" onclick="window.print()" style="width: 250px; justify-content: center;">
                <i class="fas fa-print"></i> Print Official Bill
            </button>
            <div style="display: flex; gap: 10px;">
                <button class="primary-btn" onclick="saveAsImage('${inv.invoice_number}')" style="background: var(--accent); width: 150px; justify-content: center;">
                    <i class="fas fa-image"></i> Save JPG
                </button>
                <button class="primary-btn" onclick="saveAsPDF('${inv.invoice_number}')" style="background: #e11d48; width: 150px; justify-content: center;">
                    <i class="fas fa-file-pdf"></i> Save PDF
                </button>
            </div>
            <div style="margin-top: 15px; width: 100%; max-width: 320px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="font-size: 14px; font-weight: bold; margin-bottom: 12px; color: var(--text-main);">Contactless Digital Bill</p>
                <button class="primary-btn" id="qr-share-btn" style="background: #6366f1; width: 100%; justify-content: center; font-size: 14px; padding: 12px;">
                    <i class="fas fa-qrcode"></i> Generate QR Bill (Free)
                </button>
                <p style="font-size: 11px; color: #64748b; margin-top: 10px;">Customer can scan QR to get receipt instantly.</p>
            </div>
        </div>
    `;
    openModal();

    // Attach event listeners
    document.getElementById('qr-share-btn').onclick = () => showQRBill(inv);
}


window.showQRBill = (inv) => {
    // Branded Digital Receipt Link
    // We use the server IP (10.30.2.53) so customers on Wi-Fi can access it.
    let origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        origin = 'http://10.30.2.53:8000';
    }

    const billUrl = `${origin}/bill/${inv.id}`;
    // Larger, high-resolution QR for easier scanning
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(billUrl)}`;

    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 10px 20px 30px;">
            <div style="margin-bottom: 25px;">
                <div style="width: 50px; height: 50px; background: #eef2ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                    <i class="fas fa-qrcode" style="color: #6366f1; font-size: 24px;"></i>
                </div>
                <h2 style="font-family: 'Outfit', sans-serif; margin: 0; color: #1e293b; font-size: 22px;">Digital Receipt Ready</h2>
                <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Secure & Contactless for ${state.settings.SHOP_NAME || 'Store'}</p>
            </div>
            
            <div style="position: relative; display: inline-block; padding: 20px; background: white; border-radius: 24px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.1); border: 1px solid #e2e8f0; margin-bottom: 25px;">
                <img src="${qrUrl}" alt="QR Code" style="width: 250px; height: 250px; display: block;">
                <!-- Subtle corner accents -->
                <div style="position: absolute; top: 10px; left: 10px; width: 20px; height: 20px; border-top: 3px solid #6366f1; border-left: 3px solid #6366f1; border-top-left-radius: 8px;"></div>
                <div style="position: absolute; bottom: 10px; right: 10px; width: 20px; height: 20px; border-bottom: 3px solid #6366f1; border-right: 3px solid #6366f1; border-bottom-right-radius: 8px;"></div>
            </div>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; max-width: 320px; margin: 0 auto 25px; display: flex; align-items: center; gap: 12px; text-align: left;">
                <div style="width: 35px; height: 35px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="fas fa-wifi" style="color: white; font-size: 14px;"></i>
                </div>
                <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.4;">
                    <strong>Step 1:</strong> Connect customer to Shop Wi-Fi.<br>
                    <strong>Step 2:</strong> Scan QR with any phone camera.
                </p>
            </div>

            <button class="primary-btn" id="qr-back-btn" style="margin: 0 auto; background: #1e293b; border-radius: 10px; padding: 12px 24px; font-weight: 600;">
                <i class="fas fa-arrow-left"></i> Return to Invoice
            </button>
        </div>
    `;

    document.getElementById('qr-back-btn').onclick = () => showPrintPreview(inv);
}

function formatBillShortText(inv) {
    let text = `*${state.settings.SHOP_NAME || 'Supermarket'} - ${state.settings.SHOP_LOCATION}*\n`;
    text += `Invoice: ${inv.invoice_number}\n`;
    text += `Date: ${new Date(inv.created_at).toLocaleDateString()}\n`;
    text += `GST: ${state.settings.GST_NUMBER}\n`;
    text += `--------------------------\n`;
    inv.items.forEach(item => {
        text += `${item.product ? item.product.name : 'Item'} x ${item.quantity} = ₹${item.subtotal.toFixed(2)}\n`;
    });
    text += `--------------------------\n`;
    text += `*TOTAL: ₹${inv.total_amount.toFixed(2)}*\n`;
    text += `Digital Bill: ${window.location.origin}/bill/${inv.id}\n`;
    text += `Thank you for shopping with us!`;
    return text;
}

window.saveAsImage = (filename) => {
    const element = document.getElementById('printable-invoice');
    html2canvas(element, { scale: 3 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${filename}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    });
}

window.saveAsPDF = (filename) => {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('printable-invoice');

    html2canvas(element, { scale: 3 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${filename}.pdf`);
    });
}

// Helper for bill aesthetics
function numberToWords(number) {
    // Simple helper for grand look
    if (number === 0) return 'Zero';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const translate = (n) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + translate(n % 100) : '');
        return '';
    };
    return translate(number);
}

// --- Reports ---
function renderReports() {
    pageContent.innerHTML = `
        <div class="reports-container">
            <div class="card" style="padding: 24px; background: white; border-radius: 12px; box-shadow: var(--shadow); margin-bottom: 24px;">
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                        <h2 style="margin: 0;">Sales Reports</h2>
                        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                            <div class="search-box" style="width: 200px; background: #f1f5f9;">
                                <i class="fas fa-search"></i>
                                <input type="text" id="report-search" placeholder="Search customer/ID..." oninput="filterReports()">
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="date" id="report-from" class="form-control" style="padding: 8px; border: 1px solid var(--border); border-radius: 6px;">
                                <span style="color: #64748b;">to</span>
                                <input type="date" id="report-to" class="form-control" style="padding: 8px; border: 1px solid var(--border); border-radius: 6px;">
                            </div>
                            <button class="primary-btn" onclick="filterReports()"><i class="fas fa-filter"></i> Filter</button>
                            <button class="icon-btn" onclick="clearReportsFilter()" title="Clear Filters"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="badge-btn" onclick="setReportRange('today')">Today</button>
                        <button class="badge-btn" onclick="setReportRange('yesterday')">Yesterday</button>
                        <button class="badge-btn" onclick="setReportRange('month')">This Month</button>
                        <button class="badge-btn" onclick="setReportRange('all')">All Time</button>
                    </div>
                    
                    <div id="report-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div class="stat-card" style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1;">
                            <small style="color: #64748b; font-weight: 600;">TOTAL BILLS</small>
                            <h3 id="summary-count" style="margin: 5px 0 0; font-size: 24px;">0</h3>
                        </div>
                        <div class="stat-card" style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">
                            <small style="color: #64748b; font-weight: 600;">GROSS REVENUE</small>
                            <h3 id="summary-total" style="margin: 5px 0 0; font-size: 24px;">₹0.00</h3>
                        </div>
                        <div class="stat-card" style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <small style="color: #64748b; font-weight: 600;">TAX COLLECTED</small>
                            <h3 id="summary-tax" style="margin: 5px 0 0; font-size: 24px;">₹0.00</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="padding: 24px; background: white; border-radius: 12px; box-shadow: var(--shadow);">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; min-width: 800px;">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Invoice #</th>
                                <th>Customer Name</th>
                                <th>GST (Tax)</th>
                                <th>Discount</th>
                                <th>Total Payable</th>
                                <th style="text-align: center;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="reports-table-body">
                            <!-- Items populated by filterReports() -->
                        </tbody>
                    </table>
                </div>
                <div id="empty-reports" class="hidden" style="text-align: center; padding: 40px; color: #94a3b8;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>No transactions found for the selected criteria.</p>
                </div>
            </div>
        </div>
    `;

    filterReports();
}

window.filterReports = () => {
    const fromDate = document.getElementById('report-from').value;
    const toDate = document.getElementById('report-to').value;
    const searchQuery = document.getElementById('report-search').value.toLowerCase();
    const tbody = document.getElementById('reports-table-body');
    const emptyState = document.getElementById('empty-reports');
    
    const filtered = state.invoices.filter(inv => {
        // Use local date string YYYY-MM-DD for comparison
        const invDateObj = new Date(inv.created_at);
        const invDateStr = invDateObj.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD
        
        const dateInRange = (!fromDate || invDateStr >= fromDate) && 
                            (!toDate || invDateStr <= toDate);
                            
        const searchMatch = !searchQuery || 
            inv.invoice_number.toLowerCase().includes(searchQuery) || 
            inv.customer_name.toLowerCase().includes(searchQuery);
        
        return dateInRange && searchMatch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        tbody.innerHTML = filtered.slice().reverse().map(inv => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${new Date(inv.created_at).toLocaleDateString()}</div>
                    <small style="color: #64748b;">${new Date(inv.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                </td>
                <td><span style="background: #f1f5f9; color: #1e293b; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: bold;">${inv.invoice_number}</span></td>
                <td>${inv.customer_name}</td>
                <td>₹${inv.gst_amount.toFixed(2)}</td>
                <td style="color: #ea580c;">-₹${inv.discount.toFixed(2)}</td>
                <td><strong style="color: #0f172a; font-size: 15px;">₹${inv.total_amount.toFixed(2)}</strong></td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button class="icon-btn" onclick="viewInvoice(${inv.id})" title="Details"><i class="fas fa-expand"></i></button>
                        <button class="icon-btn" onclick="window.printBill(${inv.id})" title="Print"><i class="fas fa-print"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    const totalSales = filtered.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalTax = filtered.reduce((sum, inv) => sum + inv.gst_amount, 0);
    
    document.getElementById('summary-count').innerText = filtered.length;
    document.getElementById('summary-total').innerText = `₹${totalSales.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('summary-tax').innerText = `₹${totalTax.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
}

window.setReportRange = (range) => {
    const fromInput = document.getElementById('report-from');
    const toInput = document.getElementById('report-to');
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    
    if (range === 'today') {
        fromInput.value = todayStr;
        toInput.value = todayStr;
    } else if (range === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        const yestStr = yesterday.toLocaleDateString('en-CA');
        fromInput.value = yestStr;
        toInput.value = yestStr;
    } else if (range === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        fromInput.value = firstDay.toLocaleDateString('en-CA');
        toInput.value = todayStr;
    } else if (range === 'all') {
        fromInput.value = '';
        toInput.value = '';
    }
    filterReports();
}

window.clearReportsFilter = () => {
    document.getElementById('report-from').value = '';
    document.getElementById('report-to').value = '';
    document.getElementById('report-search').value = '';
    filterReports();
}

window.printBill = (id) => {
    const inv = state.invoices.find(i => i.id === id);
    if (!inv) return;
    
    // Set a flag or directly call print after showing modal
    showPrintPreview(inv);
    setTimeout(() => {
        window.print();
    }, 500);
}

window.viewInvoice = (id) => {
    const inv = state.invoices.find(i => i.id === id);
    if (inv) showPrintPreview(inv);
}

// --- Inventory ---
function renderInventory() {
    pageContent.innerHTML = `
        <div class="card" style="padding: 24px; background: white; border-radius: 12px; box-shadow: var(--shadow);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2>Product Inventory</h2>
                <button class="primary-btn" onclick="openAddProductModal()"><i class="fas fa-plus"></i> Add Product</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Barcode</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Threshold</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.products.map(p => `
                        <tr>
                            <td>${p.barcode}</td>
                            <td>${p.name}</td>
                            <td>${p.category}</td>
                            <td>₹${p.price_per_unit.toFixed(2)} / ${p.unit}</td>
                            <td><span class="badge ${p.stock <= (p.low_stock_threshold || 5) ? 'badge-danger' : 'badge-success'}">${p.stock} ${p.unit}</span></td>
                            <td><span style="font-size: 0.9rem; color: var(--text-muted);">${p.low_stock_threshold || 5} ${p.unit}</span></td>
                            <td>
                                <button class="icon-btn" onclick="openEditProductModal(${p.id})"><i class="fas fa-edit"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.openAddProductModal = () => {
    modalTitle.innerText = "Add New Product";
    modalBody.innerHTML = `
        <form id="product-form">
            <div class="form-group">
                <label>Barcode</label>
                <input type="text" id="p-barcode" placeholder="Scan or type barcode" required>
                <div id="barcode-error" class="error-msg">This barcode is already assigned to another product!</div>
            </div>
            <div class="form-group">
                <label>Product Name</label>
                <input type="text" id="p-name" placeholder="e.g. Fresh Milk" required>
                <div id="name-error" class="error-msg">A product with this name already exists!</div>
            </div>
            <div class="form-group">
                <label>Category</label>
                <select id="p-category">
                    <option value="">Select Category (Optional)</option>
                    ${[...new Set(state.products.map(p => p.category).filter(c => c))].map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    <option value="General">General</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Dairy">Dairy</option>
                </select>
            </div>
            <div class="form-group">
                <label>Unit</label>
                <select id="p-unit">
                    <option value="pcs">Pcs (Count)</option>
                    <option value="kg">Kg (Weight)</option>
                    <option value="g">Gram (Weight)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Price per Unit (₹)</label>
                <input type="number" id="p-price" step="0.01" required>
            </div>
            <div class="form-group">
                <label>Initial Stock (Units)</label>
                <input type="number" id="p-stock" step="0.01" required>
            </div>
            <div class="form-group">
                <label>Low Stock Alert Threshold</label>
                <input type="number" id="p-threshold" step="0.01" value="5.0" required>
            </div>
            <button type="submit" id="submit-prod" class="primary-btn" style="width: 100%; justify-content: center;">Save Product</button>
        </form>
    `;

    const barcodeInput = document.getElementById('p-barcode');
    const nameInput = document.getElementById('p-name');

    const checkDuplicates = () => {
        const barcode = barcodeInput.value.trim();
        const name = nameInput.value.trim();
        
        const dupBarcode = barcode && state.products.some(p => p.barcode === barcode);
        const dupName = name && state.products.some(p => p.name.toLowerCase() === name.toLowerCase());

        const bError = document.getElementById('barcode-error');
        const nError = document.getElementById('name-error');

        if (dupBarcode) {
            if (barcodeInput.style.borderColor !== 'var(--danger)') {
                barcodeInput.classList.add('shake');
                setTimeout(() => barcodeInput.classList.remove('shake'), 400);
            }
            barcodeInput.style.borderColor = 'var(--danger)';
            bError.style.display = 'block';
        } else {
            barcodeInput.style.borderColor = 'var(--border)';
            bError.style.display = 'none';
        }

        if (dupName) {
            if (nameInput.style.borderColor !== 'var(--danger)') {
                nameInput.classList.add('shake');
                setTimeout(() => nameInput.classList.remove('shake'), 400);
            }
            nameInput.style.borderColor = 'var(--danger)';
            nError.style.display = 'block';
        } else {
            nameInput.style.borderColor = 'var(--border)';
            nError.style.display = 'none';
        }
        const submitBtn = document.getElementById('submit-prod');
        if (dupBarcode || dupName) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
        } else {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    };

    let debounceTimer;
    const debouncedCheck = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(checkDuplicates, 500);
    };

    barcodeInput.addEventListener('input', debouncedCheck);
    nameInput.addEventListener('input', debouncedCheck);

    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            barcode: document.getElementById('p-barcode').value,
            name: document.getElementById('p-name').value,
            category: document.getElementById('p-category').value,
            unit: document.getElementById('p-unit').value,
            price_per_unit: parseFloat(document.getElementById('p-price').value),
            stock: parseFloat(document.getElementById('p-stock').value),
            low_stock_threshold: parseFloat(document.getElementById('p-threshold').value)
        };

        const res = await fetch('/api/products/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showNotification('Product added!', 'success');
            closeModal();
            fetchInitialData();
            if (state.currentPage === 'inventory') renderInventory();
        } else {
            const err = await res.json();
            showNotification(err.detail || 'Failed to add product', 'error');
        }
    });
    openModal();
}

window.openEditProductModal = (id) => {
    const p = state.products.find(prod => prod.id === id);
    if (!p) return;

    modalTitle.innerText = "Edit Product";
    modalBody.innerHTML = `
        <form id="edit-product-form">
            <div class="form-group">
                <label>Barcode</label>
                <input type="text" id="p-barcode" value="${p.barcode}" required>
                <div id="barcode-error" class="error-msg">This barcode is already assigned to another product!</div>
            </div>
            <div class="form-group">
                <label>Product Name</label>
                <input type="text" id="p-name" value="${p.name}" required>
                <div id="name-error" class="error-msg">A product with this name already exists!</div>
            </div>
            <div class="form-group">
                <label>Category</label>
                <select id="p-category">
                    <option value="">Select Category (Optional)</option>
                    ${[...new Set(state.products.map(p => p.category).filter(c => c))].map(cat => `<option value="${cat}" ${p.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                    <option value="General" ${p.category === 'General' ? 'selected' : ''}>General</option>
                    <option value="Grocery" ${p.category === 'Grocery' ? 'selected' : ''}>Grocery</option>
                    <option value="Snacks" ${p.category === 'Snacks' ? 'selected' : ''}>Snacks</option>
                    <option value="Beverages" ${p.category === 'Beverages' ? 'selected' : ''}>Beverages</option>
                    <option value="Dairy" ${p.category === 'Dairy' ? 'selected' : ''}>Dairy</option>
                </select>
            </div>
            <div class="form-group">
                <label>Unit</label>
                <select id="p-unit">
                    <option value="pcs" ${p.unit === 'pcs' ? 'selected' : ''}>Pcs (Count)</option>
                    <option value="kg" ${p.unit === 'kg' ? 'selected' : ''}>Kg (Weight)</option>
                    <option value="g" ${p.unit === 'g' ? 'selected' : ''}>Gram (Weight)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Price per Unit (₹)</label>
                <input type="number" id="p-price" step="0.01" value="${p.price_per_unit}" required>
            </div>
            <div class="form-group">
                <label>Stock (Units)</label>
                <input type="number" id="p-stock" step="0.01" value="${p.stock}" required>
            </div>
            <div class="form-group">
                <label>Low Stock Alert Threshold</label>
                <input type="number" id="p-threshold" step="0.01" value="${p.low_stock_threshold || 5.0}" required>
            </div>
            <div style="display: flex; gap: 10px;">
                <button type="submit" id="update-prod" class="primary-btn" style="flex: 1; justify-content: center;">Update Product</button>
                <button type="button" class="primary-btn" onclick="deleteProduct(${p.id})" style="background: var(--danger); flex: 1; justify-content: center;">Delete</button>
            </div>
        </form>
    `;

    const barcodeInput = document.getElementById('p-barcode');
    const nameInput = document.getElementById('p-name');

    const checkDuplicates = () => {
        const barcode = barcodeInput.value.trim();
        const name = nameInput.value.trim();
        
        const dupBarcode = barcode && state.products.some(prod => prod.barcode === barcode && prod.id !== p.id);
        const dupName = name && state.products.some(prod => prod.name.toLowerCase() === name.toLowerCase() && prod.id !== p.id);

        const bError = document.getElementById('barcode-error');
        const nError = document.getElementById('name-error');

        if (dupBarcode) {
            if (barcodeInput.style.borderColor !== 'var(--danger)') {
                barcodeInput.classList.add('shake');
                setTimeout(() => barcodeInput.classList.remove('shake'), 400);
            }
            barcodeInput.style.borderColor = 'var(--danger)';
            bError.style.display = 'block';
        } else {
            barcodeInput.style.borderColor = 'var(--border)';
            bError.style.display = 'none';
        }

        if (dupName) {
            if (nameInput.style.borderColor !== 'var(--danger)') {
                nameInput.classList.add('shake');
                setTimeout(() => nameInput.classList.remove('shake'), 400);
            }
            nameInput.style.borderColor = 'var(--danger)';
            nError.style.display = 'block';
        } else {
            nameInput.style.borderColor = 'var(--border)';
            nError.style.display = 'none';
        }
        const updateBtn = document.getElementById('update-prod');
        if (dupBarcode || dupName) {
            updateBtn.disabled = true;
            updateBtn.style.opacity = '0.5';
            updateBtn.style.cursor = 'not-allowed';
        } else {
            updateBtn.disabled = false;
            updateBtn.style.opacity = '1';
            updateBtn.style.cursor = 'pointer';
        }
    };

    let debounceTimer;
    const debouncedCheck = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(checkDuplicates, 500);
    };

    barcodeInput.addEventListener('input', debouncedCheck);
    nameInput.addEventListener('input', debouncedCheck);

    document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            barcode: document.getElementById('p-barcode').value,
            name: document.getElementById('p-name').value,
            category: document.getElementById('p-category').value,
            unit: document.getElementById('p-unit').value,
            price_per_unit: parseFloat(document.getElementById('p-price').value),
            stock: parseFloat(document.getElementById('p-stock').value),
            low_stock_threshold: parseFloat(document.getElementById('p-threshold').value)
        };

        const res = await fetch(`/api/products/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showNotification('Product updated!', 'success');
            closeModal();
            fetchInitialData();
            if (state.currentPage === 'inventory') renderInventory();
        } else {
            const err = await res.json();
            showNotification(err.detail || 'Failed to update product', 'error');
        }
    });
    openModal();
}

window.deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
    });

    if (res.ok) {
        showNotification('Product deleted', 'success');
        closeModal();
        fetchInitialData();
        if (state.currentPage === 'inventory') renderInventory();
    }
}

// --- Settings ---
let settingsPassword = ''; // Store verified password for the session

function renderSettings() {
    // If password already verified this session, go straight to settings form
    if (settingsPassword) {
        renderSettingsForm();
        return;
    }
    
    // Show password prompt
    pageContent.innerHTML = `
        <div class="card" style="padding: 40px; background: white; border-radius: 16px; box-shadow: var(--shadow); max-width: 420px; margin: 60px auto; text-align: center;">
            <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <i class="fas fa-lock" style="color: white; font-size: 28px;"></i>
            </div>
            <h2 style="margin-bottom: 8px; color: #1e293b;">Settings Protected</h2>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 28px;">Enter the admin password to access shop settings.</p>
            <form id="password-form">
                <div class="form-group" style="margin-bottom: 20px;">
                    <input type="password" id="settings-pwd" placeholder="Enter password..." 
                        style="text-align: center; font-size: 16px; padding: 14px; border: 2px solid #e2e8f0; border-radius: 12px; width: 100%; box-sizing: border-box; transition: border-color 0.2s;"
                        onfocus="this.style.borderColor='#6366f1'" onblur="this.style.borderColor='#e2e8f0'" required>
                </div>
                <button type="submit" class="primary-btn" style="width: 100%; justify-content: center; padding: 14px; font-size: 15px; border-radius: 12px;">
                    <i class="fas fa-unlock"></i> Unlock Settings
                </button>
                <div id="pwd-error" style="color: #ef4444; font-size: 13px; margin-top: 12px; display: none;"></div>
            </form>
        </div>
    `;

    document.getElementById('settings-pwd').focus();

    document.getElementById('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('settings-pwd').value;
        const errorDiv = document.getElementById('pwd-error');
        const btn = e.target.querySelector('button[type="submit"]');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        
        try {
            const res = await fetch('/api/settings/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
            });

            if (res.ok) {
                settingsPassword = pwd; // Store for this session
                showNotification('Access granted!', 'success');
                renderSettingsForm();
            } else {
                errorDiv.textContent = '✗ Incorrect password. Please try again.';
                errorDiv.style.display = 'block';
                document.getElementById('settings-pwd').value = '';
                document.getElementById('settings-pwd').focus();
                // Shake animation
                const card = pageContent.querySelector('.card');
                card.style.animation = 'shake 0.4s ease';
                setTimeout(() => card.style.animation = '', 400);
            }
        } catch (error) {
            errorDiv.textContent = 'Connection error. Please try again.';
            errorDiv.style.display = 'block';
        }
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-unlock"></i> Unlock Settings';
    });
}

function renderSettingsForm() {
    pageContent.innerHTML = `
        <div class="card" style="padding: 24px; background: white; border-radius: 12px; box-shadow: var(--shadow); max-width: 600px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2><i class="fas fa-store"></i> Shop Settings</h2>
                <span style="background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                    <i class="fas fa-check-circle"></i> Authenticated
                </span>
            </div>
            <form id="settings-form">
                <div class="form-group">
                    <label>Shop Name</label>
                    <input type="text" id="set-shop-name" value="${state.settings.SHOP_NAME || ''}" required>
                </div>
                <div class="form-group">
                    <label>Shop Location</label>
                    <input type="text" id="set-shop-loc" value="${state.settings.SHOP_LOCATION || ''}" required>
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="text" id="set-shop-phone" value="${state.settings.SHOP_PHONE || ''}" required>
                </div>
                <div class="form-group">
                    <label>GST Number</label>
                    <input type="text" id="set-shop-gst" value="${state.settings.GST_NUMBER || ''}" required>
                </div>
                <button type="submit" class="primary-btn" style="width: 100%; justify-content: center; margin-top: 20px;">
                    <i class="fas fa-save"></i> Save Settings
                </button>
            </form>
        </div>
    `;

    document.getElementById('settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            password: settingsPassword,
            SHOP_NAME: document.getElementById('set-shop-name').value,
            SHOP_LOCATION: document.getElementById('set-shop-loc').value,
            SHOP_PHONE: document.getElementById('set-shop-phone').value,
            GST_NUMBER: document.getElementById('set-shop-gst').value
        };

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                const responseData = await res.json();
                state.settings = responseData.settings;
                // Update sidebar shop name dynamically
                const sidebarName = document.getElementById('sidebar-shop-name');
                if (sidebarName) {
                    const name = state.settings.SHOP_NAME || '';
                    sidebarName.textContent = name.length > 15 ? name.substring(0, 15) + '...' : name;
                }
                showNotification('Settings updated successfully!', 'success');
            } else {
                const errData = await res.json().catch(() => null);
                const detail = errData && errData.detail ? errData.detail : 'Unknown error';
                if (res.status === 403) {
                    settingsPassword = ''; // Reset stored password
                    showNotification('Password expired. Please re-enter.', 'error');
                    renderSettings(); // Back to password prompt
                } else {
                    showNotification('Failed to save settings: ' + detail, 'error');
                }
            }
        } catch (error) {
            showNotification('Error saving settings: ' + error.message, 'error');
        }
    });
}

function showNotification(msg, type = 'info') {
    const container = document.getElementById('notification-container');
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.innerHTML = `<span>${msg}</span>`;
    container.appendChild(note);
    setTimeout(() => note.remove(), 3000);
}

function openModal() { modalContainer.classList.remove('hidden'); }
function closeModal() { modalContainer.classList.add('hidden'); }

function updateNotifications() {
    const lowStockItems = state.products.filter(p => p.stock <= (p.low_stock_threshold || 5));
    const count = lowStockItems.length;
    
    const countBadge = document.getElementById('notif-count');
    const notifBtn = document.getElementById('notif-btn');
    const dropdown = document.getElementById('notif-dropdown');
    
    if (count > 0) {
        countBadge.textContent = count;
        countBadge.classList.remove('hidden');
        notifBtn.querySelector('i').classList.add('ringing');
        
        dropdown.innerHTML = `
            <div class="notif-header">
                <span>Notifications (${count})</span>
                <button onclick="document.getElementById('notif-dropdown').classList.add('hidden')" style="background: none; border: none; cursor: pointer;"><i class="fas fa-times"></i></button>
            </div>
            <div class="notif-list">
                ${lowStockItems.map(p => `
                    <div class="notif-item" onclick="loadPage('inventory')">
                        <div class="notif-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="notif-content">
                            <h4>Low Stock: ${p.name}</h4>
                            <p>Currently ${p.stock} ${p.unit} remaining (Threshold: ${p.low_stock_threshold || 5})</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        countBadge.classList.add('hidden');
        notifBtn.querySelector('i').classList.remove('ringing');
        dropdown.innerHTML = `
            <div class="notif-header">
                <span>Notifications</span>
            </div>
            <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
                No new notifications
            </div>
        `;
    }
}

// Notification Toggle
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notif-dropdown');
    const btn = document.getElementById('notif-btn');
    
    if (btn && (btn.contains(e.target))) {
        dropdown.classList.toggle('hidden');
    } else if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});
