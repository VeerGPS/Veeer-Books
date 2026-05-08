# Veeer Sukhadiya Books — Next.js Migration

A full migration of the original vanilla-HTML/CSS/JS + Express/MongoDB project
into a single, Vercel-ready Next.js 14 (App Router) application.

> **Backend behaviour and API contract are preserved exactly.** Existing
> MongoDB documents, JWTs, Razorpay orders, and `localStorage` data continue
> to work without migration scripts.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — values from the original /server/.env can be pasted
# directly. The file `.env.local` already in this project contains the
# original credentials (test Razorpay keys, Mongo Atlas URI, SMTP creds)
# so it works out of the box, but rotate those secrets before production.

# 3. Run dev server
npm run dev          # → http://localhost:3000

# 4. Production build
npm run build && npm start
```

### Deploy to Vercel

```bash
npx vercel
```

Then in the Vercel dashboard add the same env vars from `.env.local`:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string for signing JWTs |
| `RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | SMTP credentials for OTP delivery |
| `ALLOWED_ORIGIN` | (optional) CORS origin if calling the API cross-domain |

---

## Project structure

```
veeer-books-nextjs/
├── app/                           ← App Router pages + API routes
│   ├── layout.tsx                 ← Root layout (loads Razorpay script, mounts Providers)
│   ├── providers.tsx              ← Auth + Cart + Modal contexts wrapper
│   ├── page.tsx                   ← Home (replaces index.html)
│   ├── globals.css                ← All global styles (migrated styles.css)
│   ├── not-found.tsx              ← Custom 404
│   │
│   ├── product/[slug]/            ← Dynamic product page (replaces 5 product-*.html files)
│   │   ├── page.tsx
│   │   └── AddToCartButton.tsx
│   │
│   ├── cart/page.tsx              ← Cart + Razorpay checkout (replaces cart.html)
│   ├── library/page.tsx           ← Authenticated user's purchased books
│   │
│   ├── (info)/                    ← Route group for 11 static info / policy pages
│   │   ├── best-sellers/
│   │   ├── bundles/
│   │   ├── contact-us/
│   │   ├── cookies/
│   │   ├── gift-cards/
│   │   ├── help-centre/
│   │   ├── new-arrivals/
│   │   ├── privacy/
│   │   ├── reading-apps/
│   │   ├── returns/
│   │   └── terms/
│   │
│   └── api/                       ← Migrated Express routes
│       ├── auth/
│       │   ├── signup/route.ts
│       │   ├── verify-otp/route.ts
│       │   ├── login/route.ts
│       │   └── send-otp/route.ts
│       └── razorpay/
│           ├── key/route.ts
│           ├── order/route.ts
│           └── verify/route.ts
│
├── components/
│   ├── Header.tsx                 ← Sticky nav, mobile-toggle, auth-aware
│   ├── Footer.tsx
│   ├── BookCard.tsx
│   ├── BookGrid.tsx
│   ├── PolicyPage.tsx             ← Shared shell for the 11 info pages
│   └── modals/
│       └── AuthModals.tsx         ← Login + Signup + OTP modals (mounted once)
│
├── contexts/
│   ├── AuthContext.tsx            ← token + purchasedBooks (persists to localStorage)
│   ├── CartContext.tsx            ← cartItems[]   (persists to localStorage)
│   └── ModalContext.tsx           ← which auth modal is open (transient)
│
├── lib/
│   ├── books.ts                   ← Single source of truth for the 5-book catalogue
│   ├── mongoose.ts                ← Cached connection helper (serverless-safe)
│   ├── auth.ts                    ← generateToken + requireAuth shim (replaces Express middleware)
│   ├── email.ts                   ← sendOTP — preserved 1:1
│   ├── razorpay.ts                ← Razorpay SDK singleton
│   ├── cors.ts                    ← Optional CORS helper
│   └── api-client.ts              ← Typed fetch wrappers used by client components
│
├── models/
│   └── index.ts                   ← User, OTP, Order Mongoose schemas (preserved)
│
├── public/                        ← Static assets
│   ├── images/                    ← Logo, book covers, about photo (renamed for URL safety)
│   ├── books/                     ← Original PDFs
│   └── readers/                   ← The 5 large standalone reader HTML files (kept verbatim)
│
├── .env.local                     ← Pre-populated with original credentials (rotate for prod!)
├── .env.example                   ← Sanitized template
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## Original-file → New-file mapping

### Frontend pages

| Original | New | Notes |
|---|---|---|
| `index.html` | `app/page.tsx` + `app/layout.tsx` | Hero, all 5 books, new releases, collections, about — everything on one server-rendered page |
| `cart.html` | `app/cart/page.tsx` | Razorpay checkout flow preserved exactly |
| `product-the-circle-of-ash.html` | `app/product/[slug]/page.tsx` (slug = `the-circle-of-ash`) | All 5 product pages collapsed into one dynamic route, statically pre-rendered at build time via `generateStaticParams` |
| `product-the-1-percent-rule.html` | `app/product/[slug]/page.tsx` (slug = `the-1-percent-rule`) | |
| `product-the-shattered-sky.html` | `app/product/[slug]/page.tsx` (slug = `the-shattered-sky`) | |
| `product-fairy-tales-for-kids.html` | `app/product/[slug]/page.tsx` (slug = `fairy-tales-for-kids`) | |
| `product-the-student-success-system.html` | `app/product/[slug]/page.tsx` (slug = `the-student-success-system`) | |
| `best-sellers.html` | `app/(info)/best-sellers/page.tsx` | |
| `bundles.html` | `app/(info)/bundles/page.tsx` | |
| `contact-us.html` | `app/(info)/contact-us/page.tsx` | |
| `cookies.html` | `app/(info)/cookies/page.tsx` | |
| `gift-cards.html` | `app/(info)/gift-cards/page.tsx` | |
| `help-centre.html` | `app/(info)/help-centre/page.tsx` | |
| `new-arrivals.html` | `app/(info)/new-arrivals/page.tsx` | |
| `privacy.html` | `app/(info)/privacy/page.tsx` | |
| `reading-apps.html` | `app/(info)/reading-apps/page.tsx` | |
| `returns.html` | `app/(info)/returns/page.tsx` | |
| `terms.html` | `app/(info)/terms/page.tsx` | |
| `the-circle-of-ash.html` (22 MB) | `public/readers/the-circle-of-ash.html` | Large self-contained reader (base64-embedded scanned pages) — kept verbatim as a static asset; loaded outside React to avoid serializing megabytes through the React tree |
| `the-1-percent-rule.html`, `the-shattered-sky.html`, `fairy-tales-for-kids.html`, `the-student-success-system.html` | same → `public/readers/` | |

### Frontend assets

| Original | New |
|---|---|
| `styles.css` | `app/globals.css` (migrated; CSS variables and design preserved; mobile-first responsive enhancements added at the end) |
| `logic.js` (catalogue + auth + cart + checkout) | Split into `lib/books.ts`, `contexts/AuthContext.tsx`, `contexts/CartContext.tsx`, `lib/api-client.ts`, `app/cart/page.tsx`, modals |
| `firebase-config.js` / `firebase-config.example.js` | **Removed** — Firebase was never wired up in `logic.js`. Auth uses the custom Mongo + JWT backend. |
| `book.css`, `book.js` | **Removed** — orphan files (no HTML referenced them; the 5 reader HTMLs are fully self-contained) |
| `logo.png`, `about.jpeg`, `the circle of ash.png`, `1-percent-rule.png`, `shattered sky.jpg`, `fairy tales.jpg`, `student success.png` | `public/images/*` (filenames normalised to URL-safe form) |
| `books/*.pdf` | `public/books/*.pdf` |

### Backend

| Original | New | Notes |
|---|---|---|
| `server/server.js` | `app/api/**/route.ts` | Each Express handler became a Route Handler; logic preserved 1:1 |
| `server/models/index.js` | `models/index.ts` | TypeScript-typed Mongoose models with the same shape and indexes |
| `server/utils/services.js` | `lib/email.ts` + `lib/auth.ts` | `sendOTP` preserved; `generateToken` moved to `lib/auth.ts` alongside the new `requireAuth` |
| `server/.env` | `.env.local` (committed in this delivery; rotate in prod) | |
| Express middleware `requireAuth` | `lib/auth.ts → requireAuth(req)` | Returns either `{ userId }` or a 401 `NextResponse` the caller returns immediately — a Next-idiomatic translation of `(req,res,next)` |

### API contract (unchanged)

| Method + path | Body | Returns |
|---|---|---|
| `POST /api/auth/signup` | `{ fullName, email, password, termsAccepted }` | `{ message: "OTP sent" }` |
| `POST /api/auth/verify-otp` | `{ email, otp }` | `{ token, purchasedBooks }` |
| `POST /api/auth/login` | `{ email, password }` | `{ token, purchasedBooks }` |
| `POST /api/auth/send-otp` | `{ email }` | `{ message: "OTP sent successfully" }` |
| `GET /api/razorpay/key` | — | `{ key }` |
| `POST /api/razorpay/order` (auth) | `{ amountINR, items }` | `{ order: <razorpay order> }` |
| `POST /api/razorpay/verify` (auth) | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` | `{ ok: true }` |

