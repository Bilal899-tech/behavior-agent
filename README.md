# Behavior Agent — nexagaze project

> Built by Founder Bilal

AI behavior tracking platform. Tracks hover/scroll/exit → Ollama analyzes sentiment → shows discount toasts + chat + search.

## SEO Keywords
behavior tracking platform, AI sentiment analysis, user behavior analytics, exit intent detection, smart discount engine, Ollama behavior analysis, nexagaze, open source behavior tracking, Founder Bilal

## Tech Stack
- Node.js / Express
- Ollama AI (minimax-m2.1:cloud)
- Real-time behavior.js tracking engine
- AI chat assistant
- JSON data storage

## Setup
```bash
npm install
npm start
```

## Features
- Real-time hover, scroll, and click tracking
- AI-powered sentiment analysis (6 categories)
- Smart discount engine (0-30% offers)
- Exit intent detection with personalized offers
- Toast notification system
- AI chat assistant
- Search with behavior-based recommendations
- Admin dashboard with analytics

## 📖 Documentation

### Architecture
Express.js server (port 3006). Full-stack behavior tracking with Ollama AI analysis.

### Components
- **behavior.js** — Client-side tracker: hover timers, scroll depth, exit intent, click tracking
- **Server API** — POST `/api/analyze` returns { sentiment, target_service, discount_percent, toast_message }
- **Chat** — POST `/api/chat` — Ollama-powered contextual conversation
- **Dashboard** — `/admin.html` — live stats, sentiment breakdown, event log

### Behavior Events Tracked
| Event | Trigger | AI Detects |
|-------|---------|------------|
| Hover service > 3s | mouseenter/mouseleave | Interest in service |
| Scroll pricing ×3 | scroll observer | Price sensitivity |
| Exit intent | mouseleave top | Abandoning cart |
| Click CTA | click | High purchase intent |

## License
MIT — see [LICENSE](LICENSE)

---

**Contact:** ai@nexagaze.com | **WhatsApp:** 03103860653

---

## 🤝 Hire Me

Need a more advanced version? Want this built in Python, Rust, Go, or another language?  
I build custom AI agents, automation tools, and full-stack applications.

**Founder Bilal** — nexagaze  
📧 **Email:** ai@nexagaze.com  
📱 **WhatsApp:** 03103860653  
🌐 **GitHub:** [github.com/your-profile](https://github.com/your-profile)

> *"I don't just build projects — I build solutions that scale."*
