# The Hennapreneur - Professional Henna Artist Website

A modern, fully responsive website for a professional henna artist offering henna design bookings, premium products, and online design courses.

## 🎨 Features

### Pages
- **Loading Page**: Animated entry with "The Hennapreneur" text animation and progress indicator
- **Home**: Hero section, featured designs, featured products, course promotion, client reviews
- **About**: Artist biography, services overview, why choose us section
- **Henna**: Browse all henna designs with filtering by category (Bridal, Spine, Casual, Waist, Back)
- **Henna Detail**: Individual design booking page with related designs
- **Products**: Shop premium henna products with category filtering
- **Product Detail**: Detailed product information with quantity selector
- **Contact**: Contact form, business information, FAQ section

### Functionality
✅ Animated loading page (5-second countdown)  
✅ Sticky navigation bar with mobile hamburger menu  
✅ Shopping cart with localStorage persistence  
✅ Form validation (contact, booking, enrollment)  
✅ Email notification setup (Formspree integration)  
✅ Fully responsive design (mobile, tablet, desktop)  
✅ Smooth animations and transitions  
✅ Accessibility best practices (ARIA labels, semantic HTML)  
✅ SEO-optimized structure  
✅ Fast loading performance  

## 📁 Project Structure

```
hennapreneur/
├── index.html                    # Loading page
├── pages/
│   ├── home.html               # Homepage
│   ├── about.html              # About page
│   ├── henna.html              # All henna designs
│   ├── henna-detail.html       # Individual henna booking
│   ├── products.html           # All products
│   ├── product-detail.html     # Individual product
│   └── contact.html            # Contact & FAQ
├── css/
│   └── styles.css              # Main stylesheet (responsive)
├── js/
│   ├── main.js                 # Core functionality
│   └── animations.js           # Loading and page animations
├── assets/
│   ├── data.json               # All product and design data
│   ├── images/                 # Image assets (optional)
│   └── fonts/                  # Custom fonts (optional)
└── README.md                   # This file
```

## 🎯 Design Specifications

- **Primary Color**: #F47684 (Coral Pink)
- **Background**: White
- **Font**: Elegant thin sans-serif (Segoe UI, system default)
- **Style**: Playful, modern, stylish with smooth animations
- **Responsiveness**: Mobile-first approach with media queries

## 🚀 Getting Started

### Option 1: Local Development
1. Extract the project folder
2. Open `index.html` in your browser (or use a local server)
3. Navigate through the pages - the loading animation will redirect to the home page

### Option 2: Using a Local Server (Recommended)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js with http-server
npx http-server
```

Then visit `http://localhost:8000`

## 📊 Data Structure

Static fallback data is stored in `db.json`, but henna designs can now load from a Supabase table when configured.

```json
{
  "hennaDesigns": [...],      // 15 henna designs across 5 categories
  "products": [...],           // 8 premium henna products
  "reviews": [...],            // 4 client testimonials
  "courseInfo": {...}          // Online course details
}
```

## ☁️ Supabase Setup for Henna Data

The henna pages can load records from a Supabase table named `henna_designs`.

Recommended schema:

```sql
create table henna_designs (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  variation1_name text,
  variation1_price numeric,
  variation2_name text,
  variation2_price numeric,
  image_path text,
  date_created timestamp with time zone default now()
);
```

Also create a public storage bucket named `henna-images` and upload the henna image files there. Then update `js/supabase-config.js` with your Supabase project URL, anon key, and bucket name.

> The henna designs table is intended to be read-only from the browser. Use the Supabase anon key only, and do not expose any service role key in the client.

In Supabase, enable row-level security for `henna_designs` and add a simple SELECT policy for the `anon` role. Keep insert/update/delete disabled for public access.

When Supabase is configured, the site uses the remote henna data and storage images automatically.

## 🛒 Cart System

- Cart items are saved to browser's localStorage
- Persists across page refreshes
- Supports both henna bookings and product purchases
- Real-time cart count update in navbar

## 📧 Email Integration Setup

The contact form is configured for **Formspree** integration:

1. **Sign up** at https://formspree.io
2. **Create a form** and get your form ID
3. **Update** the form endpoint in `js/main.js` (line ~200):

```javascript
const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
```

Replace `YOUR_FORM_ID` with your actual Formspree ID.

