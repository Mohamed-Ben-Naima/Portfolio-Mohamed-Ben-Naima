/* Mohamed Ben Naima — portfolio interactions. No dependencies. */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const store = {
    get(k) { try { return sessionStorage.getItem(k) ?? localStorage.getItem(k); } catch { return null; } },
    session(k, v) { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } },
    local(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  /* ── Toast ─────────────────────────────────────────────────────────── */
  const toast = (title, kicker = "") => {
    const t = $("#toast");
    $("#toast-k").textContent = kicker;
    $("#toast-v").textContent = title;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 3600);
  };

  /* ── Nav: active stage, XP bar, hide on scroll down, mobile menu ───── */
  const nav = $("#nav");
  const xpFill = $("#xp-fill");
  const links = $$(".nav-links a");
  const sections = $$("main section[id]");
  let lastY = scrollY;

  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    xpFill.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    nav.classList.toggle("hide", y > lastY && y > 400 && !$("#nav-links").classList.contains("open"));
    lastY = y;
    updateTimeline();
  };
  addEventListener("scroll", onScroll, { passive: true });

  const stageObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => stageObserver.observe(s));

  const menuBtn = $("#menu-btn");
  const navLinks = $("#nav-links");
  const setMenu = (open) => {
    navLinks.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  };
  menuBtn.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
  links.forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ── CRT mode toggle (remembered) ──────────────────────────────────── */
  const crtBtn = $("#crt-toggle");
  const setCrt = (on) => {
    document.body.classList.toggle("crt", on);
    crtBtn.setAttribute("aria-pressed", String(on));
    store.local("mbn-crt", on ? "1" : "0");
  };
  setCrt(store.get("mbn-crt") === "1");
  crtBtn.addEventListener("click", () => setCrt(!document.body.classList.contains("crt")));

  /* ── Split headings into words for the reveal ──────────────────────── */
  $$(".split").forEach((h) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement("span");
            w.className = "w";
            const inner = document.createElement("span");
            inner.textContent = part;
            w.append(inner);
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(h);
    $$(".w > span", h).forEach((s, k) => (s.style.transitionDelay = `${k * 60}ms`));
  });

  /* ── Reveal on scroll + count-up ───────────────────────────────────── */
  const countUp = (el) => {
    const target = +el.dataset.count;
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    if (reduced) return;
    const t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = pre + Math.round(target * (1 - Math.pow(1 - p, 3))) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$("[data-count]", e.target).forEach(countUp);
      revealObserver.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal, .split").forEach((el, k) => {
    if (el.classList.contains("reveal")) {
      const siblings = el.parentElement ? $$(":scope > .reveal", el.parentElement) : [];
      el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 6) * 70}ms`;
    }
    revealObserver.observe(el);
  });

  /* ── Timeline: draw the line as you scroll ─────────────────────────── */
  const timeline = $("#timeline");
  const tlItems = $$(".tl-item");
  function updateTimeline() {
    if (!timeline) return;
    const r = timeline.getBoundingClientRect();
    const mid = innerHeight * 0.6;
    const h = Math.max(0, Math.min(r.height - 12, mid - r.top));
    timeline.style.setProperty("--tl", `${h}px`);
    tlItems.forEach((li) => {
      if (li.getBoundingClientRect().top + 30 < mid) li.classList.add("lit");
    });
  }
  updateTimeline();

  /* ── Pointer effects: glow and a light tilt ────────────────────────── */
  if (finePointer && !reduced) {
    const glow = $(".cursor-glow");
    let gx = 0, gy = 0, tx = 0, ty = 0;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add("on"); }, { passive: true });
    const loop = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();

    $$(".tilt, #portrait").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const b = card.getBoundingClientRect();
        const px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
        const k = card.id === "portrait" ? 4 : 2.5;
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * k}deg) rotateY(${(px - 0.5) * k}deg) translateY(-2px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ── CV dropdown ───────────────────────────────────────────────────── */
  const dd = $("#cv-dd");
  const ddBtn = $("button", dd);
  ddBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = !dd.classList.contains("open");
    dd.classList.toggle("open", open);
    ddBtn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", () => { dd.classList.remove("open"); ddBtn.setAttribute("aria-expanded", "false"); });

  /* ── Project filters ───────────────────────────────────────────────── */
  const filters = $$(".filter");
  filters.forEach((f) => f.addEventListener("click", () => {
    filters.forEach((x) => x.setAttribute("aria-pressed", String(x === f)));
    const tag = f.dataset.filter;
    $$("#project-grid .project").forEach((p) => {
      const show = tag === "all" || p.dataset.tags.split(" ").includes(tag);
      p.classList.toggle("hidden", !show);
      if (show) { p.classList.remove("in"); requestAnimationFrame(() => p.classList.add("in")); }
    });
  }));

  /* ── Case-study popups ─────────────────────────────────────────────── */
  const dialog = $("#case");
  const inner = $("#case-inner");
  let opener = null;
  const openCase = (id, push = true) => {
    const tpl = document.getElementById(`case-${id}`);
    if (!tpl) return;
    inner.replaceChildren(tpl.content.cloneNode(true));
    const close = document.createElement("button");
    close.className = "icon-btn case-close";
    close.setAttribute("aria-label", "Close case study");
    close.innerHTML = '<svg><use href="#i-close"/></svg>';
    close.addEventListener("click", () => dialog.close());
    $(".case-hero", inner).append(close);
    inner.scrollTop = 0;
    dialog.showModal();
    if (push) history.replaceState(null, "", `#case-${id}`);
  };
  $$("[data-case]").forEach((b) => b.addEventListener("click", () => { opener = b; openCase(b.dataset.case); }));
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => {
    history.replaceState(null, "", location.pathname + location.search);
    opener?.focus();
  });
  const fromHash = () => {
    if (location.hash.startsWith("#case-") && !dialog.open) openCase(location.hash.slice(6), false);
  };
  addEventListener("hashchange", fromHash);
  fromHash();

  /* ── Contact: mailto form ──────────────────────────────── */
  const form = $("#contact-form");
  const out = $("#form-out");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim(), email = form.email.value.trim(), msg = form.message.value.trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !msg) {
      out.style.color = "var(--red)";
      out.textContent = "All fields are required, with a valid email.";
      return;
    }
    out.style.color = "";
    out.textContent = "Opening your mail client…";
    const subject = encodeURIComponent(`Portfolio: ${name}`);
    const body = encodeURIComponent(`${msg}\n\nFrom: ${name}\nEmail: ${email}`);
    location.href = `mailto:medbennaima2021@gmail.com?subject=${subject}&body=${body}`;
    setTimeout(() => { out.textContent = "Ready to send. I reply within a day."; }, 900);
  });

  /* ── A flag for the curious ───────────────────────────────────────── */
  const FLAG = atob("TUJOe2gxcjNfbTNfZjByX3kwdXJfcGYzfQ==");
  console.log("%cThere's a flag in the page source. The footer takes it.", "font:12px monospace;color:#d4af37");
  $("#flag-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#flag");
    const ok = input.value.trim() === FLAG;
    toast(ok ? "Flag accepted. Nice." : "Not quite.", ok ? "ctf" : "ctf");
    if (ok) input.value = "";
  });

  /* ── Konami code toggles CRT mode ──────────────────────────────────── */
  const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let kPos = 0;
  addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kPos = key === konami[kPos] ? kPos + 1 : (key === konami[0] ? 1 : 0);
    if (kPos === konami.length) { kPos = 0; setCrt(!document.body.classList.contains("crt")); }
  });
})();
