import type { IncomingMessage, ServerResponse } from 'http';
import { getAdminApp } from './_lib/firebaseAdmin.js';

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  const app = getAdminApp();
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      status: 'ok',
      service: 'HIRA',
      firebaseConfigured: Boolean(app),
      timezone: 'Asia/Dhaka',
    })
  );
}
