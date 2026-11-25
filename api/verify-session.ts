import type { IncomingMessage, ServerResponse } from 'http';
import { verifyBearerSession } from './_lib/firebaseAdmin.js';
import { checkRateLimit } from './_lib/rateLimit.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'local';
  const rate = checkRateLimit(`verify:${ip}`, 30, 60_000);
  if (!rate.allowed) {
    res.statusCode = 429;
    res.setHeader('Retry-After', String(rate.retryAfterSec));
    res.end(JSON.stringify({ error: 'Too many verification requests. Please wait a moment.' }));
    return;
  }

  const result = await verifyBearerSession(req.headers.authorization);
  if (!result.ok) {
    const failed = result as { ok: false; status: number; error: string };
    res.statusCode = failed.status;
    res.end(JSON.stringify({ error: failed.error }));
    return;
  }

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      authenticated: true,
      uid: result.session.uid,
      role: result.session.role,
      emailVerified: result.session.emailVerified,
    })
  );
}
