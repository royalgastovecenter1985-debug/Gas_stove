# Royal Gas Stove Center — Next.js website + admin panel

The Next.js 16 (React 19, TypeScript) version of the Royal Gas Stove Center website.
It uses a **PostgreSQL database (Neon)**. All products, categories, certificates, reels, settings and the
admin login were copied over from the PHP site's MySQL database.

- Public site: same design and URLs as the PHP site (`/`, `/products`, `/products/{category}`,
  `/product/{slug}`, `/about`, `/certificates`, `/contact`, `/brochure`, `/sitemap.xml`).
- Admin panel: `/admin`.
- Inquiry forms open **WhatsApp** with every detail filled in, and also save a copy in Admin → Inquiries
  (plus an optional e-mail).

---

## 1. Run it on this computer

Requirements: **Node.js 20.9+** and a PostgreSQL connection string in `DATABASE_URL` (Neon).

```bash
cd C:\xampp\htdocs\royalgasstove\nextjs
npm install
copy .env.example .env.local      # then set DATABASE_URL and SESSION_SECRET
npm run dev                       # http://localhost:3000   admin: http://localhost:3000/admin
```

Create a `SESSION_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**New database?** Run `database/schema.postgres.sql` to create the tables (Neon console → SQL Editor).
To copy data from the old MySQL database (XAMPP must be running, `DB_*` in `.env.local` point at it), run
`node --env-file=.env.local scripts/migrate-mysql-to-postgres.mjs`. It creates the tables too, and
replaces every row in PostgreSQL with the MySQL rows. `database/schema.sql` is the old MySQL version, kept for reference.

---

## 2. The admin panel (`/admin`)

| Section | What you can do |
|---|---|
| **Dashboard** | New/weekly inquiry counts, latest inquiries, quick links. |
| **Products** | Search and filter by category, add or edit products, and switch *Best seller* and *Visible* with one click. Delete removes the product's photos too. |
| ↳ **Product photos** | Add **many photos at once** (click or drag them onto the box), **drag to reorder**, press **★ Main** to make one the main photo, or 🗑 to remove one. JPG/PNG/WebP up to 10 MB, 15 per product. Photos are auto-rotated, resized to 1600 px, and saved with WebP and 500 px copies for fast loading. |
| **Categories** | Name, URL, tagline, description (the category page's text), image, order, visible. A category that still has products can't be deleted. |
| **Inquiries** | Every website inquiry. Filter by status (New → Contacted → Quoted → Closed), search, reply on WhatsApp or call with one click, delete, and **Export CSV** for Excel. |
| **Certificates** | Upload a certificate scan with its title, issuer and year. It appears in the Certificates page gallery, and the first one also shows on the Home and About pages. |
| **About page** | Every block of the About page: headings, story text (blank line = new paragraph, `**word**` = bold), the 4 photos, the values cards (icon, title, text), the *What we do* list, and the workshop details. |
| **Testimonials** | Customer reviews on the home page (hidden when there are none). |
| **Instagram Reels** | The *Royal Reels* row: cover image, optional short MP4, and the Instagram link. |
| **Website settings** | **Logo**, **favicon**, business name, **phone numbers**, **WhatsApp number** (where inquiries go), **address**, opening hours (and the times used for the *Open now* badge), map position, e-mail, social links, Google rating, home counters, *Who we serve* list, **brochure PDF**, inquiry e-mail address, and **change password**. |

Changes appear on the website immediately; there's no rebuild or cache to clear.

Security: passwords are bcrypt hashes (the PHP site's hashes still work), the login cookie is signed
and HTTP-only and lasts 12 hours, logins are limited to 5 failed attempts per 15 minutes per IP, every
admin action checks the session again on the server, and changing the password signs out other sessions.

---

## 3. Deploying (Node.js hosting)

Next.js needs a **Node.js server**, so plain PHP-only shared hosting can't run it. Options that work:

- **cPanel with “Setup Node.js App”** (many Indian hosts offer this), a **VPS** (Ubuntu + Nginx + PM2),
  or Node platforms such as Railway or Render.
- The database is PostgreSQL on Neon; any host just needs `DATABASE_URL`.

### Build

```bash
npm ci
npm run build          # creates .next/standalone — a self-contained server
```

`npm run build` also copies `public/` and the static files into `.next/standalone`.
Upload/deploy **the contents of `.next/standalone`**, then start it with:

```bash
node server.js         # listens on PORT (default 3000)
```

Build on the same OS type as the server (for example, build on Linux for a Linux server), or run
`npm ci && npm run build` on the server itself. The image library (sharp) is platform-specific.

### Environment variables (set in the hosting panel or a PM2 ecosystem file)

| Variable | Example | Notes |
|---|---|---|
| `APP_URL` | `https://www.yourdomain.com` | Used for canonical/OG links and the sitemap |
| `DATABASE_URL` | `postgresql://…neon.tech/neondb?sslmode=verify-full` | Neon (pooled) connection string |
| `SESSION_SECRET` | 64 random hex chars | **Required** for admin login |
| `UPLOAD_DIR` | `/home/user/rgs-uploads` | **Put it outside the deploy folder** so redeploying never deletes uploaded photos |
| `PORT` | `3000` | |
| `SMTP_*`, `MAIL_FROM` | | Optional inquiry e-mails (also set *Send inquiry e-mails to* in Website settings) |
| `DB_TIMEZONE` | `+05:30` | Default; inquiry times are shown in India time |

