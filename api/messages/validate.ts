import type { IncomingMessage, ServerResponse } from 'http';
import { verifyBearerSession } from '../_lib/firebaseAdmin.js';
import { checkRateLimit } from '../_lib/rateLimit.js';

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > 32 * 1024) {
      throw new Error('Payload too large');
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const auth = await verifyBearerSession(req.headers.authorization);
  if (!auth.ok) {
    const failed = auth as { ok: false; status: number; error: string };
    res.statusCode = failed.status;
    res.end(JSON.stringify({ error: failed.error }));
    return;
  }

  const rate = checkRateLimit(`msg:${auth.session.uid}`, 15, 60_000);
  if (!rate.allowed) {
    res.statusCode = 429;
    res.setHeader('Retry-After', String(rate.retryAfterSec));
    res.end(JSON.stringify({ error: 'Please wait briefly before sending another message.' }));
    return;
  }

  try {
    const body = await readJsonBody(req);
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    if (!text || text.length > 5000) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Message must be between 1 and 5000 characters.' }));
      return;
    }

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        valid: true,
        senderRole: auth.session.role,
        sanitizedLength: text.length,
        manualReplyNotice: 'Replies in this space are written manually by The Creator.',
      })
    );
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid request payload.' }));
  }
}
