(function () {
  const events = [];
  const SEND_INTERVAL = 8000;
  let hoverTimers = {};
  let sentCount = {};
  let lastInterest = null;

  window.__behaviorInterest = null;
  window.__behaviorSentiment = 'browsing';

  function track(type, data) {
    events.push({ type, ...data, time: Date.now() });
    if (events.length > 100) events.splice(0, 20);
  }

  function getIncrement(key) {
    if (!sentCount[key]) sentCount[key] = 0;
    sentCount[key]++;
    return sentCount[key];
  }

  document.querySelectorAll('[data-track]').forEach(el => {
    const name = el.dataset.track;

    el.addEventListener('mouseenter', () => {
      const start = Date.now();
      hoverTimers[name] = start;
      track('mouseenter', { element: name });
    });

    el.addEventListener('mouseleave', () => {
      if (hoverTimers[name]) {
        const dur = (Date.now() - hoverTimers[name]) / 1000;
        if (dur > 0.5) {
          track('hover', { element: name, duration: Math.round(dur * 10) / 10 });
        }
        delete hoverTimers[name];
      }
    });

    el.addEventListener('click', () => {
      track('click', { element: name });
      const c = getIncrement('click_' + name);
      if (c === 1) sendNow();
    });
  });

  let scrollSections = {};
  let lastScrollTime = Date.now();

  window.addEventListener('scroll', () => {
    const now = Date.now();
    if (now - lastScrollTime < 500) return;
    lastScrollTime = now;
    const sections = document.querySelectorAll('[data-section]');
    let visible = null;
    sections.forEach(s => {
      const rect = s.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.6 && rect.bottom > 0) {
        visible = s.dataset.section;
      }
    });
    if (visible) {
      if (!scrollSections[visible]) scrollSections[visible] = 0;
      scrollSections[visible]++;
    }
  });

  setInterval(() => {
    for (const [section, count] of Object.entries(scrollSections)) {
      if (count > 0) {
        track('scroll', { section, count });
        delete scrollSections[section];
      }
    }
  }, 5000);

  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 0) {
      track('exit_intent', { element: 'page' });
      sendNow();
    }
  });

  const toasts = [];

  function showToast(message, sentiment) {
    const colors = {
      interested: '#22c55e',
      price_sensitive: '#f59e0b',
      confused: '#f97316',
      abandoning: '#ef4444',
      high_intent: '#38bdf8',
      browsing: '#64748b'
    };
    const color = colors[sentiment] || '#38bdf8';

    const container = document.getElementById('toastContainer') || (() => {
      const c = document.createElement('div');
      c.id = 'toastContainer';
      c.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:99999;display:flex;flex-direction:column;gap:0.5rem;max-width:340px;';
      document.body.appendChild(c);
      return c;
    })();

    const toast = document.createElement('div');
    toast.style.cssText = `background:#1e293b;border-left:4px solid ${color};border-radius:8px;padding:0.85rem 1rem;color:#e2e8f0;font-size:0.85rem;box-shadow:0 8px 24px rgba(0,0,0,0.4);animation:slideInToast 0.3s ease-out;display:flex;align-items:center;gap:0.5rem;`;
    toast.innerHTML = `<span>${message}</span><span style="color:#64748b;cursor:pointer;font-size:0.8rem;margin-left:auto;" onclick="this.parentElement.remove()">✕</span>`;
    container.appendChild(toast);

    toasts.push(toast);
    if (toasts.length > 3) {
      const old = toasts.shift();
      if (old.parentNode) old.remove();
    }

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      toast.style.transition = '0.3s';
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
    }, 5000);
  }

  async function sendNow() {
    if (events.length === 0) return;
    const batch = events.splice(0);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch })
      });
      const data = await res.json();
      window.__behaviorSentiment = data.sentiment || 'browsing';

      if (data.target_service && data.target_service !== lastInterest) {
        lastInterest = data.target_service;
        window.__behaviorInterest = data.target_service;
        window.dispatchEvent(new CustomEvent('behavior:interest', {
          detail: { service: data.target_service, sentiment: data.sentiment, discount: data.discount_percent }
        }));
      }

      if (data.toast_message && data.toast_message.trim()) {
        showToast(data.toast_message, data.sentiment);
      }
    } catch {}
  }

  setInterval(sendNow, SEND_INTERVAL);

  const style = document.createElement('style');
  style.textContent = `@keyframes slideInToast { from { opacity:0;transform:translateX(40px); } to { opacity:1;transform:translateX(0); } }`;
  document.head.appendChild(style);
})();
