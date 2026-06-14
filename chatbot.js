  /* ============================================================
     CONFIG — update these 3 values only
     ============================================================ */
  const CFG = {
    groqKey    : '',
    waNumber   : '919999999999',
    webhookUrl : 'https://hook.eu2.make.com/bysh1kk41jadvaoinf6eiyx8n864633b',
  };

  /* ============================================================
     SYSTEM PROMPT
     ============================================================ */
  const SYSTEM = `You are Priya, a friendly property advisor at Luxury Homes — Indirapuram's most trusted real estate firm since 2012.

PERSONALITY:
- Warm and conversational, like a helpful local friend
- Keep replies SHORT — 2 sentences max
- Occasionally say "bilkul", "zaroor", "theek hai" to feel local
- Use 1 emoji per message max
- Never write bullet lists

KNOWLEDGE:
Office: Gyan Khand 1, Indirapuram, Ghaziabad 201014
Phone: +91 99999 99999 | Hours: Mon-Sat 9AM-7PM
Rating: 4.9 stars, 187 reviews | Since 2012 | 500+ families

PROPERTIES:
- 2 BHK: Rs 45L to 75L (Gyan Khand, Niti Khand, Shakti Khand)
- 3 BHK: Rs 70L to 1.2Cr (Gyan Khand 2, Niti Khand 2)
- Shops: Rs 80L to 2Cr (Vaibhav Khand, Niti Khand 1)
- Office rent: Rs 35000 to 80000/month (Niti Khand 1)
- Plots: Rs 95L for 200 Gaj (Crossings Republik)
- Rental flats: Rs 15000 to 35000/month (all sectors)
- Home loan: Best rate 8.35% SBI, 80% of value, 92% approval rate

LEAD COLLECTION RULES — FOLLOW EXACTLY:
1. First understand what they want (ask ONE question at a time)
2. Collect: lead type, property type, budget, location
3. Then ask for name, then email, then phone (ONE at a time)
4. Only after you have ALL of name + phone + email, output the LEAD tag

LEAD TAG FORMAT — output this ONLY when you have name, phone AND email:
[LEAD:{"leadType":"Buy","propertyType":"Flat","budget":"80L","location":"Niti Khand","name":"Faizan","email":"faizan@gmail.com","phone":"9876543210","summary":"3BHK flat in Niti Khand under 80L"}]

CRITICAL RULES FOR LEAD TAG:
- NEVER output [LEAD:...] with empty name, phone or email fields
- NEVER output [LEAD:...] until user has given their actual name, actual phone number AND actual email
- The tag must be the LAST thing in your response, on its own
- Do not explain or mention the tag to the user`;

  /* ============================================================
     STATE
     ============================================================ */
  const S = { open:false, history:[], led:false, typing:false };

  /* ============================================================
     INIT
     ============================================================ */
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const n = document.getElementById('lh-notif');
      if (n && !S.open) n.style.display = 'flex';
      lhAddBot("Hey there! 👋 I'm Priya from Luxury Homes. Looking to buy, rent, sell or invest in Indirapuram? I'm here to help!");
      lhShowQuick();
    }, 2500);
  });

  /* ============================================================
     TOGGLE
     ============================================================ */
  function lhToggle() {
    S.open = !S.open;
    const win   = document.getElementById('lh-chat-window');
    const icon  = document.getElementById('lh-icon');
    const notif = document.getElementById('lh-notif');
    win.classList.toggle('open', S.open);
    win.setAttribute('aria-hidden', !S.open);
    icon.textContent = S.open ? '✕' : '💬';
    if (S.open) {
      if (notif) notif.style.display = 'none';
      setTimeout(() => document.getElementById('lh-input')?.focus(), 250);
      lhScroll();
    }
  }

  /* ============================================================
     SEND
     ============================================================ */
  function lhSend() {
    const input = document.getElementById('lh-input');
    const text  = input?.value.trim();
    if (!text || S.typing) return;
    input.value = '';
    lhAddUser(text);
    S.history.push({ role:'user', content:text });
    document.getElementById('lh-quick-btns')?.remove();
    lhGetReply();
  }

  function lhQuick(text) {
    if (S.typing) return;
    document.getElementById('lh-input').value = text;
    lhSend();
  }

  /* ============================================================
     GROQ API
     ============================================================ */
  async function lhGetReply() {
    S.typing = true;
    lhShowTyping();

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method : 'POST',
        headers: {
          'Content-Type' : 'application/json',
          'Authorization': `Bearer ${CFG.groqKey}`,
        },
        body: JSON.stringify({
          model    : 'llama-3.1-8b-instant',
          messages : [
            { role:'system', content:SYSTEM },
            ...S.history,
          ],
          temperature : 0.7,
          max_tokens  : 250,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const raw = data?.choices?.[0]?.message?.content || "Sorry, please call +91 99999 99999";

      /* ---- Strip ALL lead tags from display ---- */
      /* Match [LEAD:{...}] even if the JSON has newlines inside */
      const leadMatch = raw.match(/\[LEAD:\s*(\{[\s\S]*?\})\s*\]/);
      const clean = raw.replace(/\[LEAD:\s*\{[\s\S]*?\}\s*\]/g, '').trim();

      /* Push CLEAN version to history (no tag) */
      S.history.push({ role:'assistant', content: clean });

      lhHideTyping();
      lhAddBot(clean);

      /* Only fire if lead tag exists AND name + phone + email are non-empty */
      if (leadMatch && !S.led) {
        try {
          const lead = JSON.parse(leadMatch[1]);
          const hasName  = lead.name  && lead.name.trim()  !== '';
          const hasPhone = lead.phone && lead.phone.trim() !== '';
          const hasEmail = lead.email && lead.email.trim() !== '';

          if (hasName && hasPhone && hasEmail) {
            S.led = true;
            lhFireWebhook(lead);
            setTimeout(() => lhAddWABtn(lead), 700);
          }
        } catch(e) {
          console.warn('Lead JSON parse error:', e, leadMatch[1]);
        }
      }

    } catch(err) {
      lhHideTyping();
      console.error('Chat error:', err.message);
      lhAddBot(
        CFG.groqKey === 'YOUR_GROQ_API_KEY'
          ? "⚠️ Add your Groq API key in the config. Get it free at console.groq.com"
          : "Sorry, small issue! Call us: +91 99999 99999 😊"
      );
      S.history.push({ role:'assistant', content:'[error]' });
    }

    S.typing = false;
  }

  /* ============================================================
     WEBHOOK — sends ALL fields to Make
     ============================================================ */
  async function lhFireWebhook(lead) {
    const payload = {
      /* Identity */
      name      : lead.name     || '',
      phone     : lead.phone    || '',
      email     : lead.email    || '',
      /* Lead classification — these show in Google Sheets */
      lead_type    : lead.leadType    || lead.intent || '',
      property_type: lead.propertyType || '',
      budget       : lead.budget      || '',
      location     : lead.location    || '',
      summary      : lead.summary     || '',
      /* Routing for Make router */
      sheet_tab    : lead.leadType    || lead.intent || 'General',
      form_type    : 'ai_chatbot',
      /* Meta */
      timestamp : new Date().toISOString(),
      source    : window.location.href,
      page      : document.title,
    };

    console.log('Sending to webhook:', payload);

    try {
      await fetch(CFG.webhookUrl, {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify(payload),
      });
      console.log('✅ Webhook sent');
    } catch(e) {
      console.warn('Webhook error:', e);
    }
  }

  /* ============================================================
     UI HELPERS
     ============================================================ */
  function lhAddUser(text) {
    const d = document.createElement('div');
    d.className = 'lh-row user';
    d.innerHTML = `<div class="lh-bubble"><p>${lhEsc(text)}</p><span class="lh-time">${lhTime()}</span></div>`;
    document.getElementById('lh-msgs').appendChild(d);
    lhScroll();
  }

  function lhAddBot(text) {
    const d = document.createElement('div');
    d.className = 'lh-row bot';
    const html = lhEsc(text)
      .replace(/\n/g,'<br>')
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
    d.innerHTML = `
      <div class="lh-mini-avatar">P</div>
      <div class="lh-bubble"><p>${html}</p><span class="lh-time">${lhTime()}</span></div>`;
    document.getElementById('lh-msgs').appendChild(d);
    lhScroll();
  }

  function lhAddWABtn(lead) {
    const txt = encodeURIComponent(
      `Hi Luxury Homes! I'm ${lead.name}. I want to ${lead.leadType || lead.intent}. ${lead.summary || ''}`
    );
    const d = document.createElement('div');
    d.className = 'lh-row bot';
    d.innerHTML = `
      <div class="lh-mini-avatar">P</div>
      <div class="lh-bubble">
        <p>Our team will call you within 2 hours! You can also reach us directly 👇</p>
        <a href="https://wa.me/${CFG.waNumber}?text=${txt}" target="_blank" class="lh-wa-btn">💬 Chat on WhatsApp</a>
      </div>`;
    document.getElementById('lh-msgs').appendChild(d);
    lhScroll();
  }

  function lhShowQuick() {
    if (document.getElementById('lh-quick-btns')) return;
    const d = document.createElement('div');
    d.id = 'lh-quick-btns';
    d.className = 'lh-quick';
    d.innerHTML = `
      <button onclick="lhQuick('I want to buy a property')">🏠 Buy</button>
      <button onclick="lhQuick('I want to rent a flat')">🔑 Rent</button>
      <button onclick="lhQuick('I want to sell my property')">💰 Sell</button>
      <button onclick="lhQuick('I want to invest in property')">📈 Invest</button>
      <button onclick="lhQuick('I want to give my property on rent')">🏢 Give on Rent</button>`;
    document.getElementById('lh-msgs').appendChild(d);
    lhScroll();
  }

  function lhShowTyping() {
    if (document.getElementById('lh-typing-row')) return;
    const d = document.createElement('div');
    d.className = 'lh-row bot'; d.id = 'lh-typing-row';
    d.innerHTML = `<div class="lh-mini-avatar">P</div><div class="lh-bubble"><div class="lh-typing"><span></span><span></span><span></span></div></div>`;
    document.getElementById('lh-msgs').appendChild(d);
    lhScroll();
  }

  function lhHideTyping() { document.getElementById('lh-typing-row')?.remove(); }
  function lhScroll() { const m = document.getElementById('lh-msgs'); if(m) setTimeout(()=>m.scrollTop=m.scrollHeight,60); }
  function lhTime()  { return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); }
  function lhEsc(t)  { return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
