import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';

const PORT = Number(process.env.PORT || 8787);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const APP_ACCESS_TOKEN = process.env.APP_ACCESS_TOKEN || '';
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const ALLOWED_ORIGINS = new Set((process.env.ALLOWED_ORIGINS || 'null,https://localhost,capacitor://localhost,http://localhost')
  .split(',').map(x => x.trim()).filter(Boolean));
const PER_IP_DAILY_LIMIT = Math.min(30, Math.max(1, Number(process.env.PER_IP_DAILY_LIMIT || 12)));
const GLOBAL_DAILY_LIMIT = Math.min(100, Math.max(1, Number(process.env.GLOBAL_DAILY_LIMIT || 50)));
const counts = new Map();
let globalCount = 0;
let globalDay = new Date().toISOString().slice(0, 10);

if (!GEMINI_API_KEY || APP_ACCESS_TOKEN.length < 32) {
  console.error('Set GEMINI_API_KEY and a random APP_ACCESS_TOKEN of at least 32 characters.');
  process.exit(1);
}

function send(res, status, body, origin) {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.writeHead(status);
  res.end(JSON.stringify(body));
}
function tokenMatches(value) {
  if (typeof value !== 'string') return false;
  const a = Buffer.from(value); const b = Buffer.from(APP_ACCESS_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function readJson(req, limit = 8192) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > limit) throw Object.assign(new Error('Message trop volumineux.'), { status: 413 });
  }
  try { return JSON.parse(raw || '{}'); }
  catch { throw Object.assign(new Error('Requête JSON invalide.'), { status: 400 }); }
}
function reserveQuota(ip) {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== globalDay) { globalDay = day; globalCount = 0; counts.clear(); }
  if (globalCount >= GLOBAL_DAILY_LIMIT) return false;
  const entry = counts.get(ip) || { day, count: 0 };
  if (entry.day !== day) { entry.day = day; entry.count = 0; }
  if (entry.count >= PER_IP_DAILY_LIMIT) return false;
  entry.count++; globalCount++; counts.set(ip, entry); return true;
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  if (req.method === 'OPTIONS') return send(res, 204, {}, origin);
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname === '/health' && req.method === 'GET') return send(res, 200, { ok: true }, origin);
  if (url.pathname !== '/api/chat' || req.method !== 'POST') return send(res, 404, { error: 'Route introuvable.' }, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return send(res, 403, { error: 'Origine non autorisée. Ajoute le domaine exact à ALLOWED_ORIGINS.' }, origin);
  if (!tokenMatches((req.headers.authorization || '').replace(/^Bearer\s+/i, ''))) return send(res, 401, { error: 'Code d’accès invalide.' }, origin);
  const ip = req.socket.remoteAddress || 'unknown';
  if (!reserveQuota(ip)) return send(res, 429, { error: 'Quota journalier atteint. Réessaie demain.' }, origin);
  try {
    const body = await readJson(req);
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const language = body.language === 'mg' ? 'Malagasy' : 'French';
    if (!message || message.length > 2000) return send(res, 400, { error: 'Le message doit contenir entre 1 et 2 000 caractères.' }, origin);
    const system = `You are a kind, concise faith-informed recovery companion in ${language}. Reply in ${language}. Offer practical next steps, reflective questions, brief optional Christian encouragement when relevant. Do not diagnose, prescribe, shame, or claim to replace medical or addiction care. Never request identifying or sensitive health details. If a user describes immediate danger or severe alcohol withdrawal symptoms, urge them to contact emergency services or a clinician now. Keep replies under 350 words.`;
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: message }] }], generationConfig: { maxOutputTokens: 600, temperature: 0.65 } }),
      signal: AbortSignal.timeout(30000)
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : 502;
      return send(res, status, { error: upstream.status === 429 ? 'Quota Gemini gratuit atteint ou temporairement indisponible.' : 'Le service Gemini est momentanément indisponible.' }, origin);
    }
    const reply = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    if (!reply) return send(res, 502, { error: 'Gemini n’a pas retourné de texte.' }, origin);
    return send(res, 200, { reply, remainingToday: Math.max(0, PER_IP_DAILY_LIMIT - (counts.get(ip)?.count || 0)) }, origin);
  } catch (error) {
    return send(res, error.status || 502, { error: error.status ? error.message : 'Impossible de joindre Gemini. Vérifie le serveur et sa connexion.' }, origin);
  }
});
server.listen(PORT, '0.0.0.0', () => console.log(`Liberté Gemini backend listening on port ${PORT}`));
