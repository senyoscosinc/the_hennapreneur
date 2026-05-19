/* ============================================
   THE HENNAPRENEUR - Main JavaScript
   ============================================ */

// ============ GLOBAL STATE ============
let cart = [];
let data = {};
window.data = data;
let currentPage = window.location.pathname.split('/').pop() || 'home.html';
let pendingBooking = null;  // Store booking data temporarily before confirmation

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  // Load data — failure here must not prevent cart / nav / forms from working
  try {
    await loadData();
  } catch (err) {
    console.error('initializeApp: data load failed, continuing with empty data.', err.message);
    // Ensure window.data always exists so page scripts don't throw
    window.data = window.data || { hennaDesigns: [], products: [], reviews: [], courseInfo: {} };
  }

  // Initialize cart from localStorage
  loadCartFromStorage();

  // Load payment / email libraries
  loadPaymentLibraries();
  loadEmailLibrary();

  // Create checkout modal markup
  createCheckoutModal();

  // Setup navigation
  setupNavigation();

  // Setup cart functionality
  setupCart();

  // Setup forms
  setupForms();

  // Update cart count
  updateCartCount();
}

// ============ DATA LOADING ============
async function loadData() {
  try {
    // Initialize data object
    data = {
      hennaDesigns: [],
      products: [],
      reviews: [],
      courseInfo: {}
    };

    // Load ONLY from Supabase (no fallback)
    if (!(window.CONFIG?.SUPABASE_URL || window.SUPABASE_URL) || !(window.CONFIG?.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY)) {
      throw new Error('Supabase credentials not configured in config.js');
    }

    if (typeof fetchHennaDesignsFromSupabase !== 'function') {
      throw new Error('fetchHennaDesignsFromSupabase function not available');
    }

    const supabaseHenna = await fetchHennaDesignsFromSupabase();
    
    if (!Array.isArray(supabaseHenna)) {
      throw new Error('Supabase returned non-array data: ' + JSON.stringify(supabaseHenna));
    }

    if (supabaseHenna.length === 0) {
      throw new Error('No henna designs found in Supabase table. Check if table "henna_designs" exists and has data.');
    }

    data.hennaDesigns = supabaseHenna;
    window.data = data;

    if (typeof fetchProductsFromSupabase !== 'function') {
      throw new Error('fetchProductsFromSupabase function not available');
    }

    const supabaseProducts = await fetchProductsFromSupabase();

    if (!Array.isArray(supabaseProducts)) {
      throw new Error('Supabase returned non-array products data: ' + JSON.stringify(supabaseProducts));
    }

    if (supabaseProducts.length === 0) {
      console.warn('No products found in Supabase table. Product pages may render empty grids.');
    }

    data.products = supabaseProducts;
    window.data = data; // keep window.data in sync after products are loaded
  } catch (error) {
    console.error('ERROR: Failed to load data:', error.message);
    throw error; // Stop execution to make error visible
  }
}

function formatCurrency(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return 'GHS 0.00';
  }
  return `GHS ${Number(value).toFixed(2)}`;
}

function getHennaPriceLabel(henna) {
  if (henna?.variation1_price !== undefined && henna?.variation2_price !== undefined) {
    return `${formatCurrency(henna.variation1_price)} / ${formatCurrency(henna.variation2_price)}`;
  }
  if (henna?.walk_in_price !== undefined) {
    return formatCurrency(henna.walk_in_price);
  }
  if (henna?.price?.min !== undefined && henna?.price?.max !== undefined) {
    return `${formatCurrency(henna.price.min)} - ${formatCurrency(henna.price.max)}`;
  }
  return 'GHS 0.00';
}

function getHennaDefaultPrice(henna) {
  if (henna?.variation1_price !== undefined) {
    return henna.variation1_price;
  }
  if (henna?.variation2_price !== undefined) {
    return henna.variation2_price;
  }
  if (henna?.walk_in_price !== undefined) {
    return henna.walk_in_price;
  }
  if (henna?.price?.min !== undefined) {
    return henna.price.min;
  }
  return 0;
}

