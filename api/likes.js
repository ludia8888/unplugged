// api/likes.js
// Unplugged — likes (quiet acknowledgements) backed by Vercel KV.
//
//   GET  /api/likes?ids=047,046,045&vid=…   → { counts, liked }
//   GET  /api/likes?id=047&vid=…            → { count, liked }
//   POST /api/likes?id=047  { vid }         → { count, liked }
//
// Keys:
//   likes:<essayId>     Redis Set of anonymous visitor IDs

import { kv } from '@vercel/kv';

function getIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || req.connection?.remoteAddress || '';
}

async function isRateLimited(key, limit, windowSec) {
  try {
    const n = await kv.incr(key);
    if (n === 1) await kv.expire(key, windowSec);
    return n > limit;
  } catch {
    return false; // never block on infra hiccups
  }
}

const MAX_BATCH = 60;
const VID_RE = /^[A-Za-z0-9._-]{6,64}$/;
const ID_RE  = /^[A-Za-z0-9_-]{1,40}$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!process.env.KV_REST_API_URL && !process.env.KV_URL) {
    return res.status(503).json({ error: 'kv not configured' });
  }

  try {
    if (req.method === 'GET') {
      const raw = String(req.query.ids || req.query.id || '');
      const ids = raw.split(',').map(s => s.trim()).filter(x => ID_RE.test(x)).slice(0, MAX_BATCH);
      if (!ids.length) return res.status(400).json({ error: 'no valid ids' });
      const vid = VID_RE.test(String(req.query.vid || '')) ? String(req.query.vid) : '';

      const counts = {};
      const liked  = {};
      await Promise.all(ids.map(async id => {
        const [c, m] = await Promise.all([
          kv.scard(`likes:${id}`),
          vid ? kv.sismember(`likes:${id}`, vid) : Promise.resolve(0),
        ]);
        counts[id] = Number(c) || 0;
        liked[id]  = !!m;
      }));

      if (ids.length === 1) {
        return res.json({ count: counts[ids[0]], liked: liked[ids[0]] });
      }
      return res.json({ counts, liked });
    }

    if (req.method === 'POST') {
      const id = String(req.query.id || '');
      if (!ID_RE.test(id)) return res.status(400).json({ error: 'bad id' });

      const body = await readJson(req);
      const vid = String(body.vid || '');
      if (!VID_RE.test(vid)) return res.status(400).json({ error: 'bad vid' });

      const ip = getIp(req);
      if (await isRateLimited(`rl:like:${ip}`, 30, 60)) {
        return res.status(429).json({ error: 'slow down' });
      }

      const key = `likes:${id}`;
      const was = await kv.sismember(key, vid);
      if (was) await kv.srem(key, vid);
      else     await kv.sadd(key, vid);
      const count = Number(await kv.scard(key)) || 0;
      return res.json({ count, liked: !was });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('[api/likes]', err);
    return res.status(500).json({ error: 'something broke' });
  }
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return await new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 4096) req.destroy(); });
    req.on('end',  () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
