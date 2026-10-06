/* Mohamed Ben Naima — portfolio interactions. No dependencies. */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  /* ── Toast ─────────────────────────────────────────────────────────── */
  const toast = (title, kicker = "") => {
    const t = $("#toast");
    $("#toast-k").textContent = kicker;
    $("#toast-v").textContent = title;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 3400);
  };

  /* ── Background: pixel starfield with parallax and the odd comet ───── */
  const sky = $("#sky");
  const ctx = sky.getContext("2d");
  const COLORS = ["#fbf3d9", "#ecd28c", "#d4af37", "#a78bfa", "#c9bdf0", "#8b5cf6"];
  let W = 0, H = 0, DPR = 1, stars = [], comet = null, lastComet = 0, rafId = 0;

  const seed = () => {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    sky.width = W * DPR; sky.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round(Math.min(W < 700 ? 140 : 320, (W * H) / 4800));
    stars = Array.from({ length: n }, () => {
      const depth = Math.random();                       // 0 far → 1 near
      return {
        x: Math.random() * W, y: Math.random() * H * 3, // spread over 3 screens for parallax
        s: depth > .92 ? 2 : 1 + (depth > .6 ? 1 : 0) * (Math.random() > .5),
        depth,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        tw: Math.random() * Math.PI * 2, sp: .6 + Math.random() * 1.6,
        cross: depth > .95,
      };
    });
  };

  let lastFrame = 0;
  const draw = (t) => {
    if (!reduced) {                                       // 30 fps is plenty for twinkling; halves the GPU work
      rafId = requestAnimationFrame(draw);
      if (t - lastFrame < 33) return;
      lastFrame = t;
    }
    ctx.clearRect(0, 0, W, H);
    const scroll = scrollY;
    for (const st of stars) {
      const par = .05 + st.depth * .25;
      const y = ((st.y - scroll * par) % (H * 3) + H * 3) % (H * 3);
      if (y > H) continue;
      const a = reduced ? .7 : .35 + .65 * Math.abs(Math.sin(st.tw + t * .001 * st.sp));
      ctx.globalAlpha = a * (.45 + st.depth * .55);
      ctx.fillStyle = st.c;
      const x = Math.round(st.x), yy = Math.round(y);
      ctx.fillRect(x, yy, st.s, st.s);
      if (st.cross && a > .8) {                          // a gold pixel sparkle on the brightest stars
        ctx.globalAlpha = (a - .8) * 3;
        ctx.fillRect(x - 2, yy, 1, 1); ctx.fillRect(x + st.s + 1, yy, 1, 1);
        ctx.fillRect(x, yy - 2, 1, 1); ctx.fillRect(x, yy + st.s + 1, 1, 1);
      }
    }
    if (!reduced) {
      if (!comet && t - lastComet > 7000 + Math.random() * 6000) {
        comet = { x: Math.random() * W * .6 + W * .3, y: Math.random() * H * .35, v: 7 + Math.random() * 4, life: 0 };
        lastComet = t;
      }
      if (comet) {
        comet.life += 1; comet.x -= comet.v; comet.y += comet.v * .45;
        for (let i = 0; i < 14; i++) {
          ctx.globalAlpha = (1 - i / 14) * Math.max(0, 1 - comet.life / 70);
          ctx.fillStyle = i < 2 ? "#fbf3d9" : "#d4af37";
          ctx.fillRect(Math.round(comet.x + i * 3), Math.round(comet.y - i * 1.35), 2, 2);
        }
        if (comet.life > 70 || comet.x < -40) comet = null;
      }
    }
    ctx.globalAlpha = 1;
  };

  seed();
  if (reduced) draw(0); else rafId = requestAnimationFrame(draw);
  let resizeT;
  addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(() => { seed(); if (reduced) draw(0); }, 150); });
  if (reduced) addEventListener("scroll", () => draw(0), { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (reduced) return;
    cancelAnimationFrame(rafId);
    if (!document.hidden) rafId = requestAnimationFrame(draw);
  });

  /* ── Nav: active section, XP bar, hide on scroll down, mobile menu ─── */
  const nav = $("#nav");
  const xpFill = $("#xp-fill");
  const links = $$(".nav-links a");
  const navLinks = $("#nav-links");
  let lastY = scrollY;

  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    xpFill.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    nav.classList.toggle("hide", y > lastY && y > 400 && !navLinks.classList.contains("open"));
    lastY = y;
    updateTimeline();
  };
  addEventListener("scroll", onScroll, { passive: true });

  const stageObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => stageObserver.observe(s));

  const menuBtn = $("#menu-btn");
  const setMenu = (open) => { navLinks.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", String(open)); };
  menuBtn.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
  links.forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ── CRT scanlines toggle (remembered) ─────────────────────────────── */
  const crtBtn = $("#crt-toggle");
  const setCrt = (on) => {
    document.body.classList.toggle("crt", on);
    crtBtn.setAttribute("aria-pressed", String(on));
    store.set("mbn-crt", on ? "1" : "0");
  };
  setCrt(store.get("mbn-crt") === "1");
  crtBtn.addEventListener("click", () => setCrt(!document.body.classList.contains("crt")));

  /* ── Reveal on scroll + count-up ───────────────────────────────────── */
  const countUp = (el) => {
    if (reduced) return;
    const target = +el.dataset.count, suf = el.dataset.suffix || "";
    const t0 = performance.now(), dur = 1300;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suf;
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
  $$(".reveal").forEach((el) => {
    const sibs = el.parentElement ? $$(":scope > .reveal", el.parentElement) : [];
    el.style.transitionDelay = `${Math.min(Math.max(sibs.indexOf(el), 0), 6) * 70}ms`;
    revealObserver.observe(el);
  });

  /* ── Timeline: draw the line as you scroll ─────────────────────────── */
  const timeline = $("#timeline");
  const tlItems = $$(".tl-item");
  function updateTimeline() {
    const r = timeline.getBoundingClientRect();
    const mid = innerHeight * 0.6;
    timeline.style.setProperty("--tl", `${Math.max(0, Math.min(r.height - 12, mid - r.top))}px`);
    tlItems.forEach((li) => { if (li.getBoundingClientRect().top + 24 < mid) li.classList.add("lit"); });
  }
  updateTimeline();

  /* ── Pointer: light tilt + gold glow on cartridges ─────────────────── */
  if (finePointer && !reduced) {
    $$(".tilt, #portrait").forEach((card) => {
      const label = $(".label", card);
      card.addEventListener("pointermove", (e) => {
        const b = card.getBoundingClientRect();
        const px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
        if (label) { label.style.setProperty("--mx", `${px * 100}%`); label.style.setProperty("--my", `${py * 100}%`); }
        const k = card.id === "portrait" ? 6 : 4;
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * k}deg) rotateY(${(px - 0.5) * k}deg) translateY(-3px)`;
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
    $$("#project-grid .cart").forEach((p) => {
      const show = tag === "all" || p.dataset.tags.split(" ").includes(tag);
      p.classList.toggle("hidden", !show);
      if (show) p.classList.add("in");
    });
  }));

  /* ── Case-study popups (deep-linkable: #case-<id>) ─────────────────── */
  const dialog = $("#case");
  const inner = $("#case-inner");
  let opener = null;
  const openCase = (id, push = true) => {
    const tpl = document.getElementById(`case-${id}`);
    if (!tpl) return;
    inner.replaceChildren(tpl.content.cloneNode(true));
    const close = document.createElement("button");
    close.className = "icon-btn case-close";
    close.setAttribute("aria-label", "Close");
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg"), use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#i-close"); svg.append(use); close.append(svg);
    close.addEventListener("click", () => dialog.close());
    $(".case-hero", inner).append(close);
    inner.scrollTop = 0;
    if (!dialog.open) dialog.showModal();
    if (push) history.replaceState(null, "", `#case-${id}`);
  };
  $$("[data-case]").forEach((b) => b.addEventListener("click", () => { opener = b; openCase(b.dataset.case); }));
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => {
    history.replaceState(null, "", location.pathname + location.search);
    opener?.focus();
  });
  const fromHash = () => { if (location.hash.startsWith("#case-")) openCase(location.hash.slice(6), false); };
  addEventListener("hashchange", fromHash);
  fromHash();

  /* ── Contact: mailto form ──────────────────────────────────────────── */
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
  });

  /* ── A flag for the curious ───────────────────────────────────────── */
  const FLAG = atob("TUJOe2gxcjNfbTNfZjByX3kwdXJfcGYzfQ==");
  console.log("%c★ BEN NAIMA ARCADE ★%c\nThere's a flag in the page source. The footer takes it.", "font:700 14px monospace;color:#d4af37", "font:12px monospace;color:#a78bfa");
  $("#flag-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#flag");
    const ok = input.value.trim() === FLAG;
    toast(ok ? "Flag accepted." : "Not quite.", ok ? "ACHIEVEMENT UNLOCKED" : "CTF");
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
    if (kPos === konami.length) { kPos = 0; setCrt(!document.body.classList.contains("crt")); toast("CRT mode", "↑↑↓↓←→←→BA"); }
  });
})();