function getServiceCharge() {
  const serviceSelect = document.getElementById('serviceType');
  if (!serviceSelect) return 0;
  const serviceType = serviceSelect.value;
  if (serviceType === 'home_accra') return 100;
  if (serviceType === 'home_outside_accra') return 200;
  return 0;
}

function getSelectedHennaPrice() {
  const variationRadio = document.querySelector(`input[name="hennaVariation_${currentDesign?.id}"]:checked`);
  if (variationRadio && currentDesign) {
    const selectedVariation = variationRadio.value;
    if (selectedVariation === 'variation1' && currentDesign.variation1_price !== undefined) {
      return currentDesign.variation1_price;
    }
    if (selectedVariation === 'variation2' && currentDesign.variation2_price !== undefined) {
      return currentDesign.variation2_price;
    }
  }
  return getHennaDefaultPrice(currentDesign);
}

function updateDetailPrice() {
  const basePrice = getSelectedHennaPrice();
  const serviceCharge = getServiceCharge();
  document.getElementById('price').textContent = formatCurrency(basePrice + serviceCharge);
}

function getServiceLabel() {
  const serviceSelect = document.getElementById('serviceType');
  if (!serviceSelect) return 'Walk-In service';
  const selected = serviceSelect.value;
  if (selected === 'home_accra') return 'Home service (Accra)';
  if (selected === 'home_outside_accra') return 'Home service (Outside Accra)';
  return 'Walk-In service';
}

function getHennaVariationHtml(henna) {
  const hasVar1 = henna?.variation1_name;
  const hasVar2 = henna?.variation2_name;
  
  // If only one variation exists, display as text (not interactive)
  if ((hasVar1 && !hasVar2) || (!hasVar1 && hasVar2)) {
    if (hasVar1) {
      return `<div class="variation-single">${henna.variation1_name}</div>`;
    } else {
      return `<div class="variation-single">${henna.variation2_name}</div>`;
    }
  }
  
  // If both variations exist, display as radio buttons
  if (hasVar1 || hasVar2) {
    let html = '<div class="variations-group">';
    
    if (hasVar1) {
      html += `
        <label class="variation-radio">
          <input type="radio" name="hennaVariation_${henna.id}" value="variation1" checked onchange="updateDetailPrice()">
          <span class="variation-label">${henna.variation1_name}</span>
        </label>`;
    }
    
    if (hasVar2) {
      html += `
        <label class="variation-radio">
          <input type="radio" name="hennaVariation_${henna.id}" value="variation2" onchange="updateDetailPrice()">
          <span class="variation-label">${henna.variation2_name}</span>
        </label>`;
    }
    
    html += '</div>';
    return html;
  }

  return `<div class="card-price">${getHennaPriceLabel(henna)}</div>`;
}

// ============ NAVIGATION ============
function setupNavigation() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-links a');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
  }

  // Close menu when link is clicked
  links.forEach(link => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('active');
      navLinks?.classList.remove('open');
    });
  });

  // Update active link
  updateActiveNavLink();
}

