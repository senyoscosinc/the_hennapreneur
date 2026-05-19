/* ============================================
   EMAIL LOGIC
   ============================================ */

// Safely access CONFIG - handle both browser and build environments
function getConfig() {
  return (typeof window !== 'undefined' && window.CONFIG) ||
         (typeof global !== 'undefined' && global.CONFIG) ||
         {};
}

function getEmailJsPublicKey() {
  return getConfig().EMAILJS_PUBLIC_KEY || '';
}

function formatCurrency(value) {
  return `GHS ${Number(value || 0).toFixed(2)}`;
}

// Returns a Promise — safe to await before sending
function loadEmailLibrary() {
  return new Promise((resolve, reject) => {
    // Already loaded and initialized
    if (typeof window !== 'undefined' && window.emailjs && typeof window.emailjs.send === 'function') {
      return resolve();
    }

    // Script tag exists but hasn't fired onload yet — wait for it
    const existing = document.querySelector(
      'script[src*="emailjs"]'
    );
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.emailjs && typeof window.emailjs.init === 'function') {
          window.emailjs.init(getEmailJsPublicKey());
        }
        resolve();
      });
      existing.addEventListener('error', reject);
      return;
    }

    // Guard against missing key before injecting the script
    const emailJsPublicKey = getEmailJsPublicKey();
    if (!emailJsPublicKey) {
      return reject(new Error('EMAILJS_PUBLIC_KEY is not defined'));
    }

    const script = document.createElement('script');
    script.src ='https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.async = true;

    script.onload = () => {
      const emailJsPublicKey = getEmailJsPublicKey();
      if (window.emailjs && typeof window.emailjs.init === 'function') {
        window.emailjs.init(emailJsPublicKey);
        resolve();
      } else {
        reject(new Error('EmailJS loaded but init() is unavailable'));
      }
    };

    script.onerror = () =>
      reject(new Error('Failed to load EmailJS script'));

    document.head.appendChild(script);
  });
}

async function sendCheckoutConfirmationEmail(order) {
  // Wait for EmailJS to be ready before proceeding
  await loadEmailLibrary();

  const orderItemsList =
    order.items
      ?.map(
        (item) =>
          `${item.name} (${item.unitType || 'piece'}): ${item.quantity} x ${formatCurrency(item.price)}`
      )
      .join('\n') || 'No items';

  const customerEmail = order.email?.trim();
  if (!customerEmail) {
    throw new Error('sendCheckoutConfirmationEmail: customer email is missing');
  }

  // Business recipient is not defined in this script.
  // If the business template is configured to use a fixed recipient in EmailJS, no address is required here.
  // If you need a dynamic business recipient, add EMAILJS_BUSINESS_RECIPIENT to config.js and update the template.
  const businessEmail = getConfig().EMAILJS_BUSINESS_RECIPIENT?.trim();
  const businessParams = {
    message: `
      NEW ORDER NOTIFICATION

      Order Reference: ${order.reference || 'N/A'}
      Customer Name:   ${order.name || 'N/A'}
      Customer Email:  ${customerEmail || 'N/A'}
      Customer Phone:  ${order.phone || 'N/A'}
      Order Notes:     ${order.notes || 'None'}
      Order Total:     ${formatCurrency(order.total)}

      Items:
      ${orderItemsList}
    `.trim(),
  };

  if (businessEmail) {
    businessParams.to_email = businessEmail;
  }

  const customerParams = {
    // Match the exact variable names in the EmailJS customer template
    customer_email: customerEmail,
    message: `
      Hello ${order.name || 'Valued Customer'},

      Thank you for your order from The Hennapreneur!

      Here is a summary of your order:
      Order Reference: ${order.reference || 'N/A'}
      Order Total:     ${formatCurrency(order.total)}

      Items:
      ${orderItemsList}

      You will be contacted shortly to confirm the details of your order.
      Thank you for choosing The Hennapreneur!

      Best regards,
      Ayisha Inusah
    `.trim(),
  };

  try {
    const businessResult = await window.emailjs.send(
      getConfig().EMAILJS_SERVICE_ID,
      getConfig().EMAILJS_CHECKOUT_TEMPLATE,
      businessParams
    );

    const customerResult = await window.emailjs.send(
      getConfig().EMAILJS_SERVICE_ID,
      getConfig().EMAILJS_CUSTOMER_TEMPLATE,
      customerParams
    );

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error?.text || error?.message || error);
    throw error;
  }
}

