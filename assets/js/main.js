/* Gastrosex.com — shared site behaviour */
(function () {
  "use strict";
  var ROOT = document.body.getAttribute("data-root") || "";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  };
  var params = new URLSearchParams(location.search);
  window.GS = { $: $, $$: $$, store: store, root: ROOT };

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  GS.toast = toast;

  var dataCache = {};
  function getJSON(name) {
    if (!dataCache[name]) dataCache[name] = fetch(ROOT + "assets/data/" + name).then(function (r) { return r.json(); });
    return dataCache[name];
  }
  GS.getJSON = getJSON;

  function copy(text) {
    if (navigator.clipboard) return navigator.clipboard.writeText(text).then(function () { toast("Copied"); });
    var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Copied"); } catch (_) {}
    ta.remove(); return Promise.resolve();
  }
  GS.copy = copy;

  /* ---------- theme ---------- */
  var themeBtn = $("[data-theme-toggle]");
  function syncTheme() {
    var dark = document.documentElement.dataset.theme === "dark";
    if (themeBtn) themeBtn.setAttribute("aria-label", dark ? "Lights up" : "Lights down");
  }
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("gs-theme", next); } catch (_) {}
    syncTheme();
  });
  syncTheme();

  /* ---------- mobile nav ---------- */
  var menuBtn = $("[data-menu-toggle]"), nav = $("#main-nav");
  if (menuBtn && nav) menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  /* ---------- search ---------- */
  function searchIndex(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return getJSON("search.json").then(function (idx) {
      if (!terms.length) return [];
      return idx.map(function (it) {
        var hay = (it.t + " " + it.d + " " + it.k).toLowerCase(), score = 0;
        for (var i = 0; i < terms.length; i++) {
          if (hay.indexOf(terms[i]) === -1) return null;
          score += it.t.toLowerCase().indexOf(terms[i]) > -1 ? 3 : 1;
        }
        return { it: it, s: score };
      }).filter(Boolean).sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.it; });
    });
  }
  function renderResults(list, el, q) {
    el.innerHTML = "";
    if (!q) return;
    if (!list.length) { el.innerHTML = '<li class="muted">No matches for that. Try an ingredient such as "chocolate" or "shrimp".</li>'; return; }
    list.slice(0, 12).forEach(function (it) {
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = ROOT + it.u;
      var s = document.createElement("strong"); s.textContent = it.t;
      var sp = document.createElement("span"); sp.textContent = it.c + ": " + it.d;
      a.appendChild(s); a.appendChild(sp); li.appendChild(a); el.appendChild(li);
    });
  }
  var dlg = $("#search-dlg");
  $$("[data-search-open]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (dlg && dlg.showModal) { dlg.showModal(); $("#search-q").focus(); } else { location.href = ROOT + "search.html"; }
    });
  });
  if (dlg) {
    $("[data-search-close]", dlg).addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
    var qi = $("#search-q"), out = $("[data-search-results]", dlg), tmr;
    qi.addEventListener("input", function () {
      clearTimeout(tmr);
      tmr = setTimeout(function () { var q = qi.value.trim(); searchIndex(q).then(function (l) { renderResults(l, out, q); }); }, 120);
    });
  }
  var sp = $("[data-search-page]");
  if (sp) {
    var q0 = (params.get("q") || "").trim(), inp = $("#sq");
    if (inp) inp.value = q0;
    if (q0) searchIndex(q0).then(function (l) { renderResults(l, sp, q0); });
  }

  /* ---------- consent ---------- */
  var consent = $("[data-consent]"), choice = store.get("gs-consent", null);
  if (choice === "essential") { (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1; }
  if (consent && !choice) consent.hidden = false;
  $$("[data-consent-choice]").forEach(function (b) {
    b.addEventListener("click", function () {
      var c = b.getAttribute("data-consent-choice"); store.set("gs-consent", c);
      if (c === "essential") (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
      consent.hidden = true;
    });
  });

  /* ---------- saved recipes ---------- */
  function saved() { return store.get("gs-saved", []); }
  function updateSavedUI() {
    var s = saved(), menus = store.get("gs-menus", []), n = s.length + menus.length;
    $$("[data-saved-count]").forEach(function (el) { el.textContent = n; el.hidden = !n; });
    $$("[data-save]").forEach(function (b) {
      var on = s.indexOf(b.getAttribute("data-save")) > -1;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      var lab = $("span", b); if (lab) lab.textContent = on ? "Saved" : "Save";
    });
  }
  $$("[data-save]").forEach(function (b) {
    b.addEventListener("click", function () {
      var s = saved(), slug = b.getAttribute("data-save"), i = s.indexOf(slug);
      if (i > -1) { s.splice(i, 1); toast("Removed from saved"); } else { s.push(slug); toast("Saved to this browser"); }
      store.set("gs-saved", s); updateSavedUI();
    });
  });
  updateSavedUI();
  var savedList = $("[data-saved-list]");
  if (savedList) {
    var s = saved(), menus = store.get("gs-menus", []);
    if (s.length || menus.length) getJSON("recipes.json").then(function (all) {
      var by = {}; all.forEach(function (r) { by[r.slug] = r; });
      savedList.innerHTML = "";
      if (s.length) {
        var sec = document.createElement("section"); sec.innerHTML = "<h2>Recipes</h2>";
        var ul = document.createElement("ul"); ul.className = "guide-list";
        s.forEach(function (slug) {
          var r = by[slug]; if (!r) return;
          var li = document.createElement("li");
          li.innerHTML = '<a href="' + ROOT + r.url + '"><strong></strong><span class="g-desc"></span></a>';
          $("strong", li).textContent = r.title; $(".g-desc", li).textContent = r.short; ul.appendChild(li);
        });
        sec.appendChild(ul); savedList.appendChild(sec);
      }
      if (menus.length) {
        var ms = document.createElement("section"); ms.innerHTML = "<h2>Menus</h2>";
        menus.forEach(function (m, idx) {
          var card = document.createElement("div"); card.className = "out-block"; card.style.marginBottom = "1rem";
          var h = document.createElement("h3"); h.textContent = m.name; card.appendChild(h);
          var ol = document.createElement("ul");
          m.slugs.forEach(function (sl) { var r = by[sl]; if (!r) return; var li = document.createElement("li"); li.innerHTML = '<a href="' + ROOT + r.url + '"></a>'; $("a", li).textContent = r.title; ol.appendChild(li); });
          card.appendChild(ol);
          var del = document.createElement("button"); del.className = "btn btn-ghost btn-sm"; del.type = "button"; del.textContent = "Remove menu";
          del.addEventListener("click", function () { var a = store.get("gs-menus", []); a.splice(idx, 1); store.set("gs-menus", a); location.reload(); });
          card.appendChild(del); ms.appendChild(card);
        });
        savedList.appendChild(ms);
      }
    });
  }

  /* ---------- forms (delivered to the owner's inbox; no address in page code) ---------- */
  function inbox() {
    var c = window.GS_CONFIG || {};
    if (c.formAlias) return c.formAlias;
    try { return atob((c.k || []).join("")).split("").reverse().join(""); } catch (_) { return ""; }
  }
  function serialize(form) {
    var data = {}, fd = new FormData(form);
    fd.forEach(function (v, k) { if (k === "_honey") return; data[k] = data[k] ? data[k] + ", " + v : v; });
    return data;
  }
  function sendForm(form, extra) {
    var data = serialize(form);
    var name = form.getAttribute("data-form") || "Website form";
    data._subject = "Gastrosex.com: " + name + (data.name ? " from " + data.name : "");
    data._template = "table"; data._captcha = "false"; data.form = name; data.page = location.href;
    if (data.email) data._replyto = data.email;
    if (extra) Object.keys(extra).forEach(function (k) { data[k] = extra[k]; });
    return fetch("https://formsubmit.co/ajax/" + inbox(), {
      method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data)
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || String(j.success) === "false") throw new Error(j.message || "send failed"); return j; }); });
  }
  GS.sendForm = sendForm;
  $$("form[data-form]").forEach(function (form) {
    if (form.hasAttribute("data-stepper")) return; // handled by stepper
    form.addEventListener("submit", function (ev) { ev.preventDefault(); submitForm(form); });
  });
  function submitForm(form, extra) {
    var msg = $(".form-msg", form), btn = $('button[type="submit"]', form);
    var hp = form.querySelector('[name="_honey"]');
    if (hp && hp.value) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending…"; }
    if (msg) { msg.className = "form-msg"; msg.textContent = ""; }
    var auto = null;
    if (form.getAttribute("data-form") === "Newsletter signup") {
      auto = { _autoresponse: "Thanks for joining Gastrosex.com! Your free Date-Night Playbook (12 menus for two) is here: " + new URL(ROOT + "playbook.html", location.href).href };
    }
    sendForm(form, Object.assign({}, auto || {}, extra || {})).then(function () {
      var redirect = form.getAttribute("data-redirect");
      if (redirect) { location.href = ROOT + redirect; return; }
      if (msg) { msg.className = "form-msg ok"; msg.textContent = form.getAttribute("data-ok") || "Sent. Thank you!"; }
      form.reset();
    }).catch(function () {
      if (msg) { msg.className = "form-msg err"; msg.textContent = "That didn't send. Check your connection and try again in a moment."; }
    }).then(function () { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; } });
  }
  GS.submitForm = submitForm;

  /* prefill from URL */
  $$("form[data-prefill]").forEach(function (form) {
    params.forEach(function (v, k) {
      var f = form.elements[k]; if (!f) return;
      if (f.length && f[0] && f[0].type === "radio") { $$('input[name="' + k + '"]', form).forEach(function (r) { r.checked = r.value === v; }); }
      else if (f.tagName === "SELECT") { $$("option", f).forEach(function (o) { if (o.value === v || o.textContent === v) f.value = o.value; }); }
      else f.value = v;
    });
  });

  /* multi-step lead form */
  $$("form[data-stepper]").forEach(function (form) {
    var steps = $$("[data-step]", form), i = 0;
    var back = $("[data-step-back]", form), next = $("[data-step-next]", form), sub = $("[data-step-submit]", form);
    function show() {
      steps.forEach(function (s, n) { s.hidden = n !== i; });
      back.hidden = i === 0; next.hidden = i === steps.length - 1; sub.hidden = i !== steps.length - 1;
      $("[data-step-count]", form).textContent = "Step " + (i + 1) + " of " + steps.length;
      $("[data-progress]", form).style.width = ((i + 1) / steps.length * 100) + "%";
    }
    function valid() {
      var ok = true;
      $$("input,select,textarea", steps[i]).forEach(function (f) { if (ok && !f.checkValidity()) { f.reportValidity(); ok = false; } });
      return ok;
    }
    next.addEventListener("click", function () { if (valid()) { i++; show(); var f = $("input,select,textarea", steps[i]); if (f) f.focus(); } });
    back.addEventListener("click", function () { i--; show(); });
    form.addEventListener("submit", function (ev) { ev.preventDefault(); if (valid()) submitForm(form); });
    show();
  });

  /* ---------- YouTube lite embeds ---------- */
  $$("[data-yt]").forEach(function (b) {
    b.addEventListener("click", function () {
      var id = b.getAttribute("data-yt"), f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
      f.title = b.getAttribute("aria-label") || "YouTube video";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"; f.allowFullscreen = true;
      f.loading = "lazy"; b.replaceWith(f);
    });
  });

  /* ---------- print & share ---------- */
  $$("[data-print]").forEach(function (b) { b.addEventListener("click", function () { window.print(); }); });
  $$("[data-share]").forEach(function (b) {
    b.addEventListener("click", function () {
      var d = { title: document.title, url: location.href.split("#")[0] };
      if (navigator.share) navigator.share(d).catch(function () {}); else copy(d.url);
    });
  });

  /* ---------- recipe page ---------- */
  var FR = [[0.125, "⅛"], [0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"]];
  function fmt(x) {
    var w = Math.floor(x + 1e-9), f = x - w;
    if (f < 0.06) return String(w);
    var best = FR.reduce(function (a, b) { return Math.abs(b[0] - f) < Math.abs(a[0] - f) ? b : a; });
    if (Math.abs(best[0] - f) < 0.06) return (w ? w : "") + best[1];
    return (Math.round(x * 10) / 10).toString();
  }
  GS.fmt = fmt;
  var rec = $("[data-recipe]");
  if (rec) {
    $$(".servings button", rec).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = Number(b.getAttribute("data-serves")) / 2;
        $$(".servings button", rec).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $$(".q", rec).forEach(function (q) { q.textContent = fmt(Number(q.getAttribute("data-q")) * f); });
      });
    });
    var cl = $("[data-copy-list]", rec);
    if (cl) cl.addEventListener("click", function () {
      copy($("h1", rec).textContent + "\n" + $$(".ings li", rec).map(function (li) { return "• " + li.textContent.replace(/\s+/g, " ").trim(); }).join("\n"));
    });
    var cm = $("[data-cook-mode]", rec), lock = null;
    if (cm) cm.addEventListener("click", function () {
      var on = document.body.classList.toggle("cooking");
      cm.setAttribute("aria-pressed", on ? "true" : "false");
      $("[data-cook-hint]", rec).hidden = !on;
      var first = $(".steps li", rec);
      if (on) {
        if (first && !$(".steps li.current", rec)) first.classList.add("current");
        if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (l) { lock = l; }).catch(function () {});
        $("#make-it").scrollIntoView();
      } else if (lock) { lock.release(); lock = null; }
    });
    $$(".steps li", rec).forEach(function (li) {
      li.addEventListener("click", function (ev) {
        if (!document.body.classList.contains("cooking") || ev.target.closest(".timer-btn")) return;
        $$(".steps li", rec).forEach(function (x) { x.classList.remove("current"); });
        li.classList.add("current");
      });
    });
    $$(".timer-btn", rec).forEach(function (b) {
      var iv = null, label = b.innerHTML;
      b.addEventListener("click", function () {
        if (iv) { clearInterval(iv); iv = null; b.className = "timer-btn"; b.innerHTML = label; return; }
        var end = Date.now() + Number(b.getAttribute("data-timer")) * 60000;
        b.className = "timer-btn running";
        iv = setInterval(function () {
          var left = Math.max(0, end - Date.now()), m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000);
          b.textContent = (left ? m + ":" + (s < 10 ? "0" : "") + s + " left (tap to stop)" : "Time's up");
          if (!left) {
            clearInterval(iv); iv = null; b.className = "timer-btn done";
            try { var ac = new (window.AudioContext || window.webkitAudioContext)(), o = ac.createOscillator(); o.frequency.value = 880; o.connect(ac.destination); o.start(); setTimeout(function () { o.stop(); }, 700); } catch (_) {}
            if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
            setTimeout(function () { b.className = "timer-btn"; b.innerHTML = label; }, 8000);
          }
        }, 250);
      });
    });
  }

  /* ---------- recipe filters ---------- */
  var board = $("[data-recipe-board]");
  if (board) {
    var state = { course: "", diet: [], skill: "", time: "" };
    if (params.get("course")) state.course = params.get("course");
    if (params.get("diet")) state.diet = [params.get("diet")];
    function apply() {
      var shown = 0;
      $$(".mline", board).forEach(function (li) {
        var ok = (!state.course || li.dataset.course === state.course) &&
          state.diet.every(function (d) { return (" " + li.dataset.diets + " ").indexOf(" " + d + " ") > -1; }) &&
          (!state.skill || li.dataset.skill === state.skill) && (!state.time || Number(li.dataset.time) <= Number(state.time));
        li.hidden = !ok; if (ok) shown++;
      });
      $$(".menu-col", board).forEach(function (c) { c.hidden = !$$(".mline", c).some(function (l) { return !l.hidden; }); });
      $("[data-f-count]").textContent = shown + (shown === 1 ? " recipe" : " recipes");
      $("[data-f-empty]").hidden = shown > 0;
      $$("[data-f]").forEach(function (b) {
        var f = b.dataset.f, v = b.dataset.v, on = f === "diet" ? state.diet.indexOf(v) > -1 : state[f] === v;
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    $$("[data-f]").forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.dataset.f, v = b.dataset.v;
        if (f === "diet") { var i = state.diet.indexOf(v); if (i > -1) state.diet.splice(i, 1); else state.diet.push(v); }
        else state[f] = state[f] === v && f !== "course" ? "" : v;
        apply();
      });
    });
    apply();
  }

  /* ---------- home: tonight's menu card ---------- */
  var mc = $("[data-menu-card]");
  if (mc && $("[data-shuffle]", mc)) {
    var list = $("[data-mc-list]", mc), use = $("[data-use-menu]", mc), td = $("[data-today]", mc);
    try { td.textContent = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }); } catch (_) {}
    var cur = $$("li", list).map(function (li) { return $("a", li).getAttribute("href").replace(/^recipes\//, "").replace(/\.html$/, ""); });
    function link() { use.href = "tools/date-night-menu-builder.html?menu=" + cur.join(","); }
    link();
    $("[data-shuffle]", mc).addEventListener("click", function () {
      getJSON("recipes.json").then(function (all) {
        var pick = function (c, not) {
          var p = all.filter(function (r) { return r.course === c && r.slug !== not; });
          if (!p.length) p = all.filter(function (r) { return r.course === c; });
          return p[Math.floor(Math.random() * p.length)];
        };
        var sel = [pick("drink", cur[0]), pick("starter", cur[1]), pick("main", cur[2]), pick("dessert", cur[3])];
        cur = sel.map(function (r) { return r.slug; });
        $$("li", list).forEach(function (li, i) { var a = $(".mc-dish", li); a.textContent = sel[i].title; a.href = ROOT + sel[i].url; });
        list.classList.remove("dealing"); void list.offsetWidth; list.classList.add("dealing");
        link();
      });
    });
  }

  /* ---------- occasions countdown ---------- */
  var occLine = $("[data-occasion-line]");
  if (occLine) {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    function nextDate(m, d) { var t = new Date(now.getFullYear(), m, d); if (t < now) t.setFullYear(t.getFullYear() + 1); return t; }
    var occ = [
      { n: "Valentine's Day", d: nextDate(1, 14), href: "guides/anniversary-valentines-dinner-menus.html", tip: "Book special ingredients a week ahead and practise the dessert once." },
      { n: "New Year's Eve", d: nextDate(11, 31), href: "guides/anniversary-valentines-dinner-menus.html", tip: "A make-ahead dessert means you're at the table at midnight, not the sink." },
      { n: "Christmas Eve dinner", d: nextDate(11, 24), href: "guides/reverse-timeline-dinner-planning.html", tip: "Plan your timeline backwards from the time you want to sit down." }
    ];
    var anniv = store.get("gs-anniv", "");
    if (anniv) { var p = anniv.split("-"); occ.push({ n: "Your anniversary", d: nextDate(Number(p[1]) - 1, Number(p[2])), href: "guides/anniversary-valentines-dinner-menus.html", tip: "Six celebration menus are ready for you." }); }
    occ.sort(function (a, b) { return a.d - b.d; });
    var o = occ[0], days = Math.round((o.d - now) / 864e5);
    occLine.textContent = (days === 0 ? o.n + " is today." : o.n + " is in " + days + (days === 1 ? " day. " : " days. ")) + " " + o.tip;
    var ol = $("[data-occasion-link]"); if (ol) ol.href = ROOT + o.href;
    var af = $("[data-anniv-form]");
    if (af) {
      if (anniv) af.elements.anniv.value = anniv;
      af.addEventListener("submit", function (ev) { ev.preventDefault(); store.set("gs-anniv", af.elements.anniv.value); toast("Anniversary saved on this device"); setTimeout(function () { location.reload(); }, 700); });
    }
  }

  /* ---------- contest ---------- */
  var cd = $("[data-countdown]");
  if (cd) {
    var n2 = new Date(), end = new Date(Date.UTC(n2.getUTCFullYear(), n2.getUTCMonth() + 1, 1)) - 1;
    getJSON("site.json").then(function (meta) {
      var th = meta.contest_themes[n2.getMonth()], h1 = $("[data-contest-theme]");
      if (h1 && th) h1.textContent = th;
      var inp = $('input[name="theme"]'); if (inp && th) inp.value = th;
      var lis = $$(".theme-list li"); if (lis[n2.getMonth()]) lis[n2.getMonth()].classList.add("now");
    }).catch(function () {});
    var tick = function () {
      var left = end - Date.now(), d = Math.floor(left / 864e5), h = Math.floor(left % 864e5 / 36e5);
      cd.textContent = left > 0 ? "Entries close in " + d + " days and " + h + " hours." : "Entries for this month are closed.";
    };
    tick(); setInterval(tick, 60000);
  }

  /* ---------- support page ---------- */
  var sf = $("[data-support-form]");
  if (sf) {
    var pay = (window.GS_CONFIG || {}).payments || {}, names = { paypal: "PayPal", stripe: "Card (Stripe)", buymeacoffee: "Buy Me a Coffee", kofi: "Ko-fi" };
    var holder = $("[data-pay-buttons]", sf), any = false;
    Object.keys(names).forEach(function (k) {
      if (!pay[k]) return; any = true;
      var a = document.createElement("a"); a.className = "btn btn-plum"; a.href = pay[k]; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Pay with " + names[k];
      holder.appendChild(a);
    });
    if (any) { holder.hidden = false; var note = $("[data-pledge-fields] p.small", sf); if (note) note.textContent = "Prefer to pledge and get a payment link by email? Fill in your details below."; }
    sf.addEventListener("change", function () { var c = sf.elements.custom_amount; if (c.value) $$('input[name="amount"]', sf).forEach(function (r) { r.checked = false; }); });
  }

  /* ---------- thank-you page ---------- */
  var th = $("[data-thanks]");
  if (th) {
    var f = params.get("f"), T = {
      plan: ["Your request is in", "We'll email you options within 24 hours. While you wait, build a menu or browse recipes your date might love."],
      playbook: ["You're on the list", "Your Date-Night Playbook is ready below, and we've also emailed you the link."],
      partner: ["Application received", "Thanks for applying. We review every partner and reply within three business days."],
      contest: ["Your entry is in. Good luck!", "We'll confirm your entry by email. Winners are announced on the contest page within 14 days of the close."],
      careers: ["Application received", "Thanks for your interest. If your work is a fit, we'll be in touch with a brief."],
      advertise: ["Thanks for reaching out", "We'll reply within two business days with options and availability."],
      support: ["Thank you for your support", "We'll email you a secure payment link within one business day. It genuinely keeps the kitchen running."],
      contact: ["Message sent", "We read every message and reply within one or two business days."]
    }[f];
    if (T) { $("[data-thanks-title]").textContent = T[0]; $("[data-thanks-text]").textContent = T[1]; }
    if (f === "playbook" || f === "plan") {
      $("[data-thanks-extra]").innerHTML = '<a class="btn btn-plum btn-lg" href="' + ROOT + 'playbook.html">Open the Date-Night Playbook</a>';
    }
  }
})();
