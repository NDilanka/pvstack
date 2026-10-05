(() => {
  "use strict";
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const data = JSON.parse($("#playbook-data").textContent);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const store = {
    get(k) { try { return localStorage.getItem("pvpb." + k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem("pvpb." + k, v); } catch { /* storage blocked */ } },
  };
  const MODES = Object.keys(data.lines);
  const stepMode = new Map();
  for (const m of MODES) for (const s of data.lines[m].steps) stepMode.set(s.id, m);
  const modeFor = (id) => stepMode.get(id) || (MODES.includes(id) ? id : null);

  const toastEl = $("#toast");
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1600);
  }

  // Theme: no stored choice means the CSS follows the OS.
  const themeBtn = $("#theme-toggle");
  const darkOS = matchMedia("(prefers-color-scheme: dark)");
  const effectiveTheme = () => root.dataset.theme || (darkOS.matches ? "dark" : "light");
  function paintTheme() {
    themeBtn.setAttribute("aria-pressed", String(effectiveTheme() === "dark"));
  }
  themeBtn.addEventListener("click", () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    store.set("theme", next);
    paintTheme();
  });
  darkOS.addEventListener("change", paintTheme);
  paintTheme();

  let mode = null;
  function setMode(m) {
    if (!MODES.includes(m) || m === mode) return;
    mode = m;
    root.dataset.lineMode = m;
    for (const el of $$("[data-line]")) el.hidden = el.dataset.line !== m;
    for (const b of $$("[data-mode-btn]")) b.setAttribute("aria-pressed", String(b.dataset.modeBtn === m));
    for (const li of $$(".minimap li[data-mode]")) li.hidden = li.dataset.mode !== m;
    for (const a of $$(`[data-href-${m}]`)) {
      a.setAttribute("href", a.getAttribute(`data-href-${m}`));
      a.dataset.station = a.getAttribute(`data-href-${m}`).slice(1);
    }
    store.set("mode", m);
    refreshCurrent();
  }
  for (const b of $$("[data-mode-btn]")) {
    b.addEventListener("click", () => {
      setMode(b.dataset.modeBtn);
      history.replaceState(null, "", "#" + b.dataset.modeBtn);
    });
  }

  // In-page links: switch the line first so the target is visible, then scroll.
  function go(id, push) {
    const m = modeFor(id);
    if (m) setMode(m);
    const el = document.getElementById(id);
    if (!el) return false;
    if (push) history.pushState(null, "", "#" + id);
    if (!el.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute("tabindex", "-1");
    el.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
    el.focus({ preventScroll: true });
    return true;
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = decodeURIComponent(a.getAttribute("href").slice(1));
    if (id && go(id, true)) e.preventDefault();
  });
  addEventListener("popstate", () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) go(id, false);
  });

  const pfSelect = $("#pf-select");
  function setPlatform(id) {
    const p = data.platforms.find((x) => x.id === id) || data.platforms[0];
    pfSelect.value = p.id;
    for (const b of $$("[data-pf-btn]")) b.setAttribute("aria-pressed", String(b.dataset.pfBtn === p.id));
    for (const el of $$("[data-pf-panel]")) el.hidden = el.dataset.pfPanel !== p.id;
    const tpl = $(`template[data-pf-template="${p.id}"]`);
    for (const el of $$("[data-pf-name]")) el.textContent = p.name;
    for (const el of $$("[data-pf-invoke]")) el.innerHTML = tpl.innerHTML;
    store.set("platform", p.id);
  }
  pfSelect.addEventListener("change", () => setPlatform(pfSelect.value));
  for (const b of $$("[data-pf-btn]")) b.addEventListener("click", () => setPlatform(b.dataset.pfBtn));
  setPlatform(store.get("platform"));

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    }
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    const src = $("[data-copy-source]", b.closest("figure, .agents-body"));
    if (!src) return;
    const text = src.matches("code") ? src.textContent : src.innerText.trim();
    const ok = await copyText(text);
    const label = $("span", b);
    const before = label.textContent;
    b.classList.toggle("done", ok);
    label.textContent = ok ? "Copied" : "Copy failed";
    toast(ok ? "Copied to clipboard" : "Copy failed. Select the text instead.");
    setTimeout(() => { b.classList.remove("done"); label.textContent = before; }, 1600);
  });

  const stationLinks = (id) => $$(`[data-station="${id}"]`);
  function paintProgress(id) {
    const boxes = $$(`[data-done="${id}"]`);
    const n = boxes.filter((b) => b.checked).length;
    const out = $(`[data-progress="${id}"]`);
    if (out) out.textContent = n === boxes.length ? `All ${n} done` : `${n} of ${boxes.length} done`;
    const complete = boxes.length > 0 && n === boxes.length;
    document.getElementById(id)?.classList.toggle("complete", complete);
    for (const a of stationLinks(id)) a.classList.toggle("complete", complete);
  }
  const doneIds = [...new Set($$("[data-done]").map((b) => b.dataset.done))];
  for (const id of doneIds) {
    let saved = [];
    try { saved = JSON.parse(store.get("done." + id) || "[]"); } catch { saved = []; }
    for (const b of $$(`[data-done="${id}"]`)) {
      b.checked = saved.includes(Number(b.dataset.index));
      b.addEventListener("change", () => {
        const on = $$(`[data-done="${id}"]`).filter((x) => x.checked).map((x) => Number(x.dataset.index));
        store.set("done." + id, JSON.stringify(on));
        paintProgress(id);
      });
    }
    paintProgress(id);
  }

  const topbar = $(".topbar");
  const mmLinks = $$(".minimap a[data-mm]");
  const mmIds = mmLinks.map((a) => a.dataset.mm);
  let currentId = null;
  const visible = new Set();
  function paintCurrent(id) {
    if (id === currentId) return;
    currentId = id;
    const idx = mmIds.indexOf(id);
    mmLinks.forEach((a, i) => {
      const li = a.parentElement;
      if (i === idx) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
      li.classList.toggle("here", i === idx);
      li.classList.toggle("passed", idx >= 0 && i < idx);
    });
    for (const el of $$(".station.current, .here[data-station]")) el.classList.remove("current", "here");
    if (stepMode.has(id)) {
      document.getElementById(id).classList.add("current");
      for (const a of stationLinks(id)) a.classList.add("here");
    }
    const a = mmLinks[idx];
    if (a) {
      const ol = a.closest("ol");
      const left = a.offsetLeft - ol.clientWidth / 2 + a.offsetWidth / 2;
      ol.scrollTo({ left, behavior: reduce.matches ? "auto" : "smooth" });
    }
  }
  function refreshCurrent() {
    const order = mmIds.filter((id) => visible.has(id) && !document.getElementById(id)?.closest("[hidden]"));
    if (order.length) paintCurrent(order[order.length - 1]);
  }
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id);
      refreshCurrent();
    }, { rootMargin: "-35% 0px -60% 0px" });
    for (const id of mmIds) {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    }
    const hero = $(".hero");
    new IntersectionObserver(([e]) => topbar.classList.toggle("past-hero", !e.isIntersecting), { rootMargin: "-120px 0px 0px 0px" }).observe(hero);
    const reveal = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px" });
    for (const el of $$(".reveal")) reveal.observe(el);
  } else {
    for (const el of $$(".reveal")) el.classList.add("in");
    topbar.classList.add("past-hero");
  }
  new ResizeObserver(() => root.style.setProperty("--top-h", topbar.offsetHeight + "px")).observe(topbar);

  // Fit the isometric board to its stage. The projected box comes from the browser,
  // so this stays right whatever the station count.
  const stage = $(".board-stage");
  const fit = $(".board-fit");
  const board = $(".board");
  function projectedBox() {
    let box = null;
    for (const el of [board, ...$$(".pillar span", board)]) {
      const r = el.getBoundingClientRect();
      box = box ? { l: Math.min(box.l, r.left), t: Math.min(box.t, r.top), r: Math.max(box.r, r.right), b: Math.max(box.b, r.bottom) } : { l: r.left, t: r.top, r: r.right, b: r.bottom };
    }
    return box;
  }
  function fitBoard() {
    if (!stage || !stage.offsetParent) return;
    for (const [k, v] of [["--s", "1"], ["--tx", "0px"], ["--ty", "0px"]]) fit.style.setProperty(k, v);
    board.style.animation = "none";
    let box = projectedBox();
    const s = Math.min((stage.clientWidth * 0.97) / (box.r - box.l), (stage.clientHeight * 0.94) / (box.b - box.t), 1.15);
    fit.style.setProperty("--s", s.toFixed(3));
    box = projectedBox();
    const st = stage.getBoundingClientRect();
    fit.style.setProperty("--tx", (st.left + st.width / 2 - (box.l + box.r) / 2).toFixed(1) + "px");
    fit.style.setProperty("--ty", (st.top + st.height / 2 - (box.t + box.b) / 2).toFixed(1) + "px");
    board.style.animation = "";
  }
  if (stage) {
    fitBoard();
    new ResizeObserver(fitBoard).observe(stage);
  }

  // The core loop: scroll story when pinned beside a chapter, otherwise a timed cycle.
  const loopCards = $$(".loop-card");
  function lightLoop(active) {
    loopCards.forEach((c, i) => {
      c.classList.toggle("on", i <= active);
      c.classList.toggle("current", i === active);
    });
  }
  const story = $(".story");
  if (story && loopCards.length) {
    const ps = $$(".story-p", story);
    let queued = false;
    const onScroll = () => {
      queued = false;
      const r = story.getBoundingClientRect();
      const mid = innerHeight * 0.5;
      const p = Math.min(0.999, Math.max(0, (mid - r.top) / Math.max(1, r.height - innerHeight * 0.3)));
      lightLoop(Math.floor(p * loopCards.length));
      let best = null;
      let bestD = Infinity;
      for (const el of ps) {
        const pr = el.getBoundingClientRect();
        const d = Math.abs(pr.top + pr.height / 2 - mid);
        if (d < bestD) { bestD = d; best = el; }
      }
      for (const el of ps) el.classList.toggle("on", el === best);
    };
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  } else if (loopCards.length) {
    if (reduce.matches) lightLoop(loopCards.length - 1);
    else {
      let n = 0;
      lightLoop(0);
      setInterval(() => { n = (n + 1) % (loopCards.length + 1); lightLoop(n === loopCards.length ? -1 : n); }, 1400);
    }
  }
  const loopFig = $(".loop");
  const stack = $(".loop-stack");
  if (loopFig && !reduce.matches) {
    const host = loopFig.closest("section") || loopFig;
    host.addEventListener("pointermove", (e) => {
      const r = loopFig.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      stack.style.setProperty("--ry", (-18 + x * 20).toFixed(1) + "deg");
      stack.style.setProperty("--rx", (12 - y * 14).toFixed(1) + "deg");
    });
    host.addEventListener("pointerleave", () => { stack.style.removeProperty("--ry"); stack.style.removeProperty("--rx"); });
  }

  for (const b of $$(".flip")) b.addEventListener("click", () => b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")));

  // Recipes: text filter plus line chips. "any" recipes match every line.
  const q = $("#recipe-q");
  const recipes = $$(".recipe");
  let recipeMode = "all";
  function filterRecipes() {
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const li of recipes) {
      const text = li.textContent.toLowerCase();
      const okMode = recipeMode === "all" || li.dataset.mode === "any" || li.dataset.mode === recipeMode;
      const ok = okMode && words.every((w) => text.includes(w));
      li.hidden = !ok;
      if (ok) shown++;
    }
    $("#recipe-count").textContent = `${shown} ${shown === 1 ? "recipe" : "recipes"}`;
    $("#recipe-empty").hidden = shown > 0;
  }
  if (q) {
    q.addEventListener("input", filterRecipes);
    for (const b of $$("[data-recipe-mode]")) {
      b.addEventListener("click", () => {
        recipeMode = b.dataset.recipeMode;
        for (const x of $$("[data-recipe-mode]")) x.setAttribute("aria-pressed", String(x === b));
        filterRecipes();
      });
    }
  }

  const typed = $(".typed");
  if (typed && !reduce.matches) {
    const html = typed.innerHTML;
    const text = typed.textContent;
    typed.textContent = "";
    typed.classList.add("typing");
    let i = 0;
    const tick = () => {
      typed.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 24 + Math.random() * 46);
      else { typed.innerHTML = html; setTimeout(() => typed.classList.remove("typing"), 2400); }
    };
    setTimeout(tick, 700);
  }

  // Initial line: the hash wins, then the saved choice.
  const hashId = decodeURIComponent(location.hash.slice(1));
  setMode(modeFor(hashId) || store.get("mode") || MODES[0]);
  if (hashId && document.getElementById(hashId)) requestAnimationFrame(() => go(hashId, false));
})();
