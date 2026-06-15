/* ============================================================
   CONFIG — update these 3 values
   ============================================================ */
const CFG = {
  groqKey    : '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',
  waNumber   : '919999999989',
  webhookUrl : 'https://hook.eu2.make.com/7dwuqdlwtqjto2b5g15197ifk3qbdvx7',
};
 
/* ============================================================
   PROPERTY DATABASE
   Add/remove properties here. Same IDs should be in your
   Google Sheets "Properties" tab so Make can look them up.
   ============================================================ */
const PROPERTIES = [
  {
    id:'LH001', title:'3 BHK Premium Apartment', type:'Flat',
    intent:['Buy'], location:'Gyan Khand', area:'Gyan Khand 2, Indirapuram',
    price:'₹78 Lakh', size:'1450 sq ft', bhk:3,
    tags:['RERA Verified','Pool','Ready to Move'],
    budget_tags:['60L-1Cr'], emoji:'🏢',
  },
  {
    id:'LH002', title:'2 BHK Furnished Flat', type:'Flat',
    intent:['Rent'], location:'Niti Khand', area:'Niti Khand 3, Indirapuram',
    price:'₹18,000/mo', size:'1100 sq ft', bhk:2,
    tags:['Semi-Furnished','2 Bath','Lift'],
    budget_tags:['12K-20K'], emoji:'🏠',
  },
  {
    id:'LH003', title:'Commercial Shop — 15% ROI', type:'Shop',
    intent:['Buy','Invest'], location:'Vaibhav Khand', area:'Vaibhav Khand, Indirapuram',
    price:'₹1.2 Crore', size:'450 sq ft', bhk:null,
    tags:['15% Yield','Tenant Ready','RERA'],
    budget_tags:['1Cr-2Cr'], emoji:'🛒',
  },
  {
    id:'LH004', title:'2 BHK Ready to Move', type:'Flat',
    intent:['Buy'], location:'Shakti Khand', area:'Shakti Khand 4, Indirapuram',
    price:'₹55 Lakh', size:'980 sq ft', bhk:2,
    tags:['Ready Possession','2 Bath','RERA'],
    budget_tags:['30L-60L'], emoji:'🏡',
  },
  {
    id:'LH005', title:'Plot — Appreciation Zone', type:'Plot',
    intent:['Buy','Invest'], location:'Crossings Republik', area:'Crossings Republik, Ghaziabad',
    price:'₹95 Lakh', size:'200 Gaj', bhk:null,
    tags:['22% Growth (2yr)','Clear Title','Registry Ready'],
    budget_tags:['60L-1Cr'], emoji:'📐',
  },
  {
    id:'LH006', title:'Office Space — Prime Location', type:'Office',
    intent:['Rent'], location:'Niti Khand', area:'Niti Khand 1, Indirapuram',
    price:'₹35,000/mo', size:'800 sq ft', bhk:null,
    tags:['Fully Fitted','2 Parking','CCTV'],
    budget_tags:['35K-60K'], emoji:'🏢',
  },
  {
    id:'LH007', title:'3 BHK With Study Room', type:'Flat',
    intent:['Buy'], location:'Niti Khand', area:'Niti Khand 2, Indirapuram',
    price:'₹92 Lakh', size:'1680 sq ft', bhk:3,
    tags:['Study Room','2 Parking','Club House'],
    budget_tags:['60L-1Cr'], emoji:'🏘',
  },
  {
    id:'LH008', title:'3 BHK Fully Furnished', type:'Flat',
    intent:['Rent'], location:'Gyan Khand', area:'Gyan Khand 1, Indirapuram',
    price:'₹28,000/mo', size:'1350 sq ft', bhk:3,
    tags:['Fully Furnished','AC in all rooms','Modular Kitchen'],
    budget_tags:['20K-35K'], emoji:'🏠',
  },
  {
    id:'LH009', title:'1 BHK Compact Flat', type:'Flat',
    intent:['Buy','Rent'], location:'Shakti Khand', area:'Shakti Khand 2, Indirapuram',
    price:'₹32 Lakh', size:'650 sq ft', bhk:1,
    tags:['Affordable','Metro Nearby','RERA'],
    budget_tags:['30L-60L','Under 30L'], emoji:'🏠',
  },
  {
    id:'LH010', title:'Villa — Independent House', type:'House',
    intent:['Buy'], location:'Vasundhara', area:'Vasundhara, Ghaziabad',
    price:'₹1.8 Crore', size:'2800 sq ft', bhk:4,
    tags:['Private Garden','4 BHK','Premium Society'],
    budget_tags:['1Cr-2Cr'], emoji:'🏰',
  },
];
 
