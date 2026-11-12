# Gastrosex.com — Phase-wise Build Prompts

A complete, reusable prompt sequence to build, launch and grow Gastrosex.com. Run the phases in order; each prompt is self-contained and can be pasted into an AI coding assistant. Phases 0–11 produced the site in this repository; Phase 12 is the post-launch growth plan.

> **Private values.** The owner's inbox address is deliberately not written anywhere in this repository (the build fails if a plain address appears in any file). Supply it privately when you run Phase 6, and store it only in encoded or aliased form.

---

## Phase 0 — Concept and business model

```
You are a digital-media strategist. Domain: Gastrosex.com ("gastrosex" = short for "gastrosexual",
a 2008 consumer-research term from the Future Foundation for people who cook to impress others).

Define the single most profitable, AdSense-safe website concept for this domain.
Constraints:
- Content must be 100% family-friendly food content (Google AdSense prohibits sexual content; the word
  "sex" in the domain raises review risk, so the content must remove all ambiguity).
- Monetisation stack: Google AdSense now (ca-pub-6620975821265271), premium ad network later
  (Mediavine at 50k sessions/month, Raptive at 100k pageviews), lead generation, newsletter sponsorships,
  reader support, sponsored contests and partner listings.
Deliver: positioning statement, audience, top-of-funnel search intents, revenue model with RPM ranges and
lead values, the main risks and how to mitigate them, and a one-line tagline.
```

**Decision taken:** *Gastrosex — Cook to impress.* A date-night and cook-to-impress food hub: recipes for two, full-evening menu planning, technique guides, and a lead funnel that sells private-chef, couples-cooking-class and custom-menu requests to providers.

---

## Phase 1 — Competitive research (35+ sites)

```
Audit at least 35 world-class sites in recipes, cooking education, date-night planning, drinks pairing,
private-chef/cooking-class marketplaces and relationship content. For each record: navigation, content
types, interactive tools, forms and calls to action, lead magnets, monetisation, community and trust
features, and distinctive design traits. Then produce a feature matrix: which features to copy, which to
improve, and which nobody offers for the "cooking to impress someone" niche. Save as RESEARCH.md.
```

Output: see `RESEARCH.md` (39 sites audited).

---

## Phase 2 — Brand and design system

```
Create a distinctive design system for Gastrosex.com that avoids generic AI-template looks.
Subject: an evening dinner for two at home. Signature element: the printed menu card.
- Palette: deep plum ink (#2b1631), mauve-linen background (#f4eef2), menu-card paper (#fffcfa),
  saffron accent (#e3a008), pomegranate (#a3203a) and herb green (#3f6b4c) used sparingly.
- Type: Bodoni Moda (display, optical sizes, italic for course labels) + Figtree (UI and body),
  both SIL OFL, loaded from Google Fonts (self-host later if you prefer zero third-party requests).
- Signature patterns: a "Tonight's menu" card in the hero that can be shuffled; recipe indexes laid out
  like a restaurant menu with dotted leaders to the cooking time; a "Lights down" dark mode.
- One motion moment only (menu-card shuffle); respect prefers-reduced-motion; visible focus states;
  WCAG AA contrast; responsive down to 360px.
Deliver tokens, component specs and a CSS file.
```

---

## Phase 3 — Information architecture

```
Build the page map for a static site (GitHub Pages, no server):
Home; Recipes index (filter by course, diet, skill, time); 20 recipe pages; Guides index; 13 guide pages;
Tools index + 5 tools (Menu Builder, Dinner Timeline, Pairing Finder, Host Quiz, Converter);
Videos; Plan my date night (lead funnel); For chefs & cooking schools (B2B lead funnel); Playbook
(lead magnet, noindex); Saved; Search; Support (donations); Contests; Careers; Advertise; About;
Editorial policy; Contact; Privacy; Terms; Disclaimer & trademark; HTML sitemap; Thank-you; 404.
Global elements on EVERY page:
1. A top bar: "Contact, if you are interested in this website / domain name / Sponsorship /
   Advertisement / Partnership" linking to https://web.works/contact
2. Header: logo, nav, "Plan my date night" CTA, search, saved, dark-mode toggle.
3. Footer: lead-magnet signup, link columns, trademark/copyright notice, owner-contact link.
4. Cookie notice with "Essential only" (non-personalised ads) and "Accept all".
```

