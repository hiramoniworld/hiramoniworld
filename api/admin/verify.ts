import type { IncomingMessage, ServerResponse } from 'http';
import { verifyBearerSession } from '../_lib/firebaseAdmin.js';
import { checkRateLimit } from '../_lib/rateLimit.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'local';
  const rate = checkRateLimit(`admin-verify:${ip}`, 30, 60_000);
  if (!rate.allowed) {
    res.statusCode = 429;
    res.setHeader('Retry-After', String(rate.retryAfterSec));
    res.end(JSON.stringify({ error: 'Rate limit exceeded.' }));
    return;
  }

  const auth = await verifyBearerSession(req.headers.authorization, req.headers['x-firebase-token']);
  if (!auth.ok) {
    const failed = auth as { ok: false; status: number; error: string };
    res.statusCode = failed.status;
    res.end(JSON.stringify({ error: failed.error }));
    return;
  }

  if (auth.session.role !== 'admin') {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Admin authorization required.' }));
    return;
  }

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      authorized: true,
      role: 'admin',
      uid: auth.session.uid,
      privacyIsolation: {
        privateJournalAccessible: false,
        privateQuestionResponsesAccessibleOnlyWhenShared: true,
      },
    })
  );
}