/* ============================================================
   PROPERTY MATCHING ENGINE
   Returns up to 3 best matches based on lead data
   ============================================================ */
function matchProperties(leadType, propType, budget, location) {
  let results = PROPERTIES.filter(p => {
    if (!p.intent.includes(leadType)) return false;
    if (propType && propType !== 'Any' && p.type.toLowerCase() !== propType.toLowerCase()) return false;
    if (location && location !== 'Any' && !p.location.toLowerCase().includes(location.toLowerCase())) return false;
    if (budget && budget !== 'Any' && !p.budget_tags.includes(budget)) return false;
    return true;
  });
 
  // Loosen location if too few
  if (results.length < 2) {
    results = PROPERTIES.filter(p => {
      if (!p.intent.includes(leadType)) return false;
      if (propType && propType !== 'Any' && p.type.toLowerCase() !== propType.toLowerCase()) return false;
      if (budget && budget !== 'Any' && !p.budget_tags.includes(budget)) return false;
      return true;
    });
  }
 
  // Loosen budget + location if still too few
  if (results.length < 2) {
    results = PROPERTIES.filter(p => p.intent.includes(leadType));
  }
 
  return results.slice(0, 3);
}
 
/* ============================================================
   LEAD STATE
   ============================================================ */
const lead = {
  leadType:'', propertyType:'', budget:'', location:'',
  name:'', email:'', phone:'', summary:'',
  interestedProperties: [], // array of {id, title, price}
};
 
let currentStep  = 'start';
let chatHistory  = [];
let isOpen       = false;
 
/* ============================================================
   FLOW DEFINITION
   ============================================================ */
