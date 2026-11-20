# ShopEase — Full-Stack E-Commerce Project (Basic Level)

A complete, beginner-friendly e-commerce project built **exactly on the folder/file
structure** from the uploaded `tree\_structure.txt`:

|Part|Tech|Runs on|What it does|
|-|-|-|-|
|`client/`|React 18 + Vite 5 + Tailwind CSS 3|http://localhost:5173|Storefront: home, shop, search, product cards, cart \& checkout, login/register|
|`admin/`|React 18 + Vite 5 (plain CSS)|http://localhost:5174|Admin panel: stats, orders + status, invoices, add/delete products|
|`server/`|Node.js + Express 4 + MySQL|http://localhost:5000|REST API: auth (JWT), products, categories, cart, orders, payments (mock), reviews, coupons, notifications, search, support, admin stats|
|`database/`|MySQL (single `schema.sql`)|MySQL 5.7+/8|All tables + seed data (12 products, 2 users, 2 coupons)|

**External references are used as CDN links (nothing to download):**

* Product images → **Unsplash CDN** links (`https://images.unsplash.com/photo-...`) stored in the database
* Icons → **Font Awesome 6.5.2** CDN (`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css`)
* Font → **Google Fonts Poppins** (`https://fonts.googleapis.com/css2?family=Poppins...`)

An internet connection is needed once so the browser can load those links.

\---

## 1\. What you must install first (Windows 10/11)

You need **two** things: **Node.js** and **MySQL**.

### 1.1 Node.js (version 18 or newer)

**PowerShell (one line):**

```powershell
winget install OpenJS.NodeJS.LTS
```

**CMD (one line):**

```cmd
winget install OpenJS.NodeJS.LTS
```

*No winget?* Download the **LTS installer** from https://nodejs.org and click through it.
Verify afterwards (**close and reopen** the terminal first):

```powershell
node -v
npm -v
```

### 1.2 MySQL

Pick **one** option:

**Option A — MySQL Community Server (recommended)**

```powershell
winget install Oracle.MySQL
```

Remember the **root password** you set during the MySQL installer.
Make sure the MySQL service is running (it starts automatically).

**Option B — XAMPP (easiest for beginners)**

1. Download from https://www.apachefriends.org and install.
2. Open the **XAMPP Control Panel** → press **Start** next to **MySQL**.
3. The default root user has an **empty password** → in `server/.env` leave
`DB\_PASSWORD=` empty.

Verify (**only Option A**; close/reopen terminal first):

```powershell
mysql --version
```

If "mysql is not recognized" add `C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin`
to the PATH, or just use the **MySQL 8.0 Command Line Client** shortcut from the
Start menu instead of plain `mysql`.

\---

## 2\. Import the database

Open a terminal in the project folder (where this README is), then run:

**PowerShell:**

```powershell
# Option A (MySQL installed)
mysql -u root -p < database\\schema.sql

# Option B (XAMPP): C:\\xampp\\mysql\\bin\\mysql.exe -u root < database\\schema.sql
```

**CMD:**

```cmd
mysql -u root -p < database\\schema.sql
```

(Option B XAMPP: `C:\\xampp\\mysql\\bin\\mysql.exe -u root < database\\schema.sql`)

This creates the database `ecommerce\_db` with all tables and demo data.

> If you prefer a GUI: open phpMyAdmin (XAMPP) or MySQL Workbench, create nothing
> manually — just "Import" / "Run SQL file" on `database/schema.sql`.

\---

## 3\. Configure the server (one file)

Open `server/.env` (and the identical copy `server/src/.env`) and set your MySQL
password:

```env
DB\_USER=root
DB\_PASSWORD=your\_mysql\_password     # XAMPP users: leave empty
DB\_NAME=ecommerce\_db
```

Everything else works as-is for local development.

\---

## 4\. Install dependencies (npm install in 3 folders)

Open **PowerShell or CMD in the project folder** and run:

**PowerShell:**

```powershell
cd server;  npm install;  cd ..\\client;  npm install;  cd ..\\admin;  npm install;  cd ..
```

**CMD:**

```cmd
cd server \&\& npm install \&\& cd ..\\client \&\& npm install \&\& cd ..\\admin \&\& npm install \&\& cd ..
```

Or simply run `npm install` **three times, one per folder**: `server`, `client`, `admin`.

\---

## 5\. Run the project (3 terminals)

You need **3 terminal windows** (right-click the folder → "Open in Terminal", or use
the terminal tab in VS Code and press **+** for more tabs).

**Terminal 1 — API server (PowerShell):**

```powershell
cd server
npm run dev        # or: npm start  (CMD: npm start)
```

You should see: `\[OK] API server running -> http://localhost:5000/api/health`

