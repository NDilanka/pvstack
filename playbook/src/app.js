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
  const status = $("#status");
  const announce = (msg) => { status.textContent = ""; requestAnimationFrame(() => (status.textContent = msg)); };

  // Theme: no stored choice means the CSS follows the OS.
  const themeBtns = $$("[data-theme-toggle]");
  const darkOS = matchMedia("(prefers-color-scheme: dark)");
  const effectiveTheme = () => root.dataset.theme || (darkOS.matches ? "dark" : "light");
  const paintTheme = () => { for (const b of themeBtns) b.setAttribute("aria-pressed", String(effectiveTheme() === "dark")); };
  for (const b of themeBtns) {
    b.addEventListener("click", () => {
      const next = effectiveTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      store.set("theme", next);
      paintTheme();
    });
  }
  darkOS.addEventListener("change", paintTheme);
  paintTheme();

  let mode = null;
  function setMode(m) {
    if (!MODES.includes(m) || m === mode) return;
    mode = m;
    for (const el of $$("[data-line]")) el.hidden = el.dataset.line !== m;
    for (const b of $$("[data-mode-btn]")) b.setAttribute("aria-pressed", String(b.dataset.modeBtn === m));
    for (const a of $$(`[data-href-${m}]`)) {
      a.setAttribute("href", a.getAttribute(`data-href-${m}`));
      a.dataset.station = a.getAttribute(`data-href-${m}`).slice(1);
    }
    store.set("mode", m);
    queueSpy();
  }
  for (const b of $$("[data-mode-btn]")) {
    b.addEventListener("click", () => {
      setMode(b.dataset.modeBtn);
      history.replaceState(null, "", "#" + b.dataset.modeBtn);
    });
  }

  // Contents drawer below the desktop breakpoint.
  const sidebar = $("#sidebar");
  const contentsBtn = $(".contents-btn");
  const scrim = $(".scrim");
  const drawerQuery = matchMedia("(max-width: 1099px)");
  const outside = [$(".page"), $(".topbar")];
  function setDrawer(open, restoreFocus = true) {
    const wasOpen = sidebar.classList.contains("open");
    sidebar.classList.toggle("open", open);
    contentsBtn.setAttribute("aria-expanded", String(open));
    scrim.hidden = !open;
    for (const el of outside) el.inert = open;
    if (open) ($("a[aria-current]", sidebar) || $(".toc a", sidebar)).focus();
    else if (wasOpen && restoreFocus) contentsBtn.focus();
  }
  contentsBtn.addEventListener("click", () => setDrawer(!sidebar.classList.contains("open")));
  $(".drawer-close").addEventListener("click", () => setDrawer(false));
  scrim.addEventListener("click", () => setDrawer(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sidebar.classList.contains("open")) setDrawer(false); });
  drawerQuery.addEventListener("change", () => setDrawer(false, false));

  // In-page links: switch the line first so the target is visible, then scroll.
  function go(id, push) {
    const m = modeFor(id);
    if (m) setMode(m);
    const el = document.getElementById(id);
    if (!el) return false;
    if (push) history.pushState(null, "", "#" + id);
    setDrawer(false, false);
    if (!el.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute("tabindex", "-1");
    el.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
    el.focus({ preventScroll: true });
    return true;
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = decodeURIComponent(a.getAttribute("href").slice(1));
    if (id && go(id, true)) e.preventDefault();
  });
  addEventListener("popstate", () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) go(id, false);
  });

  const pfSelects = $$("[data-pf-select]");
  function setPlatform(id) {
    const p = data.platforms.find((x) => x.id === id) || data.platforms[0];
    for (const s of pfSelects) s.value = p.id;
    for (const b of $$("[data-pf-btn]")) b.setAttribute("aria-pressed", String(b.dataset.pfBtn === p.id));
    for (const el of $$("[data-pf-panel]")) el.hidden = el.dataset.pfPanel !== p.id;
    const tpl = $(`template[data-pf-template="${p.id}"]`);
    for (const el of $$("[data-pf-name]")) el.textContent = p.name;
    for (const el of $$("[data-pf-invoke]")) el.innerHTML = tpl.innerHTML;
    store.set("platform", p.id);
  }
  for (const s of pfSelects) s.addEventListener("change", () => setPlatform(s.value));
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
      ta.style.cssText = "position:fixed;left:-9999px";
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
    const src = $("[data-copy-source]", b.closest("figure, section"));
    if (!src) return;
    const text = src.matches("code") ? src.textContent : src.innerText.trim();
    const ok = await copyText(text);
    const label = $("span", b);
    if (!b.dataset.label) b.dataset.label = label.textContent;
    b.classList.toggle("copied", ok);
    label.textContent = ok ? "Copied" : "Copy failed";
    announce(ok ? "Copied to clipboard" : "Copy failed. Select the text instead.");
    clearTimeout(b.timer);
    b.timer = setTimeout(() => { b.classList.remove("copied"); label.textContent = b.dataset.label; }, 1800);
  });

  const stationLinks = (id) => $$(`[data-station="${id}"]`);
  function paintProgress(id) {
    const boxes = $$(`[data-done="${id}"]`);
    const n = boxes.filter((b) => b.checked).length;
    const out = $(`[data-progress="${id}"]`);
    if (out) out.textContent = n === boxes.length ? `All ${n} done` : `${n} of ${boxes.length}`;
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

  // Scroll spy: the current section is the last TOC target whose top has passed the reading line.
  // It only marks the TOC and the map. Nothing on the page depends on it to be visible.
  const tocLinks = $$(".toc a[data-toc]");
  let currentId = null;
  let queued = false;
  function spy() {
    queued = false;
    const line = Math.min(innerHeight * 0.3, 240);
    let best = null;
    for (const a of tocLinks) {
      const el = document.getElementById(a.dataset.toc);
      if (!el || el.closest("[hidden]")) continue;
      if (el.getBoundingClientRect().top <= line) best = a.dataset.toc;
    }
    if (best === currentId) return;
    currentId = best;
    for (const a of tocLinks) {
      if (a.dataset.toc === best) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
    for (const el of $$(".here[data-station]")) el.classList.remove("here");
    if (best && stepMode.has(best)) {
      for (const a of stationLinks(best)) if (!a.closest(".toc")) a.classList.add("here");
    }
    const cur = $(`.toc a[data-toc="${best}"]`);
    if (cur && !sidebar.classList.contains("open")) {
      const r = cur.getBoundingClientRect();
      const s = sidebar.getBoundingClientRect();
      if (r.top < s.top + 40 || r.bottom > s.bottom - 40) sidebar.scrollTop += r.top - s.top - s.height / 2;
    }
  }
  function queueSpy() { if (!queued) { queued = true; requestAnimationFrame(spy); } }
  addEventListener("scroll", queueSpy, { passive: true });
  addEventListener("resize", queueSpy);

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

  // Initial line: the hash wins, then the saved choice.
  const hashId = decodeURIComponent(location.hash.slice(1));
  setMode(modeFor(hashId) || store.get("mode") || MODES[0]);
  if (hashId && document.getElementById(hashId)) requestAnimationFrame(() => go(hashId, false));
})();
