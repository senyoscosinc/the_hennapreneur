# The Hennapreneur - Deployment & Setup Guide

## 🚀 Quick Start (Local Testing)

### Step 1: Open the Project
1. Navigate to the project folder: `c:\Users\hp\Desktop\hennapreneur`
2. Open `index.html` in your browser

**Note**: For best experience, use a local server instead of opening the file directly.

### Step 2: Local Server Setup

#### Using Python (Easiest)
```bash
# Open Command Prompt or PowerShell in the project folder
cd c:\Users\hp\Desktop\hennapreneur

# Python 3
python -m http.server 8000

# Then visit: http://localhost:8000
```

#### Using Node.js
```bash
npm install -g http-server
http-server

# Or with npx (no installation needed)
npx http-server
```

#### Using VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"
3. Browser opens automatically

---

## 📋 Pre-Deployment Checklist

### Content Updates
- [ ] Update business name, email, phone, address
- [ ] Add real images to `/assets/images/`
- [ ] Update product prices in `data.json`
- [ ] Update henna design prices
- [ ] Add business hours to contact page
- [ ] Update social media links
- [ ] Add testimonials/reviews
- [ ] Set up course details

### Email Setup
- [ ] Sign up at Formspree.io
- [ ] Create form and get Form ID
- [ ] Update Form ID in `js/main.js` (line 202)
- [ ] Test form submission

### Technical Checks
- [ ] Test all forms on all pages
- [ ] Verify cart functionality (add/remove items)
- [ ] Configure Supabase if henna designs should load from the remote database
- [ ] Check all links work correctly
- [ ] Test mobile responsiveness
- [ ] Verify animations load smoothly
- [ ] Check browser console for errors
- [ ] Test across different browsers

---

## ☁️ Supabase Henna Setup

If you want the henna pages to load data from Supabase, set up a Supabase project and create a table called `henna_designs` with the following schema:

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

Create a public storage bucket named `henna-images` and upload the design images there. Then update `js/supabase-config.js` with your Supabase project URL, anon key, and bucket name.

> This site uses Supabase only as a client-side read source for henna data. Do not store any Supabase service key in the project.

In Supabase, enable row-level security on `henna_designs` and add a policy like:

```sql
create policy "Allow public select" on public.henna_designs
  for select
  using (true);
```

Leave insert/update/delete policies closed for public access.

The site will automatically use Supabase data for henna when the configuration is provided, with `db.json` remaining as a fallback.

---

## 🌐 Deployment Options

### Option 1: Netlify (Recommended for Beginners)

1. **Sign up** at https://netlify.com
2. **Drag and drop** your project folder into Netlify
3. **Deploy** - Your site is live!
4. **Custom Domain** - Add your domain via Netlify settings

### Option 2: Vercel

1. **Sign up** at https://vercel.com
2. **Connect** your Git repository (or drag & drop)
3. **Deploy** - Instant deployment
4. **Add Domain** - Connect your custom domain

### Option 3: GitHub Pages

1. **Create** a GitHub account at https://github.com
2. **Create repository** named `username.github.io`
3. **Upload** all files to repository
4. **Access** at `https://username.github.io`

### Option 4: Traditional Web Hosting (Bluehost, GoDaddy, etc.)

1. **Upload** files via FTP/SFTP
2. **Use** File Manager in hosting control panel
3. **Configure** domain pointing
4. **Test** site is accessible

### Option 5: AWS S3 + CloudFront

1. **Create** S3 bucket
2. **Upload** all files
3. **Enable** static website hosting
4. **Set up** CloudFront distribution
5. **Configure** custom domain via Route 53

---

## 🔧 Email Configuration (Essential)

### Using Formspree (Easiest)

1. Go to https://formspree.io
2. Sign up with your email
3. Create new form:
   - Name: "The Hennapreneur Contact"
   - Email: your-email@example.com
4. Copy your Form ID (looks like: `f/xxxxxxxxxxxx`)
5. Open `js/main.js` and find line ~202
6. Replace `YOUR_FORM_ID` with your actual ID:

```javascript
const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

7. Save file and test the contact form

### Using EmailJS (Alternative)

1. Sign up at https://www.emailjs.com
2. Add email service (Gmail recommended)
3. Create email template
4. Get Service ID and Template ID
5. Add to your HTML:

```html
<script src="https://cdn.emailjs.com/sdk/3.12.0/email.min.js"></script>
<script>
  emailjs.init('YOUR_PUBLIC_KEY');
