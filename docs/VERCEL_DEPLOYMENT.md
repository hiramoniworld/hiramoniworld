# HIRA — Vercel Deployment Guide

## 1. Project & Routing Configuration
The repository includes `vercel.json` configured with:
- Build command: `npm run build`
- Output directory: `dist`
- API functions in `/api/*.ts`
- SPA fallback rewrite so `/admin`, `/galaxy`, `/mirror`, and all client routes resolve directly after deployment.

## 2. Required Vercel Environment Variables
Add these in **Vercel Project → Settings → Environment Variables**:

### Client Variables (`VITE_*`)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_FIRESTORE_DATABASE_ID` (`(default)` or your named database ID)

### Server-Only Variables (NEVER add `VITE_` prefix)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_DATABASE_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON` — Single-line JSON string of your Firebase Service Account key
- `ADMIN_EMAIL` — Admin account email
- `ADMIN_UID` — Admin account UID
- `HIRA_EMAIL` — Hira's authorized email
- `HIRA_UID` — Hira's authorized UID

## 3. Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

## 4. Post-Deployment Verification Checklist
1. Open your Vercel URL and confirm `https://<your-domain>/api/health` returns `{"status":"ok"}`.
2. Add your Vercel domain (`<your-domain>.vercel.app`) to **Firebase Console → Authentication → Settings → Authorized domains**.
3. Test signing in as Hira on `/login` and opening `/universe`.
4. Confirm visiting `/admin` while signed in as Hira denies access.
5. Sign in as Admin on `/admin` and verify Overview, Content Scheduling (BST), Media Library, and Inbox work cleanly.

## 5. Troubleshooting
- **401/403 on `/api/admin/verify`**: Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is valid JSON and `ADMIN_EMAIL` / `ADMIN_UID` match your Firebase Auth user.
- **Google Sign-In popup blocked or unauthorized-domain**: Add the Vercel domain to Firebase Authentication → Authorized Domains.
- **Missing index error in console**: Deploy `firestore.indexes.json` via `firebase deploy --only firestore:indexes`.
