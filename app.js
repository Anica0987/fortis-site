import { supabase } from "./supabaseClient.js";
import {
  uid, todayISO, fmtDate, daysUntil, addDays, num, moneyFmt, lineTotal, quoteTotal, STATUS,
  loadKey, saveKey, uploadDocument, getDocumentUrl, deleteDocument, deleteAllOrderDocuments,
} from "./data.js";

const LOGO_SRC = "/logo.png";

const state = {
  view: "loading", // loading | landing | auth | dashboard
  session: null,
  orders: [],
  directory: [],
  tab: "overview",
  activeOrderId: null,
  waybillOrderId: null,
  quoteOrderId: null,
  showNewOrder: false,
  search: "",
  authMode: "login",
  authError: "",
  authInfo: "",
  authBusy: false,
};

const root = document.getElementById("app");

function icons() {
  if (window.lucide) window.lucide.createIcons();
}

function setState(patch) {
  Object.assign(state, patch);
  render();
}

function render() {
  if (state.view === "loading") {
    root.innerHTML = `<div class="loading-screen">
      <div style="color:#8A8175;font-family:var(--font-mono);letter-spacing:2px;font-size:13px;">LOADING FORTIS…</div>
    </div>`;
  } else if (state.view === "dashboard" && state.session) {
    root.innerHTML = renderDashboard();
    bindDashboardEvents();
  } else if (state.view === "auth") {
    root.innerHTML = renderAuth();
    bindAuthEvents();
  } else {
    root.innerHTML = renderLanding();
    bindLandingEvents();
  }
  icons();
}

/* ============================== INIT / AUTH ============================== */
async function init() {
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  state.view = data.session ? "dashboard" : "landing";
  if (data.session) await loadBusinessData();
  render();

  supabase.auth.onAuthStateChange(async (_event, sess) => {
    state.session = sess;
    state.view = sess ? "dashboard" : "landing";
    if (sess) await loadBusinessData();
    render();
  });
}

async function loadBusinessData() {
  const [o, d] = await Promise.all([
    loadKey("fortis-orders", []),
    loadKey("fortis-directory", []),
  ]);
  state.orders = o;
  state.directory = d;
}

async function logout() {
  await supabase.auth.signOut();
  state.view = "landing";
  render();
}

/* ============================== LANDING PAGE ============================== */
function renderLanding() {
  return `
  <div style="background:var(--cream);font-family:var(--font-body);color:var(--ink);min-height:100vh;">
    <div class="nav-bar transparent" id="nav-bar">
      <div style="display:flex;align-items:center;gap:12px;">
        <img src="${LOGO_SRC}" alt="Fortis" style="height:44px;width:auto;" onerror="this.style.display='none'">
        <span id="nav-word" style="font-family:var(--font-display);font-weight:700;font-size:22px;letter-spacing:.3px;color:#fff;">FORTIS</span>
      </div>
      <button id="btn-login-1" class="btn-amber"><i data-lucide="log-in" style="width:16px;height:16px;"></i> Admin login</button>
    </div>

    <div class="hero-wrap" id="hero-wrap">
      <div class="hero-sticky">
        <video autoplay muted loop playsinline preload="auto" poster="fortis-hero-poster.jpg">
          <source src="fortis-hero.mp4" type="video/mp4">
        </video>
        <div class="hero-vignette"></div>

        <div id="hero-headline" style="position:absolute;top:16%;left:0;right:0;text-align:center;pointer-events:none;transition:opacity .2s linear;">
          <div style="font-family:var(--font-mono);font-size:12.5px;letter-spacing:4px;color:#F2C6AE;margin-bottom:16px;">FREIGHT · CAMPUS DELIVERY · SOUTH AFRICA</div>
          <h1 style="font-family:var(--font-hero);font-weight:500;font-size:clamp(38px,6.4vw,84px);line-height:1.04;margin:0;color:#fff;text-shadow:0 6px 30px rgba(0,0,0,.35);">
            Goods moved.<br><span style="font-style:italic;color:#F2C6AE;">Paperwork sorted.</span>
          </h1>
          <p style="font-family:var(--font-body);font-size:18px;color:rgba(255,255,255,.82);max-width:560px;margin:24px auto 0;line-height:1.55;">
            Quotes, purchase orders, transfer bookings and signed waybills — tracked from first request to the moment goods are signed for at the gate.
          </p>
        </div>

        <div class="manifest-card" id="mc-1" data-range="0.14,0.42" style="left:6%;">
          ${manifestBox("TRACK RECORD", "210+", "Schools served", "Across 5 provinces")}
        </div>
        <div class="manifest-card" id="mc-2" data-range="0.40,0.68" style="right:6%;">
          ${manifestBox("PERFORMANCE", "98.6%", "On-time delivery", "Last 12 months")}
        </div>
        <div class="manifest-card" id="mc-3" data-range="0.66,0.94" style="left:6%;">
          ${manifestBox("TURNAROUND", "6.2 hrs", "Avg. transit time", "Depot to campus gate")}
        </div>

        <div id="hero-closing" style="position:absolute;bottom:10%;left:0;right:0;text-align:center;pointer-events:none;opacity:0;">
          <div style="font-family:var(--font-hero);font-style:italic;font-size:26px;letter-spacing:.3px;color:#fff;">Every delivery, documented.</div>
        </div>

        <div id="scroll-cue" style="position:absolute;bottom:26px;left:50%;transform:translateX(-50%);font-family:var(--font-mono);font-size:11px;letter-spacing:3px;color:rgba(255,255,255,.55);">SCROLL ↓</div>
      </div>
    </div>

    <div style="padding:120px 8vw;background:var(--cream);">
      <div style="font-family:var(--font-mono);font-size:12px;letter-spacing:3px;color:var(--amber);margin-bottom:16px;">HOW A DELIVERY MOVES THROUGH FORTIS</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:34px;margin-top:30px;">
        ${processCard(0, "file-text", "Quote issued", "A request comes in and a quote is attached to the job file.")}
        ${processCard(1, "clipboard-check", "PO confirmed", "Once the school signs off, the purchase order is attached and the job is locked in.")}
        ${processCard(2, "calendar-clock", "Transfer booked", "A reminder flags the job until transport is scheduled, with vehicle and driver recorded.")}
        ${processCard(3, "package", "Waybill signed", "On delivery a waybill is generated and signed by the receiving contact at the gate.")}
      </div>
    </div>

    <div style="padding:100px 8vw 130px;background:var(--navy2);text-align:center;">
      <div style="font-family:var(--font-hero);font-weight:500;font-style:italic;font-size:clamp(28px,4vw,46px);color:#fff;">Run your fleet from one screen.</div>
      <p style="color:rgba(255,255,255,.6);margin-top:16px;max-width:480px;margin-left:auto;margin-right:auto;line-height:1.6;">Admin access only — built for the Fortis operations team.</p>
      <button id="btn-login-2" class="btn-amber" style="margin-top:30px;padding:15px 32px;font-size:16px;">Open admin login <i data-lucide="arrow-right" style="width:18px;height:18px;"></i></button>
    </div>

    <div style="padding:24px 8vw;background:var(--cream);border-top:1px solid var(--sand);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;">
      <span style="font-family:var(--font-mono);font-size:12px;color:#8A8175;">© ${new Date().getFullYear()} FORTIS · fortis.org.za</span>
      <span style="font-family:var(--font-mono);font-size:12px;color:#8A8175;">OPERATIONS PORTAL</span>
    </div>
  </div>`;
}
function manifestBox(eyebrow, value, label, sub) {
  return `<div class="box">
    <div class="badge-circle"><i data-lucide="shield-check" style="width:18px;height:18px;color:var(--amber);"></i></div>
    <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:2px;color:#F2C6AE;margin-bottom:6px;">${eyebrow}</div>
    <div style="font-family:var(--font-hero);font-weight:500;font-size:30px;color:#fff;line-height:1;">${value}</div>
    <div style="font-family:var(--font-display);font-size:14px;color:#fff;margin-top:6px;letter-spacing:.3px;">${label}</div>
    <div style="font-family:var(--font-body);font-size:12px;color:rgba(244,242,236,.6);margin-top:4px;">${sub}</div>
  </div>`;
}
function processCard(i, icon, title, desc) {
  return `<div class="process-card ${i % 2 !== 0 ? "odd" : ""}">
    <i data-lucide="${icon}" style="width:24px;height:24px;color:${i % 2 === 0 ? "var(--blue)" : "var(--amber)"};"></i>
    <div style="font-family:var(--font-hero);font-weight:500;font-size:23px;margin-top:14px;letter-spacing:.2px;color:var(--ink);">${title}</div>
    <div style="font-family:var(--font-body);font-size:14.5px;color:#6B6355;margin-top:8px;line-height:1.6;">${desc}</div>
  </div>`;
}