function updateActiveNavLink() {
  const currentPage = window.location.pathname;
  const links = document.querySelectorAll('.nav-links a');

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (currentPage.includes(href.replace('./', ''))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ============ CART FUNCTIONALITY ============
function closeCartTray() {
  const cartSidebar = document.querySelector('.cart-sidebar');
  cartSidebar?.classList.remove('open');
}

function setupCart() {
  // Setup cart toggle
  const cartIcon = document.querySelector('.cart-icon');
  const cartSidebar = document.querySelector('.cart-sidebar');
  const closeBtn = document.querySelector('.close-btn');

  if (cartIcon) {
    cartIcon.addEventListener('click', () => {
      cartSidebar?.classList.toggle('open');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      cartSidebar?.classList.remove('open');
    });
  }

  document.addEventListener('click', (e) => {
    if (!cartSidebar || !cartSidebar.classList.contains('open')) return;
    const target = e.target;
    if (cartIcon?.contains(target) || cartSidebar.contains(target)) return;
    cartSidebar.classList.remove('open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartTray();
    }
  });

  // Render cart
  renderCart();
}

function addToCart(item) {
   const existingItem = cart.find(
     cartItem => cartItem.id === item.id && cartItem.type === item.type && cartItem.unitType === item.unitType
   );

   if (existingItem) {
     existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
   } else {
     cart.push({
       ...item,
       quantity: item.quantity || 1,
       cartId: Date.now()
     });
   }

   saveCartToStorage();
   updateCartCount();
   renderCart();

   showNotification('Item added to cart!');
 }

function removeFromCart(cartId) {
  cart = cart.filter(item => item.cartId !== cartId);
  saveCartToStorage();
  updateCartCount();
  renderCart();
}

function updateCartQuantity(cartId, quantity) {
  const item = cart.find(item => item.cartId === cartId);
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveCartToStorage();
    updateCartCount();
    renderCart();
  }
}

function renderCart() {
  const cartItemsContainer = document.querySelector('.cart-items');
  const cartTotal = document.querySelector('.cart-total span:last-child');
  const checkoutBtn = document.querySelector('.checkout-btn');

  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="cart-empty"><p>Your cart is empty</p></div>';
    if (cartTotal) cartTotal.textContent = 'GHS 0.00';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  let html = '';
  let total = 0;

  cart.forEach(item => {
    const price = item.price || (item.price?.min ? `GHS ${item.price.min}-GHS ${item.price.max}` : 'GHS 0.00');
    const itemTotal = typeof item.price === 'number' ? item.price * (item.quantity || 1) : (item.price?.min || 0);
    total += itemTotal;

    html += `
      <div class="cart-item">
        <div class="cart-item-image">
          <img src="${item.image || '../assets/images/placeholder.png'}" alt="${item.name || 'Item'}">
        </div>
        <div class="cart-item-content">
          <div class="cart-item-title">${item.name || 'Unnamed Item'}</div>
          <div class="cart-item-price">${typeof item.price === 'number' ? 'GHS ' + item.price.toFixed(2) : (item.price?.min ? 'GHS ' + item.price.min.toFixed(2) : 'GHS 0.00')}</div>
          <div class="quantity-control">
            <button onclick="updateCartQuantity(${item.cartId}, ${(item.quantity || 1) - 1})">−</button>
            <span>${item.quantity || 1}</span>
            <button onclick="updateCartQuantity(${item.cartId}, ${(item.quantity || 1) + 1})">+</button>
            <img src="../assets/icons/trash-xmark.svg" alt="remove" class="cart-item-remove" onclick="removeFromCart(${item.cartId})">
          </div>
        </div>
      </div>
    `;
  });

  cartItemsContainer.innerHTML = html;
  if (cartTotal) cartTotal.textContent = 'GHS ' + total.toFixed(2);
  if (checkoutBtn) checkoutBtn.disabled = false;

  // Setup checkout
  setupCheckout();
}

function updateCartCount() {
  const cartCount = document.querySelector('.cart-count');
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (cartCount) {
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
  }
}

function saveCartToStorage() {
  localStorage.setItem('hennaCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
  const stored = localStorage.getItem('hennaCart');
  if (stored) {
    try {
      cart = JSON.parse(stored);
    } catch (e) {
      console.error('Error loading cart from storage:', e);
      cart = [];
    }
  }
}

// ============ FORMS ============
function setupForms() {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
  });
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formType = form.getAttribute('data-form-type') || 'contact';

  // Validate form
  if (!validateForm(form)) {
    return;
  }

  // Prepare form data
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Add cart info if applicable
  if (cart.length > 0 && (formType === 'booking' || formType === 'checkout')) {
    data.cart = JSON.stringify(cart);
  }

  // Handle booking forms specially - show confirmation popup instead of immediate submission
  if (formType === 'booking') {
    handleBookingFormSubmit(form, data);
    return;
  }

  // Handle course enrollment forms with email confirmations
  if (formType === 'course') {
    await handleCourseFormSubmit(form, data);
    return;
  }

  // Send to email service (setup with Formspree or similar)
  await submitForm(data, formType);

  // Clear form
  form.reset();
  showFormSuccess(form);
}

