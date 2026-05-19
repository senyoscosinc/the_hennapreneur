/* ============================================
   PAYMENT LOGIC
   ============================================ */

// Guard: formatCurrency may already be defined by main.js
if (typeof formatCurrency === 'undefined') {
  function formatCurrency(value) {
    return `GHS ${Number(value || 0).toFixed(2)}`;
  }
}

const PAYSTACK_PUBLIC_KEY = 'pk_live_7ecc69a5c0205e4a47aad44548bf6457218b8720';

function loadPaymentLibraries() {
  if (document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')) return;

  const paystackScript = document.createElement('script');
  paystackScript.src = 'https://js.paystack.co/v1/inline.js';
  paystackScript.async = true;
  document.head.appendChild(paystackScript);
}

function createCheckoutModal() {
  if (document.getElementById('checkoutModal')) return;

  const modalHtml = `
    <div id="checkoutModal" class="modal">
      <div class="modal-content">
        <button class="modal-close" type="button" onclick="closeModal('checkoutModal')">×</button>
        <h2>Secure Checkout</h2>
        <div id="checkoutSummary" class="checkout-summary"></div>

        <div class="checkout-form">
          <div class="form-group">
            <label for="checkoutName">Full Name *</label>
            <input type="text" id="checkoutName" required>
            <div class="form-error"></div>
          </div>
          <div class="form-group">
            <label for="checkoutEmail">Email Address *</label>
            <input type="email" id="checkoutEmail" required>
            <div class="form-error"></div>
          </div>
          <div class="form-group">
            <label for="checkoutPhone">Phone Number *</label>
            <input type="tel" id="checkoutPhone" required>
            <div class="form-error"></div>
          </div>
          <div class="form-group">
            <label for="checkoutNotes">Order Notes</label>
            <textarea id="checkoutNotes" placeholder="Any additional instructions or preferences"></textarea>
          </div>
          <button id="paystackPayButton" class="primary-btn" type="button">Pay with Paystack</button>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const payButton = document.getElementById('paystackPayButton');
  if (payButton) {
    payButton.addEventListener('click', processCheckout);
  }
}

function getCartTotal() {
  return cart.reduce((sum, item) => {
    const unitPrice = typeof item.price === 'number' ? item.price : (item.price?.min || 0);
    return sum + unitPrice * (item.quantity || 1);
  }, 0);
}

function formatCartItem(item) {
  const unitPrice = typeof item.price === 'number' ? item.price : (item.price?.min || 0);
  return `
    <div class="checkout-item">
      <div>${item.name}${item.serviceType ? ` <span class="checkout-item-meta">(${item.serviceType})</span>` : ''}</div>
      <div>${formatCurrency(unitPrice)} x ${item.quantity || 1}</div>
    </div>`;
}

function renderCheckoutSummary() {
  const summary = document.getElementById('checkoutSummary');
  if (!summary) return;

  if (cart.length === 0) {
    summary.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }

  const itemsHtml = cart.map(formatCartItem).join('');
  const total = getCartTotal();

  summary.innerHTML = `
    <div class="checkout-summary-header">
      <h3>Order Summary</h3>
    </div>
    ${itemsHtml}
    <div class="checkout-total">
      <strong>Total:</strong>
      <span>${formatCurrency(total)}</span>
    </div>`;
}

function processCheckout() {
  const nameInput = document.getElementById('checkoutName');
  const emailInput = document.getElementById('checkoutEmail');
  const phoneInput = document.getElementById('checkoutPhone');
  const notesInput = document.getElementById('checkoutNotes');

  if (!nameInput || !emailInput || !phoneInput) {
    showNotification('Checkout form unavailable', 'error');
    return;
  }

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const notes = notesInput?.value.trim() || '';

  if (!name || !email || !phone) {
    if (!name) showFieldError(nameInput, 'Full name is required');
    if (!email) showFieldError(emailInput, 'Email is required');
    if (!phone) showFieldError(phoneInput, 'Phone number is required');
    return;
  }

  if (!isValidEmail(email)) {
    showFieldError(emailInput, 'Enter a valid email address');
    return;
  }

  if (!isValidPhone(phone)) {
    showFieldError(phoneInput, 'Enter a valid phone number');
    return;
  }

  const total = getCartTotal();
  const amountInKobo = Math.round(total * 100);

  if (!window.PaystackPop) {
    showNotification('Paystack is not loaded yet. Please try again in a moment.', 'error');
    return;
  }

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: amountInKobo,
    currency: 'GHS',
    ref: `hennapreneur_${Date.now()}`,
    metadata: {
      custom_fields: [
        { display_name: 'Full Name', variable_name: 'full_name', value: name },
        { display_name: 'Phone', variable_name: 'phone', value: phone }
      ]
    },
    callback(response) {
      const orderData = {
        reference: response.reference,
        name,
        email,
        phone,
        notes,
        total,
        items: [...cart]
      };
      
      if (response.status === 'success' || response.message === 'Approved') {
        handlePaymentSuccess(orderData);
      } else {
        handlePaymentFailure(orderData, response.message || 'Payment was not successful');
      }
    },
    onClose() {
      const orderData = {
        reference: `hennapreneur_${Date.now()}_cancelled`,
        name,
        email,
        phone,
        notes,
        total,
        items: [...cart]
      };
      handlePaymentFailure(orderData, 'Payment window closed by user');
    }
  });

  handler.openIframe();
}

async function handlePaymentSuccess(order) {
  let savedToDb = false;
  
  try {
    const result = await saveCheckoutOrder({
      customer_name: order.name,
      customer_email: order.email,
      customer_phone: order.phone,
      order_items: order.items,
      order_total: order.total,
      status: 'paid',
      payment_reference: order.reference,
      payment_method: 'paystack'
    });
    
    if (result.success) {
      savedToDb = true;
    } else {
      console.error('Failed to save order:', result.error);
    }
  } catch (dbErr) {
    console.error('Database save error:', dbErr);
  }

  try {
    await sendCheckoutConfirmationEmail(order);
    showNotification('Payment successful! Confirmation email sent.' + (savedToDb ? '' : ' (Note: Order saved locally)'));
  } catch (error) {
    console.error('EmailJS error:', error);
    showNotification('Payment succeeded but confirmation email failed to send.', 'error');
  }

  clearCart();
  closeModal('checkoutModal');
  renderCart();
}

async function handlePaymentFailure(order, errorMessage) {
  try {
    const result = await saveCheckoutOrder({
      customer_name: order.name,
      customer_email: order.email,
      customer_phone: order.phone,
      order_items: order.items,
      order_total: order.total,
      status: 'failed',
      payment_reference: order.reference,
      payment_method: 'paystack',
      notes: `Payment failed: ${errorMessage}`
    });
    
    if (result.success) {
    }
  } catch (dbErr) {
    console.error('Failed to save failed order:', dbErr);
  }
  
  showNotification(`Payment failed: ${errorMessage}`, 'error');
  closeModal('checkoutModal');
}

function clearCart() {
  cart = [];
  saveCartToStorage();
  updateCartCount();
}
