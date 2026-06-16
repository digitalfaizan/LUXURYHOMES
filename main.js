/* ============================================================
   LUXURY HOMES — main.js
   Webhook: Make.com  |  Chatbot: Voiceflow
   ============================================================ */

const WA_NUM      = '919999999999';        // ← your real WhatsApp number
const BIZ_NAME    = 'Luxury Homes Indirapuram';
const WEBHOOK_URL = 'https://hook.eu2.make.com/7dwuqdlwtqjto2b5g15197ifk3qbdvx7';

/* ============================================================
   SEND TO MAKE WEBHOOK
   Sends a structured payload so Make can route to the right
   Google Sheet tab (Buy / Rent / Sell / Invest / Commercial)
   ============================================================ */
async function sendToWebhook(payload) {
  try {
    await fetch(WEBHOOK_URL, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        ...payload,
        timestamp : new Date().toISOString(),
        source    : window.location.href,
        page      : document.title,
      }),
    });
  } catch (err) {
    // Webhook failure is silent — WhatsApp fallback still works
    console.warn('Webhook error:', err);
  }
}

/* Decide which Sheet tab this lead belongs to */
function getSheetTab(intent) {
  const i = (intent || '').toLowerCase();
  if (i.includes('buy') || i.includes('purchase'))           return 'Buy';
  if (i.includes('rent') && !i.includes('give'))             return 'Rent';
  if (i.includes('sell'))                                    return 'Sell';
  if (i.includes('invest'))                                  return 'Invest';
  if (i.includes('shop') || i.includes('office')
    || i.includes('commercial') || i.includes('give'))       return 'Commercial';
  return 'General';
}

/* ============================================================
   AUTO DAY / NIGHT THEME
   ============================================================ */
function getAutoTheme() {
  const h = new Date().getHours();
  return (h >= 7 && h < 19) ? 'light' : 'dark';
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = (t === 'dark') ? '☀️' : '🌙';
  localStorage.setItem('lh-theme', t);
}
(function initTheme() {
  applyTheme(localStorage.getItem('lh-theme') || getAutoTheme());
})();

document.addEventListener('DOMContentLoaded', () => {

  /* Theme toggle */
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  /* ============================================================
     HEADER SCROLL
     ============================================================ */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     HAMBURGER
     ============================================================ */
  const burger     = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', false);
    }));
  }

  /* ============================================================
     SEARCH TABS
     ============================================================ */
  document.querySelectorAll('.stab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal,.prop-card,.service-card,.blog-card,.review-card,.team-card').forEach(el => {
    if (!el.classList.contains('reveal')) el.classList.add('reveal');
    revealObs.observe(el);
  });

  /* ============================================================
     COUNTER ANIMATION
     ============================================================ */
  const cntObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target, parseInt(e.target.dataset.target));
        cntObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.counter').forEach(el => cntObs.observe(el));

  /* ============================================================
     EMI CALCULATOR
     ============================================================ */
  if (document.getElementById('emi-price')) calcEMI();

  /* ============================================================
     PROPERTY CHART
     ============================================================ */
  buildChart();

  /* ============================================================
     SMOOTH ANCHOR SCROLL
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); smoothScroll(target); }
    });
  });

  /* Chatbot loaded via chatbot.js */

  /* ESC to close modal */
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
});



/* ============================================================
   LEAD CAPTURE FLOW
   ============================================================ */
const leadData  = { intent:'', flow:'', name:'', phone:'', email:'' };
let   currentFlow = '';

function selectLead(btn) {
  leadData.intent = btn.dataset.val;
  leadData.flow   = btn.dataset.flow;
  currentFlow     = btn.dataset.flow;
  showStep('lead-step-2-' + currentFlow);
  updateDots(2);
  scrollToSection('lead');
}

function nextStep(target) {
  if (target === 'contact') {
    showStep('lead-step-contact');
    updateDots(3);
  }
  scrollToSection('lead');
}

function goBack() {
  showStep('lead-step-1');
  updateDots(1);
  scrollToSection('lead');
}
function goBackToPrefs() {
  showStep('lead-step-2-' + currentFlow);
  updateDots(2);
  scrollToSection('lead');
}

function showStep(id) {
  document.querySelectorAll('.lead-step').forEach(s => s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}
function updateDots(n) {
  document.querySelectorAll('#step-dots .dot').forEach((d, i) => d.classList.toggle('active', i < n));
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) setTimeout(() => smoothScroll(el), 60);
}
function smoothScroll(el) {
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior: 'smooth' });
}