function handleBookingFormSubmit(form, data) {
  // Get selected henna variation
  const selectedVariation = document.querySelector(`input[name="hennaVariation_${currentDesign?.id}"]:checked`)?.nextElementSibling?.textContent || 'Standard';
  const serviceTypeValue = document.getElementById('serviceType')?.value || 'walk_in';
  const basePrice = getSelectedHennaPrice();
  const serviceCharge = getServiceCharge();
  const totalPrice = basePrice + serviceCharge;
  
  // Store booking data for later use
  pendingBooking = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    date: data.date,
    time: data.time,
    message: data.message,
    designId: currentDesign?.id,
    designImage: currentDesign?.image || '',
    designName: currentDesign?.name || 'Henna Design',
    designCategory: currentDesign?.category || 'Henna',
    selectedVariation: selectedVariation,
    serviceType: serviceTypeValue,
    serviceTypeLabel: getServiceLabel(),
    basePrice: basePrice,
    serviceCharge: serviceCharge,
    totalPrice: totalPrice
  };

  // Close the booking modal
  closeModal('bookingModal');

  // Show the confirmation popup
  openModal('bookingConfirmationModal');
}

async function handleCourseFormSubmit(form, data) {
  try {
    const courseBooking = {
      name: data.name,
      email: data.email,
      phone: data.phone || 'N/A',
      experience: data.experience,
      message: data.message,
      courseName: 'Henna Design Mastery Course',
      courseDuration: '3-month intensive course',
      courseStart: 'Next available cohort'
    };

    await sendCourseConfirmationEmail(courseBooking);

    form.reset();
    closeModal('courseModal');
    showFormSuccess(form);
    showNotification('Course signup confirmed! Check your email for details.', 'success');
  } catch (error) {
    console.error('Error sending course confirmation email:', error);
    showNotification('Unable to process your course signup right now. Please try again.', 'error');
  }
}

async function submitForm(data, formType) {
  try {
    await loadEmailLibrary();

    const params = {
      message: Object.entries(data)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n'),
      customer_email: data.email || ''
    };

    const businessEmail = getConfig?.()?.EMAILJS_BUSINESS_RECIPIENT?.trim();
    if (businessEmail) params.to_email = businessEmail;

    await window.emailjs.send(
      getConfig().EMAILJS_SERVICE_ID,
      getConfig().EMAILJS_CHECKOUT_TEMPLATE,
      params
    );

    return true;
  } catch (error) {
    console.error('Error submitting form:', error);
    // Fallback: store locally if email service fails
    const submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
    submissions.push({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem('formSubmissions', JSON.stringify(submissions));
    return false;
  }
}

function validateForm(form) {
  let isValid = true;

  // Clear previous errors
  form.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.parentElement?.classList.remove('has-error');
  });

  // Validate required fields
  form.querySelectorAll('[required]').forEach(field => {
    if (!field.value.trim()) {
      showFieldError(field, 'This field is required');
      isValid = false;
    }
  });

  // Validate email
  const emailFields = form.querySelectorAll('input[type="email"]');
  emailFields.forEach(field => {
    if (field.value && !isValidEmail(field.value)) {
      showFieldError(field, 'Please enter a valid email address');
      isValid = false;
    }
  });

  // Validate phone
  const phoneFields = form.querySelectorAll('input[type="tel"]');
  phoneFields.forEach(field => {
    if (field.value && !isValidPhone(field.value)) {
      showFieldError(field, 'Please enter a valid phone number');
      isValid = false;
    }
  });

  return isValid;
}

function showFieldError(field, message) {
  let errorEl = field.parentElement?.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    field.parentElement?.appendChild(errorEl);
  }
  errorEl.textContent = message;
  field.parentElement?.classList.add('has-error');
}