const FLOW = {
  start: {
    msg: "Hey there! 👋 I'm Priya from Luxury Homes.\n\nWhat are you looking to do today?",
    type:'options', field:'leadType',
    options:[
      { label:'🏠 Buy a Property',       val:'Buy',         next:'prop_type_buy'    },
      { label:'🔑 Rent a Property',       val:'Rent',        next:'prop_type_rent'   },
      { label:'💰 Sell My Property',      val:'Sell',        next:'sell_type'        },
      { label:'📈 Invest in Property',    val:'Invest',      next:'prop_type_invest' },
      { label:'🏢 Give Property on Rent', val:'Give on Rent',next:'give_type'        },
      { label:'💬 Ask a Question',        val:'Question',    next:'ai_question'      },
    ],
  },
 
  /* ---- PROPERTY TYPES ---- */
  prop_type_buy: {
    msg:'What type of property do you want to buy?',
    type:'options', field:'propertyType',
    options:[
      { label:'🏢 Flat / Apartment', val:'Flat',   next:'budget_buy'  },
      { label:'🏘 Independent House',val:'House',  next:'budget_buy'  },
      { label:'📐 Plot / Land',      val:'Plot',   next:'budget_buy'  },
      { label:'🛒 Shop / Commercial',val:'Shop',   next:'budget_buy'  },
      { label:'🏰 Villa',            val:'Villa',  next:'budget_buy'  },
    ],
  },
  prop_type_rent: {
    msg:'What type of property do you want to rent?',
    type:'options', field:'propertyType',
    options:[
      { label:'🏢 Flat / Apartment', val:'Flat',   next:'budget_rent' },
      { label:'🏘 Independent House',val:'House',  next:'budget_rent' },
      { label:'🛒 Shop / Commercial',val:'Shop',   next:'budget_rent' },
      { label:'🏢 Office Space',     val:'Office', next:'budget_rent' },
    ],
  },
  prop_type_invest: {
    msg:'What type of property are you looking to invest in?',
    type:'options', field:'propertyType',
    options:[
      { label:'🏢 Residential Flat', val:'Flat',   next:'budget_invest' },
      { label:'🛒 Commercial Shop',  val:'Shop',   next:'budget_invest' },
      { label:'🏢 Office Space',     val:'Office', next:'budget_invest' },
      { label:'📐 Plot / Land',      val:'Plot',   next:'budget_invest' },
    ],
  },
 
  /* ---- BUDGETS ---- */
  budget_buy: {
    msg:'What is your purchase budget?',
    type:'options', field:'budget',
    options:[
      { label:'Under ₹30 Lakh',  val:'Under 30L', next:'location' },
      { label:'₹30L – ₹60L',     val:'30L-60L',   next:'location' },
      { label:'₹60L – ₹1 Crore', val:'60L-1Cr',   next:'location' },
      { label:'₹1Cr – ₹2Cr',     val:'1Cr-2Cr',   next:'location' },
      { label:'Above ₹2 Crore',  val:'Above 2Cr', next:'location' },
    ],
  },
  budget_rent: {
    msg:'What is your monthly rental budget?',
    type:'options', field:'budget',
    options:[
      { label:'Under ₹12,000', val:'Under 12K', next:'location' },
      { label:'₹12K – ₹20K',   val:'12K-20K',  next:'location' },
      { label:'₹20K – ₹35K',   val:'20K-35K',  next:'location' },
      { label:'₹35K – ₹60K',   val:'35K-60K',  next:'location' },
      { label:'Above ₹60,000', val:'Above 60K',next:'location'  },
    ],
  },
  budget_invest: {
    msg:'What is your investment budget?',
    type:'options', field:'budget',
    options:[
      { label:'₹30L – ₹60L',    val:'30L-60L',  next:'location' },
      { label:'₹60L – ₹1 Crore',val:'60L-1Cr',  next:'location' },
      { label:'₹1Cr – ₹2Cr',    val:'1Cr-2Cr',  next:'location' },
      { label:'Above ₹2 Crore', val:'Above 2Cr',next:'location' },
    ],
  },
 
  /* ---- SELL / GIVE ON RENT ---- */
  sell_type: {
    msg:'What type of property do you want to sell?',
    type:'options', field:'propertyType',
    options:[
      { label:'🏢 Flat / Apartment', val:'Flat',   next:'sell_price' },
      { label:'🏘 Independent House',val:'House',  next:'sell_price' },
      { label:'📐 Plot / Land',      val:'Plot',   next:'sell_price' },
      { label:'🛒 Shop / Commercial',val:'Shop',   next:'sell_price' },
    ],
  },
  sell_price: {
    msg:'What price are you expecting?',
    type:'options', field:'budget',
    options:[
      { label:'Under ₹40 Lakh',  val:'Under 40L', next:'location' },
      { label:'₹40L – ₹70L',     val:'40L-70L',   next:'location' },
      { label:'₹70L – ₹1 Crore', val:'70L-1Cr',   next:'location' },
      { label:'₹1Cr – ₹2Cr',     val:'1Cr-2Cr',   next:'location' },
      { label:'Above ₹2 Crore',  val:'Above 2Cr', next:'location' },
    ],
  },
  give_type: {
    msg:'What type of property do you want to give on rent?',
    type:'options', field:'propertyType',
    options:[
      { label:'🏢 Flat / Apartment', val:'Flat',   next:'give_rent' },
      { label:'🏘 Independent House',val:'House',  next:'give_rent' },
      { label:'🛒 Shop / Commercial',val:'Shop',   next:'give_rent' },
      { label:'🏢 Office Space',     val:'Office', next:'give_rent' },
    ],
  },
  give_rent: {
    msg:'What monthly rent are you expecting?',
    type:'options', field:'budget',
    options:[
      { label:'Under ₹15,000', val:'Under 15K', next:'location' },
      { label:'₹15K – ₹30K',   val:'15K-30K',  next:'location' },
      { label:'₹30K – ₹60K',   val:'30K-60K',  next:'location' },
      { label:'Above ₹60,000', val:'Above 60K',next:'location'  },
    ],
  },
 
  /* ---- LOCATION ---- */
  location: {
    msg:'Which area are you interested in?',
    type:'options', field:'location',
    options:[
      { label:'Gyan Khand',         val:'Gyan Khand',         next:'show_properties' },
      { label:'Niti Khand',         val:'Niti Khand',         next:'show_properties' },
      { label:'Shakti Khand',       val:'Shakti Khand',       next:'show_properties' },
      { label:'Vaibhav Khand',      val:'Vaibhav Khand',      next:'show_properties' },
      { label:'Crossings Republik', val:'Crossings Republik', next:'show_properties' },
      { label:'Vasundhara',         val:'Vasundhara',         next:'show_properties' },
      { label:'Any / Flexible',     val:'Any',                next:'show_properties' },
    ],
  },
 
  /* ---- CONTACT ---- */
  ask_name: {
    msg:"Perfect! To share full details and schedule a visit, I'll need your contact info.\n\nWhat's your full name?",
    type:'input', inputType:'text', placeholder:'e.g. Rahul Sharma',
    field:'name', next:'ask_email',
  },
  ask_email: {
    msg:'Thanks {name}! What is your email address? We will send property details there.',
    type:'input', inputType:'email', placeholder:'yourname@gmail.com',
    field:'email', next:'ask_phone', validate:'email',
  },
  ask_phone: {
    msg:'And your WhatsApp number? Our expert will call you within 2 hours.',
    type:'input', inputType:'tel', placeholder:'9876543210',
    field:'phone', next:'done', validate:'phone',
  },
  done: {
    msg:'',
    type:'done',
  },
 
  /* ---- AI FREE QUESTION ---- */
  ai_question: {
    msg:"Sure! Ask me anything about properties in Indirapuram 😊",
    type:'ai_mode',
  },
};
 