**CMD version:**

```cmd
cd server
npm start
```

**Terminal 2 — Storefront (client):**

```powershell
cd client
npm run dev
```

Open **http://localhost:5173**

**CMD version:**

```cmd
cd client
npm run dev
```

**Terminal 3 — Admin panel:**

```powershell
cd admin
npm run dev
```

Open **http://localhost:5174**

**CMD version:**

```cmd
cd admin
npm run dev
```

\---

## 6\. Demo logins

|Where|Email|Password|
|-|-|-|
|Storefront (customer)|`john@email.com`|`User@123`|
|Admin panel (admin)|`admin@shop.com`|`Admin@123`|

**Try this:** log in on the storefront → add products to the cart → open the cart
icon → apply coupon `SAVE10` → fill the address → **Place order** (choose
"Card (mock)" with number `4111111111111111`, or Cash on delivery) → log into the
admin panel → see the order, change its status, download the invoice.

\---

## 7\. Project structure ( tree file)

```
ecommerce-project/
├── admin/
│   ├── index.html              <- added (Vite needs an entry HTML)
│   ├── package.json            <- moved from src/ (Vite reads the root package.json)
│   ├── vite.config.js          <- moved from src/ (Vite reads the root config)
│   └── src/
│       ├── App.jsx             login screen + admin layout
│       ├── main.jsx            <- added (Vite React entry)
│       ├── components/         (empty - add your widgets here)
│       ├── context/            (empty)
│       ├── hooks/              (empty)
│       ├── pages/
│       │   └── DashboardPage.jsx   stats, orders, invoices, products
│       ├── services/           (empty - axios instance lives in App.jsx)
│       └── utils/              (empty)
├── client/
│   ├── index.html              <- added (loads Font Awesome + Poppins via CDN)
│   ├── package.json
│   ├── postcss.config.js       <- added (Tailwind requirement)
│   ├── tailwind.config.js
│   ├── vite.config.js          (port 5173, proxies /api -> :5000)
│   ├── public/                 (empty)
│   └── src/
│       ├── App.jsx             router + cart context + auth state
│       ├── index.css           Tailwind setup
│       ├── main.jsx
│       ├── assets/             (empty - images come from CDN links)
│       ├── components/
│       │   ├── CheckoutPage.jsx    cart review + address + place order
│       │   ├── LoadingScreen.jsx   spinner
│       │   ├── Navbar.jsx          nav + search + login/register modal
│       │   └── ProductCard.jsx     product image/name/price/add-to-cart
│       ├── context/            (empty - cart context lives in App.jsx)
│       ├── hooks/              (empty)
│       ├── pages/
│       │   ├── HomePage.jsx        hero, categories, featured products
│       │   └── ShopPage.jsx        filters, sort, pagination
│       ├── services/
│       │   └── axios.js            shared API client with JWT interceptor
│       ├── styles/             (empty - styles live in index.css)
│       └── utils/              (empty)
├── database/
│   └── schema.sql              all tables + seed data
├── server/
│   ├── .env                    DB credentials / JWT secret
│   ├── package.json
│   ├── server.js               Express entry point
│   ├── logs/                   created at runtime (winston)
│   └── src/
│       ├── .env                same settings (loaded first)
│       ├── config/
│       │   ├── database.js         MySQL pool
│       │   ├── passport.js         local email/password strategy
│       │   └── redis.js            optional cache (memory fallback)
│       ├── controllers/            14 controllers (auth, user, product,
│       │                           category, cart, wishlist, order, payment,
│       │                           review, coupon, notification, search,
│       │                           support, admin)
│       ├── logs/                   audit/email/invoice files at runtime
│       ├── middleware/
│       │   ├── auth.js             JWT guard + admin guard
│       │   └── validation.js       tiny field validators
│       ├── models/             (empty - raw SQL via mysql2 is used)
│       ├── routes/
│       │   └── index.js            mounts all controllers under /api
│       ├── services/
│       │   ├── auditService.js     writes logs/audit.log
│       │   ├── emailService.js     email stub (logs to file/console)
│       │   └── invoiceService.js   plain-text invoice per order
│       ├── utils/
│       │   └── logger.js           winston -> error/combined/http/exceptions
│       └── validators/         (empty)
└── README.md                   this file
```

### Files added or moved compared with your original tree

The uploaded tree listed no `index.html` / `main.jsx` for the two front-ends and
placed `admin`'s `package.json` + `vite.config.js` inside `src/`. To make the
project actually run, these were **added**: `client/index.html`,
`client/postcss.config.js`, `admin/index.html`, `admin/src/main.jsx` — and these
were **moved up one level**: `admin/package.json`, `admin/vite.config.js`.
Everything else follows your structure exactly (empty folders are kept with a
`.gitkeep` file).

