# Banyan Circle — Ops Platform

A complete hospitality operations web app for Banyan Circle properties.
Built as a mobile-first HTML/JS app backed by Supabase.

---

## What's included

| File | Purpose |
|------|---------|
| `login.html` | Staff login page |
| `index.html` | Main ops app (9 modules, mobile-first) |
| `owner.html` | Owner dashboard with revenue + analytics |
| `css/app.css` | Shared styles |
| `js/supabase.js` | Supabase client + auth helpers |
| `schema.sql` | Full database schema — run once in Supabase |

## Modules

1. **Home** — today's stats, checkouts, laundry status, activity
2. **Attendance** — staff check-in/out, duty times, remarks
3. **Housekeeping** — tasks by type (post-checkout / regular / pre-checkin) + photo upload
4. **Bookings** — manual bookings + Airbnb/Booking.com iCal sync
5. **Laundry** — send/return log per property + vendor
6. **Guests** — complaints tracker + Moments & Memories feedback stats
7. **Assets** — register per property, movement tracking + photos
8. **Lost & Found** — item log, photo upload, status tracking
9. **Banyan Circle Community** — talent roster, category filters
10. **Owner Dashboard** — revenue, occupancy, expenses, staff, guest satisfaction

---

## Setup in 5 steps

### 1. Create your Supabase project
- Go to https://supabase.com → New project
- Choose a region close to India (Singapore or Mumbai)
- Save your database password

### 2. Run the schema
- Dashboard → SQL Editor → New Query
- Paste the entire contents of `schema.sql`
- Click Run

### 3. Create storage buckets
In Supabase → Storage → New bucket, create these 4 (all private):
- `housekeeping-photos`
- `asset-photos`
- `lost-and-found-photos`
- `community-media`

### 4. Connect the app
Open `js/supabase.js` and replace:
```js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
```
Find these values at: Supabase Dashboard → Settings → API

### 5. Create staff accounts
- Supabase → Authentication → Users → Invite user
- Send invites to: sherry@banyancircle.com, ajith@banyancircle.com, vineeth@banyancircle.com
- Each staff member clicks the link, sets a password, and can log in

### 6. Host the app (free options)

**Option A — Supabase Storage (simplest)**
- Supabase → Storage → New bucket called `app` (make it PUBLIC)
- Upload all files maintaining the folder structure
- Your app URL: `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/app/index.html`

**Option B — Vercel (recommended, free)**
```bash
npm install -g vercel
cd banyan-circle
vercel
```
Follow the prompts — you get a free `.vercel.app` URL instantly.

**Option C — Netlify**
- Go to https://netlify.com → Drag and drop the `banyan-circle` folder
- Instant deploy, free SSL, free custom domain

---

## Airbnb + Booking.com calendar sync

Both platforms export iCal feeds you can read automatically:

**Airbnb iCal URL:**
Listing → Availability → Export Calendar → Copy link

**Booking.com iCal URL:**
Property → Calendar → Export → Copy link

To sync automatically, set up a Supabase Edge Function (cron job) that:
1. Fetches both iCal URLs every 15 minutes
2. Parses bookings using the `ical.js` library
3. Upserts into your `bookings` table with `source: 'airbnb'` or `'booking_com'`

---

## Adding more properties

1. Go to Supabase → Table Editor → `properties` → Insert row
2. Add the new property name and address
3. The dropdowns in all forms will automatically include it

## Adding staff

1. Supabase → Table Editor → `staff` → Insert row
2. Fill name, designation, property
3. Supabase → Authentication → Invite user (their email)

---

## Tech stack

- **Frontend:** Vanilla HTML + CSS + ES Modules (no build step needed)
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Charts:** Chart.js (CDN)
- **Fonts:** Playfair Display + DM Sans (Google Fonts)
- **Hosting:** Any static host (Vercel, Netlify, Supabase Storage)

## Cost

| Service | Free tier | Paid |
|---------|-----------|------|
| Supabase | 500MB DB, 1GB storage, 50k monthly active users | $25/month for more |
| Vercel hosting | Free forever for this size | — |
| Total | **₹0/month to start** | ~₹2,000/month at scale |
