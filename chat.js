(function () {
  let open = false;
  let messages = [];

  const container = document.createElement('div');
  container.id = 'chatWidget';
  container.innerHTML = `
    <style>
      #chatWidget * { margin:0; padding:0; box-sizing:border-box; font-family:system-ui,-apple-system,sans-serif; }
      #chatBubble { position:fixed;bottom:1.5rem;left:1.5rem;z-index:99998;width:56px;height:56px;border-radius:50%;background:#38bdf8;color:#0f172a;border:none;cursor:pointer;font-size:1.5rem;box-shadow:0 4px 20px rgba(56,189,248,0.3);transition:0.3s;display:flex;align-items:center;justify-content:center; }
      #chatBubble:hover { transform:scale(1.1);background:#0ea5e9; }
      #chatBubble .badge { position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#ef4444;color:#fff;border-radius:50%;font-size:0.6rem;display:flex;align-items:center;justify-content:center;display:none; }
      #chatPanel { position:fixed;bottom:5.5rem;left:1.5rem;z-index:99998;width:360px;max-height:480px;background:#1e293b;border-radius:16px;border:1px solid #334155;box-shadow:0 12px 48px rgba(0,0,0,0.5);display:none;flex-direction:column;overflow:hidden;animation:chatIn 0.25s ease-out; }
      #chatPanel.open { display:flex; }
      @keyframes chatIn { from { opacity:0;transform:translateY(20px) scale(0.95); } to { opacity:1;transform:translateY(0) scale(1); } }
      #chatHeader { padding:1rem 1.2rem;background:#0f172a;display:flex;justify-content:space-between;align-items:center; }
      #chatHeader h4 { color:#e2e8f0;font-size:0.9rem;display:flex;align-items:center;gap:0.4rem; }
      #chatHeader h4 .dot { width:8px;height:8px;background:#22c55e;border-radius:50%;display:inline-block; }
      #chatHeader .close { color:#64748b;cursor:pointer;font-size:0.9rem;background:none;border:none;padding:0.2rem; }
      #chatHeader .close:hover { color:#ef4444; }
      #chatContext { padding:0.5rem 1.2rem;background:rgba(56,189,248,0.06);border-bottom:1px solid #0f172a;font-size:0.78rem;color:#94a3b8;display:none; }
      #chatMessages { flex:1;overflow-y:auto;padding:1rem 1.2rem;display:flex;flex-direction:column;gap:0.6rem;min-height:200px;max-height:300px; }
      #chatMessages .msg { max-width:85%;padding:0.6rem 0.9rem;border-radius:10px;font-size:0.85rem;line-height:1.5;animation:msgIn 0.2s ease-out; }
      @keyframes msgIn { from { opacity:0;transform:translateY(8px); } to { opacity:1;transform:translateY(0); } }
      #chatMessages .msg.user { align-self:flex-end;background:#38bdf8;color:#0f172a;border-bottom-right-radius:4px; }
      #chatMessages .msg.bot { align-self:flex-start;background:#0f172a;color:#cbd5e1;border-bottom-left-radius:4px; }
      #chatMessages .msg.bot .typing { display:inline-flex;gap:0.2rem; }
      #chatMessages .msg.bot .typing span { width:6px;height:6px;background:#64748b;border-radius:50%;animation:typing 1.4s infinite; }
      #chatMessages .msg.bot .typing span:nth-child(2) { animation-delay:0.2s; }
      #chatMessages .msg.bot .typing span:nth-child(3) { animation-delay:0.4s; }
      @keyframes typing { 0%,60%,100% { opacity:0.3;transform:translateY(0); } 30% { opacity:1;transform:translateY(-4px); } }
      #chatInputRow { display:flex;gap:0.5rem;padding:0.8rem 1.2rem;border-top:1px solid #0f172a; }
      #chatInputRow input { flex:1;padding:0.6rem 0.8rem;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:0.85rem;outline:none; }
      #chatInputRow input:focus { border-color:#38bdf8; }
      #chatInputRow button { padding:0.6rem 1rem;background:#38bdf8;color:#0f172a;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:0.82rem;white-space:nowrap; }
      #chatInputRow button:hover { background:#0ea5e9; }
      #chatInputRow button:disabled { opacity:0.5;cursor:not-allowed; }
      #chatSuggest { padding:0.3rem 1.2rem 0.8rem;display:flex;gap:0.4rem;flex-wrap:wrap; }
      #chatSuggest button { background:#0f172a;color:#64748b;border:1px solid #334155;padding:0.3rem 0.6rem;border-radius:6px;font-size:0.75rem;cursor:pointer;transition:0.2s; }
      #chatSuggest button:hover { border-color:#38bdf8;color:#38bdf8; }
      @media (max-width:480px) { #chatPanel { left:0.5rem;right:0.5rem;width:auto;max-height:70vh; } }
    </style>
    <button id="chatBubble">
      <span>💬</span>
      <span class="badge" id="chatBadge">1</span>
    </button>
    <div id="chatPanel">
      <div id="chatHeader">
        <h4><span class="dot"></span> BehaviorAI Chat</h4>
        <button class="close" id="chatClose">✕</button>
      </div>
      <div id="chatContext"></div>
      <div id="chatMessages">
        <div class="msg bot">Hi! I can see what you're interested in. Ask me anything about our services!</div>
      </div>
      <div id="chatSuggest"></div>
      <div id="chatInputRow">
        <input id="chatInput" placeholder="Ask about services..." />
        <button id="chatSend">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  const bubble = document.getElementById('chatBubble');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const msgContainer = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const ctxBar = document.getElementById('chatContext');
  const suggestBar = document.getElementById('chatSuggest');
  const badge = document.getElementById('chatBadge');

  let context = { target_service: null, sentiment: 'browsing' };
  let hasNew = false;

  function updateContext(detail) {
    if (detail && detail.service) {
      context.target_service = detail.service;
      context.sentiment = detail.sentiment || 'interested';
      ctxBar.textContent = '🤖 Detected: interested in ' + detail.service + (detail.discount ? ' — ' + detail.discount + '% off available!' : '');
      ctxBar.style.display = 'block';
      if (detail.discount) {
        ctxBar.textContent += ' 🎉';
      }
      suggestBar.innerHTML = '';
      [
        'Tell me about ' + detail.service,
        'How much does it cost?',
        'I want to book ' + detail.service,
        'Any discounts available?'
      ].forEach(text => {
        const b = document.createElement('button');
        b.textContent = text;
        b.onclick = () => { input.value = text; sendMessage(); };
        suggestBar.appendChild(b);
      });

      if (!open) {
        hasNew = true;
        badge.style.display = 'flex';
      }
    }
  }

  window.addEventListener('behavior:interest', (e) => updateContext(e.detail));

  bubble.addEventListener('click', () => {
    open = !open;
    panel.classList.toggle('open', open);
    badge.style.display = 'none';
    hasNew = false;
    if (open) {
      msgContainer.scrollTop = msgContainer.scrollHeight;
      input.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    open = false;
    panel.classList.remove('open');
  });

  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  sendBtn.addEventListener('click', sendMessage);

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendBtn.disabled = true;

    addMessage(text, 'user');
    const typingId = addTyping();

    const ctx = { ...context };
    if (window.__behaviorInterest) ctx.target_service = window.__behaviorInterest;
    ctx.sentiment = window.__behaviorSentiment || 'browsing';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: ctx })
      });
      const data = await res.json();
      removeTyping(typingId);
      addMessage(data.reply || 'Sorry, I could not process that.', 'bot');
    } catch {
      removeTyping(typingId);
      addMessage('Sorry, I\'m having trouble connecting. Please try again.', 'bot');
    }
    sendBtn.disabled = false;
  }

  function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    div.textContent = text;
    msgContainer.appendChild(div);
    msgContainer.scrollTop = msgContainer.scrollHeight;
    return div;
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    msgContainer.appendChild(div);
    msgContainer.scrollTop = msgContainer.scrollHeight;
    return div;
  }

  function removeTyping(el) {
    if (el && el.parentNode) el.remove();
  }

  if (window.__behaviorInterest) {
    updateContext({ service: window.__behaviorInterest, sentiment: window.__behaviorSentiment });
  }
})();
