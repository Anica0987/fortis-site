# Fortis — plain HTML/CSS/JS version

This is a straight port of the React app you had — same design, same Supabase backend,
same features — rewritten so it runs as static files with no build step. Just drop these
files into your existing repo.

## Files
- `index.html` — the page shell
- `styles.css` — all styling (colors, fonts, layout)
- `app.js` — all app logic (landing page, login, dashboard, orders, waybills, quotes)
- `data.js` — small helpers + Supabase read/write functions
- `supabaseClient.js` — creates the Supabase connection
- `config.js` — **you need to edit this one**

## Setup (2 steps)

### 1. Add your Supabase keys
Open `config.js` and replace the placeholders with your real values, from your
Supabase dashboard → **Settings → API**:

```js
export const SUPABASE_URL = "https://xxxxx.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJI...";
```

The anon/public key is safe to put in client-side code — that's what it's designed for.

### 2. Keep your existing assets
This assumes your repo already has, at the same paths the original app used:
- `logo.png`
- `fortis-hero.mp4` and `fortis-hero-poster.jpg` (landing page video background)

If your file names/paths differ, update the references in `app.js` (search for
`LOGO_SRC`) and in the `<video>`/`<source>` tags inside `renderLanding()`.

## What's assumed already set up in Supabase
Since you mentioned you'd already done Supabase work, this expects:
- A table called **`app_state`** with columns `key` (text, primary key) and `value` (jsonb)
- A storage bucket called **`fortis-docs`** for uploaded documents
- Email/password auth enabled (Authentication → Providers → Email)

If any of those don't exist yet, create them in the Supabase dashboard before testing.

## Deploying
Since there's no build step, you can push these files straight to GitHub and serve them
however you already serve your site (GitHub Pages, Netlify, etc.) — no `npm install`,
no build command needed.

## Note on structure
This isn't React under the hood — it's a small hand-rolled system: one `state` object,
a `render()` function that rebuilds the page from it, and plain `addEventListener` calls
wired up after each render. That's normal for vanilla JS apps of this size and is easy to
extend: to add a field, add it to the relevant `render...()` template string and read its
value in the matching `bind...()` function.