/* ============================================================
   TOGGLE
   ============================================================ */
function lhToggle() {
  isOpen = !isOpen;
  const win   = document.getElementById('lh-chat-window');
  const icon  = document.getElementById('lh-icon');
  const notif = document.getElementById('lh-notif');
  win.classList.toggle('open', isOpen);
  win.setAttribute('aria-hidden', !isOpen);
  icon.textContent = isOpen ? '✕' : '💬';
  if (isOpen && notif) notif.style.display = 'none';
  if (isOpen) lhScroll();
}
 
/* ============================================================
   INIT
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const n = document.getElementById('lh-notif');
    if (n) n.style.display = 'flex';
    goToStep('start');
  }, 2000);
});
 
/* ============================================================
   STEP ENGINE
   ============================================================ */
function goToStep(stepKey) {
  currentStep = stepKey;
  const step  = FLOW[stepKey];
  if (!step) return;
 
  /* Special steps */
  if (stepKey === 'show_properties') { showMatchedProperties(); return; }
  if (stepKey === 'done')            { handleDone(); return; }
 
  const msg = step.msg.replace('{name}', lead.name || '');
  if (msg) addBotMsg(msg);
 
  if (step.type === 'options')   addOptions(step.options, step.field);
  if (step.type === 'input')     addInputField(step);
  if (step.type === 'ai_mode')   showFreeInput();
}
 
/* ============================================================
   SHOW MATCHED PROPERTIES
   ============================================================ */