Auth header format: `Authorization: Bearer <jwt>`.

---

## Architectural decisions

### 1. App Router (Next.js 14)
The original is a multi-page static site. The App Router gives us file-based
routing, server components, route groups for the 11 policy pages, and dynamic
routes for products — all without a heavy client bundle.

### 2. `bcryptjs` instead of `bcrypt`
The native `bcrypt` package requires a C++ toolchain at install time and
frequently breaks Vercel/Lambda builds. `bcryptjs` is a pure-JS
drop-in with the **same API** (`bcrypt.hash`, `bcrypt.compare`). Hashes are
binary-compatible, so existing user passwords in MongoDB continue to verify.

### 3. Cached Mongoose connection
Each serverless cold start would otherwise open a new connection to Atlas and
exhaust the pool. `lib/mongoose.ts` uses the canonical
`global._mongooseCache` pattern so one connection is reused across invocations.

### 4. `requireAuth` returns `NextResponse | { userId }`
Express's `(req, res, next)` doesn't translate to Next.js Route Handlers.
Pattern used:
```ts
const auth = requireAuth(req);
if (auth instanceof NextResponse) return auth;   // 401 short-circuit
// …auth.userId is now safe to use
```

### 5. Same-origin API calls
The original front-end hit `http://localhost:8787/api/...` with hardcoded URLs
and required CORS to be open. On Vercel everything ships under one domain, so
client components call `/api/...` through `lib/api-client.ts`. **No CORS, no
environment-switching, no proxy.**

