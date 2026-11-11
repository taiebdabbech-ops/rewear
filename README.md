# REWEAR — Buy better. Wear better.

Second-hand clothing marketplace for Tunisia, built with **Angular**.
Web Project — **Objective 3: development and integration of the main features** (SUP'COM, 2026/2027).

- **Team:** Borhen Eddine Labidi, Taieb Dabbech
- **Supervisor:** Dr. Maroua Nouioua

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
| Product details | `/product/:id` | Photo gallery, condition grade with explanation, seller card (badge, rating, sales), add to favourites, contact form (simulated), more items from the seller, view counter |
| Seller profile | `/seller/:id` | Badge, figures, listings, reviews with rating breakdown, **review form** |
| Sell | `/sell` 🔒 | **Listing form** with validation, photo upload (resized in the browser), condition selector, publish or save as draft, **edit mode** (`/sell?edit=:id`) |
| My account | `/account` 🔒 | My listings by status (active, sold, drafts) with edit, mark as sold, publish and delete (with confirmation); my favourites; my reputation; profile; log out |
| Log in / Sign up | `/login` | **Log-in and sign-up forms** with validation (email, Tunisian phone number, password confirmation, terms), demo account button |
| How it works | `/how-it-works` | Buying and selling guides, condition grades, seller badges, FAQ, about, contact, terms |
| Not found | `**` | 404 page |

🔒 = protected by an Angular route guard: visitors are sent to Log in, then brought back.

Also included: toast notifications, loading and error states (with a "Try again" button when the API is off), optimistic favourites, lazy-loaded pages, responsive layout (phone, tablet, desktop), keyboard focus styles, alternative texts and ARIA labels.

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
      message.service.ts   "Contact seller" messages
      toast.service.ts     Notifications
      listing-filter.ts    Pure filtering and sorting functions
      image-utils.ts       Photo resizing, "x days ago"
    shared/                Reusable components
      header, footer, product-card, condition-label, seller-badge,
      star-rating, icon, toast-container
    pages/                 One folder per page
      home, shop, product-detail, seller-profile, sell, account,
      auth, how-it-works, not-found
```

## 5. Technical notes

- **Standalone components + `OnPush`** everywhere; templates use the new control flow (`@if`, `@for`, `@switch`).
- **Route parameters as inputs** (`withComponentInputBinding`): `/product/:id` arrives in the component as `id = input.required<string>()`.
- **Reactive forms** with built-in validators, a custom group validator (passwords must match) and a pattern for Tunisian phone numbers.
- **HTTP** through `HttpClient` in services only; pages never call the API directly.
- **Filtering logic** is a pure function (`listing-filter.ts`) so it is easy to read and to test.

**Dependencies:** the Angular packages created by `ng new`, plus `json-server@0.17.4` (development only).

## 6. Manual test checklist

- [ ] Every link of the header, footer and breadcrumb opens the right page
- [ ] Shop: each filter alone and combined, sorting, pagination, "Clear all", search from the header
- [ ] Favourites: heart on a card while logged out (redirect to Log in) and logged in
- [ ] Sell: empty form shows the error messages; publish with photos; save a draft; edit an item
- [ ] My account: mark as sold, publish a draft, delete with confirmation
- [ ] Log in with a wrong password, sign up with an existing email, password mismatch
- [ ] Visit `/sell` while logged out: redirect to Log in, then back to Sell
- [ ] Stop json-server: the error message and "Try again" button appear
- [ ] Responsive: 375 px (phone), 768 px (tablet), 1280 px (desktop)
- [ ] Browsers: Chrome, Firefox, Edge

## 7. Limits of this version

- Authentication is **simulated**: passwords are stored in clear text in `db.json`. Never use a real password.
- "Contact seller" saves the message but does not deliver it; seller verification badges are simulated.
- No online payment (cash on delivery planned).
- json-server replaces a real back-end and SQL database for this objective.

## 8. Git workflow

- `main` always runs; one branch per feature (`feature/shop-filters`, `feature/sell-form`…), merged through pull requests.
- Clear commit messages: `feat: add size filter`, `fix: price filter with empty value`, `style: product card spacing`.