function showMatchedProperties() {
  const matches = matchProperties(lead.leadType, lead.propertyType, lead.budget, lead.location);
 
  if (matches.length === 0) {
    addBotMsg("I couldn't find an exact match right now, but our team has more listings. Let me connect you with an expert! 😊");
    setTimeout(() => goToStep('ask_name'), 500);
    return;
  }
 
  addBotMsg(`Great news! 🎉 I found ${matches.length} propert${matches.length > 1 ? 'ies' : 'y'} matching your requirement. Tap "I'm Interested" on any that you like!`);
 
  setTimeout(() => {
    matches.forEach((prop, idx) => {
      setTimeout(() => addPropertyCard(prop), idx * 300);
    });
 
    // After all cards, ask if they want contact
    setTimeout(() => {
      addBotMsg("Would you like our expert to call you with more details and arrange a site visit? 📞");
      const wrap = document.createElement('div');
      wrap.className = 'lh-options';
      const yes = document.createElement('button');
      yes.className = 'lh-opt-btn gold';
      yes.textContent = '✅ Yes, call me!';
      yes.onclick = () => { wrap.remove(); addUserMsg('Yes, call me!'); setTimeout(() => goToStep('ask_name'), 400); };
      const no = document.createElement('button');
      no.className = 'lh-opt-btn';
      no.textContent = '🔄 See different options';
      no.onclick = () => { wrap.remove(); addUserMsg('See different options'); resetLead(); setTimeout(() => goToStep('start'), 400); };
      wrap.appendChild(yes);
      wrap.appendChild(no);
      document.getElementById('lh-msgs').appendChild(wrap);
      lhScroll();
    }, matches.length * 300 + 500);
  }, 400);
}
 
function addPropertyCard(prop) {
  const card = document.createElement('div');
  card.className = 'lh-prop-card';
  card.id = 'prop-' + prop.id;
  card.innerHTML = `
    <div class="lh-prop-card-head">
      <span class="ptitle">${prop.emoji} ${prop.title}</span>
      <span class="pprice">${prop.price}</span>
    </div>
    <div class="lh-prop-card-body">
      <div class="lh-prop-loc">📍 ${prop.area}</div>
      <div class="lh-prop-tags">
        ${prop.size ? `<span>📐 ${prop.size}</span>` : ''}
        ${prop.bhk  ? `<span>🛏 ${prop.bhk} BHK</span>` : ''}
        ${prop.tags.map(t => `<span>${t}</span>`).join('')}
      </div>
      <button class="lh-prop-interested" onclick="selectProperty('${prop.id}','${prop.title}','${prop.price}', this)">
        👍 I'm Interested
      </button>
    </div>`;
  document.getElementById('lh-msgs').appendChild(card);
  lhScroll();
}
 
function selectProperty(id, title, price, btn) {
  // Toggle selection
  const already = lead.interestedProperties.find(p => p.id === id);
  if (already) {
    lead.interestedProperties = lead.interestedProperties.filter(p => p.id !== id);
    btn.textContent = '👍 I\'m Interested';
    btn.classList.remove('selected');
  } else {
    lead.interestedProperties.push({ id, title, price });
    btn.textContent = '✅ Selected!';
    btn.classList.add('selected');
  }
}
 
/* ============================================================
   HANDLE DONE — fire webhook after contact collected
   ============================================================ */
function handleDone() {
  const selectedStr = lead.interestedProperties.map(p => `${p.id}: ${p.title} (${p.price})`).join(' | ');
  lead.summary = `${lead.leadType} | ${lead.propertyType} | Budget: ${lead.budget} | Location: ${lead.location}`;
  if (selectedStr) lead.summary += ` | Interested in: ${selectedStr}`;
 
  // Fire webhook with ALL data including property IDs
  fireLead();
 
  // Show success
  addBotMsg(`Thank you ${lead.name}! ✅\n\nOur property expert will call you at ${lead.phone} within 2 hours. Full property details are being sent to ${lead.email} right now!\n\nYou can also reach us directly on WhatsApp 👇`);
 
  // Show WA button
  const txt = encodeURIComponent(`Hi Luxury Homes! I'm ${lead.name}. ${lead.summary}`);
  const wrap = document.createElement('div');
  wrap.innerHTML = `<a href="https://wa.me/${CFG.waNumber}?text=${txt}" target="_blank" class="lh-wa-btn" style="margin-left:35px;display:inline-flex;">💬 Chat on WhatsApp</a>`;
  document.getElementById('lh-msgs').appendChild(wrap);
 
  // Restart option
  setTimeout(() => {
    const r = document.createElement('div');
    r.className = 'lh-options';
    const btn = document.createElement('button');
    btn.className = 'lh-opt-btn gold';
    btn.textContent = '🔄 New Enquiry';
    btn.onclick = () => { r.remove(); resetLead(); setTimeout(() => goToStep('start'), 300); };
    r.appendChild(btn);
    document.getElementById('lh-msgs').appendChild(r);
    lhScroll();
  }, 800);
}
 