### 6. Reader HTML files preserved as static assets
The 5 reader HTML files are 4–22 MB each — scanned book pages embedded as
base64. Re-rendering them as React components would force every byte through
the React tree for zero benefit. They live in `public/readers/` and are
opened directly via `window.location.href = book.reader`. They keep the
exact same UX as before.

### 7. Static pre-rendering of product pages
`generateStaticParams` in `app/product/[slug]/page.tsx` produces 5 pre-built
HTML pages at build time, so `/product/the-circle-of-ash` is served as static
HTML and hydrates a tiny "Add to cart" island.

### 8. Razorpay Checkout script loaded once
`<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive">`
in `app/layout.tsx` makes `window.Razorpay` available everywhere it's needed,
removing the duplicate `<script>` tags from the original `index.html` and
`cart.html`.

### 9. Storage keys preserved
The Auth and Cart contexts read/write the **same** `localStorage` keys the
original code used:
- `auth_token`
- `purchased_books`
- `cartItems`
- `temp_email` (transient, used during OTP signup)

This means any user who had an open tab from the legacy site sees their
session and cart preserved on first visit.

### 10. Catalogue is server-side data
`lib/books.ts` exports the canonical `BOOKS` array with `id`, `slug`, `price`,
etc. **Do not change the numeric `id` values** — they are stored in MongoDB
on `User.purchasedBooks` and `Order.items`. The `slug` is new (URL-friendly),
but it's purely for routing and not persisted anywhere.

---

## Mobile responsiveness

The original CSS had only one breakpoint (`@media (max-width: 768px)`). The
migrated `globals.css` adds:

- **Mobile nav toggle** — `Header.tsx` exposes a `☰` button and uses
  `.nav-links.open` to show a stacked menu under 769 px.
- **Container padding** drops from 2 rem to 1 rem under 640 px so content
  uses the full screen width on phones.