</script>
```

6. Update form submission in `js/main.js`

---

## 📊 Setting Up Analytics

### Google Analytics

1. Go to https://analytics.google.com
2. Create property for your domain
3. Get your Tracking ID (G-XXXXXXXXXX)
4. Add to every page before `</head>`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 💳 Payment Integration (Future)

### For Product Sales with Stripe

1. Sign up at https://stripe.com
2. Get API keys
3. Add Stripe.js to your page
4. Implement payment form handling

```html
<script src="https://js.stripe.com/v3/"></script>
```

### For Booking Payments

- Use **Stripe** or **PayPal** payment gateway
- Modify checkout form in `pages/` to process payments
- Store transaction details securely

---

## 🔐 Security Best Practices

1. **Use HTTPS** - Essential for payment/form handling
2. **Validate Input** - All data validated client AND server-side
3. **Secure Headers** - Set proper HTTP headers:
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: SAMEORIGIN
   Content-Security-Policy: default-src 'self'
   ```
4. **Store Data** - Never store sensitive data client-side
5. **Update Libraries** - Keep any dependencies updated

---

## 📈 Performance Optimization

### Image Optimization
- Use tools like TinyPNG, ImageOptim
- Compress images before uploading
- Use WebP format for modern browsers
- Implement lazy loading

### CSS/JS Optimization
- Minify CSS and JavaScript
- Remove unused code
- Use CSS media queries efficiently
- Load JavaScript asynchronously

### Caching Strategy
```
# In .htaccess (Apache)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## 🧪 Testing Before Launch

### Desktop Testing
- [ ] Chrome (Windows)
- [ ] Firefox (Windows)
- [ ] Safari (if Mac available)
- [ ] Edge

### Mobile Testing
- [ ] iPhone Safari
- [ ] Chrome Mobile
- [ ] Samsung Internet
- [ ] Firefox Mobile

### Functionality Testing
- [ ] All navigation links work
- [ ] Forms submit successfully
- [ ] Cart add/remove items
- [ ] Filtering works on Henna/Products pages
- [ ] Detail pages load correctly
- [ ] Animations are smooth
- [ ] Images load properly
- [ ] Responsive design at all breakpoints

### Performance Testing
- [ ] Page loads in under 3 seconds
- [ ] No console errors
- [ ] All images optimized
- [ ] Mobile Lighthouse score 90+

---

## 🚨 Troubleshooting After Deployment

### Site Not Loading
- [ ] Check domain DNS settings
- [ ] Verify all files uploaded
- [ ] Check hosting server status
- [ ] Clear browser cache

### Forms Not Working
- [ ] Verify Formspree Form ID correct
- [ ] Check CORS settings
- [ ] Verify email address is correct
- [ ] Check browser console for errors

### Images Not Showing
- [ ] Verify image paths are correct
- [ ] Check file names match exactly (case-sensitive)
- [ ] Ensure images uploaded to correct folder
- [ ] Use absolute URLs if needed

### Slow Performance
- [ ] Optimize and compress images
- [ ] Enable gzip compression
- [ ] Use CDN for static assets
- [ ] Minimize CSS/JavaScript
- [ ] Check database queries (if applicable)

---

## 📞 Domain & SSL Setup

### Getting a Domain
- Namecheap.com
- GoDaddy.com
- Google Domains
- Bluehost.com

### Setting Up SSL Certificate (HTTPS)

**Netlify**: Automatic (included)
**Vercel**: Automatic (included)
**Traditional Hosting**: 
- Usually free through cPanel
- Or use Let's Encrypt

---

## 📊 Monitoring & Maintenance

### Regular Checks
- [ ] Monitor uptime (UptimeRobot.com)
- [ ] Check analytics weekly
- [ ] Review form submissions
- [ ] Monitor page speed
- [ ] Check error logs

### Scheduled Tasks
- **Weekly**: Review analytics, check errors
- **Monthly**: Backup website, update content
- **Quarterly**: Security audit, performance review
- **Annually**: Renew SSL certificate, domain

---

## 🎯 Success Metrics

Track these after launch:
- Website uptime
- Page load speed
- Mobile traffic percentage
- Form submission rate
- Cart conversion rate
- Bounce rate
- Time on site
- Return visitor rate

---

## 📖 Additional Resources

- **Web Performance**: https://web.dev/
- **Security**: https://owasp.org/www-project-top-ten/
- **Accessibility**: https://www.w3.org/WAI/
- **SEO**: https://developers.google.com/search
- **Mobile First**: https://developers.google.com/web/fundamentals

---

## ✅ Launch Checklist

Before going live:

- [ ] All content updated and accurate
- [ ] Email system configured and tested
- [ ] Images optimized and uploaded
- [ ] Forms tested on all devices
- [ ] Analytics setup
- [ ] SSL certificate active (HTTPS)
- [ ] Domain pointed correctly
- [ ] Backup created
- [ ] Performance optimized
- [ ] Security audit completed
- [ ] Mobile responsive tested
- [ ] All links verified
- [ ] Sitemap created
- [ ] Robots.txt configured
- [ ] Google Search Console verified

---

**Ready to launch? Great! 🎉**

Your website is professionally built, responsive, and ready for production use.

If you need help with any of these steps, refer to the README.md file or check the specific service documentation.

Good luck with The Hennapreneur! 💜