async function submitLead() {
  const name  = document.getElementById('lf-name')?.value.trim()  || '';
  const phone = document.getElementById('lf-phone')?.value.trim() || '';
  const email = document.getElementById('lf-email')?.value.trim() || '';

  if (!name || !phone) { alert('Please fill in your name and WhatsApp number.'); return; }
  if (!email) { alert('Please fill in your email address.'); return; }

  Object.assign(leadData, { name, phone, email });

  /* Map each flow to clean webhook field names */
  const fieldMap = {
    'buy'       : { lead_type:'Buy',          property_type:'lf-buy-type',  budget:'lf-buy-budget',  location:'lf-buy-loc'  },
    'rent'      : { lead_type:'Rent',         property_type:'lf-rent-type', budget:'lf-rent-budget', location:'lf-rent-loc' },
    'sell'      : { lead_type:'Sell',         property_type:'lf-sell-type', budget:'lf-sell-price',  location:'lf-sell-loc' },
    'invest'    : { lead_type:'Invest',       property_type:'lf-inv-type',  budget:'lf-inv-budget',  location:''            },
    'give-rent' : { lead_type:'Give on Rent', property_type:'lf-gr-type',   budget:'lf-gr-rent',     location:'lf-gr-loc'   },
  };

  const fm            = fieldMap[currentFlow] || {};
  const lead_type     = fm.lead_type || leadData.intent || '';
  const property_type = document.getElementById(fm.property_type)?.value || '';
  const budget        = document.getElementById(fm.budget)?.value        || '';
  const location      = document.getElementById(fm.location)?.value      || '';
  const summary       = `${lead_type} | ${property_type} | Budget: ${budget} | Location: ${location}`;

  sendToWebhook({
    form_type     : 'lead_capture',
    sheet_tab     : lead_type || 'General',
    lead_type, property_type, budget, location,
    name, phone, email, summary,
  });

  showStep('lead-step-success');
  updateDots(3);
  scrollToSection('lead');
}

/* Pull all dropdown values for the active flow */
function collectPrefs(flow) {
  const ids = {
    'buy'       : ['lf-buy-type','lf-buy-bhk','lf-buy-budget','lf-buy-loc','lf-buy-pos','lf-buy-loan'],
    'rent'      : ['lf-rent-type','lf-rent-bhk','lf-rent-budget','lf-rent-loc','lf-rent-furn','lf-rent-time'],
    'sell'      : ['lf-sell-type','lf-sell-loc','lf-sell-size','lf-sell-price','lf-sell-status','lf-sell-time'],
    'invest'    : ['lf-inv-type','lf-inv-budget','lf-inv-goal','lf-inv-horizon','lf-inv-roi','lf-inv-fin'],
    'give-rent' : ['lf-gr-type','lf-gr-loc','lf-gr-size','lf-gr-furn','lf-gr-rent','lf-gr-avail'],
  };
  const out = {};
  (ids[flow] || []).forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value) out[id.replace('lf-'+flow.replace('-rent','')+'-','').replace('lf-gr-','').replace('lf-inv-','').replace('lf-buy-','').replace('lf-rent-','').replace('lf-sell-','')] = el.value;
  });
  return out;
}

/* ============================================================
   PROPERTY FILTER
   ============================================================ */
function filterProps(btn) {
  const f = btn.dataset.filter;
  document.querySelectorAll('.pf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.prop-card').forEach(c => c.classList.toggle('hidden', f !== 'all' && c.dataset.type !== f));
}

/* ============================================================
   QUOTE MODAL
   ============================================================ */
let modalRef = '';

