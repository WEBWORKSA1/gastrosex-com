# Gastrosex.com — Cook to impress

Date-night recipes, menus, guides and planning tools for anyone who cooks to impress. A static site served by GitHub Pages (free plan) from the `main` branch. `build.py` generates Jekyll sources (pages with front matter, `_layouts/`, `_data/`); GitHub Pages' built-in Jekyll turns them into the final HTML. No server, no workflow needed to publish.

## What's inside
- **20 recipes for two** (`content/recipes.py`) with scaling, cook mode, timers, pairings, plating notes and Recipe schema.
- **13 guides** (`content/guides.py`), **14 curated videos** (`content/videos.py`).
- **5 tools**: Date-Night Menu Builder, Dinner Timeline, Drink Pairing Finder, Host Quiz, Kitchen Converter (`assets/js/tools.js`).
- **Lead generation**: `plan.html` (3-step private chef / cooking class / custom menu request), `partners.html` (B2B), newsletter + Playbook lead magnet, quiz and menu-builder email capture.
- **Revenue pages**: `support.html` (donations), `contests.html` (monthly contest), `careers.html`, `advertise.html`.
- **Legal**: privacy (AdSense cookies), terms, editorial policy, disclaimer with trademark and copyright disclosures.
- Owner bar on every page linking to https://web.works/contact.

## Edit and rebuild
```
python3 build.py              # regenerate Jekyll pages, _data, search index and sitemap
python3 build.py --preview    # also render the finished site into _site/ (pip install python-liquid)
```
The generator (`build.py`, `content/`, `scripts/`, `ops/`) ships in `gastrosex-source.zip`; upload it to the repo root (Add file → Upload files) to rebuild here or run the weekly workflow. Edit content in `content/*.py`, styles in `assets/css/site.css`, behaviour in `assets/js/`. Shared header, footer and owner bar: `_layouts/default.html`; recipe page template: `_layouts/recipe.html` with one data file per recipe in `_data/recipes/`. You can also edit any generated page directly. The build fails if any file contains a plain email address.

## Publishing on GitHub Pages
Settings → Pages → Build and deployment → **Deploy from a branch** → `main` / `(root)` → Save. Pages builds with Jekyll automatically (do not add a `.nojekyll` file). Live at `https://webworksa1.github.io/gastrosex-com/`.

### Custom domain
1. DNS for gastrosex.com: A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; CNAME `www` → `webworksa1.github.io`.
2. Settings → Pages → Custom domain: `gastrosex.com`, then tick **Enforce HTTPS**. Do this only after DNS points to GitHub.

## Forms
Every form posts to FormSubmit's AJAX endpoint. The destination inbox is never written in page code: `assets/js/config.js` holds it encoded and it is decoded only at send time. The first submission triggers a one-time FormSubmit activation email; click **Activate Form**. FormSubmit then provides a random alias: paste it into `formAlias` in `config.js` and delete the `k` value.

## Donations
Add PayPal.me / Stripe Payment Link / Buy Me a Coffee / Ko-fi URLs to `payments` in `assets/js/config.js`; buttons appear on `support.html` automatically. Until then the page runs in pledge mode (the reader leaves details and gets a payment link by email).

## Contest
Monthly themes and prizes live in `CONTEST` in `build.py`. The theme and countdown rotate automatically each month. Prizes listed: $100 cookware gift card, $50 gift card, and a feature. Edit them if you change the prize budget.

## AdSense
The Auto ads tag (`ca-pub-6620975821265271`) is in every page `<head>` and `ads.txt` is at the root. Apply once `https://gastrosex.com/ads.txt` resolves. After approval: enable Auto ads, turn on the Google consent message (EEA/UK/CH), and exclude `/plan.html` and `/thank-you.html` from Auto ads.

## Automation
`ops/workflows/refresh.yml` is the weekly refresh workflow. GitHub only lets the repo owner add workflow files, so install it once, after uploading the generator: on GitHub, Add file → Create new file → name it `.github/workflows/refresh.yml` and paste the contents. It then runs every Monday (and on demand): refreshes family-safe food headlines (`scripts/fetch_news.py`), rebuilds every page with the new week's featured menu and contest dates, commits to `main`, and asks Pages to redeploy. Client-side, the menu card, occasion countdown and contest countdown update daily.

## Docs
- `PROMPTS.md`: the phase-wise build prompts.
- `RESEARCH.md`: concept, risks, revenue model and the 39-site benchmark audit.

## Trademark and copyright
"Gastrosex"/"gastrosexual" are used descriptively; no exclusive rights are claimed. Original content © Gastrosex.com. Fonts: Bodoni Moda and Figtree (SIL Open Font License), served by Google Fonts. Embedded videos belong to their creators.
