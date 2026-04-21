// api/comments.js
// Unplugged — comments (marks in the margin) backed by Vercel KV.
//
//   GET  /api/comments?id=047            → { comments: [...] }
//   POST /api/comments?id=047  { name, body }
//
// Keys:
//   comments:<essayId>   Sorted Set of comment IDs (score = epoch ms)
//   comments:all         Sorted Set across every essay (for admin moderation)
//   comment:<id>         Hash { id, essayId, name, body, ts, hidden }

import { kv } from '@vercel/kv';
import crypto from 'node:crypto';

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
    return false;
  }
}

/** Strict escaping — comments render via textContent on the client, but we
 *  defensively strip angle-brackets and null bytes server-side too so anything
 *  that reads the KV records directly is safe. */
function sanitize(s) {
  return String(s || '')
    .replace(/\u0000/g, '')
    .replace(/</g, '‹')   // U+2039 — visually tolerable stand-in
    .replace(/>/g, '›');
}

const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const MAX_NAME = 60;
const MAX_BODY = 1000;
const MIN_BODY = 1;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!process.env.KV_REST_API_URL && !process.env.KV_URL) {
    return res.status(503).json({ error: 'kv not configured' });
  }

  try {
    const id = String(req.query.id || '');
    if (!ID_RE.test(id)) return res.status(400).json({ error: 'bad id' });

    if (req.method === 'GET') {
      const cids = await kv.zrange(`comments:${id}`, 0, -1, { rev: true });
      if (!cids || !cids.length) return res.json({ comments: [] });

      const records = await Promise.all(cids.map(cid => kv.hgetall(`comment:${cid}`)));
      const visible = records
        .filter(r => r && r.hidden !== '1')
        .map(r => ({
          id: r.id,
          name: r.name || '',          // empty = anonymous; client resolves variant
          body: r.body || '',
          ts: Number(r.ts) || 0,
        }));
      return res.json({ comments: visible });
    }

    if (req.method === 'POST') {
      const ip = getIp(req);
      if (await isRateLimited(`rl:comment:${ip}`, 1, 30)) {
        return res.status(429).json({ error: 'just a breath — try again in a moment' });
      }
      if (await isRateLimited(`rl:comment:day:${ip}`, 12, 60 * 60 * 24)) {
        return res.status(429).json({ error: 'plenty of marks for today' });
      }

      const body = await readJson(req);
      const rawName = String(body.name || '').trim();
      const rawBody = String(body.body || '').trim();

      if (rawBody.length < MIN_BODY) return res.status(400).json({ error: 'empty mark' });
      if (rawBody.length > MAX_BODY) return res.status(400).json({ error: `keep it under ${MAX_BODY} characters` });

      // Empty name stays empty — the article page picks a quiet variant
      // deterministically from the comment id. Admin moderation shows the
      // raw empty so the moderator can tell an anonymous mark from a signed one.
      const name = sanitize(rawName).slice(0, MAX_NAME);
      const clean = sanitize(rawBody).slice(0, MAX_BODY);
      const cid = crypto.randomUUID();
      const ts  = Date.now();

      await kv.hset(`comment:${cid}`, {
        id: cid,
        essayId: id,
        name,
        body: clean,
        ts: String(ts),
        hidden: '0',
      });
      await kv.zadd(`comments:${id}`, { score: ts, member: cid });
      await kv.zadd('comments:all',   { score: ts, member: cid });

      return res.json({
        comment: { id: cid, name, body: clean, ts },
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('[api/comments]', err);
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
    req.on('data', (c) => { raw += c; if (raw.length > 8192) req.destroy(); });
    req.on('end',  () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
