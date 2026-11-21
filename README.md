# REWEAR — Buy better. Wear better.

Second-hand clothing marketplace for Tunisia, built with **Angular**.
Web Project — **Objective 3: development and integration of the main features** (SUP'COM, 2026/2027).

- **Team:** Borhen Eddine Labidi, Taieb Dabbech
- **Supervisor:** Dr. Maroua Nouioua
- **Repository:** https://github.com/taiebdabbech-ops/rewear

---

## 1. Choice of framework

| Need | Choice | Why |
|---|---|---|
| Front-end framework | **Angular 22** (TypeScript, standalone components) | Required by the course for development. Angular is a complete framework: routing, forms with validation and HTTP calls are built in, so no extra library is needed. Its component structure matches the page-by-page prototypes of Objective 2. |
| State management | **Angular signals** (`signal`, `computed`, `effect`) | Each service is the single source of truth for its data; pages derive what they display with `computed` (filters, counters, ratings) and update automatically. |
| Data | **Simulated REST API with json-server** (`db.json`) | Objective 3 allows an API simulation. json-server gives real HTTP routes (GET, POST, PATCH, DELETE) and saves every change in `db.json`. Its collections follow the relational model of Objective 2 (users, listings, reviews, favourites, messages), so it can later be replaced by a MySQL-backed API without changing the pages. |
| Style | Custom CSS with CSS variables | Applies our visual identity (Forest green, Moss, Sage, Linen, Brass; Caladea/Cambria headings, Carlito/Calibri text) without the look imposed by a UI kit. |

## 2. Features developed

| Page | Route | What the user can do |
|---|---|---|
| Home | `/` | Hero with call to action, live figures (items for sale, items sold), categories, recent items, trusted sellers' items |
| Shop | `/shop`, `/shop/:category` | Search (`?q=`), filters by size, price, brand, condition and seller badge, active-filter chips, sorting, pagination, mobile filter sheet |
| Product details | `/product/:id` | Photo gallery, condition grade with explanation, seller card (badge, rating, sales), add to favourites, contact form (simulated), more items from the seller, view counter, publish confirmation after a new listing |
| Seller profile | `/seller/:id` | Badge, figures, listings, reviews with rating breakdown, **review form** |
| Sell | `/sell` 🔒 | **Listing form** with validation, photo upload (resized in the browser), condition selector, publish or save as draft, **edit mode** (`/sell?edit=:id`) |
| My account | `/account` 🔒 | My listings by status (active, sold, drafts) with edit, mark as sold, publish and delete (with confirmation); my favourites; **my messages** (received and sent); my reputation; **profile settings** (edit details, change password); log out |
| Log in / Sign up | `/login` | **Log-in and sign-up forms** with validation (email, Tunisian phone number, password confirmation, terms), demo account button |
| Forgot password | `/forgot-password` | E-mail form and confirmation (simulated: no e-mail is sent, and the page never reveals whether an account exists) |
| How it works | `/how-it-works` | Buying and selling guides, condition grades, seller badges, FAQ, about, terms, **contact form** (`#contact`) |
| Not found | `**` | 404 page |

🔒 = protected by an Angular route guard: visitors are sent to Log in, then brought back.

Also included: toast notifications, loading and error states (with a "Try again" button when the API is off), optimistic favourites, lazy-loaded pages, responsive layout (phone, tablet, desktop), keyboard focus styles, alternative texts and ARIA labels.

### Improvements of Objective 4

| Area | Improvement |
|---|---|
| Pages of the sitemap | Profile settings (edit details, change password), My messages, Forgot password, Contact form, publish confirmation |
| Page transitions | Soft fade between pages with the router's View Transitions (`withViewTransitions` in `app.config.ts`); the header and the mobile bar stay still |
| Micro-animations | Cards and buttons react to hover and press, the favourite heart "pops", menus and FAQ answers open with a short fade, items of a grid appear one after the other |
| Mobile navigation | Bottom bar on phones (< 600 px) with Home, Shop, Sell, Favourites and Account, as in the Objective 2 mobile prototype |
| Accessibility | Animations switched off for users who ask for reduced motion (`prefers-reduced-motion`), current page announced to screen readers (`aria-current`), visible focus ring on product cards |

## 3. Getting started

**Requirements:** Node.js LTS (tested setup: Node 24, npm 11, Angular CLI 22).

```bash
# 1. Install the dependencies
npm install

# 2. Terminal 1 — start the simulated API on http://localhost:3000
npx json-server --watch db.json --port 3000

# 3. Terminal 2 — start the Angular app on http://localhost:4200
ng serve -o
```

If the Angular CLI is not installed globally, use `npm start` instead of `ng serve -o`, then open http://localhost:4200.
Keep both terminals open while using the site: if json-server is stopped, the pages show a "Cannot reach the API" message.

**Demo accounts** (password `rewear123` for all): `sarra@rewear.tn` (Trusted seller), `amine@rewear.tn`, `ines@rewear.tn`, `salma@rewear.tn`.
You can also create a new account from the Sign up tab.

To restore the original demo data, copy `db.seed.json` over `db.json`.

## 4. Project structure

```
db.json                    Simulated database (json-server)
public/images/             Product illustrations, placeholder
src/
  styles.css               Global styles and visual identity (CSS variables)
  app/
    app.ts / app.html      Root component: header, pages, footer, notifications
    app.routes.ts          Routes (lazy-loaded pages, guard)
    app.config.ts          Router (input binding, scrolling) and HttpClient
    core/                  Data and logic
      models.ts            Types and constants (categories, conditions, badges)
      listing.service.ts   Listings: load, create, update, delete (signals)
      user.service.ts      Users and reviews, seller rating
      auth.service.ts      Simulated log-in / sign-up (localStorage)
      auth.guard.ts        Protects /sell and /account
      favourite.service.ts Favourites with optimistic updates
      message.service.ts   "Contact seller" messages and inbox
      contact.service.ts   Contact form of the Support pages
      validators.ts        Shared form rules (phone, cities, passwords match)
      toast.service.ts     Notifications
      listing-filter.ts    Pure filtering and sorting functions
      image-utils.ts       Photo resizing, "x days ago"
    shared/                Reusable components
      header, footer, bottom-nav, product-card, condition-label,
      seller-badge, star-rating, icon, toast-container
    pages/                 One folder per page
      home, shop, product-detail, seller-profile, sell, account
      (+ profile-settings, account-messages), auth, forgot-password,
      how-it-works (+ contact-form), not-found
```

## 5. Technical notes

- **Standalone components + `OnPush`** everywhere; templates use the new control flow (`@if`, `@for`, `@switch`).
- **Route parameters as inputs** (`withComponentInputBinding`): `/product/:id` arrives in the component as `id = input.required<string>()`.
- **Reactive forms** with built-in validators, a custom group validator (passwords must match) and a pattern for Tunisian phone numbers.
- **HTTP** through `HttpClient` in services only; pages never call the API directly.
- **Filtering logic** is a pure function (`listing-filter.ts`) so it is easy to read and to test.

**Dependencies:** the Angular packages created by `ng new`, plus `json-server@0.17.4` (development only).

## 6. How to test the main features

- Every link of the header, footer and breadcrumb opens the right page
- Shop: each filter alone and combined, sorting, pagination, "Clear all", search from the header
- Favourites: heart on a card while logged out (redirect to Log in) and logged in
- Sell: empty form shows the error messages; publish with photos; save a draft; edit an item
- My account: mark as sold, publish a draft, delete with confirmation
- My account › My messages: log in as Sarra, 2 received and 1 sent message appear
- My account › Profile: change your first name or city and save (the header and your public profile update); change the password with a wrong current password, then with the right one
- Forgot password: invalid e-mail shows an error; a valid one shows the confirmation
- Contact form (How it works › Contact): empty form errors, then send; the message appears in `db.json › contactMessages`
- Publish a new item: the confirmation banner appears on its page
- Log in with a wrong password, sign up with an existing email, password mismatch
- Visit `/sell` while logged out: redirect to Log in, then back to Sell
- Stop json-server: the error message and "Try again" button appear
- Responsive: 375 px (phone), 768 px (tablet), 1280 px (desktop)
- Phone (375 px): the bottom bar appears, its current tab is highlighted; filters, toasts and footer stay visible above it
- Reduced motion (Windows: Settings › Accessibility › Visual effects › Animation effects off): pages change without animation
- Browsers: Chrome, Firefox, Edge

## 7. Limits of this version

- Authentication is **simulated**: passwords are stored in clear text in `db.json`. Never use a real password.
- "Contact seller" and the contact form save the message but send no e-mail; there is no reply feature yet. Password reset is simulated. Seller verification badges are simulated.
- No online payment (cash on delivery planned).
- json-server replaces a real back-end and SQL database for this objective.

## 8. Git workflow

Code hosted on GitHub: https://github.com/taiebdabbech-ops/rewear

Conventions for the next objectives:
- `main` always runs; one branch per feature (`feature/shop-filters`, `feature/sell-form`…), merged through pull requests.
- Clear commit messages: `feat: add size filter`, `fix: price filter with empty value`, `style: product card spacing`.
