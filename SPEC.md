# TCV LUXURY - Site Specification v2.0

Last updated: 2026-04-01
Production URL: https://tcv-luxury.vercel.app/
Repository: https://github.com/kanata9163-lang/Luxury-Car

## 1. Site Overview

| Item | Details |
|------|---------|
| Site Name | TCV LUXURY |
| Concept | Landing page for overseas buyers interested in Japan's ultra-luxury vehicles |
| Language | English |
| Target | Overseas affluent buyers (via paid ads) |
| Goal | Lead capture via WhatsApp / LINE |
| Hosting | Vercel (static) |
| Framework | None (static HTML + Vanilla JS) |

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML / CSS / Vanilla JavaScript |
| Fonts | Google Fonts (DM Sans, Playfair Display) |
| Deploy | Vercel (static hosting, zero build step) |
| Lead Backend | Google Apps Script (fire-and-forget) |
| Analytics | GTM + GA4 + Meta Pixel + Vercel Analytics |

**No dependencies** — no npm packages, no build step, no server-side code.

## 3. File Structure

```
tcv-luxury/
├── index.html     # Main page (HTML/CSS/JS all-in-one)
├── img_hero.jpg   # Hero background image
├── rogo.png       # Logo / Favicon
├── package.json   # Minimal metadata (no dependencies)
├── vercel.json    # Vercel config (static output)
├── SPEC.md        # This file
└── .gitignore
```

## 4. Data Architecture

**v2.0 Change**: Scraping has been completely removed. The site is now a **no-inventory LP** — it does not display specific vehicle listings. Instead, it showcases brands handled and directs users to inquire via WhatsApp/LINE.

- No `cars.json`, no `build.js`, no `scrapers/` directory
- No image proxy (`api/img.js` removed)
- No Express server (`server.js` removed)
- No npm dependencies (axios, cheerio, etc. removed)

## 5. Page Structure

| Section | Content |
|---------|---------|
| Navigation | Logo + Brand/Why/Process/Reviews links + CTA button + mobile burger |
| Hero | Background image + "The World's Finest Cars, From Japan" + Inquire CTA |
| Stats Strip | 2,500+ exported / 48 countries / 15+ years / 99.2% satisfaction |
| Brand Marquee | Scrolling brand names |
| Brands Grid | 8 brand cards (Ferrari, Lamborghini, Porsche, Rolls-Royce, Bentley, McLaren, Aston Martin, Mercedes-AMG) |
| Why TCV | Bento grid: 150-point inspection, history, global delivery, secure transactions, multilingual concierge |
| Process | 4-step: Consultation > Sourcing > Purchase > Delivery |
| Testimonials | 3 client review cards |
| CTA Section | WhatsApp + LINE buttons |
| Footer | Company / Services / Connect links |
| Floating CTA | Fixed WhatsApp + LINE buttons (appear on scroll) |
| Lead Modal | Form overlay triggered by all CTA buttons |

## 6. CV Flow (Lead Capture)

### 6.1 Flow
```
User clicks any CTA button
  ↓
Lead capture form modal opens
  ↓
User fills info → clicks "Continue to WhatsApp/LINE"
  ↓
├─ GAS receives lead data (fire-and-forget, no-cors)
├─ Meta Pixel Lead event fires
├─ GTM dataLayer lead_enquiry event fires
└─ Redirect to WhatsApp or LINE
```

### 6.2 Lead Form Fields

| Field | ID | Type | Required |
|-------|-----|------|---------|
| Your Name | lead-name | text | Yes |
| Country | lead-country | text | Yes |
| Email | lead-email | email | Yes |
| Phone | lead-phone | tel | No |
| Desired Vehicle | lead-desired-car | text | No |
| Budget | lead-budget | select | No |
| Purchase Timing | lead-timing | select | No |

Budget options: ~ $100K / $100K-$200K / $200K-$500K / $500K-$1M / $1M+
Timing options: ASAP / Within 1 month / 1-3 months / 3-6 months / Just browsing

### 6.3 GAS Endpoint

URL: `https://script.google.com/macros/s/AKfycbxluaaheTfpO6Snxel3sNGo0K8XeMt5IPFgtUw-sL3eQBqtNiVOTK07n4WkNNVQcQc/exec`

Send method: `fetch()` with `mode: 'no-cors'` (fire-and-forget)

### 6.4 WhatsApp

Number: +81 80-3464-8696
Pre-filled message includes: name, country, email, phone, desired vehicle, budget, timing

## 7. Tracking Tags

### 7.1 Google Tag Manager
- Container ID: `GTM-W69PF7JH`

### 7.2 Google Analytics 4
- Measurement ID: `G-YS81SWHQRE`

### 7.3 Meta Pixel
- Pixel ID: `26695493793388140`
- Events: `PageView` (page load), `Lead` (form submit)

### 7.4 Vercel Analytics
- Speed Insights: `/_vercel/speed-insights/script.js`
- Web Analytics: `/_vercel/insights/script.js`

### 7.5 Custom Events

`trackLead(data)` fires on form submission:
- Meta Pixel: `fbq('track', 'Lead', {...})`
- GTM: `dataLayer.push({ event: 'lead_enquiry', ... })`

## 8. Design System

### Colors
| Variable | Value | Usage |
|----------|-------|-------|
| --bg | #06080A | Page background |
| --bg-card | #0D1117 | Card background |
| --bg-elevated | #151B23 | Modal background |
| --gold | #C9A84C | Accent, CTA |
| --gold-light | #E8D5A0 | Gradient |
| --text | #E8E8E8 | Primary text |
| --text-muted | #8B949E | Secondary text |

### Fonts
| Font | Usage |
|------|-------|
| DM Sans (300-700) | Body, UI, forms |
| Playfair Display (400-700, italic) | Headings, brand names |

### UI Features
- Scroll reveal animations (IntersectionObserver)
- Counter animation on stats
- Brand marquee (infinite scroll)
- Bento grid layout for features
- Floating CTA buttons
- Modal with backdrop blur
- Responsive (1024px / 768px / 480px breakpoints)

## 9. Vercel Config

```json
{
  "framework": null,
  "outputDirectory": "."
}
```

No build command. Pure static hosting.

## 10. Notes

- **No scraping**: All vehicle data display was removed. The LP focuses on brand presentation and lead capture.
- **No server-side code**: Pure static site, zero dependencies.
- **Price hidden by design**: Users must inquire via WhatsApp/LINE for pricing.
- **GAS is fire-and-forget**: No retry on failure. WhatsApp redirect is not blocked by GAS response.