function openLeadModal(ref) {
  modalRef = ref;
  document.getElementById('quote-modal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('quote-modal')?.classList.remove('open');
  document.body.style.overflow = '';
}
window.addEventListener('click', e => { if (e.target.id === 'quote-modal') closeModal(); });

async function submitModal() {
  const name  = document.getElementById('m-name')?.value.trim()  || '';
  const phone = document.getElementById('m-phone')?.value.trim() || '';
  const email = document.getElementById('m-email')?.value.trim() || '';
  if (!name || !phone) { alert('Please enter your name and WhatsApp number.'); return; }
  if (!email) { alert('Please enter your email address.'); return; }

  sendToWebhook({
    form_type     : 'quote_request',
    sheet_tab     : getSheetTab(modalRef),
    lead_type     : getSheetTab(modalRef),
    property_type : modalRef,
    budget        : '',
    location      : '',
    name, phone, email,
    summary       : `Quote request for: ${modalRef}`,
  });

  /* Show success inside modal instead of redirecting */
  const box = document.querySelector('.modal-box');
  if (box) {
    box.innerHTML = `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:48px;margin-bottom:16px;">✅</div>
        <h3 style="font-family:var(--font-display);font-size:1.8rem;color:var(--navy);margin-bottom:10px;">
          Request <em>Received!</em>
        </h3>
        <p style="color:var(--text-3);font-size:14px;line-height:1.7;">
          Thank you, ${name}! Our property expert will call you within 2 hours and send details to ${email}.
        </p>
        <button onclick="closeModal()" style="margin-top:20px;padding:11px 28px;background:var(--gold);color:#fff;border:none;border-radius:50px;font-size:14px;font-weight:600;cursor:pointer;">
          Close
        </button>
      </div>`;
  }
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
async function submitContact(e) {
  e.preventDefault();
  const name     = document.getElementById('cf-name')?.value.trim()    || '';
  const phone    = document.getElementById('cf-phone')?.value.trim()   || '';
  const email    = document.getElementById('cf-email')?.value.trim()   || '';
  const interest = document.getElementById('cf-interest')?.value       || '';
  const message  = document.getElementById('cf-message')?.value.trim() || '';
  if (!name || !phone) { alert('Please enter your name and WhatsApp number.'); return; }
  if (!email) { alert('Please enter your email address.'); return; }

  sendToWebhook({
    form_type     : 'contact_form',
    sheet_tab     : getSheetTab(interest),
    lead_type     : interest,
    property_type : '',
    budget        : '',
    location      : '',
    name, phone, email, message,
    summary       : `${interest} — ${message || 'No message'}`,
  });

  /* Replace form with success message */
  const form = document.querySelector('.contact-form');
  if (form) {
    form.innerHTML = `
      <div style="text-align:center;padding:32px 20px;">
        <div style="font-size:52px;margin-bottom:16px;">✅</div>
        <h3 style="font-family:var(--font-display);font-size:1.8rem;color:var(--navy);margin-bottom:10px;">
          Message <em>Sent!</em>
        </h3>
        <p style="color:var(--text-3);font-size:14px;line-height:1.75;">
          Thank you, ${name}! We've received your enquiry and will call you within 2 hours. A confirmation will be sent to <strong>${email}</strong>.
        </p>
      </div>`;
  }
}

/* ============================================================
   EMI CALCULATOR
   ============================================================ */
function calcEMI() {
  const price  = parseInt(document.getElementById('emi-price')?.value  || 7500000);
  const down   = parseInt(document.getElementById('emi-down')?.value   || 20);
  const rate   = parseFloat(document.getElementById('emi-rate')?.value || 8.5);
  const tenure = parseInt(document.getElementById('emi-tenure')?.value || 20);

  const loan  = price * (1 - down / 100);
  const mr    = rate / 12 / 100;
  const n     = tenure * 12;
  const emi   = (loan * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
  const int   = emi * n - loan;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('emi-price-val',  fmtINR(price));
  set('emi-down-val',   down + '%');
  set('emi-rate-val',   rate.toFixed(1) + '%');
  set('emi-tenure-val', tenure + ' Yrs');
  set('emi-monthly',    '₹' + Math.round(emi).toLocaleString('en-IN'));
  set('emi-loan-amt',   fmtINR(loan));
  set('emi-interest',   fmtINR(int));
}
function fmtINR(n) {
  if (n >= 10000000) return '₹' + (n/10000000).toFixed(1) + ' Cr';
  if (n >= 100000)   return '₹' + (n/100000).toFixed(0) + ' L';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

/* ============================================================
   PROPERTY VALUE CHART
   ============================================================ */
function buildChart() {
  const wrap = document.getElementById('prop-chart-bars');
  if (!wrap) return;
  const data = [
    {yr:'2020',val:52,type:'past'},{yr:'2021',val:56,type:'past'},
    {yr:'2022',val:63,type:'past'},{yr:'2023',val:69,type:'past'},
    {yr:'2024',val:78,type:'past'},{yr:'2025',val:84,type:'future'},
    {yr:'2026',val:91,type:'future'},{yr:'2027',val:99,type:'future'},
    {yr:'2028',val:108,type:'future'},{yr:'2029',val:118,type:'future'},
  ];
  const max = Math.max(...data.map(d => d.val));
  wrap.innerHTML = '';
  data.forEach(d => {
    const col = document.createElement('div');
    col.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;';
    const bar = document.createElement('div');
    bar.className = 'cbar ' + d.type;
    bar.style.height = Math.round((d.val / max) * 100) + '%';
    bar.title = '₹' + d.val + 'L (' + d.yr + ')';
    const lbl = document.createElement('div');
    lbl.className = 'cbar-label';
    lbl.textContent = d.yr;
    col.append(bar, lbl);
    wrap.appendChild(col);
  });
}

/* ============================================================
   COUNTER ANIMATION
   ============================================================ */
function animateCounter(el, target) {
  const dur = 1600, start = performance.now();
  const run = now => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round((1 - Math.pow(1-p, 3)) * target);
    if (p < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}
