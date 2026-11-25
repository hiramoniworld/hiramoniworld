import fs from 'fs';
import path from 'path';
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

interface AppletConfig {
  projectId?: string;
  firestoreDatabaseId?: string;
}

function loadProjectId(): string | undefined {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as AppletConfig;
      if (parsed.projectId && parsed.projectId !== 'remixed-project-id') {
        return parsed.projectId;
      }
    }
  } catch {
    // Fallback cleanly if config is absent in external build
  }
  return undefined;
}

export function getAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = loadProjectId();

  if (serviceAccountRaw && serviceAccountRaw.trim().startsWith('{')) {
    const serviceAccount = JSON.parse(serviceAccountRaw);
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId,
    });
  }

  if (projectId) {
    return initializeApp({ projectId });
  }

  return null;
}

export interface VerifiedSession {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: 'admin' | 'hira';
  decoded: DecodedIdToken;
}

export async function verifyBearerSession(
  authorizationHeader?: string | string[],
  firebaseTokenHeader?: string | string[]
): Promise<{ ok: true; session: VerifiedSession } | { ok: false; status: number; error: string }> {
  const customToken = Array.isArray(firebaseTokenHeader) ? firebaseTokenHeader[0] : firebaseTokenHeader;
  const header = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;

  let token = '';
  if (customToken && customToken.trim()) {
    token = customToken.startsWith('Bearer ') ? customToken.slice('Bearer '.length).trim() : customToken.trim();
  } else if (header && header.startsWith('Bearer ')) {
    token = header.slice('Bearer '.length).trim();
  } else {
    return { ok: false, status: 401, error: 'Missing Authorization token.' };
  }

  if (!token || token.length > 8192) {
    return { ok: false, status: 401, error: 'Malformed authentication token.' };
  }

  const app = getAdminApp();
  if (!app) {
    return { ok: false, status: 503, error: 'Firebase project configuration is not initialized.' };
  }

  try {
    const decoded = await getAuth(app).verifyIdToken(token);
    const email = (decoded.email || '').toLowerCase();
    const emailVerified = Boolean(decoded.email_verified);

    const adminEmail = (process.env.ADMIN_EMAIL || 'hiramoniamar@gmail.com').toLowerCase();
    const adminUid = process.env.ADMIN_UID || '';
    const isAdmin =
      emailVerified && ((adminUid && decoded.uid === adminUid) || (adminEmail && email === adminEmail));

    if (isAdmin) {
      return {
        ok: true,
        session: {
          uid: decoded.uid,
          email,
          emailVerified,
          role: 'admin',
          decoded,
        },
      };
    }

    const hiraEmail = (process.env.HIRA_EMAIL || 'hiramoniworld@gmail.com').toLowerCase();
    const hiraUid = process.env.HIRA_UID || '';
    const isPreAuthorizedHiraPassword =
      email === hiraEmail && decoded.firebase?.sign_in_provider === 'password';

    if (!emailVerified && !isPreAuthorizedHiraPassword) {
      return { ok: false, status: 403, error: 'Email verification is required.' };
    }

    if ((hiraEmail && email !== hiraEmail) || (hiraUid && decoded.uid !== hiraUid)) {
      return { ok: false, status: 403, error: 'This private universe is restricted to authorized accounts.' };
    }

    return {
      ok: true,
      session: {
        uid: decoded.uid,
        email,
        emailVerified,
        role: 'hira',
        decoded,
      },
    };
  } catch {
    return { ok: false, status: 401, error: 'Invalid or expired authentication token.' };
  }
}