---

## Phase 4 — Content and AdSense compliance

```
Write original, genuinely useful content (no AI filler, no scraped text):
- 20 recipes for two: starters, mains, sides, desserts, brunch, a zero-proof drink. Each with metric and
  US amounts, total and hands-on time, skill, cost estimate, intro, "why it impresses", scalable
  ingredients, numbered method with in-step timers, tips, make-ahead plan, plating, wine AND zero-proof
  pairing, FAQ, related recipes, and an optional embedded YouTube video credited to its channel.
- 13 long-form guides: what a gastrosexual is (with sources), first-date dinner at home, reverse
  timeline, plating, wine pairing, "romantic" foods myth vs science, cooking together, $25 date night,
  setting the scene, kitchen tools, steak doneness (USDA note), celebration menus, dietary needs.
AdSense checklist: family-safe wording and imagery only; no thin pages; About, Contact, Privacy (with
Google advertising-cookie disclosure and opt-out links), Terms, Editorial policy; clear navigation;
ads.txt; no ads encouraged on thank-you or form pages; no misleading buttons; alcohol content limited to
pairings with an age note and zero-proof alternatives; no health claims.
```

---

## Phase 5 — Interactive tools

```
Build five dependency-free JavaScript tools fed by a generated recipes.json:
1. Date-Night Menu Builder: occasion, mood, diet, skill, budget, serve time, courses -> scored menu
   card with per-course Swap, combined shopping list, reverse timeline, drink pairings, scene tips,
   Print, Save (localStorage), "Have a chef cook this" (prefills the lead form) and "Email me this menu"
   (lead capture with an autoresponse that sends the menu to the user).
2. Dinner Timeline Planner: pick dishes + serve time -> minute-by-minute plan, custom tasks, print/copy.
3. Drink Pairing Finder: dish + sauce -> wine, beer/cider and zero-proof with reasons.
4. "What kind of cook-to-impress host are you?" quiz: 8 questions -> 5 profiles, recipes, shareable
   result, email capture.
5. Kitchen Converter: volume/weight by ingredient, oven temperatures with gas marks, recipe scaler,
   steak doneness chart.
Recipe pages also get: servings scaler, ingredient checklist, copy shopping list, cook mode (Wake Lock,
step highlighting), step timers with sound/vibration, print, share and save.
```

---

## Phase 6 — Lead generation (highest priority after content)

```
Build a dedicated, high-converting lead system. All submissions go to the owner's inbox through
FormSubmit's AJAX endpoint. The inbox address must NEVER appear in page source: store it encoded in
assets/js/config.js and decode only at send time; after activation, replace it with FormSubmit's random
alias string (config.formAlias) and remove the encoded key.
Funnels:
- "Plan my date night": 3-step form (service type -> date, city, guests, budget per person, cuisine,
  diet, notes -> name, email, phone, contact preference, consent, newsletter opt-in) with progress bar,
  URL prefill, and a home-page mini form that hands off to it.
- In-context CTAs on every recipe ("Want a chef to cook it for you?") and in the Menu Builder.
- Lead magnet: "Date-Night Playbook" (12 menus for two) delivered on the thank-you page and by
  autoresponse after newsletter signup.
- B2B: "For chefs & cooking schools" application form (supply side for selling leads).
Every form: honeypot, consent checkbox, inline success/error state, thank-you page per form type.
```

---

## Phase 7 — Support, contests, hiring and advertising

```
- Support page: one-time/monthly toggle, five tiers ($5–$250) mapped to purposes (operations, hiring
  talent, promotion/marketing, contests & prizes), allocation bars, a pledge form that works with no
  payment provider, and payment buttons that appear automatically when PayPal/Stripe/Buy Me a Coffee/
  Ko-fi links are added to config.js. State clearly that support is not tax-deductible.
- Contests: monthly "Plate to Impress" theme (auto-rotates by month), prizes, judging criteria,
  live countdown to month end, entry form (photo link, story, 18+ and rules consent), full official
  rules (no purchase necessary, eligibility, licence to publish, privacy), past-winners area.
- Careers: six freelance roles and an application form.
- Advertise: sponsored recipes, newsletter, tool sponsorship, contest prizes, partner listings, and
  "Buy this website or domain" linking to web.works/contact; inquiry form.
```