function showFormSuccess(form) {
  let successEl = form.querySelector('.form-success');
  if (!successEl) {
    successEl = document.createElement('div');
    successEl.className = 'form-success';
    form.insertBefore(successEl, form.firstChild);
  }
  successEl.textContent = 'Thank you! Your message has been sent successfully.';
  successEl.classList.add('show');

  setTimeout(() => {
    successEl.classList.remove('show');
  }, 4000);
}

// ============ VALIDATION HELPERS ============
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(phone);
}

// ============ CHECKOUT ============
function setupCheckout() {
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', proceedToCheckout);
  }
}

function proceedToCheckout() {
  if (cart.length === 0) {
    showNotification('Your cart is empty');
    return;
  }

  closeCartTray();

  // Show checkout modal or redirect to checkout page
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    renderCheckoutSummary();
    modal.classList.add('open');
  } else {
    // Redirect to checkout page or open a form
    alert('Redirecting to checkout...');
  }
}

// ============ BOOKING CONFIRMATION HANDLERS ============
function proceedWithPayment() {
  
  if (!pendingBooking) {
    showNotification('Error: Booking data not found', 'error');
    return;
  }

  // Close confirmation modal
  closeModal('bookingConfirmationModal');

  // Use pricing already captured when the booking form was submitted
  const basePrice = pendingBooking.basePrice || 0;
  const serviceCharge = pendingBooking.serviceCharge || 0;
  const totalPrice = pendingBooking.totalPrice || (basePrice + serviceCharge);

  addToCart({
    id: pendingBooking.designId || Date.now(),
    name: pendingBooking.designName,
    price: totalPrice,
    type: 'henna',
    category: pendingBooking.designCategory,
    serviceType: pendingBooking.serviceTypeLabel,
    serviceCharge: serviceCharge,
    image: pendingBooking.designImage || '',
    bookingDetails: pendingBooking
  });

  // Clear the pending booking
  pendingBooking = null;

  // Show success message and proceed to checkout
  showNotification('Booking added to cart!');
  setTimeout(() => {
    proceedToCheckout();
  }, 500);
}

async function completeBookingWithoutPayment() {
  
  if (!pendingBooking) {
    showNotification('Error: Booking data not found', 'error');
    return;
  }

  try {
    // Show loading state
    showNotification('Processing your booking...');

    // Send booking confirmation email
    const result = await sendBookingConfirmationEmail(pendingBooking);

    // Close confirmation modal
    closeModal('bookingConfirmationModal');

    // Clear pending booking
    pendingBooking = null;

    // Show success notification
    showNotification('Booking confirmed! Check your email for details.', 'success');

    // Optionally reset the page or show a confirmation message
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    showNotification('Error processing booking. Please try again.', 'error');
  }
}

function getServiceChargeAmount() {
  const serviceType = document.getElementById('serviceType')?.value;
  switch(serviceType) {
    case 'home_accra':
      return 100;
    case 'home_outside_accra':
      return 200;
    case 'walk_in':
    default:
      return 0;
  }
}

// ============ NOTIFICATIONS ============
function showNotification(message, type = 'success') {
  // Create notification element if it doesn't exist
  let notificationContainer = document.getElementById('notificationContainer');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notificationContainer';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 1000;
      max-width: 400px;
    `;
    document.body.appendChild(notificationContainer);
  }

  const notification = document.createElement('div');
  notification.style.cssText = `
    background: ${type === 'success' ? '#4caf50' : '#f44336'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 5px;
    margin-bottom: 10px;
    animation: fadeInUp 0.3s ease;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  notification.textContent = message;

  notificationContainer.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============ UTILITY FUNCTIONS ============
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
  }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('open');
  }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Log cart for debugging
function logCart() {
  return cart.reduce((sum, item) => {
    const price = typeof item.price === 'number' ? item.price : (item.price?.min || 0);
    return sum + (price * (item.quantity || 1));
  }, 0);
}