/* ============================================================
   FIRE WEBHOOK
   ============================================================ */
async function fireLead() {
  const payload = {
    form_type          : 'ai_chatbot',
    sheet_tab          : lead.leadType || 'General',
    lead_type          : lead.leadType,
    property_type      : lead.propertyType,
    budget             : lead.budget,
    location           : lead.location,
    name               : lead.name,
    email              : lead.email,
    phone              : lead.phone,
    summary            : lead.summary,
    /* Property IDs the user showed interest in */
    interested_property_ids   : lead.interestedProperties.map(p => p.id).join(', '),
    interested_property_names : lead.interestedProperties.map(p => p.title).join(', '),
    interested_property_prices: lead.interestedProperties.map(p => p.price).join(', '),
    timestamp          : new Date().toISOString(),
    source             : window.location.href,
    page               : document.title,
  };
 
  console.log('📤 Lead payload:', payload);
 
  try {
    await fetch(CFG.webhookUrl, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
    });
    console.log('✅ Sent to Make.com');
  } catch(e) { console.warn('Webhook error:', e); }
}
 
/* ============================================================
   OPTIONS / INPUT HELPERS
   ============================================================ */
function addOptions(options, field) {
  const wrap = document.createElement('div');
  wrap.className = 'lh-options';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'lh-opt-btn';
    btn.textContent = opt.label;
    btn.onclick = () => {
      wrap.remove();
      if (field) lead[field] = opt.val;
      addUserMsg(opt.label);
      setTimeout(() => goToStep(opt.next), 400);
    };
    wrap.appendChild(btn);
  });
  document.getElementById('lh-msgs').appendChild(wrap);
  lhScroll();
}
 
function addInputField(step) {
  const wrap = document.createElement('div');
  wrap.className = 'lh-input-step';
 
  const inp = document.createElement('input');
  inp.type = step.inputType || 'text';
  inp.placeholder = step.placeholder || '';
  inp.autocomplete = 'off';
 
  const err = document.createElement('span');
  err.className = 'lh-err-msg';
 
  const btn = document.createElement('button');
  btn.textContent = 'Continue →';
 
  const submit = () => {
    const val = inp.value.trim();
    if (!val) { inp.classList.add('error'); err.textContent = 'Please enter a value'; err.style.display='block'; return; }
    if (step.validate === 'email' && !isValidEmail(val)) {
      inp.classList.add('error'); err.textContent = '⚠️ Enter a valid email (e.g. name@gmail.com)'; err.style.display='block'; return;
    }
    if (step.validate === 'phone' && !isValidPhone(val)) {
      inp.classList.add('error'); err.textContent = '⚠️ Enter a valid 10-digit mobile number'; err.style.display='block'; return;
    }
    lead[step.field] = val;
    wrap.remove();
    addUserMsg(step.field === 'phone' ? '••••••••••' : val); // hide phone for privacy
    setTimeout(() => goToStep(step.next), 400);
  };
 
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  inp.addEventListener('input', () => { inp.classList.remove('error'); err.style.display='none'; });
  btn.onclick = submit;
 
  wrap.appendChild(inp);
  wrap.appendChild(err);
  wrap.appendChild(btn);
  document.getElementById('lh-msgs').appendChild(wrap);
  setTimeout(() => inp.focus(), 100);
  lhScroll();
}
 
function showFreeInput() {
  document.getElementById('lh-input-row').style.display = 'flex';
  setTimeout(() => document.getElementById('lh-input')?.focus(), 200);
}
 
/* ============================================================
   AI MODE (for general questions)
   ============================================================ */
