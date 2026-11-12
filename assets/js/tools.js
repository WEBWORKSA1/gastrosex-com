/* Gastrosex.com — interactive tools */
(function () {
  "use strict";
  var GS = window.GS, $ = GS.$, $$ = GS.$$, R = GS.root;
  var tool = ($("[data-tool]") || {}).getAttribute && $("[data-tool]").getAttribute("data-tool");
  var params = new URLSearchParams(location.search);
  var esc = function (s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; };

  /* ---------- shared timeline maths ---------- */
  var SERVE_OFFSET = { drink: -45, starter: -25, side: 0, main: 0, brunch: 0, dessert: 45 };
  function clock(base, mins) {
    var d = new Date(base.getTime() + mins * 60000);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  function buildTimeline(recipes, serveStr, extra) {
    var p = (serveStr || "20:00").split(":"), base = new Date(); base.setHours(+p[0], +p[1], 0, 0);
    var tasks = [];
    recipes.forEach(function (r) {
      var serve = SERVE_OFFSET[r.course] || 0, start = serve - r.total - (r.chill || 0), hands = serve - r.active;
      if (r.chill && start < -360) tasks.push({ t: -100000 + start, label: "The day before or this morning", what: "Make " + r.title + " (chill " + Math.round(r.chill / 60) + " hr or more)." });
      else tasks.push({ t: start, what: "Start " + r.title + "." });
      if (!r.chill && r.total - r.active >= 10) tasks.push({ t: hands, what: "Hands-on time for " + r.title + " (" + r.active + " min)." });
      tasks.push({ t: serve, what: "Serve " + r.title + ".", serve: true });
    });
    tasks.push({ t: -180, what: "Shop for anything missing, chill the drinks and set the table." });
    tasks.push({ t: -55, what: "Tidy the kitchen, light the candles, start the playlist." });
    (extra || []).forEach(function (x) { tasks.push(x); });
    tasks.sort(function (a, b) { return a.t - b.t; });
    return tasks.map(function (x) { return { time: x.label || clock(base, x.t), what: x.what, serve: !!x.serve }; });
  }
  function renderTimeline(el, rows) {
    el.innerHTML = rows.map(function (r) { return '<li' + (r.serve ? ' class="serve"' : "") + "><time>" + esc(r.time) + "</time><span>" + esc(r.what) + "</span></li>"; }).join("");
  }

  /* ---------- 1. menu builder ---------- */
  if (tool === "date-night-menu-builder") GS.getJSON("recipes.json").then(function (ALL) {
    var form = $("[data-builder-form]"), card = $("[data-out-card]"), extra = $("[data-out-extra]");
    var BY = {}; ALL.forEach(function (r) { BY[r.slug] = r; });
    var SKILL = { easy: 1, medium: 2, advanced: 3 };
    var OCC = {
      "first-date": { name: "a first date at home", want: ["classic"], scene: "Keep it relaxed: lamps instead of overhead lights, a playlist you both might like at conversation volume, and a seat for your guest near the kitchen so you can talk while you finish cooking." },
      "anniversary": { name: "your anniversary", want: ["fancy"], scene: "Bring out the good glasses and cloth napkins. Low unscented candles, a printed menu on each plate, and the playlist from the year you met." },
      "valentines": { name: "Valentine's Day", want: ["fancy", "classic"], scene: "Warm, low light and a small bunch of unscented flowers. Put the phones in another room and serve dessert somewhere different, like the sofa." },
      "birthday": { name: "a birthday", want: ["playful"], scene: "Make it a celebration: a candle in the dessert, their favorite album, and a toast before the first course." },
      "just-because": { name: "a night in", want: [], scene: "Small effort, big effect: clear the table, light a candle and cook something you both love. Cook together if you can." },
      "brunch": { name: "a weekend brunch", want: ["cozy"], scene: "Open the curtains, put the coffee on early and serve everything family-style in the middle of the table." }
    };
    function fits(r, f) {
      var ok = f.diets.every(function (d) {
        if (d === "vegetarian") return r.diets.indexOf("vegetarian") > -1 || r.diets.indexOf("vegan") > -1;
        if (d === "pescatarian") return ["pescatarian", "vegetarian", "vegan"].some(function (x) { return r.diets.indexOf(x) > -1; });
        return r.diets.indexOf(d) > -1;
      });
      return ok && SKILL[r.skill] <= SKILL[f.skill];
    }
    function score(r, f) {
      var s = Math.random() * 1.6;
      if (r.vibes.indexOf(f.vibe) > -1) s += 3;
      OCC[f.occasion].want.forEach(function (v) { if (r.vibes.indexOf(v) > -1) s += 1.2; });
      if (f.skill === "advanced" && r.skill !== "easy") s += 1;
      if (f.occasion === "first-date" && r.course === "dessert" && r.chill) s += 1.5;
      if (f.budget === 1) s -= r.cost * 1.2;
      if (f.budget === 3 && r.cost === 3) s += 1.5;
      return s;
    }
    function read() {
      var fd = new FormData(form);
      return { occasion: fd.get("occasion"), vibe: fd.get("vibe"), diets: fd.getAll("diet"), skill: fd.get("skill"), budget: Number(fd.get("budget")), serve: fd.get("serve"), courses: fd.getAll("course") };
    }
    var current = {}; // course -> slug
    function pick(course, f, not) {
      var pool = ALL.filter(function (r) { return r.course === course && r.slug !== not && fits(r, f); });
      if (!pool.length) pool = ALL.filter(function (r) { return r.course === course && r.slug !== not && SKILL[r.skill] <= SKILL[f.skill]; }).filter(function (r) { return fits(r, { diets: f.diets, skill: "advanced" }); });
      if (!pool.length) return null;
      pool.sort(function (a, b) { return score(b, f) - score(a, f); });
      return pool[0];
    }
    function order(f) {
      var mainC = f.occasion === "brunch" ? "brunch" : "main";
      var list = ["drink", "starter", mainC, "side", "dessert"].filter(function (c) { return c === mainC || f.courses.indexOf(c) > -1; });
      if (f.occasion === "brunch") list = list.filter(function (c) { return c !== "starter" && c !== "side"; });
      return list;
    }
    function build(keep) {
      var f = read(), courses = order(f), next = {};
      courses.forEach(function (c) { next[c] = keep && current[c] && BY[current[c]] && fits(BY[current[c]], f) ? current[c] : (pick(c, f) || {}).slug; });
      if (f.budget === 1) {
        var total = function () { return courses.reduce(function (t, c) { return t + (next[c] ? BY[next[c]].cost_usd : 0); }, 0); };
        var guard = 0;
        while (total() > 30 && guard++ < 6) {
          var priciest = courses.filter(function (c) { return next[c]; }).sort(function (a, b) { return BY[next[b]].cost_usd - BY[next[a]].cost_usd; })[0];
          var cheaper = ALL.filter(function (r) { return r.course === priciest && fits(r, f) && r.cost_usd < BY[next[priciest]].cost_usd; }).sort(function (a, b) { return a.cost_usd - b.cost_usd; })[0];
          if (!cheaper) break; next[priciest] = cheaper.slug;
        }
      }
      current = next; render(f, courses);
    }
    var LABEL = { drink: "To welcome", starter: "To start", main: "The main", brunch: "The main", side: "On the side", dessert: "To finish" };
    function render(f, courses) {
      var rs = courses.map(function (c) { return current[c] ? BY[current[c]] : null; });
      var missing = courses.filter(function (c, i) { return !rs[i]; });
      var cost = rs.reduce(function (t, r) { return t + (r ? r.cost_usd : 0); }, 0);
      var html = '<p class="mc-head">A menu for ' + esc(OCC[f.occasion].name) + '</p><p class="mc-date">Serves two, about $' + cost + ' in groceries</p><ol class="mc-list dealing">';
      courses.forEach(function (c, i) {
        var r = rs[i];
        html += "<li><span class=\"mc-course\">" + LABEL[c] + "</span>" + (r ? '<a class="mc-dish" href="' + R + r.url + '">' + esc(r.title) + '</a><button class="swap" type="button" data-swap="' + c + '" aria-label="Swap ' + LABEL[c].toLowerCase() + '">Swap</button><span class="mc-meta">' + r.total + " min, " + r.skill + "</span>" : '<span class="muted">No recipe fits these filters yet</span>') + "</li>";
      });
      html += '</ol><p class="mc-serve">Dinner is served at ' + esc(clockLabel(f.serve)) + "</p>";
      if (missing.length) html += '<p class="muted small">Try relaxing a dietary filter or the skill level to fill every course.</p>';
      card.innerHTML = html; extra.hidden = false;
      $$("[data-swap]", card).forEach(function (b) { b.addEventListener("click", function () { var c = b.getAttribute("data-swap"), r = pick(c, read(), current[c]); if (r) { current[c] = r.slug; render(read(), order(read())); } }); });
      var real = rs.filter(Boolean);
      // shopping list
      var shop = $("[data-out-shop]"), lines = [];
      shop.innerHTML = real.map(function (r) {
        lines.push(r.title.toUpperCase());
        return '<li class="shop-r">' + esc(r.title) + "</li>" + r.ings.map(function (i) { lines.push("- " + (i.a ? i.a + " " : "") + i.i); return "<li>" + (i.a ? "<b>" + esc(i.a) + "</b> " : "") + esc(i.i) + "</li>"; }).join("");
      }).join("");
      shop.dataset.text = lines.join("\n");
      // timeline
      var tl = buildTimeline(real, f.serve);
      renderTimeline($("[data-out-timeline]"), tl);
      // drinks
      var main = real.filter(function (r) { return r.course === "main" || r.course === "brunch"; })[0], des = real.filter(function (r) { return r.course === "dessert"; })[0], drink = real.filter(function (r) { return r.course === "drink"; })[0];
      var dh = "";
      if (drink) dh += "<p><strong>Welcome:</strong> " + esc(drink.title) + ", zero-proof by default.</p>";
      if (main) dh += "<p><strong>With the main:</strong> " + esc(main.pairing.wine) + " <em>Zero-proof:</em> " + esc(main.pairing.zero) + "</p>";
      if (des) dh += "<p><strong>With dessert:</strong> " + esc(des.pairing.wine) + " <em>Zero-proof:</em> " + esc(des.pairing.zero) + "</p>";
      $("[data-out-drinks]").innerHTML = dh;
      $("[data-out-scene]").textContent = OCC[f.occasion].scene;
      var names = real.map(function (r) { return r.title; });
      $("[data-chef-link]").href = R + "plan.html?want=private-chef&notes=" + encodeURIComponent("I'd love a chef to cook this menu: " + names.join(", ") + ".");
      var summary = "Your Gastrosex.com menu for " + OCC[f.occasion].name + ":\n" + real.map(function (r) { return "- " + r.title + ": " + location.origin + location.pathname.replace(/tools\/[^/]*$/, "") + r.url; }).join("\n") +
        "\n\nTIMELINE (serve at " + clockLabel(f.serve) + ")\n" + tl.map(function (t) { return t.time + "  " + t.what; }).join("\n") + "\n\nSHOPPING LIST\n" + lines.join("\n");
      $("[data-menu-field]").value = summary;
      $("[data-auto-field]").value = summary + "\n\nCook to impress!\nGastrosex.com";
      var u = new URL(location.href); u.searchParams.set("menu", courses.map(function (c) { return current[c] || ""; }).join(",")); history.replaceState(null, "", u);
    }
    function clockLabel(s) { var p = (s || "20:00").split(":"), d = new Date(); d.setHours(+p[0], +p[1], 0, 0); return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
    form.addEventListener("submit", function (ev) { ev.preventDefault(); build(false); $("[data-builder-out]").scrollIntoView({ behavior: "smooth", block: "start" }); });
    $("[data-copy-shop]").addEventListener("click", function () { GS.copy($("[data-out-shop]").dataset.text || ""); });
    $("[data-save-menu]").addEventListener("click", function () {
      var m = GS.store.get("gs-menus", []), f = read();
      m.unshift({ name: "Menu for " + OCC[f.occasion].name + ", saved " + new Date().toLocaleDateString(), slugs: order(f).map(function (c) { return current[c]; }).filter(Boolean) });
      GS.store.set("gs-menus", m.slice(0, 20)); GS.toast("Menu saved. Find it under Saved.");
      $$("[data-saved-count]").forEach(function (el) { el.hidden = false; el.textContent = Number(el.textContent || 0) + 1; });
    });
    // prefill from URL: ?menu=a,b,c  or ?main=slug
    var pm = params.get("menu"), mn = params.get("main");
    if (pm) {
      pm.split(",").forEach(function (s) { var r = BY[s]; if (!r) return; current[r.course] = s; var cb = form.querySelector('input[name="course"][value="' + r.course + '"]'); if (cb) cb.checked = true; if (r.course === "brunch") form.elements.occasion.value = "brunch"; });
      render(read(), order(read()));
    } else if (mn && BY[mn]) {
      current[BY[mn].course] = mn; if (BY[mn].course === "brunch") form.elements.occasion.value = "brunch"; build(true);
    }
  });

  /* ---------- 2. timeline planner ---------- */
  if (tool === "dinner-timeline") GS.getJSON("recipes.json").then(function (ALL) {
    var form = $("[data-timeline-form]"), out = $("[data-timeline-out]"), BY = {};
    ALL.forEach(function (r) { BY[r.slug] = r; });
    (params.get("r") || "").split(",").forEach(function (s) { var cb = form.querySelector('input[name="r"][value="' + s + '"]'); if (cb) cb.checked = true; });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fd = new FormData(form), picks = fd.getAll("r").map(function (s) { return BY[s]; });
      if (!picks.length) { out.innerHTML = '<p class="form-msg err">Pick at least one dish.</p>'; return; }
      var extra = [];
      if (fd.get("custom")) extra.push({ t: -Number(fd.get("custom_min") || 0), what: fd.get("custom") });
      var rows = buildTimeline(picks, fd.get("serve"), extra);
      out.innerHTML = '<h2>Your timeline</h2><ol class="tline"></ol><div class="out-actions" style="margin-top:1rem"><button class="btn btn-ghost btn-sm" type="button" data-print>Print</button><button class="btn btn-ghost btn-sm" type="button" data-copy-tl>Copy</button></div>';
      renderTimeline($(".tline", out), rows);
      $("[data-print]", out).addEventListener("click", function () { window.print(); });
      $("[data-copy-tl]", out).addEventListener("click", function () { GS.copy(rows.map(function (r) { return r.time + "  " + r.what; }).join("\n")); });
    });
    if (params.get("r")) form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit"));
  });

  /* ---------- 3. pairing finder ---------- */
  if (tool === "pairing-finder") {
    var P = {
      "red-meat": { wine: ["Cabernet Sauvignon, Malbec or Syrah", "Tannin softens against protein and fat."], beer: ["Porter or a malty amber ale", "Roasty malt echoes the char of a good sear."], zero: ["Sparkling tart-cherry juice with rosemary", "Tart and slightly bitter, it cuts the richness like a red wine would."], recipe: "pan-seared-ribeye-red-wine-sauce" },
      "poultry": { wine: ["Pinot Grigio, Vermentino or a light Pinot Noir", "Medium weight that won't overpower chicken."], beer: ["Saison or a crisp pilsner", "Peppery, dry and refreshing."], zero: ["Lemon-thyme spritz", "Bright acidity mirrors a lemony pan sauce."], recipe: "chicken-piccata" },
      "shellfish": { wine: ["Chablis, Albariño or Champagne", "Crisp acidity and minerality love sweet shellfish."], beer: ["Witbier or Belgian blonde", "Citrus and spice flatter seafood."], zero: ["Soda water with lemon peel and thyme", "Clean and saline-friendly."], recipe: "seared-scallops-lemon-brown-butter" },
      "salmon": { wine: ["Pinot Noir or Sauvignon Blanc", "Salmon is rich enough for a light red."], beer: ["Kölsch or pale ale", "Gentle bitterness balances oily fish."], zero: ["Cucumber-mint cooler", "Fresh and herbal."], recipe: "lemon-herb-salmon-en-papillote" },
      "white-fish": { wine: ["Sauvignon Blanc, Muscadet or Vinho Verde", "Light and zesty for delicate fish."], beer: ["Pilsner or lager", "Clean and crisp."], zero: ["Sparkling water with grapefruit", "A little bitterness, lots of freshness."], recipe: "lemon-herb-salmon-en-papillote" },
      "mushroom": { wine: ["Pinot Noir or lightly oaked Chardonnay", "Earthy notes meet earthy mushrooms."], beer: ["Brown ale or dubbel", "Nutty malt complements umami."], zero: ["Chilled Earl Grey with lemon", "Tannic, aromatic and food-friendly."], recipe: "creamy-mushroom-risotto" },
      "pasta-tomato": { wine: ["Chianti, Sangiovese or Barbera", "High acidity matches tomato."], beer: ["Italian pilsner", "Crisp and simple."], zero: ["Blood-orange soda", "Bittersweet citrus loves tomato."], recipe: "spaghetti-aglio-e-olio" },
      "pasta-butter": { wine: ["Soave, Chardonnay or Barbera", "Roundness to match butter and cheese."], beer: ["Belgian blonde", "Soft body, gentle fruit."], zero: ["Sparkling apple juice with sage", "Apple and sage flatter brown butter."], recipe: "handmade-tagliatelle-brown-butter-sage" },
      "spicy": { wine: ["Off-dry Riesling or Gewürztraminer", "A touch of sweetness tames heat; high alcohol makes it hotter."], beer: ["Wheat beer or lager", "Cold, light and low in bitterness."], zero: ["Iced lemongrass-ginger tea", "Cooling and aromatic."], recipe: "thai-green-curry-shrimp" },
      "cheese": { wine: ["Champagne, Pinot Noir or tawny port", "Bubbles for soft cheeses, port for blue."], beer: ["Belgian tripel", "Fruity and strong enough for aged cheese."], zero: ["Dry sparkling cider-style apple juice", "Apple is cheese's oldest friend."], recipe: "burrata-blistered-tomatoes-basil-oil" },
      "chocolate": { wine: ["Ruby port or Banyuls", "Must be sweeter than the dessert."], beer: ["Imperial stout", "Coffee and cocoa notes."], zero: ["Espresso or salted hot chocolate", "Bitter against sweet."], recipe: "molten-chocolate-lava-cakes" },
      "fruit-dessert": { wine: ["Moscato d'Asti or Sauternes", "Gentle sweetness and lively acidity."], beer: ["Fruit lambic", "Tart and festive."], zero: ["Chamomile tea with honey", "Floral and soothing."], recipe: "creme-brulee-for-two" }
    };
    var SAUCE = { none: "", rich: " With a rich, buttery sauce, lean toward the fuller option or a wine with good acidity to cut through.", bright: " With a lemony or herby sauce, pick the crisper, higher-acid option." };
    var pf = $("[data-pairing-form]"), po = $("[data-pairing-out]");
    function show() {
      var fd = new FormData(pf), p = P[fd.get("dish")], note = SAUCE[fd.get("sauce")];
      po.innerHTML = [["Wine", p.wine], ["Beer or cider", p.beer], ["Zero-proof", p.zero]].map(function (x) {
        return '<div class="pair-card"><h3>' + x[0] + "</h3><p><strong>" + esc(x[1][0]) + "</strong></p><p>" + esc(x[1][1]) + (x[0] === "Wine" ? esc(note) : "") + "</p></div>";
      }).join("") + '<p>Cook it: <a href="' + R + "recipes/" + p.recipe + '.html">our recipe suggestion</a>. Or read the <a href="' + R + 'guides/wine-pairing-for-date-night.html">pairing cheat sheet</a>.</p>';
    }
    pf.addEventListener("change", show); show();
  }

  /* ---------- 4. quiz ---------- */
  if (tool === "cook-to-impress-quiz") {
    var Q = [
      ["It's Friday night and you're cooking for someone special. Your first thought?", [["Something that makes them gasp when it arrives", "show"], ["Something warm and comforting", "cozy"], ["Something they've never tasted before", "explore"], ["A classic I can nail every time", "classic"]]],
      ["Pick a kitchen soundtrack.", [["Big-band jazz", "show"], ["Acoustic and mellow", "cozy"], ["A playlist from my last trip", "explore"], ["Whatever we choose together", "team"]]],
      ["Your signature move?", [["Torching sugar at the table", "show"], ["Slow-cooked anything", "cozy"], ["Hand-made pasta, together", "team"], ["A perfect pan sauce", "classic"]]],
      ["How do you handle the timing?", [["Spreadsheet-level planning", "classic"], ["I cook ahead so I can relax", "cozy"], ["I improvise and it works out", "explore"], ["We cook side by side", "team"]]],
      ["Pick a dessert.", [["Crème brûlée", "show"], ["Warm lava cake", "cozy"], ["Something with chili or spice", "explore"], ["Chocolate strawberries we dip together", "team"]]],
      ["Your ideal table?", [["Candles, cloth napkins, the works", "show"], ["The sofa, a blanket, bowls", "cozy"], ["Lots of small plates to share", "explore"], ["The kitchen counter, mid-cook", "team"]]],
      ["Your guest says they're adventurous. You...", [["Plan a tasting-menu style evening", "show"], ["Still make something soothing", "cozy"], ["Go bold with a cuisine they don't know", "explore"], ["Do a flawless bistro classic", "classic"]]],
      ["What would you love to learn next?", [["Restaurant plating", "show"], ["Braising and soups", "cozy"], ["Thai and Spanish classics", "explore"], ["Making fresh pasta", "team"]]]
    ];
    var RES = {
      show: { n: "The Showstopper", d: "You cook for the moment the plate lands. You love a reveal, a flame and a dramatic finish, and your guests remember it for years.", r: ["seared-scallops-lemon-brown-butter", "pan-seared-ribeye-red-wine-sauce", "creme-brulee-for-two"], g: "plate-like-a-chef" },
      cozy: { n: "The Cozy Host", d: "Your food feels like a hug. You choose warmth over fuss and make people feel completely at home.", r: ["french-onion-soup-for-two", "creamy-mushroom-risotto", "molten-chocolate-lava-cakes"], g: "set-the-scene-table-lighting-music" },
      explore: { n: "The Flavor Explorer", d: "You cook to take someone somewhere new. Spice, travel and surprise are your love language.", r: ["gambas-al-ajillo-garlic-shrimp", "thai-green-curry-shrimp", "shakshuka-for-two"], g: "romantic-foods-myth-vs-science" },
      classic: { n: "The Calm Classicist", d: "You master the classics and execute them perfectly. Reliable, elegant, never flustered.", r: ["chicken-piccata", "lemon-herb-salmon-en-papillote", "tiramisu-cups"], g: "reverse-timeline-dinner-planning" },
      team: { n: "The Kitchen Partner", d: "For you the cooking is the date. You'd rather make pasta side by side than be served anything.", r: ["handmade-tagliatelle-brown-butter-sage", "spaghetti-aglio-e-olio", "chocolate-dipped-strawberries"], g: "cooking-together-as-a-couple" }
    };
    var qs = $("[data-quiz-qs]"), i = 0, ans = [];
    qs.innerHTML = Q.map(function (q, n) {
      return '<li class="quiz-q" data-q="' + n + '"' + (n ? " hidden" : "") + "><h2>" + esc(q[0]) + '</h2><div class="quiz-opts">' + q[1].map(function (o, k) {
        return '<label><input type="radio" name="q' + n + '" value="' + o[1] + '"> ' + esc(o[0]) + "</label>";
      }).join("") + "</div></li>";
    }).join("");
    var prev = $("[data-quiz-prev]"), next = $("[data-quiz-next]"), prog = $("[data-quiz-prog]");
    function step() {
      $$(".quiz-q", qs).forEach(function (li, n) { li.hidden = n !== i; });
      prev.disabled = i === 0; next.textContent = i === Q.length - 1 ? "See my result" : "Next";
      prog.textContent = "Question " + (i + 1) + " of " + Q.length;
    }
    next.addEventListener("click", function () {
      var c = qs.querySelector('input[name="q' + i + '"]:checked');
      if (!c) { GS.toast("Pick an answer to continue"); return; }
      ans[i] = c.value;
      if (i < Q.length - 1) { i++; step(); return; }
      var tally = {}; ans.forEach(function (a) { tally[a] = (tally[a] || 0) + 1; });
      var top = Object.keys(tally).sort(function (a, b) { return tally[b] - tally[a]; })[0], res = RES[top];
      GS.getJSON("recipes.json").then(function (ALL) {
        var BY = {}; ALL.forEach(function (r) { BY[r.slug] = r; });
        var out = $("[data-quiz-result]");
        out.innerHTML = '<div class="menu-card"><p class="mc-head">You are</p><h2>' + res.n + "</h2><p>" + esc(res.d) + "</p><h3>Cook these next</h3><ul>" +
          res.r.map(function (s) { return '<li><a href="' + R + BY[s].url + '">' + esc(BY[s].title) + "</a></li>"; }).join("") +
          '</ul><p>Read next: <a href="' + R + "guides/" + res.g + '.html">our guide for your style</a>.</p><div class="out-actions"><button class="btn btn-ghost btn-sm" type="button" data-share-res>Share my result</button><a class="btn btn-saffron btn-sm" href="' + R + "tools/date-night-menu-builder.html?menu=" + res.r.join(",") + '">Build a menu from these</a></div></div>' +
          '<form class="lead-box" data-quiz-lead><h2>Get your profile and three menus by email</h2><div class="row"><label class="sr" for="qz-email">Email</label><input id="qz-email" type="email" name="email" required placeholder="you@example.com"><button class="btn btn-saffron" type="submit">Send</button></div><label class="check"><input type="checkbox" name="consent" value="yes" required> Email me my result and occasional recipe ideas.</label><div class="hp"><input name="_honey" tabindex="-1" autocomplete="off"></div><p class="form-msg" role="status"></p></form>';
        out.hidden = false; $("[data-quiz]").querySelector(".quiz-nav").hidden = true; qs.hidden = true;
        $("[data-share-res]", out).addEventListener("click", function () {
          var t = "I'm " + res.n + " on the Gastrosex.com cook-to-impress quiz. What are you?";
          if (navigator.share) navigator.share({ title: t, text: t, url: location.href }).catch(function () {}); else GS.copy(t + " " + location.href);
        });
        var lf = $("[data-quiz-lead]", out);
        lf.setAttribute("data-form", "Quiz result signup"); lf.setAttribute("data-ok", "Sent. Check your inbox.");
        lf.addEventListener("submit", function (ev) {
          ev.preventDefault();
          GS.submitForm(lf, { result: res.n, _autoresponse: "Your cook-to-impress profile: " + res.n + "\n\n" + res.d + "\n\nCook these next:\n" + res.r.map(function (s) { return "- " + BY[s].title + ": " + new URL(R + BY[s].url, location.href).href; }).join("\n") + "\n\nGastrosex.com" });
        });
        out.scrollIntoView({ behavior: "smooth" });
      });
    });
    prev.addEventListener("click", function () { if (i) { i--; step(); } });
    step();
  }

  /* ---------- 5. converter ---------- */
  if (tool === "kitchen-converter") {
    var VOL = { cup: 240, tbsp: 15, tsp: 5, ml: 1, floz: 29.5735 }, WT = { g: 1, oz: 28.3495, lb: 453.592 };
    var DENS = { water: 1, flour: 125 / 240, sugar: 200 / 240, butter: 227 / 240, rice: 200 / 240, cream: 238 / 240 };
    var NAMES = { cup: "cups", tbsp: "tablespoons", tsp: "teaspoons", ml: "ml", floz: "fl oz", g: "grams", oz: "ounces", lb: "pounds" };
    var cf = $("[data-conv-form]"), co = $("[data-conv-out]");
    var round = function (x) { return x >= 100 ? Math.round(x) : x >= 10 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100; };
    function conv() {
      var fd = new FormData(cf), v = Number(fd.get("v")) || 0, from = fd.get("from"), dens = DENS[fd.get("ing")];
      var ml = VOL[from] ? v * VOL[from] : v * WT[from] / dens, g = ml * dens;
      co.innerHTML = "<ul>" + Object.keys(VOL).filter(function (k) { return k !== from; }).map(function (k) { return "<li><strong>" + round(ml / VOL[k]) + "</strong> " + NAMES[k] + "</li>"; }).join("") +
        Object.keys(WT).filter(function (k) { return k !== from; }).map(function (k) { return "<li><strong>" + round(g / WT[k]) + "</strong> " + NAMES[k] + "</li>"; }).join("") + "</ul>";
    }
    cf.addEventListener("input", conv); conv();
    var tf = $("[data-temp-form]"), to = $("[data-temp-out]");
    var GAS = [[140, "1"], [150, "2"], [165, "3"], [180, "4"], [190, "5"], [200, "6"], [220, "7"], [230, "8"], [240, "9"]];
    function temp() {
      var fd = new FormData(tf), t = Number(fd.get("t")) || 0, c = fd.get("u") === "C" ? t : (t - 32) * 5 / 9, f = fd.get("u") === "F" ? t : t * 9 / 5 + 32;
      var gas = GAS.reduce(function (a, b) { return Math.abs(b[0] - c) < Math.abs(a[0] - c) ? b : a; });
      to.innerHTML = "<p><strong>" + Math.round(c) + "°C</strong> = <strong>" + Math.round(f) + "°F</strong>" + (c >= 130 && c <= 250 ? ", about gas mark " + gas[1] : "") + "</p><p class=\"muted small\">Fan or convection ovens: reduce by about 20°C (25°F).</p>";
    }
    tf.addEventListener("input", temp); temp();
    var sf = $("[data-scale-form]"), so = $("[data-scale-out]");
    function parseNum(s) { s = s.trim(); var m = s.match(/^(\d+)\s+(\d+)\/(\d+)/); if (m) return +m[1] + m[2] / m[3]; m = s.match(/^(\d+)\/(\d+)/); if (m) return m[1] / m[2]; m = s.match(/^\d+(\.\d+)?/); return m ? Number(m[0]) : null; }
    function scale() {
      var fd = new FormData(sf), k = (Number(fd.get("to")) || 1) / (Number(fd.get("from")) || 1);
      so.innerHTML = "<ul>" + String(fd.get("list")).split("\n").filter(function (l) { return l.trim(); }).map(function (l) {
        var n = parseNum(l); if (n === null) return "<li>" + esc(l) + "</li>";
        var rest = l.trim().replace(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(\.\d+)?)/, "");
        return "<li><strong>" + esc(GS.fmt(n * k)) + "</strong>" + esc(rest) + "</li>";
      }).join("") + "</ul>";
    }
    sf.addEventListener("input", scale); scale();
  }
})();
