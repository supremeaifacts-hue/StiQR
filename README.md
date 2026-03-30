# StickerQR (Working Title)

## Executive Summary
StickerQR is a web application for generating fully customized QR codes. The unique "Sticker Studio" feature lets users place decorative or branded stickers in the centre of the QR code, in addition to standard logos. It targets individuals and businesses for marketing, events, and information sharing.

## Core Objectives
- **Usability:** 3-step process (Select Type -> Customize -> Download)
- **Customization:** industry-standard options plus the Sticker Studio
- **Monetization:** clear freemium model with explicit differentiation between free/static and paid/dynamic features
- **Transparency:** avoid deceptive practices seen in competitors

## Scope
**In Scope:**
- Responsive web app
- User authentication
- Static and dynamic QR generation
- Proprietary sticker gallery and logo upload
- Basic analytics for paid tiers
- Download in PNG/SVG/PDF

**Out of Scope (MVP):**
- Native mobile apps
- Advanced AI design suggestions

## High-Level Architecture
- **Frontend:** React.js (or Vue.js) for reactive UI and editor canvas
- **Backend:** Node.js/Express (or Python Flask) for API, QR processing, and storage
- **Database:** PostgreSQL for user data and dynamic redirect mapping
- **Storage:** AWS S3 / Cloudflare R2 for sticker assets and user uploads

## Next Steps / MVP Tasks
1. Scaffold frontend and backend directories
2. Initialize package.json files and basic server/app components
3. Implement QR type selector and basic static generation
4. Build editor canvas with color picking and preview
5. Add sticker gallery UI (placeholder data)
6. Implement download endpoints and file generation
7. Set up user authentication (JWT or session) and dashboard
8. Design API endpoints for programmatic generation

---
*This README will grow as development proceeds.*

## Getting Started

### Frontend

```bash
cd frontend
npm install        # installs React, Vite, etc.
npm run dev         # starts Vite dev server on localhost:5173
```

### Backend

```bash
cd backend
npm install        # installs Express
npm start          # runs the API server on localhost:3000
```

Frontend assets can eventually be built and served by the backend in production.