\---

## 8\. API quick reference (base: http://localhost:5000/api)

|Method + path|Auth|Purpose|
|-|-|-|
|GET `/health`|–|server status|
|POST `/auth/register`, `/auth/login`|–|create account / get JWT|
|GET `/auth/me`|user|current profile|
|GET `/products`|–|list (filters: `category`, `sort`, `page`, `minPrice`, `maxPrice`)|
|GET `/products/:idOrSlug`|–|product detail|
|POST/PUT/DELETE `/products...`|admin|manage products|
|GET `/categories`|–|categories + product counts|
|GET/POST/PUT/DELETE `/cart...`|user|cart operations|
|GET/POST/DELETE `/wishlist...`|user|wishlist|
|POST `/orders`, GET `/orders`, PUT `/orders/:id/cancel`|user|checkout \& history|
|GET `/orders/admin/all`, PUT `/orders/:id/status`|admin|order management|
|POST `/payments`|user|mock COD / card payment|
|GET/POST/DELETE `/reviews...`|– / user|product reviews|
|GET `/coupons`, POST `/coupons/apply`|– / user|coupon logic|
|GET/PUT `/notifications...`|user|in-app notifications|
|GET `/search?q=...`|–|keyword search|
|POST/GET `/support...`|user / admin|support tickets|
|GET `/admin/stats`, GET `/admin/invoice/:orderId`|admin|dashboard + invoice|

\---

## 9\. Troubleshooting

|Problem|Fix|
|-|-|
|`'mysql' is not recognized`|Use the "MySQL 8.0 Command Line Client" Start-menu shortcut, or XAMPP's `C:\\xampp\\mysql\\bin\\mysql.exe`, or fix the PATH|
|`\[X] MySQL connection failed`|MySQL not running (start XAMPP/MySQL service) or wrong password in `server/.env`, or `schema.sql` not imported yet|
|`Cannot find module ... iconv-lite ... valid "main" entry` (MODULE\_NOT\_FOUND)|`node\_modules` is **corrupted** - see "Fixing a corrupted node\_modules" below. Same fix works for `client` and `admin`.|
|Port 5000 already in use|Change `PORT` in `server/.env` **and** the two `vite.config.js` proxy targets|
|Port 5173/5174 already in use|Vite will ask to run on the next port automatically - accept|
|Blank page / CORS error|Make sure the API server (Terminal 1) is running before the front-ends|
|`npm install` very slow|Normal on first run; use `npm install --no-audit --no-fund`|
|Images not loading|They come from `images.unsplash.com` - check your internet connection|
|Want a fresh empty database|Run the `schema.sql` again (it drops and recreates `ecommerce\_db`)|

Logs are written to `server/logs/` (`error.log`, `combined.log`, `http.log`,
`exceptions.log`, `rejections.log`) and `server/src/logs/` (`audit.log`,
`email.log`, `invoices/\*.txt`).

\---

## 10\. Fixing a corrupted node\_modules (MODULE\_NOT\_FOUND)

If you ever see errors like this on Windows:

```
Error: Cannot find module '...\\server\\node\_modules\\iconv-lite\\lib\\index.js'.
Please verify that the package.json has a valid "main" entry
```

it means the `node\_modules` folder is incomplete/corrupted. This happens when
`npm install` is interrupted (Ctrl+C, closing the terminal too early), when
antivirus real-time scanning locks files while npm writes them, when OneDrive /
Dropbox syncs the folder during install, or when `npm install` is run **while
the `node --watch` dev server is still running**. The project files are fine -
only the installed folder is broken.

**Fix (do this in the folder that shows the error, e.g. `server`):**

1. Stop the dev server first: press **Ctrl+C** in that terminal.
2. Delete the broken install:

   **PowerShell:**

```powershell
   Remove-Item -Recurse -Force node\_modules
   npm ci
   ```

   **CMD:**

```cmd
   rmdir /s /q node\_modules
   npm ci
   ```

   `npm ci` does a clean install strictly from `package-lock.json` (all three
folders ship with a lock file, so it works). `npm install` works too.

3. Start the server again: `npm start` (or `npm run dev`).

**If deletion fails** with "file in use" or "path too long" errors:

```powershell
# close VS Code and all terminals using the folder first, then:
mkdir empty
robocopy empty node\_modules /MIR      # mirrors an empty folder = deletes all
rmdir node\_modules
rmdir empty
npm ci
```

**To prevent it happening again:** don't run `npm install` while the dev
server is running, and exclude the project folder from antivirus real-time
scanning / OneDrive sync during installs.

