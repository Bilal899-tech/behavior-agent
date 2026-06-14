import express from 'express';
import ollama from 'ollama';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const REACTIONS_FILE = join(DATA_DIR, 'reactions.json');
const MODEL = 'minimax-m2.1:cloud';

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR);
if (!existsSync(REACTIONS_FILE)) writeFileSync(REACTIONS_FILE, '[]');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static('.'));

function loadReactions() {
  try { return JSON.parse(readFileSync(REACTIONS_FILE, 'utf-8')); } catch { return []; }
}
function saveReactions(data) {
  writeFileSync(REACTIONS_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/reactions', (req, res) => {
  res.json(loadReactions());
});

app.get('/api/stats', (req, res) => {
  const all = loadReactions();
  const sentiments = {};
  const services = {};
  let totalDiscount = 0;
  let discountCount = 0;

  all.forEach(r => {
    const a = r.analysis || {};
    const s = a.sentiment || 'browsing';
    sentiments[s] = (sentiments[s] || 0) + 1;
    if (a.target_service) {
      services[a.target_service] = (services[a.target_service] || 0) + 1;
    }
    if (a.discount_percent) {
      totalDiscount += a.discount_percent;
      discountCount++;
    }
  });

  res.json({
    total: all.length,
    sentiments,
    services,
    avgDiscount: discountCount ? Math.round(totalDiscount / discountCount) : 0,
    recent20: all.slice(0, 20)
  });
});

app.post('/api/analyze', async (req, res) => {
  const events = req.body.events;
  if (!events || !events.length) return res.json({ ok: true });

  const prompt = `You are an advanced e-commerce behavioral AI. Analyze this user's real-time interaction events and return a JSON analysis.

Events (newest first):
${events.map(e => `- ${e.type}"${e.element||''}" ${e.duration ? `for ${e.duration}s` : ''} ${e.count ? `x${e.count}` : ''} ${e.section ? `in ${e.section}` : ''}`).join('\n')}

Return a JSON object with these fields:
- "sentiment": one of ["interested", "price_sensitive", "confused", "high_intent", "abandoning", "browsing"]
- "confidence": number 0-100
- "trigger": what specifically triggered this (e.g. "hovered SEO card for 3s", "compared pricing 3 times")
- "target_service": which service they seem most interested in, or null
- "discount_percent": 0-30 (only suggest discount if sentiment is price_sensitive or abandoning)
- "suggested_action": one sentence what to do
- "toast_message": short friendly notification message (max 60 chars) to display as toast, or empty string if no action needed

Return ONLY valid JSON. No markdown. No explanation.`;

  try {
    const response = await ollama.chat({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      options: { temperature: 0.2 }
    });

    const raw = response.message.content;
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    let analysis;
    try { analysis = JSON.parse(cleaned); } catch {
      return res.json({ ok: true, error: 'Parse failed', analysis: { sentiment: 'browsing', confidence: 0, toast_message: '' } });
    }

    const reaction = { time: new Date().toISOString(), events: events.slice(-5), analysis };
    const all = loadReactions();
    all.unshift(reaction);
    if (all.length > 500) all.length = 500;
    saveReactions(all);

    res.json({ ok: true, ...analysis });
  } catch (err) {
    res.json({ ok: true, error: err.message, analysis: { sentiment: 'browsing', toast_message: '' } });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const ctx = context || {};
  const service = ctx.target_service || 'our services';
  const sentiment = ctx.sentiment || 'browsing';

  const prompt = `You are a helpful sales assistant for BehaviorAgent — an AI-powered engagement platform. The user is currently interested in "${service}" and their detected sentiment is "${sentiment}".

User's message: "${message}"

Respond helpfully, naturally, and concisely (2-4 sentences). If they ask about pricing, mention our plans start at $29/mo. If they seem interested in a specific service, offer to help them book it. Be friendly but professional. Do NOT use markdown. Keep it conversational.`;

  try {
    const response = await ollama.chat({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      options: { temperature: 0.3 }
    });
    res.json({ reply: response.message.content.trim() });
  } catch (err) {
    res.json({ reply: 'Sorry, I am having trouble connecting. Please try again or contact our team.' });
  }
});

const PORT = 3006;
app.listen(PORT, () => {
  console.log(`\n[behavior-agent] http://localhost:${PORT}`);
  console.log(`nexagaze project — built by Founder Bilal`);
  console.log(`Contact: ai@nexagaze.com | WhatsApp: 03103860653\n`);
});