### Alternative: EmailJS
For EmailJS integration:
```javascript
// Add EmailJS script to your HTML
<script src="https://cdn.emailjs.com/sdk/3.12.0/email.min.js"></script>

// Initialize and use EmailJS in main.js
```

### Fallback: Local Storage
If email service fails, submissions are automatically saved to localStorage and you can retrieve them via browser console:
```javascript
JSON.parse(localStorage.getItem('formSubmissions'))
```

## ♿ Accessibility Features

- Semantic HTML5 elements
- ARIA labels for icons and interactive elements
- Keyboard navigation support
- Focus indicators on all interactive elements
- High contrast color scheme
- Reduced motion support
- Screen reader friendly

## 🔍 SEO Optimization

- Meta tags on all pages (description, keywords)
- Semantic HTML structure
- Descriptive alt text placeholders
- Open Graph meta tags ready
- Mobile-friendly responsive design
- Fast page load times

## 📱 Responsive Breakpoints

- **Desktop**: 1024px+
- **Tablet**: 768px - 1024px
- **Mobile**: Below 768px
- **Small Mobile**: Below 480px

## 🎬 Animations

- **Loading Page**: Canvas-based animated text with progress bar
- **Hover Effects**: Card lift animations, button transitions
- **Scroll Animations**: Parallax effects on hero sections
- **Form Feedback**: Success/error message animations
- **Page Transitions**: Fade-in animations

## 📋 Forms Included

1. **Contact Form** - General inquiries
2. **Booking Form** - Henna session reservations
3. **Enrollment Form** - Course sign-ups
4. **Checkout Form** - (For complete implementation with payment gateway)

### Validation
- Required field validation
- Email format validation
- Phone number format validation
- Custom error messages

## 🔧 Customization

### Update Business Info
Edit the following in all pages:
- Business name, email, phone in footer
- Social media links
- Business hours
- Location details

### Add Your Images
Place images in `/assets/images/` and reference them in:
- Card image divs
- Hero section backgrounds
- Product thumbnails

### Modify Data
Edit `/assets/data.json` to:
- Add/remove henna designs
- Add/remove products
- Update pricing
- Modify course information
- Add/remove testimonials

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## ⚡ Performance Tips

1. **Optimize Images**: Compress images before uploading
2. **Use CDN**: Serve images from a CDN for faster loading
3. **Lazy Loading**: Implement lazy loading for product images
4. **Caching**: Set up browser caching headers
5. **Minification**: Minify CSS and JavaScript for production

## 🔒 Security Considerations

- All form submissions are validated client-side and server-side
- Use HTTPS in production
- Implement CSRF protection for forms
- Validate all user inputs server-side
- Keep dependencies updated

## 📚 Third-Party Integration Ready

The site is ready for:
- **Payment Gateway**: Stripe, PayPal
- **Email Service**: Formspree, EmailJS, SendGrid
- **Analytics**: Google Analytics, Hotjar
- **CRM**: Mailchimp for newsletter signup
- **Booking System**: Calendly, Acuity Scheduling

## 🐛 Troubleshooting

### Cart not persisting
- Check if localStorage is enabled in browser
- Clear browser cache and try again
- Check browser console for errors

### Forms not submitting
- Verify Formspree ID is correct
- Check browser console for CORS errors
- Ensure email service is properly configured

### Images not showing
- Verify image paths are correct
- Check if images exist in `/assets/images/`
- Use browser DevTools to check network requests

### Navigation not working
- Verify all page file names are correct
- Check relative paths in href attributes
- Clear browser cache

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify all file paths are correct
3. Ensure you're using a local server (not opening files directly)
4. Check the data.json file format is valid JSON

## 📝 License

This project is created for The Hennapreneur. All rights reserved.

## 🎉 Ready to Launch

Your website is production-ready! To deploy:

1. **Test locally** - Verify all features work
2. **Setup email service** - Configure Formspree/EmailJS
3. **Add images** - Replace placeholder content with real images
4. **Update content** - Customize business information
5. **Deploy** - Use hosting service (Netlify, Vercel, GitHub Pages, traditional hosting)

## 📈 Future Enhancements

- Add payment processing (Stripe/PayPal)
- Implement user accounts and booking history
- Add photo gallery/portfolio section
- Integrate with scheduling calendar
- Setup newsletter subscription
- Add blog/tutorials section
- Implement review/rating system
- Add live chat support

---

**Made with ❤️ for The Hennapreneur**
