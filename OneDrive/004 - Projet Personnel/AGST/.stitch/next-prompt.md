---
page: index
---
Phase 3 enhancement: Add a language toggle (FR/EN/BM) to the AGST site. All 6 pages (index, mission, programme, joueurs, actualites, rejoindre) currently have a 3-button lang toggle in the navbar that does nothing. Implement the i18n system.

This is a JavaScript-only enhancement — do NOT regenerate the pages. Instead, write a shared JS file `site/public/i18n.js` that:
1. Defines FR/EN/BM translation strings for key UI elements (navbar links, CTA buttons, section titles, anti-scam messages, footer text)
2. Reads `localStorage.getItem('agst-lang')` to restore the last chosen language
3. Applies translations by querying `[data-i18n="key"]` attributes
4. Exports a `setLang(lang)` function used by the lang toggle buttons

Then update `index.html` with `data-i18n` attributes on key elements and the `setLang()` call wired to the toggle buttons as a pilot implementation.

**DESIGN SYSTEM (REQUIRED):**

DESIGN SYSTEM — AGST Académie Globale Sportive Tigana

BRAND IDENTITY:
- Bold, energetic African sports academy. Mobile-first. Real photos of children training in Bamako.
- Trilingual: French (primary), English, Bambara.

COLORS:
- Primary green: #1A7A3C
- Accent gold: #F5A623
- Dark navy: #0D1B48
- Page bg: #FAFAF7
- WhatsApp green: #25D366

TYPOGRAPHY:
- Headings: Oswald 700, uppercase
- Body: Inter 400–600

KEY CONTENT:
- WhatsApp: +223 65 41 88 81
- All pages: index, mission, programme, joueurs, actualites, rejoindre