- **Hero typography** uses `clamp()` so the H1 scales smoothly from 2 rem to
  4 rem.
- **Product page** stacks vertically (`grid-template-columns: 1fr`) under
  860 px, with the cover centered and capped at 360 px.
- **Cart layout** stacks under 900 px and the per-item action buttons drop
  to a third row instead of overflowing.
- **Footer grid** collapses 4 → 2 → 1 columns at 992 px and 768 px.
- **Book grid** densities adapt — `repeat(auto-fill, minmax(180px, 1fr))` on
  phones, 240 px on tablet, 280 px on desktop.

All buttons keep `min-height ≥ 44px` (44px is the iOS HIG tap-target
threshold) due to the existing `.btn` padding.

---

## Performance notes

- **next/image** is used on the home page, product page, library, and cart —
  Vercel automatically generates optimized AVIF/WebP at multiple sizes.
- **Static pre-rendering** of the home page, all 5 product pages, and the
  11 policy pages via the default behaviour of server components.
- **Lazy hydration** of cart-only logic — only `app/cart/page.tsx` and
  `AddToCartButton.tsx` ship the Razorpay-related JS to the browser.
- **Razorpay script** uses `strategy="afterInteractive"` so it doesn't block
  initial paint.
- **TTL index** on the `OTP` collection (`expireAfterSeconds: 0` against
  `expiresAt`) auto-purges expired OTPs without a cron job.

---

## Limitations & known issues

- **Total `/public/readers` payload is ~84 MB.** Vercel's Hobby plan has a
  100 MB deploy-output limit per function. Static assets are served from
  Vercel's edge CDN and are *not* counted against function size, so the deploy
  succeeds — but if you ever exceed 100 MB total you should move the readers
  to S3/R2 and update `Book.reader` paths in `lib/books.ts`.
- **Email-OTP via Hostinger SMTP** is synchronous — if the SMTP server is
  slow, signup will hang. For production, consider Resend or Postmark with
  API-based delivery.
- **Razorpay test keys** are committed in `.env.local`. Replace them with
  your live keys before going to production.
- **`logic.js` referenced PDF.js for an in-browser PDF reader** but PDF.js
  was never actually loaded — the canvas/`pdfDoc` code paths were dead. They
  were not migrated.
- **Firebase** config files (`firebase-config*.js`) were stubs and never
  wired into the original auth flow. They're not migrated.
- **No rate limiting on the API routes.** The original imported
  `express-rate-limit` but never registered it. Add edge-level limiting via
  Vercel KV + middleware if abuse becomes a concern.

---

## Suggested next-step improvements (not implemented)

1. **Replace `alert()` calls** with a toast-notification system (e.g.
   `sonner`).
2. **Server-side cart** stored in MongoDB so users can resume across devices.
3. **Webhook-based payment confirmation** — Razorpay can POST directly to
   `/api/razorpay/webhook` to mark orders paid even if the user closes the
   tab before redirect.
4. **Email queue** — use a job queue so signup doesn't block on SMTP.
5. **Rate limiting** on `/api/auth/*` routes (Vercel KV + middleware).
6. **Honor system check on serverless cold-start** for Mongoose — wrap calls
   in a small retry helper.
7. **Move secrets out of source** — current `.env.local` ships with the
   original test credentials so the project runs out-of-the-box, but rotate
   `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, and SMTP password before production.

---

## Verifying the migration

After `npm install && npm run dev`, walk through:

1. `/` — home renders; 5 book cards visible.
2. Click a book → `/product/the-circle-of-ash` → "Add to Cart" → `/cart`.
3. Sign up → enter email → receive OTP → verify → JWT stored in
   `localStorage.auth_token`.
4. Checkout from `/cart` → Razorpay Checkout modal opens → use a test card
   (`4111 1111 1111 1111`, any future expiry, any CVV).
5. Verify success → book appears in `/library` → click "Read Now" → reader
   HTML opens at `/readers/the-circle-of-ash.html`.
6. Test all 11 footer links (Best Sellers, Privacy, etc.).
7. Logout → cart cleared, library route shows sign-in prompt.

---

## License & attribution

This migration preserves the original project authored by Veer Sukhadiya for
Veeer Sukhadiya Books. All book content, branding, and copy are © Veer
Sukhadiya.
