// api/admin/comments.js
// Unplugged — comment moderation (Bearer-token gated).
//
//   GET    /api/admin/comments                      → { comments, count }
//   DELETE /api/admin/comments?id=<commentId>       → { ok: true }
//   PATCH  /api/admin/comments?id=<commentId>       body: { hidden: boolean }
//
// Auth: Authorization: Bearer <ADMIN_TOKEN>  (env var on Vercel)

import { kv } from '@vercel/kv';

function isAuthed(req) {
  const expected = process.env.ADMIN_TOKEN || '';
  if (!expected) return false;
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  const supplied = m ? m[1] : '';
  if (!supplied || supplied.length !== expected.length) return false;
  // timing-safe-ish compare
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return diff === 0;
}

const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!process.env.ADMIN_TOKEN) {
    return res.status(503).json({ error: 'admin token not configured' });
  }
  if (!isAuthed(req)) {
    return res.status(401).json({ error: 'unauthorised' });
  }
  if (!process.env.KV_REST_API_URL && !process.env.KV_URL) {
    return res.status(503).json({ error: 'kv not configured' });
  }

  try {
    if (req.method === 'GET') {
      const cids = await kv.zrange('comments:all', 0, -1, { rev: true });
      if (!cids || !cids.length) return res.json({ comments: [], count: 0 });

      const records = await Promise.all(cids.map(cid => kv.hgetall(`comment:${cid}`)));
      const comments = records
        .filter(Boolean)
        .map(r => ({
          id: r.id,
          essayId: r.essayId,
          name: r.name || 'A reader',
          body: r.body || '',
          ts: Number(r.ts) || 0,
          hidden: r.hidden === '1',
        }));
      return res.json({ comments, count: comments.length });
    }

    if (req.method === 'DELETE') {
      const cid = String(req.query.id || '');
      if (!ID_RE.test(cid)) return res.status(400).json({ error: 'bad id' });

      const record = await kv.hgetall(`comment:${cid}`);
      if (!record) return res.json({ ok: true, noop: true });

      await kv.del(`comment:${cid}`);
      if (record.essayId) await kv.zrem(`comments:${record.essayId}`, cid);
      await kv.zrem('comments:all', cid);

      return res.json({ ok: true });
    }

    if (req.method === 'PATCH') {
      const cid = String(req.query.id || '');
      if (!ID_RE.test(cid)) return res.status(400).json({ error: 'bad id' });

      const body = await readJson(req);
      const hidden = body.hidden ? '1' : '0';
      const existing = await kv.hgetall(`comment:${cid}`);
      if (!existing) return res.status(404).json({ error: 'not found' });

      await kv.hset(`comment:${cid}`, { hidden });
      return res.json({ ok: true, hidden: hidden === '1' });
    }

    res.setHeader('Allow', 'GET, DELETE, PATCH');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('[api/admin/comments]', err);
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