function bindLandingEvents() {
  document.getElementById("btn-login-1")?.addEventListener("click", () => setState({ view: "auth" }));
  document.getElementById("btn-login-2")?.addEventListener("click", () => setState({ view: "auth" }));

  const heroWrap = document.getElementById("hero-wrap");
  const navBar = document.getElementById("nav-bar");
  const navWord = document.getElementById("nav-word");
  const headline = document.getElementById("hero-headline");
  const closing = document.getElementById("hero-closing");
  const scrollCue = document.getElementById("scroll-cue");
  const cards = [1, 2, 3].map((n) => document.getElementById(`mc-${n}`));

  function onScroll() {
    if (!heroWrap) return;
    const rect = heroWrap.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const p = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;

    if (window.scrollY > window.innerHeight * 0.5) {
      navBar.classList.remove("transparent"); navBar.classList.add("solid");
      navWord.style.color = "var(--ink)";
    } else {
      navBar.classList.add("transparent"); navBar.classList.remove("solid");
      navWord.style.color = "#fff";
    }
    if (headline) headline.style.opacity = 1 - Math.min(p / 0.18, 1);
    if (closing) closing.style.opacity = Math.min(Math.max((p - 0.85) / 0.15, 0), 1);
    if (scrollCue) scrollCue.style.opacity = 1 - Math.min(p / 0.08, 1);

    cards.forEach((el) => {
      if (!el) return;
      const [a, b] = el.dataset.range.split(",").map(Number);
      const visible = p >= a && p <= b;
      const side = el.style.left ? "left" : "right";
      el.style.opacity = visible ? 1 : 0;
      el.style.transform = `translateY(-50%) translateX(${visible ? "0" : side === "left" ? "-40px" : "40px"})`;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ============================== AUTH PAGE ============================== */
function renderAuth() {
  const isRegister = state.authMode === "register";
  return `
  <div style="min-height:100vh;background:var(--cream);display:flex;align-items:center;justify-content:center;font-family:var(--font-body);padding:20px;position:relative;">
    <div style="position:absolute;top:24px;left:32px;">
      <button id="btn-back" style="background:none;border:none;color:#8A8175;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:var(--font-body);font-size:14px;">
        <i data-lucide="chevron-left" style="width:16px;height:16px;"></i> Back to site
      </button>
    </div>
    <div style="width:400px;max-width:100%;background:var(--card);border:1px solid var(--sand);border-radius:8px;padding:36px;box-shadow:0 20px 60px rgba(33,30,26,.08);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <img src="${LOGO_SRC}" alt="Fortis" style="height:52px;width:auto;" onerror="this.style.display='none'">
        <span style="font-family:var(--font-display);font-weight:700;font-size:22px;color:var(--ink);letter-spacing:.3px;">FORTIS</span>
      </div>
      <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:2px;color:var(--amber);margin-bottom:24px;">OPERATIONS PORTAL</div>
      <h2 style="font-family:var(--font-hero);font-weight:500;font-size:26px;color:var(--ink);margin:0 0 4px;">${isRegister ? "Create an account" : "Sign in"}</h2>
      <p style="color:#8A8175;font-size:13.5px;margin:0 0 22px;">${isRegister ? "Set up your login for the Fortis operations portal." : "Enter your credentials to continue."}</p>

      <form id="auth-form">
        <label style="display:block;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:#8A8175;margin-bottom:6px;margin-top:14px;">Email</label>
        <input id="auth-email" type="email" class="dash-input" placeholder="you@fortis.org.za" autofocus>
        <label style="display:block;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:#8A8175;margin-bottom:6px;margin-top:14px;">Password</label>
        <input id="auth-password" type="password" class="dash-input" placeholder="••••••••">
        ${isRegister ? `
        <label style="display:block;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:#8A8175;margin-bottom:6px;margin-top:14px;">Confirm password</label>
        <input id="auth-confirm" type="password" class="dash-input" placeholder="••••••••">` : ""}
        ${state.authError ? `<div style="color:var(--red);font-size:13px;margin-top:8px;">${state.authError}</div>` : ""}
        ${state.authInfo ? `<div style="color:var(--green);font-size:13px;margin-top:8px;">${state.authInfo}</div>` : ""}
        <button type="submit" ${state.authBusy ? "disabled" : ""} class="btn-amber" style="width:100%;margin-top:20px;padding:13px 0;font-size:16px;justify-content:center;opacity:${state.authBusy ? 0.7 : 1};">
          ${state.authBusy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </button>
      </form>
      <div style="margin-top:18px;text-align:center;display:flex;flex-direction:column;gap:8px;">
        <button id="btn-switch-mode" style="background:none;border:none;color:var(--blue);cursor:pointer;font-size:13.5px;font-family:var(--font-body);">
          ${isRegister ? "Already have an account? Sign in" : "Need an account? Create one"}
        </button>
        ${!isRegister ? `<button id="btn-forgot" style="background:none;border:none;color:#8A8175;cursor:pointer;font-size:12.5px;font-family:var(--font-body);">Forgot password?</button>` : ""}
      </div>
    </div>
  </div>`;
}

function bindAuthEvents() {
  document.getElementById("btn-back")?.addEventListener("click", () => setState({ view: "landing", authError: "", authInfo: "" }));
  document.getElementById("btn-switch-mode")?.addEventListener("click", () => {
    setState({ authMode: state.authMode === "login" ? "register" : "login", authError: "", authInfo: "" });
  });
  document.getElementById("btn-forgot")?.addEventListener("click", async () => {
    const email = document.getElementById("auth-email").value.trim();
    if (!email) { setState({ authError: "Enter your email above first, then tap this again." }); return; }
    setState({ authBusy: true, authError: "" });
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setState({ authBusy: false, authError: error ? error.message : "", authInfo: error ? "" : "Password reset email sent — check your inbox." });
  });
  document.getElementById("auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    setState({ authError: "", authInfo: "" });

    if (state.authMode === "register") {
      const confirm = document.getElementById("auth-confirm").value;
      if (password.length < 6) { setState({ authError: "Use a password of at least 6 characters." }); return; }
      if (password !== confirm) { setState({ authError: "Passwords don't match." }); return; }
      setState({ authBusy: true });
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setState({ authBusy: false, authError: error.message }); return; }
      if (data.session) { setState({ authBusy: false }); return; }
      setState({ authBusy: false, authMode: "login", authInfo: "Account created — check your email to confirm it, then sign in." });
      return;
    }

    setState({ authBusy: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState({ authBusy: false, authError: error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message });
    } else {
      setState({ authBusy: false });
    }
  });
}

/* ============================== DASHBOARD ============================== */
function renderDashboard() {
  const orders = state.orders;
  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const awaitingTransfer = active.filter((o) => !o.transfer.booked && o.status === "confirmed");
  const inTransit = orders.filter((o) => o.status === "booked");
  const now = new Date();
  const deliveredThisMonth = orders.filter((o) => {
    if (!o.waybill) return false;
    const d = new Date(o.waybill.deliveredDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const reminders = orders
    .filter((o) => o.status === "confirmed" && !o.transfer.booked)
    .map((o) => {
      const rd = o.transfer.reminderDate || (o.deliveryDate ? addDays(o.deliveryDate, -3) : null);
      return { order: o, reminderDate: rd, days: rd ? daysUntil(rd) : null };
    })
    .filter((r) => r.reminderDate)
    .sort((a, b) => a.days - b.days);

  const NAV = [
    { id: "overview", label: "Overview", icon: "clipboard-check" },
    { id: "orders", label: "Orders", icon: "package" },
    { id: "reminders", label: "Reminders", icon: "bell", count: reminders.filter((r) => r.days <= 2).length },
    { id: "contacts", label: "Schools & contacts", icon: "school" },
    { id: "waybills", label: "Waybills", icon: "file-text" },
  ];

  return `
  <div class="dash-layout">
    <div class="sidebar">
      <div style="padding:20px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--sand);">
        <img src="${LOGO_SRC}" style="height:40px;width:auto;" alt="Fortis" onerror="this.style.display='none'">
        <span style="font-family:var(--font-display);font-weight:700;font-size:18px;letter-spacing:.3px;">FORTIS</span>
      </div>
      <div style="padding:16px 12px;flex:1;">
        ${NAV.map((n) => `
          <button class="sidebar-nav-btn ${state.tab === n.id ? "active" : ""}" data-tab="${n.id}">
            <i data-lucide="${n.icon}" style="width:17px;height:17px;"></i> ${n.label}
            ${n.count ? `<span style="margin-left:auto;background:var(--red);color:#fff;font-size:10.5px;border-radius:10px;padding:1px 6px;font-family:var(--font-mono);">${n.count}</span>` : ""}
          </button>`).join("")}
      </div>
      <div style="padding:16px 20px;border-top:1px solid var(--sand);">
        <div style="font-size:12.5px;color:#8A8175;margin-bottom:8px;">Signed in as <b style="color:var(--ink);">${state.session.user.email}</b></div>
        <button id="btn-logout" class="btn-ghost" style="width:100%;justify-content:center;"><i data-lucide="log-out" style="width:14px;height:14px;"></i> Log out</button>
      </div>
    </div>
    <div class="dash-main">
      ${state.tab === "overview" ? renderOverview(active, awaitingTransfer, inTransit, deliveredThisMonth, reminders) : ""}
      ${state.tab === "orders" ? renderOrdersTab(orders) : ""}
      ${state.tab === "reminders" ? renderRemindersTab(reminders) : ""}
      ${state.tab === "contacts" ? renderContactsTab() : ""}
      ${state.tab === "waybills" ? renderWaybillsTab(orders) : ""}
    </div>
  </div>
  ${state.showNewOrder ? renderNewOrderModal() : ""}
  ${state.activeOrderId ? renderOrderDetailModal(orders.find((o) => o.id === state.activeOrderId)) : ""}
  ${state.waybillOrderId ? renderWaybillView(orders.find((o) => o.id === state.waybillOrderId)) : ""}
  ${state.quoteOrderId ? renderQuoteView(orders.find((o) => o.id === state.quoteOrderId)) : ""}
  `;
}

function pageHeader(title, sub, actionLabel, actionId) {
  return `<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:22px;">
    <div><h1 style="font-family:var(--font-display);font-size:30px;margin:0;color:var(--ink);">${title}</h1>
    <div style="font-size:13.5px;color:#8A8175;">${sub}</div></div>
    ${actionLabel ? `<button id="${actionId}" class="btn-amber"><i data-lucide="plus" style="width:16px;height:16px;"></i> ${actionLabel}</button>` : ""}
  </div>`;
}
function badgeHtml(status) {
  const s = STATUS[status] || STATUS.quote;
  return `<span class="badge" style="background:${s.bg};color:${s.color};">${s.label}</span>`;
}
function orderRowHtml(o, opts = {}) {
  return `<div class="order-row" data-order-row="${o.id}">
    <div>
      <div style="font-family:var(--font-display);font-size:16px;">${escapeHtml(o.school)}</div>
      <div style="font-size:12.5px;color:#8A8175;">Quote ${escapeHtml(o.quote.number)}${o.po.attached ? ` · PO ${escapeHtml(o.po.number)}` : ""}${opts.detailed && o.deliveryDate ? ` · Delivery ${fmtDate(o.deliveryDate)}` : ""}</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      ${badgeHtml(o.status)}
      ${opts.deletable ? `<button data-delete-order="${o.id}" style="background:none;border:none;cursor:pointer;color:#B0AA9C;display:flex;"><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>` : ""}
      <i data-lucide="chevron-right" style="width:16px;height:16px;color:#B0AA9C;"></i>
    </div>
  </div>`;
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderOverview(active, awaitingTransfer, inTransit, deliveredThisMonth, reminders) {
  return `
  ${pageHeader("Overview", "Today at a glance", "New request", "btn-new-order")}
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:30px;">
    ${statCard("Active jobs", active.length, "package", "var(--blue)")}
    ${statCard("Awaiting transfer booking", awaitingTransfer.length, "calendar-clock", "var(--amber)")}
    ${statCard("In transit", inTransit.length, "truck", "#8A6FD8")}
    ${statCard("Delivered this month", deliveredThisMonth.length, "check-circle-2", "var(--green)")}
  </div>
  <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:20px;">
    <div class="panel">
      <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:#8A8175;text-transform:uppercase;margin-bottom:10px;">Recent orders</div>
      ${state.orders.slice(0, 6).map((o) => orderRowHtml(o)).join("") || emptyNote("No requests yet — create your first one.")}
    </div>
    <div class="panel">
      <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:#8A8175;text-transform:uppercase;margin-bottom:10px;">Upcoming transfer reminders</div>
      ${reminders.slice(0, 6).map((r) => reminderRowHtml(r)).join("") || emptyNote("No pending reminders.")}
    </div>
  </div>`;
}
function statCard(label, value, icon, color) {
  return `<div class="stat-card">
    <i data-lucide="${icon}" style="width:18px;height:18px;color:${color};"></i>
    <div style="font-family:var(--font-hero);font-size:30px;margin-top:8px;color:var(--ink);">${value}</div>
    <div style="font-size:12.5px;color:#8A8175;margin-top:2px;">${label}</div>
  </div>`;
}
function reminderRowHtml(r) {
  const color = r.days < 0 ? "var(--red)" : r.days <= 2 ? "var(--amberDeep)" : "#8A8175";
  const txt = r.days < 0 ? `${Math.abs(r.days)}d overdue` : r.days === 0 ? "Today" : `${r.days}d`;
  return `<div data-order-row="${r.order.id}" style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #E4E1D6;cursor:pointer;">
    <div><div style="font-family:var(--font-display);font-size:15px;">${escapeHtml(r.order.school)}</div><div style="font-size:12px;color:#8A8175;">${fmtDate(r.reminderDate)}</div></div>
    <span style="font-family:var(--font-mono);font-size:12px;color:${color};">${txt}</span>
  </div>`;
}
function emptyNote(txt) { return `<div style="font-size:13.5px;color:#8A8578;padding:10px 0;">${txt}</div>`; }

function renderOrdersTab(orders) {
  const filtered = orders.filter((o) =>
    o.school.toLowerCase().includes(state.search.toLowerCase()) ||
    o.quote.number.toLowerCase().includes(state.search.toLowerCase()) ||
    (o.po.number || "").toLowerCase().includes(state.search.toLowerCase())
  );
  return `
  ${pageHeader("Orders", `${orders.length} total requests`, "New request", "btn-new-order")}
  <div style="display:flex;align-items:center;background:#fff;border:1px solid #D8D4C8;border-radius:4px;padding:8px 12px;margin-bottom:16px;max-width:360px;">
    <i data-lucide="search" style="width:15px;height:15px;color:#8A8578;"></i>
    <input id="orders-search" value="${escapeHtml(state.search)}" placeholder="Search school, quote or PO number" style="border:none;outline:none;margin-left:8px;font-size:14px;width:100%;">
  </div>
  <div class="panel">
    ${filtered.map((o) => orderRowHtml(o, { detailed: true, deletable: true })).join("") || emptyNote("No matching orders.")}
  </div>`;
}
function renderRemindersTab(reminders) {
  return `
  ${pageHeader("Reminders", "Book transfers before it's too late")}
  <div class="panel">
    ${reminders.map((r) => {
      const color = r.days < 0 ? "var(--red)" : r.days <= 2 ? "var(--amberDeep)" : "#8A8175";
      const icon = r.days < 0 ? "alert-triangle" : r.days <= 2 ? "bell" : "clock";
      const txt = r.days < 0 ? `${Math.abs(r.days)}d overdue` : r.days === 0 ? "Book today" : `Book in ${r.days}d`;
      return `<div data-order-row="${r.order.id}" style="display:flex;justify-content:space-between;align-items:center;padding:13px 4px;border-bottom:1px solid #E4E1D6;cursor:pointer;">
        <div style="display:flex;align-items:center;gap:12px;">
          <i data-lucide="${icon}" style="width:18px;height:18px;color:${color};"></i>
          <div><div style="font-family:var(--font-display);font-size:16px;">${escapeHtml(r.order.school)}</div>
          <div style="font-size:12.5px;color:#8A8175;">Delivery due ${fmtDate(r.order.deliveryDate)} · Quote ${escapeHtml(r.order.quote.number)}</div></div>
        </div>
        <span style="font-family:var(--font-mono);font-size:12.5px;color:${color};">${txt}</span>
      </div>`;
    }).join("") || emptyNote("Nothing needs attention right now.")}
  </div>`;
}
function renderContactsTab() {
  return `
  ${pageHeader("Schools & contacts", "Reusable contact directory")}
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;">
    ${state.directory.map((d) => `
      <div style="background:#fff;border:1px solid #E4E1D6;border-radius:6px;padding:16px;">
        <div style="font-family:var(--font-display);font-size:17px;display:flex;align-items:center;gap:8px;"><i data-lucide="school" style="width:16px;height:16px;color:var(--blue);"></i> ${escapeHtml(d.school)}</div>
        <div style="font-size:12.5px;color:#8A8175;margin-top:2px;margin-bottom:10px;">${escapeHtml(d.address || "")}</div>
        ${(d.contacts || []).map((c) => `<div style="font-size:13px;margin-bottom:6px;"><b>${escapeHtml(c.name)}</b> <span style="color:#8A8175;">· ${escapeHtml(c.role)}</span><br><span style="color:#8A8175;font-size:12px;">${escapeHtml(c.phone)} ${c.email ? `· ${escapeHtml(c.email)}` : ""}</span></div>`).join("")}
      </div>`).join("") || emptyNote("Contacts are saved automatically when you create a request.")}
  </div>`;
}
function renderWaybillsTab(orders) {
  const withWaybill = orders.filter((o) => o.waybill);
  return `
  ${pageHeader("Waybills", "Signed proof of delivery")}
  <div class="panel">
    ${withWaybill.map((o) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 4px;border-bottom:1px solid #E4E1D6;">
        <div><div style="font-family:var(--font-mono);font-size:14px;">${escapeHtml(o.waybill.number)}</div>
        <div style="font-size:12.5px;color:#8A8175;">${escapeHtml(o.school)} · Delivered ${fmtDate(o.waybill.deliveredDate)}</div></div>
        <button data-view-waybill="${o.id}" class="btn-ghost"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</button>
      </div>`).join("") || emptyNote("No waybills generated yet.")}
  </div>`;
}

/* ============================== DASHBOARD EVENTS ============================== */
function bindDashboardEvents() {
  document.getElementById("btn-logout")?.addEventListener("click", logout);
  document.querySelectorAll(".sidebar-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => setState({ tab: btn.dataset.tab }));
  });
  document.getElementById("btn-new-order")?.addEventListener("click", () => setState({ showNewOrder: true }));
  document.getElementById("orders-search")?.addEventListener("input", (e) => {
    state.search = e.target.value; // avoid full re-render per keystroke losing focus; re-render but keep cursor via re-focus
    renderOrdersTabInPlace();
  });
  document.querySelectorAll("[data-order-row]").forEach((el) => {
    el.addEventListener("click", () => setState({ activeOrderId: el.dataset.orderRow }));
  });
  document.querySelectorAll("[data-delete-order]").forEach((el) => {
    el.addEventListener("click", (e) => { e.stopPropagation(); deleteOrder(el.dataset.deleteOrder); });
  });
  document.querySelectorAll("[data-view-waybill]").forEach((el) => {
    el.addEventListener("click", () => setState({ waybillOrderId: el.dataset.viewWaybill }));
  });

  if (state.showNewOrder) bindNewOrderModalEvents();
  if (state.activeOrderId) bindOrderDetailEvents();
  if (state.waybillOrderId) {
    const closeWb = () => setState({ waybillOrderId: null });
    document.getElementById("waybill-backdrop")?.addEventListener("click", closeWb);
    document.getElementById("btn-close-waybill")?.addEventListener("click", closeWb);
    document.getElementById("btn-close-waybill-x")?.addEventListener("click", closeWb);
    document.getElementById("btn-print-waybill")?.addEventListener("click", () => window.print());
  }
  if (state.quoteOrderId) {
    const closeQt = () => setState({ quoteOrderId: null });
    document.getElementById("quote-view-backdrop")?.addEventListener("click", closeQt);
    document.getElementById("btn-close-quote")?.addEventListener("click", closeQt);
    document.getElementById("btn-close-quote-x")?.addEventListener("click", closeQt);
    document.getElementById("btn-print-quote")?.addEventListener("click", () => window.print());
  }
}
function renderOrdersTabInPlace() {
  // lightweight re-render of just the orders list + count, so the search input keeps focus
  const container = document.querySelector(".dash-main");
  if (!container) return;
  const activeEl = document.activeElement;
  const cursorPos = activeEl && activeEl.id === "orders-search" ? activeEl.selectionStart : null;
  container.innerHTML = renderOrdersTab(state.orders);
  icons();
  const input = document.getElementById("orders-search");
  if (input) { input.focus(); if (cursorPos !== null) input.setSelectionRange(cursorPos, cursorPos); }
  document.getElementById("btn-new-order")?.addEventListener("click", () => setState({ showNewOrder: true }));
  document.getElementById("orders-search")?.addEventListener("input", (e) => { state.search = e.target.value; renderOrdersTabInPlace(); });
  document.querySelectorAll("[data-order-row]").forEach((el) => el.addEventListener("click", () => setState({ activeOrderId: el.dataset.orderRow })));
  document.querySelectorAll("[data-delete-order]").forEach((el) => el.addEventListener("click", (e) => { e.stopPropagation(); deleteOrder(el.dataset.deleteOrder); }));
}

/* ============================== ORDER PERSISTENCE ============================== */
function persistOrders(list) { state.orders = list; saveKey("fortis-orders", list); }
function persistDirectory(list) { state.directory = list; saveKey("fortis-directory", list); }

async function createOrder(order) {
  persistOrders([order, ...state.orders]);
  const existing = state.directory.find((d) => d.school === order.school);
  if (!existing) persistDirectory([...state.directory, { id: uid(), school: order.school, address: order.address, contacts: order.contacts }]);
  setState({ showNewOrder: false });
}
function updateOrder(updated) {
  persistOrders(state.orders.map((o) => (o.id === updated.id ? updated : o)));
  render();
}
async function deleteOrder(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;
  if (!window.confirm(`Delete the request for ${order.school}? This removes the order and any attached documents — it can't be undone.`)) return;
  persistOrders(state.orders.filter((o) => o.id !== orderId));
  await deleteAllOrderDocuments(orderId);
  setState({ activeOrderId: null });
}

/* ============================== SHARED ITEM/CONTACT ROW TEMPLATES ============================== */
function goodsItemRowHtml(g) {
  return `<div class="item-card" data-goods-row="${g.id}">
    <button type="button" data-remove-goods="${g.id}" style="position:absolute;top:6px;right:6px;background:none;border:none;cursor:pointer;color:#B0AA9C;"><i data-lucide="x" style="width:14px;height:14px;"></i></button>
    <input class="dash-input" style="margin-bottom:6px;" placeholder="Item — e.g. Classroom desks" data-g-name value="${escapeHtml(g.name || "")}">
    <div style="display:grid;grid-template-columns:1fr 1.4fr 1.4fr;gap:6px;margin-bottom:6px;">
      <input class="dash-input" placeholder="Qty" data-g-qty value="${escapeHtml(g.quantity || "1")}">
      <input class="dash-input" placeholder="Unit price (R)" data-g-price value="${escapeHtml(g.unitPrice || "")}">
      <input class="dash-input" placeholder="Supplied / installed by" data-g-installer value="${escapeHtml(g.installer || "")}">
    </div>
    <input class="dash-input" style="margin-bottom:8px;" placeholder="Notes (optional)" data-g-notes value="${escapeHtml(g.notes || "")}">
    <div data-g-docs></div>
    <div data-g-attach></div>
  </div>`;
}
function contactRowHtml(c) {
  return `<div class="item-card" data-contact-row="${c.id}">
    <button type="button" data-remove-contact="${c.id}" style="position:absolute;top:6px;right:6px;background:none;border:none;cursor:pointer;color:#B0AA9C;"><i data-lucide="x" style="width:14px;height:14px;"></i></button>
    <input class="dash-input" style="margin-bottom:6px;" placeholder="Full name" data-c-name value="${escapeHtml(c.name || "")}">
    <input class="dash-input" style="margin-bottom:6px;" placeholder="Role (e.g. Facilities Manager)" data-c-role value="${escapeHtml(c.role || "")}">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
      <input class="dash-input" placeholder="Phone" data-c-phone value="${escapeHtml(c.phone || "")}">
      <input class="dash-input" placeholder="Email" data-c-email value="${escapeHtml(c.email || "")}">
    </div>
  </div>`;
}
function attachmentsListHtml(documents) {
  if (!documents || documents.length === 0) return "";
  return `<div style="margin-bottom:10px;">
    ${documents.map((doc) => `
      <div class="doc-line" data-doc-id="${doc.id}">
        <i data-lucide="file-text" style="width:15px;height:15px;color:var(--blue);flex-shrink:0;"></i>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(doc.name)}</div>
          <div style="font-size:11px;color:#8A8175;">${fmtDate((doc.uploadedAt || "").slice(0, 10))}</div>
        </div>
        <button type="button" data-open-doc="${doc.path}" style="background:none;border:none;cursor:pointer;color:var(--blue);display:flex;align-items:center;"><i data-lucide="eye" style="width:16px;height:16px;"></i></button>
        <button type="button" data-remove-doc="${doc.id}" style="background:none;border:none;cursor:pointer;color:#B0AA9C;"><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>
      </div>`).join("")}
  </div>`;
}
function attachButtonHtml(label, inputId) {
  return `<div>
    <input type="file" accept="image/*,.pdf" id="${inputId}" style="display:none;">
    <button type="button" data-trigger-attach="${inputId}" class="btn-ghost" style="font-size:13px;padding:8px 14px;"><i data-lucide="paperclip" style="width:14px;height:14px;"></i> ${label}</button>
  </div>`;
}
function bindOpenDocButtons(container) {
  container.querySelectorAll("[data-open-doc]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const url = await getDocumentUrl(btn.dataset.openDoc);
      if (url) window.open(url, "_blank"); else alert("Couldn't open that file — try again.");
    });
  });
}
function bindAttachTrigger(container, inputId, onFile) {
  const input = container.querySelector(`#${inputId}`);
  const btn = container.querySelector(`[data-trigger-attach="${inputId}"]`);
  if (!input || !btn) return;
  btn.addEventListener("click", () => input.click());
  input.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const origLabel = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> Uploading…`;
    icons();
    try { await onFile(file); }
    catch (err) { alert("Upload failed — try again."); }
    btn.disabled = false;
  });
}

/* ============================== NEW ORDER MODAL ============================== */
let newOrderDraft = null;
function freshNewOrderDraft() {
  return {
    id: uid(),
    goodsItems: [{ id: uid(), name: "", quantity: "1", unitPrice: "", installer: "", notes: "", documents: [] }],
    contacts: [{ id: uid(), name: "", role: "", phone: "", email: "" }],
    quoteDoc: null,
  };
}
function renderNewOrderModal() {
  if (!newOrderDraft) newOrderDraft = freshNewOrderDraft();
  const d = newOrderDraft;
  return `
  <div class="modal-backdrop" id="new-order-backdrop">
    <div class="modal-shell wide" onclick="event.stopPropagation()">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <h2 style="font-family:var(--font-display);font-size:22px;color:var(--ink);margin:0;">New delivery request</h2>
        <button id="btn-close-new-order" style="background:none;border:none;cursor:pointer;color:#8A8578;"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
      </div>

      <div class="field"><label>Receiving school</label>
        <input id="no-school" class="dash-input" list="school-list" placeholder="e.g. Hoërskool Waterkloof">
        <datalist id="school-list">${state.directory.map((s) => `<option value="${escapeHtml(s.school)}">`).join("")}</datalist>
      </div>
      <div class="field"><label>Delivery address</label><input id="no-address" class="dash-input" placeholder="Street, suburb, town"></div>

      <div class="section-title">Items being requested</div>
      <div id="no-goods-list">${d.goodsItems.map(goodsItemRowHtml).join("")}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <button type="button" id="no-add-goods" class="btn-ghost" style="font-size:13px;padding:7px 12px;"><i data-lucide="plus" style="width:14px;height:14px;"></i> Add item</button>
        <div id="no-goods-total" style="font-family:var(--font-display);font-size:16px;color:var(--ink);"></div>
      </div>

      <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:26px;">
        <div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="field"><label>Quote number</label><input id="no-quote-number" class="dash-input" placeholder="Q-2026-0114"></div>
            <div class="field"><label>Quote date</label><input id="no-quote-date" type="date" class="dash-input" value="${todayISO()}"></div>
          </div>
          <div class="field"><label>Requested delivery date</label><input id="no-delivery-date" type="date" class="dash-input"></div>
          <div class="field"><label>Quote document (optional)</label>
            <div id="no-quote-doc-list">${d.quoteDoc ? attachmentsListHtml([d.quoteDoc]) : ""}</div>
            <div id="no-quote-doc-attach">${d.quoteDoc ? "" : attachButtonHtml("Attach quote PDF or photo", "no-quote-doc-input")}</div>
          </div>
        </div>
        <div>
          <div class="section-title">Contact persons at the school</div>
          <div id="no-contacts-list">${d.contacts.map(contactRowHtml).join("")}</div>
          <button type="button" id="no-add-contact" class="btn-ghost" style="font-size:13px;padding:7px 12px;"><i data-lucide="plus" style="width:14px;height:14px;"></i> Add contact</button>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px;border-top:1px solid #E4E1D6;padding-top:16px;">
        <button type="button" id="btn-cancel-new-order" class="btn-ghost">Cancel</button>
        <button type="button" id="btn-create-order" class="btn-amber"><i data-lucide="plus" style="width:16px;height:16px;"></i> Create request</button>
      </div>
    </div>
  </div>`;
}
function readGoodsRow(el) {
  return {
    id: el.dataset.goodsRow,
    name: el.querySelector("[data-g-name]").value,
    quantity: el.querySelector("[data-g-qty]").value,
    unitPrice: el.querySelector("[data-g-price]").value,
    installer: el.querySelector("[data-g-installer]").value,
    notes: el.querySelector("[data-g-notes]").value,
  };
}
function readContactRow(el) {
  return {
    id: el.dataset.contactRow,
    name: el.querySelector("[data-c-name]").value,
    role: el.querySelector("[data-c-role]").value,
    phone: el.querySelector("[data-c-phone]").value,
    email: el.querySelector("[data-c-email]").value,
  };
}
function updateGoodsTotal() {
  const rows = [...document.querySelectorAll("#no-goods-list [data-goods-row]")].map(readGoodsRow);
  const total = quoteTotal(rows);
  const el = document.getElementById("no-goods-total");
  if (el) el.textContent = total > 0 ? `Estimated total: ${moneyFmt(total)}` : "";
}
function bindNewOrderModalEvents() {
  const d = newOrderDraft;
  document.getElementById("new-order-backdrop")?.addEventListener("click", () => { newOrderDraft = null; setState({ showNewOrder: false }); });
  document.getElementById("btn-close-new-order")?.addEventListener("click", () => { newOrderDraft = null; setState({ showNewOrder: false }); });
  document.getElementById("btn-cancel-new-order")?.addEventListener("click", () => { newOrderDraft = null; setState({ showNewOrder: false }); });

  document.getElementById("no-school")?.addEventListener("change", (e) => {
    const found = state.directory.find((s) => s.school === e.target.value);
    if (found) {
      document.getElementById("no-address").value = found.address || "";
      if (found.contacts?.length) {
        d.contacts = found.contacts.map((c) => ({ ...c, id: uid() }));
        document.getElementById("no-contacts-list").innerHTML = d.contacts.map(contactRowHtml).join("");
        icons();
        bindContactRowRemovers();
      }
    }
  });

  document.querySelectorAll("#no-goods-list [data-goods-row]").forEach((row) => bindGoodsRowUploads(row, d.goodsItems.find((g) => g.id === row.dataset.goodsRow)));
  document.querySelectorAll("#no-goods-list input").forEach((inp) => inp.addEventListener("input", updateGoodsTotal));
  updateGoodsTotal();

  document.getElementById("no-add-goods")?.addEventListener("click", () => {
    const item = { id: uid(), name: "", quantity: "1", unitPrice: "", installer: "", notes: "", documents: [] };
    d.goodsItems.push(item);
    const list = document.getElementById("no-goods-list");
    list.insertAdjacentHTML("beforeend", goodsItemRowHtml(item));
    icons();
    const row = list.querySelector(`[data-goods-row="${item.id}"]`);
    bindGoodsRowUploads(row, item);
    row.querySelectorAll("input").forEach((inp) => inp.addEventListener("input", updateGoodsTotal));
  });
  bindGoodsRemovers();

  document.getElementById("no-add-contact")?.addEventListener("click", () => {
    const c = { id: uid(), name: "", role: "", phone: "", email: "" };
    d.contacts.push(c);
    document.getElementById("no-contacts-list").insertAdjacentHTML("beforeend", contactRowHtml(c));
    icons();
    bindContactRowRemovers();
  });
  bindContactRowRemovers();

  attachQuoteDocInput();
  function attachQuoteDocInput() {
    bindAttachTrigger(document, "no-quote-doc-input", async (file) => {
      const doc = await uploadDocument(d.id, "quote", file);
      d.quoteDoc = doc;
      document.getElementById("no-quote-doc-list").innerHTML = attachmentsListHtml([doc]);
      document.getElementById("no-quote-doc-attach").innerHTML = "";
      icons();
      bindOpenDocButtons(document.getElementById("no-quote-doc-list"));
      document.getElementById("no-quote-doc-list").querySelector("[data-remove-doc]")?.addEventListener("click", () => {
        d.quoteDoc = null;
        document.getElementById("no-quote-doc-list").innerHTML = "";
        document.getElementById("no-quote-doc-attach").innerHTML = attachButtonHtml("Attach quote PDF or photo", "no-quote-doc-input");
        icons();
        attachQuoteDocInput();
      });
    });
  }

  document.getElementById("btn-create-order")?.addEventListener("click", async () => {
    const school = document.getElementById("no-school").value.trim();
    const quoteNumber = document.getElementById("no-quote-number").value.trim();
    if (!school || !quoteNumber) { alert("Please add the receiving school and a quote number."); return; }
    const goodsItems = [...document.querySelectorAll("#no-goods-list [data-goods-row]")].map((row) => {
      const base = readGoodsRow(row);
      const orig = d.goodsItems.find((g) => g.id === base.id);
      return { ...base, documents: orig?.documents || [] };
    }).filter((g) => g.name.trim());
    const contacts = [...document.querySelectorAll("#no-contacts-list [data-contact-row]")].map(readContactRow).filter((c) => c.name.trim());

    const order = {
      id: d.id,
      school,
      address: document.getElementById("no-address").value.trim(),
      goods: goodsItems,
      goodsDescription: "",
      quote: { number: quoteNumber, amount: quoteTotal(goodsItems), date: document.getElementById("no-quote-date").value, attached: true },
      po: { number: "", date: "", attached: false },
      orderDate: todayISO(),
      deliveryDate: document.getElementById("no-delivery-date").value,
      transfer: { reminderDate: "", booked: false, bookedDate: "", carrier: "", vehicleReg: "", driverName: "" },
      contacts,
      followUps: [],
      status: "quote",
      waybill: null,
      documents: d.quoteDoc ? [d.quoteDoc] : [],
      createdAt: Date.now(),
    };
    newOrderDraft = null;
    await createOrder(order);
  });
}
function bindGoodsRemovers() {
  document.querySelectorAll("[data-remove-goods]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.removeGoods;
      newOrderDraft.goodsItems = newOrderDraft.goodsItems.filter((g) => g.id !== id);
      document.querySelector(`#no-goods-list [data-goods-row="${id}"]`)?.remove();
      updateGoodsTotal();
    });
  });
}
function bindContactRowRemovers() {
  document.querySelectorAll("[data-remove-contact]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.removeContact;
      newOrderDraft.contacts = newOrderDraft.contacts.filter((c) => c.id !== id);
      document.querySelector(`#no-contacts-list [data-contact-row="${id}"]`)?.remove();
    });
  });
}
function bindGoodsRowUploads(row, item) {
  const inputId = `goods-attach-${item.id}`;
  const docsEl = row.querySelector("[data-g-docs]");
  const attachEl = row.querySelector("[data-g-attach]");
  const renderDocs = () => {
    docsEl.innerHTML = attachmentsListHtml(item.documents);
    icons();
    bindOpenDocButtons(docsEl);
    docsEl.querySelectorAll("[data-remove-doc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        item.documents = item.documents.filter((doc) => doc.id !== btn.closest("[data-doc-id]").dataset.docId);
        renderDocs();
      });
    });
  };
  attachEl.innerHTML = attachButtonHtml("Attach spec sheet / photo", inputId);
  icons();
  bindAttachTrigger(row, inputId, async (file) => {
    const doc = await uploadDocument(newOrderDraft.id, `goods-${item.id.slice(0, 6)}`, file);
    item.documents.push(doc);
    renderDocs();
  });
  renderDocs();
}