### Uploads

**On Vercel (with `BLOB_READ_WRITE_TOKEN`):** uploads are stored in Vercel Blob, at the same
`assets/uploads/...` paths that are saved in the database, and pages link to the Blob URLs directly
(old `/assets/uploads/...` links redirect there). The admin's browser uploads each file straight to
Blob, so photos and videos larger than Vercel's ~4.5 MB request limit work. The Blob store must be
**Public**. Copy existing files once with `node --env-file=.env.local scripts/upload-storage-to-blob.mjs`.

**On your own server (no Blob token):** uploads are stored in `UPLOAD_DIR` (default `./storage/uploads`)
and served at `/assets/uploads/...`. On first deploy, **copy the current `storage/uploads/` folder**
(certificate + reels) into your `UPLOAD_DIR`. Back up `UPLOAD_DIR` together with the database.

### Example: VPS with PM2 + Nginx

```bash
cd /var/www/royal/.next/standalone
PORT=3000 pm2 start server.js --name royal --update-env
# Nginx: proxy_pass http://127.0.0.1:3000;  client_max_body_size 60m;  (for photo/video uploads)
```

---

## 4. Moving from the PHP site

1. Keep the database as it is: the Next.js app reads and writes the same tables.
   New settings (logo, favicon, opening times, About page text) are added the first time you save them in the admin.
2. Copy `C:\xampp\htdocs\royalgasstove\assets\uploads\*` (if you uploaded anything new through the PHP admin)
   into the Next.js `UPLOAD_DIR`.
3. Point the domain at the Node.js app. URLs are unchanged, so Google links and shared links keep working.

---

## 5. Project structure

```
src/app/(site)/        Public pages (home, products, product, about, certificates, contact, 404)
src/app/admin/         Admin: login, (panel)/… pages, actions/ (Server Actions), inquiries CSV export
src/app/api/           /api/inquiry (form submissions), /api/products (search suggestions)
src/app/assets/uploads Serves uploaded files from UPLOAD_DIR (with video range support)
src/components/site    Header, Footer, InquiryForm/Modal, SearchSheet, SiteEffects (animations, sliders, lightbox)
src/components/admin   Admin UI: ImageManager (multi-photo), ProductForm, AboutForm, SettingsForm …
src/lib/               db, auth, settings (+ settings-schema.ts: every editable setting), uploads (sharp), data queries
public/assets/         Logo, product photos, brand images, brochure (bundled files)
storage/uploads/       Admin uploads in development (use UPLOAD_DIR in production)
```

To add a new editable setting, add one line to `src/lib/settings-schema.ts`. It appears in
Admin → Website settings automatically, with no database change needed.

---

## 6. Troubleshooting

- **“Image processing is not available”** when uploading: the `sharp` package didn't install for the
  server's platform. Run `npm ci` (or `npm install --os=linux --cpu=x64 sharp`) on the server and rebuild.
- **Admin login loops back to the login page:** `SESSION_SECRET` isn't set, or the site runs on
  `https://` behind a proxy while `APP_URL` says `http://` (the cookie is marked Secure when `APP_URL` is https).
- **Uploads fail with “body exceeded”:** raise `client_max_body_size` in Nginx (60m) or the host's upload limit.
- **The site shows old photos after replacing them:** uploaded files get new names, so a normal refresh is enough.
  For files in `public/` (bundled with the build), redeploy.