const AI_SYSTEM = `You are Priya, a friendly property advisor at Luxury Homes, Indirapuram. Answer property questions briefly (2-3 sentences max).
Key facts: 2BHK ₹45L-75L, 3BHK ₹70L-1.2Cr, Shops ₹80L-2Cr, Rentals ₹15K-35K/mo, Appreciation ~12%/yr, Phone +91 99999 99999, Areas: Gyan Khand, Niti Khand, Shakti Khand, Vaibhav Khand, Crossings Republik.
Keep replies SHORT. Don't give bullet lists.`;
 
async function lhFreeText() {
  const input = document.getElementById('lh-input');
  const text  = input?.value.trim();
  if (!text) return;
  input.value = '';
  addUserMsg(text);
  chatHistory.push({ role:'user', content:text });
  showTyping();
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${CFG.groqKey}`},
      body:JSON.stringify({ model:'llama-3.1-8b-instant', messages:[{role:'system',content:AI_SYSTEM},...chatHistory], temperature:0.7, max_tokens:180 }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const reply = data?.choices?.[0]?.message?.content || "Call us: +91 99999 99999";
    chatHistory.push({ role:'assistant', content:reply });
    hideTyping();
    addBotMsg(reply);
    // After 2 AI answers, offer to start enquiry
    if (chatHistory.filter(m=>m.role==='user').length >= 2) {
      const wrap = document.createElement('div');
      wrap.className = 'lh-options';
      const btn = document.createElement('button');
      btn.className = 'lh-opt-btn gold';
      btn.textContent = '🏠 Start Property Enquiry';
      btn.onclick = () => { wrap.remove(); document.getElementById('lh-input-row').style.display='none'; chatHistory=[]; resetLead(); setTimeout(() => goToStep('start'), 300); };
      wrap.appendChild(btn);
      document.getElementById('lh-msgs').appendChild(wrap);
      lhScroll();
    }
  } catch(e) {
    hideTyping();
    addBotMsg("Sorry, small issue! Call us: +91 99999 99999 😊");
  }
}
 
/* ============================================================
   VALIDATION
   ============================================================ */
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim()); }
function isValidPhone(p) {
  const c = p.replace(/[\s\-\+]/g,'');
  return /^(91)?[6-9]\d{9}$/.test(c) || /^[6-9]\d{9}$/.test(c);
}
 
/* ============================================================
   RESET
   ============================================================ */
function resetLead() {
  Object.keys(lead).forEach(k => { lead[k] = k === 'interestedProperties' ? [] : ''; });
}
 
/* ============================================================
   UI HELPERS
   ============================================================ */
function addUserMsg(text) {
  const d = document.createElement('div');
  d.className = 'lh-row user';
  d.innerHTML = `<div class="lh-bubble"><p>${lhEsc(text)}</p><span class="lh-time">${lhTime()}</span></div>`;
  document.getElementById('lh-msgs').appendChild(d);
  lhScroll();
}
 
function addBotMsg(text) {
  const d = document.createElement('div');
  d.className = 'lh-row bot';
  const html = lhEsc(text).replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  d.innerHTML = `<div class="lh-mini-avatar">P</div><div class="lh-bubble"><p>${html}</p><span class="lh-time">${lhTime()}</span></div>`;
  document.getElementById('lh-msgs').appendChild(d);
  lhScroll();
}
 
function showTyping() {
  if (document.getElementById('lh-typing-row')) return;
  const d = document.createElement('div');
  d.className = 'lh-row bot'; d.id = 'lh-typing-row';
  d.innerHTML = `<div class="lh-mini-avatar">P</div><div class="lh-bubble"><div class="lh-typing"><span></span><span></span><span></span></div></div>`;
  document.getElementById('lh-msgs').appendChild(d);
  lhScroll();
}
function hideTyping() { document.getElementById('lh-typing-row')?.remove(); }
function lhScroll() { const m=document.getElementById('lh-msgs'); if(m) setTimeout(()=>m.scrollTop=m.scrollHeight,60); }
function lhTime()  { return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); }
function lhEsc(t)  { return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