---

## Phase 8 — Legal, trademark and copyright

```
Write Privacy (AdSense cookies, Google opt-out links, FormSubmit processor, localStorage, YouTube
privacy-enhanced embeds, GDPR/CCPA rights, children), Terms, Editorial policy and a Disclaimer page with:
- Trademark disclosure: "gastrosex"/"gastrosexual" used descriptively; no exclusive rights claimed; not
  affiliated with the original research authors/sponsor or any business using similar words; contact
  route for rights holders.
- Copyright disclosure: original text (c) Gastrosex.com; embedded videos remain their creators'; third-
  party names belong to their owners; OFL fonts credited; takedown process.
- Advertising/affiliate and health disclaimers.
Add a short trademark/copyright notice in the footer of every page.
```

---

## Phase 9 — SEO, structured data, performance, accessibility

```
- Unique title/description per page, canonical URLs on the production domain, Open Graph + Twitter
  cards; social sharing uses the page title and description (no per-recipe images until photography exists).
- JSON-LD: Organization, WebSite + SearchAction, Recipe (ingredients, HowToStep instructions with
  anchors, times, yield, diet), FAQPage, BreadcrumbList, Article, ItemList, WebApplication.
- sitemap.xml, robots.txt, HTML sitemap, internal linking between recipes/guides/tools.
- Font preconnect, lazy YouTube facades (no iframe until play), no frameworks; Jekyll layouts so the
  shared chrome lives in one file and recipe pages render from per-recipe files in _data/recipes/.
- Skip link, landmarks, labelled controls, keyboard-operable everything, reduced-motion support.
```

---

## Phase 10 — Automation ("self-updating")

```
Make the site update itself without a server:
- Client-side: today's date on the menu card, shuffleable menus, next-occasion countdown (Valentine's,
  Christmas Eve, New Year's Eve, or the visitor's saved anniversary), contest theme and countdown by
  month, saved recipes and menus.
- Weekly GitHub Action (ops/workflows/refresh.yml, installed by the owner at .github/workflows/): fetch family-safe food headlines (title,
  source and link only), rebuild every page with the new week's featured menu, contest dates and sitemap
  lastmod, commit to main, and request a Pages rebuild.
- build.py guard: abort if any file contains a plain email address.
```

---

## Phase 11 — Deploy and apply for AdSense

```
1. Push the repo to github.com/WEBWORKSA1/gastrosex-com, branch main.
2. Settings -> Pages -> Deploy from a branch -> main / (root). Site: https://webworksa1.github.io/gastrosex-com/
3. DNS for gastrosex.com: A records 185.199.108.153, 185.199.109.153, 185.199.110.153,
   185.199.111.153 and CNAME www -> webworksa1.github.io. Then Settings -> Pages -> Custom domain
   gastrosex.com and Enforce HTTPS.
4. Activate the form inbox (first submission triggers a FormSubmit activation email), then paste the
   alias into config.js.
5. Verify https://gastrosex.com/ads.txt, then add the site in AdSense, keep the auto-ads code in <head>,
   turn on the Google consent message for EEA/UK/CH, and exclude /plan.html and /thank-you.html from
   Auto ads.
6. Submit sitemap.xml in Google Search Console.
```

---

## Phase 12 — Growth plan (first 90 days)

```
Weeks 1–4: publish 2 recipes + 1 guide a week, target long-tail queries ("romantic dinner for two
ideas", "anniversary dinner at home", "first date dinner recipes", "date night pasta"); pitch the
Menu Builder to food newsletters; start Pinterest boards per menu.
Weeks 5–8: recruit 10 founding chef/cooking-school partners in 3 cities; join Cozymeal/Take a Chef style
affiliate programmes as the fallback for unmatched leads; launch the first sponsored contest prize.
Weeks 9–12: Valentine's push (landing page, menu packs, gift guide), short-form videos for every recipe,
apply to Mediavine at 50k sessions/month.
KPIs: sessions, newsletter signups, plan-request conversion rate, leads accepted by partners, RPM.
```