/* ============================== ORDER DETAIL MODAL ============================== */
function renderOrderDetailModal(order) {
  if (!order) return "";
  const dUntil = daysUntil(order.deliveryDate);
  return `
  <div class="modal-backdrop" id="order-detail-backdrop">
    <div class="modal-shell wide" onclick="event.stopPropagation()">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <h2 style="font-family:var(--font-display);font-size:22px;color:var(--ink);margin:0;">${escapeHtml(order.school)}</h2>
        <button id="btn-close-order-detail" style="background:none;border:none;cursor:pointer;color:#8A8578;"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
      </div>
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:18px;flex-wrap:wrap;">
        ${badgeHtml(order.status)}
        <span style="font-family:var(--font-mono);font-size:12.5px;color:#8A8175;">Order date ${fmtDate(order.orderDate)}</span>
        ${order.deliveryDate ? `<span style="font-family:var(--font-mono);font-size:12.5px;color:#8A8175;">· Delivery ${fmtDate(order.deliveryDate)}</span>` : ""}
        ${order.status !== "delivered" && dUntil !== null ? `<span style="font-family:var(--font-mono);font-size:12px;color:${dUntil < 0 ? "var(--red)" : dUntil <= 2 ? "var(--amberDeep)" : "#8A8175"};">${dUntil < 0 ? `${Math.abs(dUntil)}d overdue` : dUntil === 0 ? "Due today" : `in ${dUntil}d`}</span>` : ""}
        <button id="btn-delete-order-detail" style="margin-left:auto;background:none;border:none;cursor:pointer;color:#B0AA9C;display:flex;align-items:center;gap:5px;font-family:var(--font-body);font-size:12.5px;"><i data-lucide="trash-2" style="width:14px;height:14px;"></i> Delete order</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;">
        <div>
          <div class="section-title">Job details</div>
          <p style="font-size:13px;color:#8A8175;margin-top:-6px;"><i data-lucide="map-pin" style="width:13px;height:13px;vertical-align:-2px;"></i> ${escapeHtml(order.address || "No address on file")}</p>

          <div class="section-title">Items being quoted</div>
          <div id="od-goods-list">${(order.goods || []).map(goodsItemRowHtml).join("")}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <button type="button" id="od-add-goods" class="btn-ghost" style="font-size:13px;padding:7px 12px;"><i data-lucide="plus" style="width:14px;height:14px;"></i> Add item</button>
            <div id="od-goods-total" style="font-family:var(--font-display);font-size:15px;color:var(--ink);">${quoteTotal(order.goods) > 0 ? `Total: <b>${moneyFmt(quoteTotal(order.goods))}</b>` : ""}</div>
          </div>
          ${(order.goods && order.goods.length > 0) ? `<button id="btn-view-quote" class="btn-amber" style="margin-bottom:4px;"><i data-lucide="file-text" style="width:15px;height:15px;"></i> View / print quote</button>` : ""}

          <div class="section-title">Documents</div>
          <div id="od-docs-list">${attachmentsListHtml(order.documents)}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${attachButtonHtml("Quote", "od-attach-quote")}
            ${attachButtonHtml("PO", "od-attach-po")}
            ${attachButtonHtml("Waybill", "od-attach-waybill")}
            ${attachButtonHtml("Other", "od-attach-other")}
          </div>

          <div class="section-title">Quote — attached</div>
          <div class="doc-line"><i data-lucide="check-circle-2" style="width:16px;height:16px;color:var(--green);"></i>
            <div><div style="font-family:var(--font-mono);font-size:13.5px;">${escapeHtml(order.quote.number)}</div>
            <div style="font-size:12px;color:#8A8175;">${moneyFmt(quoteTotal(order.goods))} · ${fmtDate(order.quote.date)}</div></div></div>

          <div class="section-title">Purchase order</div>
          ${order.po.attached ? `
            <div class="doc-line"><i data-lucide="check-circle-2" style="width:16px;height:16px;color:var(--green);"></i>
              <div><div style="font-family:var(--font-mono);font-size:13.5px;">${escapeHtml(order.po.number)}</div><div style="font-size:12px;color:#8A8175;">${fmtDate(order.po.date)}</div></div></div>` : `
            <div style="display:flex;gap:8px;">
              <input id="od-po-number" class="dash-input" placeholder="PO number">
              <input id="od-po-date" type="date" class="dash-input" value="${todayISO()}">
              <button id="btn-attach-po" class="btn-primary" style="white-space:nowrap;">Attach PO</button>
            </div>`}

          <div class="section-title">Delivery &amp; transfer</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="field"><label>Delivery date</label><input id="od-delivery-date" type="date" class="dash-input" value="${order.deliveryDate || ""}"></div>
            <div class="field"><label>Book-transfer reminder</label><input id="od-reminder-date" type="date" class="dash-input" value="${order.transfer.reminderDate || ""}"></div>
          </div>
          <button id="btn-save-dates" class="btn-ghost" style="font-size:13px;margin-bottom:10px;">Save dates</button>

          ${order.transfer.booked ? `
            <div class="doc-line"><i data-lucide="check-circle-2" style="width:16px;height:16px;color:var(--green);"></i>
              <div><div style="font-family:var(--font-mono);font-size:13.5px;">${escapeHtml(order.transfer.carrier)} · ${escapeHtml(order.transfer.vehicleReg)}</div>
              <div style="font-size:12px;color:#8A8175;">Driver: ${escapeHtml(order.transfer.driverName)} · Booked ${fmtDate(order.transfer.bookedDate)}</div></div></div>`
            : (order.status !== "cancelled" && order.status !== "delivered") ? `
            <button id="btn-show-book-form" class="btn-amber" style="${state._showBookForm ? "display:none;" : ""}"><i data-lucide="calendar-clock" style="width:15px;height:15px;"></i> Book transfer</button>
            <div id="od-book-form" style="border:1px solid #E4E1D6;border-radius:4px;padding:10px;${state._showBookForm ? "" : "display:none;"}">
              <div class="field"><label>Carrier</label><input id="od-carrier" class="dash-input" value="Fortis Fleet"></div>
              <div class="field"><label>Vehicle registration</label><input id="od-vehicle-reg" class="dash-input" placeholder="e.g. CA 123-456"></div>
              <div class="field"><label>Driver name</label><input id="od-driver-name" class="dash-input"></div>
              <button id="btn-confirm-booking" class="btn-amber"><i data-lucide="calendar-clock" style="width:15px;height:15px;"></i> Confirm booking</button>
            </div>` : ""}
        </div>

        <div>
          <div class="section-title">Contact persons at the school</div>
          ${order.contacts.length === 0 ? emptyNote("No contacts recorded.") : order.contacts.map((c) => `
            <div style="border:1px solid #E4E1D6;border-radius:4px;padding:8px 12px;margin-bottom:8px;">
              <div style="font-family:var(--font-display);font-size:15.5px;">${escapeHtml(c.name)} <span style="color:#8A8175;font-family:var(--font-body);font-size:12.5px;">· ${escapeHtml(c.role)}</span></div>
              <div style="font-size:12.5px;color:#8A8175;display:flex;gap:12px;margin-top:2px;">
                ${c.phone ? `<span><i data-lucide="phone" style="width:11px;height:11px;vertical-align:-1px;"></i> ${escapeHtml(c.phone)}</span>` : ""}
                ${c.email ? `<span><i data-lucide="mail" style="width:11px;height:11px;vertical-align:-1px;"></i> ${escapeHtml(c.email)}</span>` : ""}
              </div>
            </div>`).join("")}

          <div class="section-title">Follow-up log</div>
          <div style="max-height:150px;overflow-y:auto;margin-bottom:8px;">
            ${order.followUps.length === 0 ? emptyNote("No follow-ups logged yet.") : [...order.followUps].reverse().map((f) => `
              <div style="font-size:13px;margin-bottom:8px;padding-left:10px;border-left:2px solid var(--blue);">
                <div style="color:#8A8175;font-family:var(--font-mono);font-size:11px;">${new Date(f.date).toLocaleString("en-ZA")}</div>${escapeHtml(f.note)}
              </div>`).join("")}
          </div>
          <div style="display:flex;gap:8px;">
            <input id="od-followup-note" class="dash-input" placeholder="Log a follow-up (e.g. confirmed with driver)">
            <button id="btn-add-followup" class="btn-ghost">Add</button>
          </div>

          <div class="section-title">Waybill</div>
          ${order.waybill ? `
            <div class="doc-line"><i data-lucide="check-circle-2" style="width:16px;height:16px;color:var(--green);"></i>
              <div><div style="font-family:var(--font-mono);font-size:13.5px;">${escapeHtml(order.waybill.number)}</div>
              <div style="font-size:12px;color:#8A8175;">Delivered ${fmtDate(order.waybill.deliveredDate)} · Received by ${escapeHtml(order.waybill.receivedBy)}</div></div></div>`
            : `
            <button id="btn-show-deliver-form" class="btn-amber" style="${state._showDeliverForm ? "display:none;" : ""}"><i data-lucide="package" style="width:15px;height:15px;"></i> Mark delivered / generate waybill</button>
            <div id="od-deliver-form" style="border:1px solid #E4E1D6;border-radius:4px;padding:10px;${state._showDeliverForm ? "" : "display:none;"}">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="field"><label>Delivered date</label><input id="od-delivered-date" type="date" class="dash-input" value="${todayISO()}"></div>
                <div class="field"><label>Time</label><input id="od-delivered-time" type="time" class="dash-input"></div>
              </div>
              <div class="field"><label>Received by</label>
                <input id="od-received-by" class="dash-input" list="received-by-list" value="${escapeHtml(order.contacts[0]?.name || "")}" placeholder="Type or pick a contact">
                <datalist id="received-by-list">${order.contacts.map((c) => `<option value="${escapeHtml(c.name)}">`).join("")}</datalist>
              </div>
              <button id="btn-confirm-delivery" class="btn-amber"><i data-lucide="check-circle-2" style="width:15px;height:15px;"></i> Confirm delivery &amp; generate waybill</button>
            </div>`}
        </div>
      </div>
    </div>
  </div>`;
}

function bindOrderDetailEvents() {
  const order = state.orders.find((o) => o.id === state.activeOrderId);
  if (!order) return;
  const close = () => setState({ activeOrderId: null, _showBookForm: false, _showDeliverForm: false });
  document.getElementById("order-detail-backdrop")?.addEventListener("click", close);
  document.getElementById("btn-close-order-detail")?.addEventListener("click", close);
  document.getElementById("btn-delete-order-detail")?.addEventListener("click", () => deleteOrder(order.id));
  document.getElementById("btn-view-quote")?.addEventListener("click", () => setState({ quoteOrderId: order.id }));

  // goods items
  document.querySelectorAll("#od-goods-list [data-goods-row]").forEach((row) => bindOdGoodsRowUploads(order, row));
  document.getElementById("od-add-goods")?.addEventListener("click", () => {
    order.goods = order.goods || [];
    order.goods.push({ id: uid(), name: "", quantity: "1", unitPrice: "", installer: "", notes: "", documents: [] });
    updateOrder(order);
  });
  document.querySelectorAll("#od-goods-list [data-remove-goods]").forEach((btn) => {
    btn.addEventListener("click", () => {
      order.goods = (order.goods || []).filter((g) => g.id !== btn.dataset.removeGoods);
      updateOrder(order);
    });
  });
  document.querySelectorAll("#od-goods-list input").forEach((inp) => {
    inp.addEventListener("blur", () => saveGoodsFromDom(order));
  });

  // documents
  bindOpenDocButtons(document.getElementById("od-docs-list"));
  document.querySelectorAll("#od-docs-list [data-remove-doc]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const docId = btn.closest("[data-doc-id]").dataset.docId;
      const doc = (order.documents || []).find((x) => x.id === docId);
      if (doc) await deleteDocument(doc.path);
      order.documents = (order.documents || []).filter((x) => x.id !== docId);
      updateOrder(order);
    });
  });
  bindAttachTrigger(document, "od-attach-quote", (f) => attachOrderDoc(order, "quote", f));
  bindAttachTrigger(document, "od-attach-po", (f) => attachOrderDoc(order, "po", f));
  bindAttachTrigger(document, "od-attach-waybill", (f) => attachOrderDoc(order, "waybill", f));
  bindAttachTrigger(document, "od-attach-other", (f) => attachOrderDoc(order, "other", f));

  // PO
  document.getElementById("btn-attach-po")?.addEventListener("click", () => {
    const poNumber = document.getElementById("od-po-number").value.trim();
    if (!poNumber) return;
    order.po = { number: poNumber, date: document.getElementById("od-po-date").value, attached: true };
    order.status = "confirmed";
    updateOrder(order);
  });

  // dates
  document.getElementById("btn-save-dates")?.addEventListener("click", () => {
    order.deliveryDate = document.getElementById("od-delivery-date").value;
    order.transfer.reminderDate = document.getElementById("od-reminder-date").value;
    updateOrder(order);
  });

  // transfer booking
  document.getElementById("btn-show-book-form")?.addEventListener("click", () => setState({ _showBookForm: true }));
  document.getElementById("btn-confirm-booking")?.addEventListener("click", () => {
    order.status = "booked";
    order.transfer = {
      ...order.transfer, booked: true, bookedDate: todayISO(),
      carrier: document.getElementById("od-carrier").value,
      vehicleReg: document.getElementById("od-vehicle-reg").value,
      driverName: document.getElementById("od-driver-name").value,
    };
    state._showBookForm = false;
    updateOrder(order);
  });

  // follow-ups
  document.getElementById("btn-add-followup")?.addEventListener("click", () => {
    const note = document.getElementById("od-followup-note").value.trim();
    if (!note) return;
    order.followUps.push({ id: uid(), date: new Date().toISOString(), note });
    updateOrder(order);
  });
  document.getElementById("od-followup-note")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("btn-add-followup")?.click();
  });

  // waybill / delivery
  document.getElementById("btn-show-deliver-form")?.addEventListener("click", () => setState({ _showDeliverForm: true }));
  document.getElementById("btn-confirm-delivery")?.addEventListener("click", () => {
    const waybillNumber = `FRT-WB-${new Date().getFullYear()}-${order.id.slice(0, 4).toUpperCase()}`;
    order.status = "delivered";
    order.waybill = {
      number: waybillNumber,
      deliveredDate: document.getElementById("od-delivered-date").value,
      deliveredTime: document.getElementById("od-delivered-time").value,
      receivedBy: document.getElementById("od-received-by").value,
      notes: "",
    };
    state._showDeliverForm = false;
    updateOrder(order);
  });
}
function saveGoodsFromDom(order) {
  order.goods = [...document.querySelectorAll("#od-goods-list [data-goods-row]")].map((row) => {
    const base = readGoodsRow(row);
    const orig = (order.goods || []).find((g) => g.id === base.id);
    return { ...base, documents: orig?.documents || [] };
  });
  persistOrders(state.orders.map((o) => (o.id === order.id ? order : o)));
  const totalEl = document.getElementById("od-goods-total");
  if (totalEl) totalEl.innerHTML = quoteTotal(order.goods) > 0 ? `Total: <b>${moneyFmt(quoteTotal(order.goods))}</b>` : "";
}
async function attachOrderDoc(order, docType, file) {
  const doc = await uploadDocument(order.id, docType, file);
  order.documents = [...(order.documents || []), doc];
  updateOrder(order);
}
function bindOdGoodsRowUploads(order, row) {
  const itemId = row.dataset.goodsRow;
  const item = (order.goods || []).find((g) => g.id === itemId);
  if (!item) return;
  const inputId = `od-goods-attach-${item.id}`;
  const docsEl = row.querySelector("[data-g-docs]");
  const attachEl = row.querySelector("[data-g-attach]");
  const renderDocs = () => {
    docsEl.innerHTML = attachmentsListHtml(item.documents);
    icons();
    bindOpenDocButtons(docsEl);
    docsEl.querySelectorAll("[data-remove-doc]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const docId = btn.closest("[data-doc-id]").dataset.docId;
        const doc = item.documents.find((d) => d.id === docId);
        if (doc) await deleteDocument(doc.path);
        item.documents = item.documents.filter((d) => d.id !== docId);
        renderDocs();
        persistOrders(state.orders.map((o) => (o.id === order.id ? order : o)));
      });
    });
  };
  attachEl.innerHTML = attachButtonHtml("Attach spec sheet / photo", inputId);
  icons();
  bindAttachTrigger(row, inputId, async (file) => {
    const doc = await uploadDocument(order.id, `goods-${item.id.slice(0, 6)}`, file);
    item.documents = item.documents || [];
    item.documents.push(doc);
    renderDocs();
    persistOrders(state.orders.map((o) => (o.id === order.id ? order : o)));
  });
  renderDocs();
}

/* ============================== WAYBILL / QUOTE PRINT VIEWS ============================== */
function docHeaderHtml(refLabel, refValue, refSub) {
  return `<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid var(--navy);padding-bottom:16px;margin-bottom:16px;">
    <div style="display:flex;gap:10px;align-items:center;">
      <img src="${LOGO_SRC}" alt="Fortis" style="height:62px;width:auto;" onerror="this.style.display='none'">
      <div><div style="font-family:var(--font-display);font-weight:700;font-size:24px;">FORTIS</div>
      <div style="font-size:11px;color:#8A8175;">fortis.org.za · Logistics &amp; Campus Delivery</div></div>
    </div>
    <div style="text-align:right;">
      <div style="font-family:var(--font-mono);font-size:12px;color:#8A8175;">${refLabel}</div>
      <div style="font-family:var(--font-mono);font-size:20px;font-weight:600;">${escapeHtml(refValue)}</div>
      ${refSub ? `<div style="font-size:12px;color:#8A8175;margin-top:2px;">${refSub}</div>` : ""}
    </div>
  </div>`;
}
function renderWaybillView(order) {
  if (!order || !order.waybill) return "";
  const goods = order.goods || [];
  return `
  <div class="modal-backdrop" id="waybill-backdrop">
    <div class="modal-shell wide" onclick="event.stopPropagation()">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <h2 style="font-family:var(--font-display);font-size:22px;color:var(--ink);margin:0;">Waybill</h2>
        <button id="btn-close-waybill-x" style="background:none;border:none;cursor:pointer;color:#8A8578;"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
      </div>
      <div id="print-area">
      <div style="border:2px solid var(--navy);padding:28px;font-family:var(--font-body);">
        ${docHeaderHtml("WAYBILL No.", order.waybill.number)}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:18px;">
          <div><div style="font-family:var(--font-mono);font-size:10.5px;color:#8A8175;letter-spacing:1px;">CONSIGNEE</div>
            <div style="font-family:var(--font-display);font-size:18px;">${escapeHtml(order.school)}</div>
            <div style="font-size:13px;color:#3A342C;">${escapeHtml(order.address)}</div>
            <div style="font-size:13px;color:#3A342C;margin-top:4px;">Received by: ${escapeHtml(order.waybill.receivedBy)}</div></div>
          <div><div style="font-family:var(--font-mono);font-size:10.5px;color:#8A8175;letter-spacing:1px;">REFERENCES</div>
            <div style="font-size:13px;">Quote: ${escapeHtml(order.quote.number)}</div>
            <div style="font-size:13px;">Purchase order: ${escapeHtml(order.po.number || "—")}</div>
            <div style="font-size:13px;">Order date: ${fmtDate(order.orderDate)}</div></div>
        </div>
        <div style="font-family:var(--font-mono);font-size:10.5px;color:#8A8175;letter-spacing:1px;margin-bottom:6px;">GOODS</div>
        ${goods.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:13.5px;">
          <thead><tr style="border-bottom:1px solid #D8D4C8;">
            <th style="text-align:left;padding:6px 8px;font-family:var(--font-mono);font-size:11px;color:#8A8175;">ITEM</th>
            <th style="text-align:left;padding:6px 8px;font-family:var(--font-mono);font-size:11px;color:#8A8175;">QTY</th>
            <th style="text-align:left;padding:6px 8px;font-family:var(--font-mono);font-size:11px;color:#8A8175;">NOTES</th></tr></thead>
          <tbody>${goods.map((g) => `<tr style="border-bottom:1px solid #EDEAE0;">
            <td style="padding:6px 8px;">${escapeHtml(g.name)}</td>
            <td style="padding:6px 8px;">${escapeHtml(g.quantity || "—")}</td>
            <td style="padding:6px 8px;color:#8A8175;">${escapeHtml(g.notes || "—")}</td></tr>`).join("")}</tbody>
        </table>` : `<div style="border:1px solid #D8D4C8;border-radius:4px;padding:12px;font-size:13.5px;margin-bottom:18px;">${escapeHtml(order.goodsDescription || "—")}</div>`}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px;">
          <div><div style="font-family:var(--font-mono);font-size:10px;color:#8A8175;letter-spacing:.5px;margin-bottom:3px;">CARRIER</div><div style="font-size:13.5px;">${escapeHtml(order.transfer.carrier || "—")}</div></div>
          <div><div style="font-family:var(--font-mono);font-size:10px;color:#8A8175;letter-spacing:.5px;margin-bottom:3px;">VEHICLE REG.</div><div style="font-size:13.5px;">${escapeHtml(order.transfer.vehicleReg || "—")}</div></div>
          <div><div style="font-family:var(--font-mono);font-size:10px;color:#8A8175;letter-spacing:.5px;margin-bottom:3px;">DRIVER</div><div style="font-size:13.5px;">${escapeHtml(order.transfer.driverName || "—")}</div></div>
          <div><div style="font-family:var(--font-mono);font-size:10px;color:#8A8175;letter-spacing:.5px;margin-bottom:3px;">DELIVERED DATE</div><div style="font-size:13.5px;">${fmtDate(order.waybill.deliveredDate)}</div></div>
          <div><div style="font-family:var(--font-mono);font-size:10px;color:#8A8175;letter-spacing:.5px;margin-bottom:3px;">DELIVERED TIME</div><div style="font-size:13.5px;">${escapeHtml(order.waybill.deliveredTime || "—")}</div></div>
          <div><div style="font-family:var(--font-mono);font-size:10px;color:#8A8175;letter-spacing:.5px;margin-bottom:3px;">STATUS</div><div style="font-size:13.5px;color:var(--green);font-weight:600;">Delivered</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;">
          <div style="border-top:1px solid #3A342C;padding-top:6px;font-size:12px;color:#8A8175;">Driver signature</div>
          <div style="border-top:1px solid #3A342C;padding-top:6px;font-size:12px;color:#8A8175;">Received signature — ${escapeHtml(order.waybill.receivedBy)}</div>
        </div>
      </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
        <button id="btn-close-waybill" class="btn-ghost">Close</button>
        <button id="btn-print-waybill" class="btn-primary"><i data-lucide="printer" style="width:15px;height:15px;"></i> Print / Save as PDF</button>
      </div>
    </div>
  </div>`;
}
function renderQuoteView(order) {
  if (!order) return "";
  const goods = order.goods || [];
  const total = quoteTotal(goods);
  return `
  <div class="modal-backdrop" id="quote-view-backdrop">
    <div class="modal-shell wide" onclick="event.stopPropagation()">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <h2 style="font-family:var(--font-display);font-size:22px;color:var(--ink);margin:0;">Quote</h2>
        <button id="btn-close-quote-x" style="background:none;border:none;cursor:pointer;color:#8A8578;"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
      </div>
      <div id="print-area">
      <div style="border:2px solid var(--navy);padding:28px;font-family:var(--font-body);">
        ${docHeaderHtml("QUOTE No.", order.quote.number, fmtDate(order.quote.date))}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:18px;">
          <div><div style="font-family:var(--font-mono);font-size:10.5px;color:#8A8175;letter-spacing:1px;">QUOTED TO</div>
            <div style="font-family:var(--font-display);font-size:18px;">${escapeHtml(order.school)}</div>
            <div style="font-size:13px;color:#3A342C;">${escapeHtml(order.address)}</div></div>
          <div><div style="font-family:var(--font-mono);font-size:10.5px;color:#8A8175;letter-spacing:1px;">ATTENTION</div>
            ${order.contacts && order.contacts.length > 0 ? order.contacts.map((c) => `<div style="font-size:13px;">${escapeHtml(c.name)}${c.role ? ` — ${escapeHtml(c.role)}` : ""}</div>`).join("") : `<div style="font-size:13px;color:#8A8175;">—</div>`}</div>
        </div>
        <div style="font-family:var(--font-mono);font-size:10.5px;color:#8A8175;letter-spacing:1px;margin-bottom:6px;">ITEMS</div>
        ${goods.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;margin-bottom:6px;font-size:13.5px;">
          <thead><tr style="border-bottom:1px solid #D8D4C8;">
            <th style="text-align:left;padding:6px 8px;font-family:var(--font-mono);font-size:11px;color:#8A8175;">DESCRIPTION</th>
            <th style="text-align:left;padding:6px 8px;font-family:var(--font-mono);font-size:11px;color:#8A8175;">SUPPLIED / INSTALLED BY</th>
            <th style="text-align:right;padding:6px 8px;font-family:var(--font-mono);font-size:11px;color:#8A8175;">QTY</th>
            <th style="text-align:right;padding:6px 8px;font-family:var(--font-mono);font-size:11px;color:#8A8175;">UNIT PRICE</th>
            <th style="text-align:right;padding:6px 8px;font-family:var(--font-mono);font-size:11px;color:#8A8175;">TOTAL</th></tr></thead>
          <tbody>${goods.map((g) => `<tr style="border-bottom:1px solid #EDEAE0;">
            <td style="padding:6px 8px;">${escapeHtml(g.name)}${g.notes ? `<div style="font-size:11.5px;color:#8A8175;">${escapeHtml(g.notes)}</div>` : ""}</td>
            <td style="padding:6px 8px;color:#8A8175;">${escapeHtml(g.installer || "To be quoted and supplied by Fortis")}</td>
            <td style="padding:6px 8px;text-align:right;">${escapeHtml(g.quantity || "—")}</td>
            <td style="padding:6px 8px;text-align:right;">${g.unitPrice ? moneyFmt(g.unitPrice) : "—"}</td>
            <td style="padding:6px 8px;text-align:right;font-family:var(--font-mono);">${moneyFmt(lineTotal(g))}</td></tr>`).join("")}</tbody>
        </table>` : `<div style="border:1px solid #D8D4C8;border-radius:4px;padding:12px;font-size:13.5px;margin-bottom:18px;">No items added yet.</div>`}
        <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
          <div style="min-width:220px;"><div style="display:flex;justify-content:space-between;border-top:2px solid var(--navy);padding-top:8px;margin-top:6px;">
            <span style="font-family:var(--font-display);font-size:16px;">Grand total</span>
            <span style="font-family:var(--font-mono);font-size:16px;font-weight:600;">${moneyFmt(total)}</span></div></div>
        </div>
        <div style="font-size:11px;color:#8A8175;line-height:1.6;border-top:1px solid #D8D4C8;padding-top:12px;">
          Prices exclude VAT unless otherwise stated. Quote valid for 30 days from the date above.
          Final quantities and measurements to be confirmed on site prior to procurement — this quote is for costing
          purposes and not for manufacturing or ordering until formally approved and a purchase order is received.
        </div>
      </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
        <button id="btn-close-quote" class="btn-ghost">Close</button>
        <button id="btn-print-quote" class="btn-primary"><i data-lucide="printer" style="width:15px;height:15px;"></i> Print / Save as PDF</button>
      </div>
    </div>
  </div>`;
}

/* ============================== BOOT ============================== */
init();
