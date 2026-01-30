# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static GitHub Pages website for **Caleb Media**, a sports highlights and photography service. The site is a single-page application built with vanilla HTML and Tailwind CSS (via CDN). It serves as a booking/information page for clients looking to book sports videography and photography services.

Domain: calebthephotoguy.com (GitHub Pages custom domain)

## Architecture

**Static site with multiple pages:**
- `index.html` - Main site (all content, styles, scripts) - approximately 1,100+ lines
- `terms.html` - Terms of Service page (separate page with same design system)
- `admin.html` - Admin panel for gallery management (NEW)
- `gallery.html` - Client gallery viewer (NEW)
- No build process for main site
- Hosted on GitHub Pages at `q2od.github.io`

**Key technologies:**
- Tailwind CSS via CDN (`https://cdn.tailwindcss.com`)
- Google Fonts: Bebas Neue (display) and DM Sans (body text)
- Vanilla JavaScript (main site + gallery system)
- Firebase (Firestore, Storage, Auth, Cloud Functions) for gallery system

**Styling approach:**
- Inline Tailwind configuration in `<script>` tag (lines 26-67)
- Custom CSS in `<style>` tag (lines 69-107)
- Custom color palette: `blaze` (#ff6a00), `blaze2` (#ff8a2a), `ink` (#0a0a0a), `paper` (#ffffff)
- Custom animations: slide-up, fade-in, scale-in, pulse-glow

## File Structure

```
/
├── index.html          # Main site (all content, styles, scripts)
├── terms.html          # Terms of Service page (standalone, same design)
├── admin.html          # Admin panel for gallery management
├── gallery.html        # Client gallery viewer (password-protected)
├── sitemap.xml         # SEO sitemap
├── robots.txt          # Search engine rules (admin/gallery noindexed)
├── CNAME               # Custom domain configuration
├── CLAUDE.md           # Documentation for Claude Code
├── SETUP.md            # Gallery system setup instructions
├── GALLERY.md          # Gallery system documentation
├── firestore.rules     # Firestore security rules
├── storage.rules       # Firebase Storage security rules
├── .gitignore          # Git ignore patterns
├── js/
│   ├── firebase-init.js    # Firebase SDK initialization
│   ├── admin.js            # Admin panel logic
│   ├── gallery.js          # Gallery viewer logic
│   ├── upload-manager.js   # File upload handling
│   └── lightbox.js         # Fullscreen media viewer
├── functions/
│   ├── index.js            # Firebase Cloud Functions (R2 integration)
│   └── package.json        # Function dependencies
└── assets/
    └── favicon.svg         # Logo/favicon (CM initials with gradient)
```

## Common Commands

**Deploy changes:**
```bash
git add index.html
git commit -m "Description of changes"
git push origin main
```

**View site locally:**
```bash
# Option 1: Simple HTTP server (Python 3)
python3 -m http.server 8000

# Option 2: Simple HTTP server (Python 2)
python -m SimpleHTTPServer 8000

# Then open http://localhost:8000
```

**Update sitemap after changes:**
Edit `sitemap.xml` and update the `<lastmod>` timestamp to current date/time in ISO 8601 format.

## Content Sections (in order)

1. **Header** (sticky nav) - Logo, navigation links (Services, Pricing, Guidelines, Process, FAQ, Terms), CTA buttons
2. **Hero** - Main headline emphasizing video + photography, booking CTA, quick booking card
3. **Services** - Two-column section: Video Highlights (left) and Action Photography (right)
4. **Guidelines** (formerly "Rules") - Critical booking rules for both video and photography
5. **Pricing** - Eight packages total:
   - Video Highlights: Free first mixtape, $25 single event, $40 two-event bundle
   - Action Photography: $20 Express, $35 Pro, $50 Premium
   - Combo Packages: $40 (video + express photo), $55 (video + pro photo)
6. **Process** - 4-step workflow (DM → Capture → Edit → Delivery)
7. **FAQ** - 10 questions covering video, photography, payment, and service details
8. **Footer** - Logo, copyright, navigation links, Terms of Service link and notice

## Important Business Rules

The site emphasizes several critical booking rules that must be maintained when editing:

1. **No guaranteed outcomes** - Booking is for filming/photographing time and editing, not specific number of clips or photos
2. **No refunds for limited playing time** - Payment is due regardless of athlete's playing time or action captured
3. **Free tier limitations** - First-time clients only, video only, 30 seconds max, no revisions
4. **Payment split** - 50% due on shoot day, 50% before delivery (applies to both video and photography)
5. **Travel fees** - Free within 5 miles of Oviedo, +$5 per additional 5 miles
6. **Ticket responsibility** - Client must provide/cover game entry tickets
7. **Individual focus** - Services focus on one booked athlete, not full team coverage
8. **Photography pricing** - Express ($20): 15+ photos, Pro ($35): 30+ photos, Premium ($50): 50+ photos
9. **Combo savings** - Booking video + photography together saves $5

## Instagram Integration

Primary CTA throughout the site is to DM "BOOK" on Instagram:
- Link: `https://ig.me/m/caleb.filmguy`
- Profile: `https://instagram.com/caleb.filmguy`

The "BOOK" keyword triggers an automated question flow on Instagram to collect booking details.

## Design System

**Typography:**
- Display font (headlines): Bebas Neue
- Body font: DM Sans (weights: 400, 500, 600, 700)

**Color variables (in Tailwind config):**
- `ink` - Dark background (#0a0a0a)
- `paper` - White text (#ffffff)
- `blaze` - Primary orange (#ff6a00)
- `blaze2` - Secondary orange (#ff8a2a)
- `court` - Brown accent (#8b4513)

**Key visual elements:**
- Gradient text effect: `.text-gradient`
- Glow shadows: `shadow-glow` and `shadow-glow-sm`
- Alert box: `.alert-box` (for important rules)
- Number badges: `.number-badge` (gradient orange circles)
- Background flavor: `.bg-flavor` (radial gradients layered)

## Editing Guidelines

**When modifying pricing:**
- Update all relevant locations: Guidelines section, Pricing section, FAQ, Terms of Service page
- Maintain consistency across all mentions
- Update both video and photography pricing as applicable

**When adding/removing sections:**
- Update navigation links in header and footer
- Add corresponding `id` attributes for anchor links
- Ensure Terms of Service page is always linked from footer and Guidelines section

**When editing photography content:**
- Maintain focus on individual athlete coverage (not team photos)
- Keep photo package tiers consistent: Express/Pro/Premium
- Emphasize action shots, candids, and portrait-style coverage
- Social-ready JPGs (1080px) are standard; print-ready high-res is an add-on

**When changing colors:**
- Edit the Tailwind config object (lines 34-40)
- Consider updating the favicon.svg gradient if brand colors change

**Responsive design:**
- Site uses Tailwind's responsive prefixes (sm:, md:, lg:)
- Test mobile view - primary CTA button behavior changes at `sm:` breakpoint
- Grid layouts adjust at `md:` (768px) and `lg:` (1024px) breakpoints

## SEO and Meta

**Update when content changes:**
- `<title>` tag (line 6)
- Meta description (line 7)
- Open Graph tags (lines 13-15)
- Sitemap lastmod timestamp (sitemap.xml line 9)

## Gallery System

**NEW: Client Gallery System** - Password-protected photo/video galleries for clients.

See [GALLERY.md](GALLERY.md) for full documentation and [SETUP.md](SETUP.md) for setup instructions.

**Quick overview:**
- Admin panel at `/admin.html` (Firebase Auth required)
- Client galleries at `/gallery.html?id={galleryId}` (password-protected)
- Photos stored in Firebase Storage
- Videos stored in Firebase Storage (MVP) or Cloudflare R2 (optional)
- Gallery metadata and analytics tracked in Firestore
- Security enforced via Firebase Security Rules + UUIDs + hashed passwords

**Common commands:**
```bash
# Deploy security rules
firebase deploy --only firestore:rules,storage:rules

# Deploy cloud functions (optional, for R2)
firebase deploy --only functions

# View function logs
firebase functions:log
```

## Deployment

This is a GitHub Pages site:
- Automatically deploys from `main` branch
- Custom domain configured via CNAME file
- No build step required for main site - push HTML and changes go live immediately
- Firebase backend requires separate deployment (see SETUP.md)