async function sendBookingConfirmationEmail(booking) {
  // Wait for EmailJS to be ready before proceeding
  await loadEmailLibrary();

  const customerEmail = booking.email?.trim();
  if (!customerEmail) {
    throw new Error('sendBookingConfirmationEmail: customer email is missing');
  }

  const bookingReference = `HENNA-${Date.now()}`;
  const businessEmail = getConfig().EMAILJS_BUSINESS_RECIPIENT?.trim();

  // Prepare email content for business
  const businessMessage = `
    NEW HENNA BOOKING REQUEST

    Booking Reference: ${bookingReference}
    Customer Name: ${booking.name || 'N/A'}
    Customer Email: ${customerEmail}
    Customer Phone: ${booking.phone || 'N/A'}
    
    BOOKING DETAILS:
    Design: ${booking.designName || 'N/A'}
    Category: ${booking.designCategory || 'N/A'}
    Variation: ${booking.selectedVariation || 'N/A'}
    Service Type: ${booking.serviceTypeLabel || 'N/A'}
    Preferred Date: ${booking.date || 'N/A'}
    Preferred Time: ${booking.time || 'N/A'}
    
    PRICING:
    Base Price: GHS ${booking.basePrice?.toFixed(2) || '0.00'}
    Service Charge: GHS ${booking.serviceCharge?.toFixed(2) || '0.00'}
    Total: GHS ${booking.totalPrice?.toFixed(2) || '0.00'}
    
    Special Requests:
    ${booking.message || 'None'}

    This booking was submitted without payment. Please contact the customer to confirm availability and arrange payment if needed.
  `.trim();

  // Prepare email content for customer
  const customerMessage = `
    Hello ${booking.name || 'Valued Customer'},

    Thank you for booking a henna session with The Hennapreneur!

    BOOKING DETAILS:
    Booking Reference: ${bookingReference}
    Design: ${booking.designName || 'N/A'}
    Category: ${booking.designCategory || 'N/A'}
    Variation: ${booking.selectedVariation || 'N/A'}
    Service Type: ${booking.serviceTypeLabel || 'N/A'}
    Preferred Date: ${booking.date || 'N/A'}
    Preferred Time: ${booking.time || 'N/A'}
    
    PRICING:
    Base Price: GHS ${booking.basePrice?.toFixed(2) || '0.00'}
    Service Charge: GHS ${booking.serviceCharge?.toFixed(2) || '0.00'}
    Total: GHS ${booking.totalPrice?.toFixed(2) || '0.00'}

    Special Requests: ${booking.message || 'None'}

    We will contact you shortly to confirm the booking and finalize the details.

    Thank you for choosing The Hennapreneur!

    Best regards,
    Ayisha Inusah
    The Hennapreneur
  `.trim();

  const businessParams = {
    message: businessMessage
  };

  if (businessEmail) {
    businessParams.to_email = businessEmail;
  }

  const customerParams = {
    customer_email: customerEmail,
    message: customerMessage
  };

  try {
    const businessResult = await window.emailjs.send(
      getConfig().EMAILJS_SERVICE_ID,
      getConfig().EMAILJS_CHECKOUT_TEMPLATE,
      businessParams
    );

    const customerResult = await window.emailjs.send(
      getConfig().EMAILJS_SERVICE_ID,
      getConfig().EMAILJS_CUSTOMER_TEMPLATE,
      customerParams
    );

    return { success: true, reference: bookingReference };
  } catch (error) {
    console.error('Booking email send error:', error?.text || error?.message || error);
    throw error;
  }
}

async function sendCourseConfirmationEmail(courseBooking) {
  await loadEmailLibrary();

  const customerEmail = courseBooking.email?.trim();
  if (!customerEmail) {
    throw new Error('sendCourseConfirmationEmail: customer email is missing');
  }

  const enrollmentReference = `COURSE-${Date.now()}`;
  const businessEmail = getConfig().EMAILJS_BUSINESS_RECIPIENT?.trim();

  const businessMessage = `
    NEW COURSE ENROLLMENT

    Enrollment Reference: ${enrollmentReference}
    Student Name: ${courseBooking.name || 'N/A'}
    Student Email: ${customerEmail}
    Student Phone: ${courseBooking.phone || 'N/A'}
    
    COURSE DETAILS:
    Course Name: ${courseBooking.courseName}
    Duration: ${courseBooking.courseDuration}
    Start Date: ${courseBooking.courseStart}
    Experience Level: ${courseBooking.experience || 'N/A'}
    Why they want to learn henna:
    ${courseBooking.message || 'N/A'}
  `.trim();

  const customerMessage = `
    Hello ${courseBooking.name || 'Valued Student'},

    Thank you for enrolling in the Henna Design Mastery Course!

    ENROLLMENT DETAILS:
    Enrollment Reference: ${enrollmentReference}
    Course Name: ${courseBooking.courseName}
    Duration: ${courseBooking.courseDuration}
    Start Date: ${courseBooking.courseStart}
    Experience Level: ${courseBooking.experience || 'N/A'}
    
    Why you want to learn henna:
    ${courseBooking.message || 'N/A'}

    We will contact you soon with the next steps and full course access details.

    Best regards,
    Ayisha Inusah
    The Hennapreneur
  `.trim();

  const businessParams = {
    message: businessMessage
  };

  if (businessEmail) {
    businessParams.to_email = businessEmail;
  }

  const customerParams = {
    customer_email: customerEmail,
    message: customerMessage
  };

  try {
    const businessResult = await window.emailjs.send(
      getConfig().EMAILJS_SERVICE_ID,
      getConfig().EMAILJS_CHECKOUT_TEMPLATE,
      businessParams
    );

    const customerResult = await window.emailjs.send(
      getConfig().EMAILJS_SERVICE_ID,
      getConfig().EMAILJS_CUSTOMER_TEMPLATE,
      customerParams
    );

    return { success: true, reference: enrollmentReference };
  } catch (error) {
    console.error('Course email send error:', error?.text || error?.message || error);
    throw error;
  }
}
