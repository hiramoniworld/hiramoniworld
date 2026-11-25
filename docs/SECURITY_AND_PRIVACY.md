# HIRA — Security & Privacy Architecture

## 1. Access Control Model
- **Two-Account Architecture**: No public registration or public user directory exists.
- **Server-Side Token Verification**: `/api/verify-session`, `/api/admin/verify`, and `/api/messages/validate` verify Firebase ID tokens via `firebase-admin` (`verifyIdToken`) and enforce `email_verified == true`.
- **Database Enforcement**: `firestore.rules` enforces default-deny, strict schema blueprints (`hasAll` + `hasOnly`), size bounds, ID regex validation, and server timestamps (`request.time`).

## 2. The Mirror (Private Journal) Zero-Knowledge Design
- Entries are encrypted **in the browser** using the Web Crypto API before touching Firestore:
  - Key Derivation: `PBKDF2` (`SHA-256`, `250,000` iterations) with a random 16-byte salt.
  - Cipher: `AES-256-GCM` with a fresh 12-byte random IV for both title and body on every save.
- The journal passphrase and derived `CryptoKey` live **only in React memory** and are cleared when locking or leaving `/mirror`.
- `firestore.rules` restricts `/privateJournal/{entryId}` exclusively to `ownerId == request.auth.uid` with **zero admin override**.
- No `/admin` UI view or `/api/*` endpoint accesses `privateJournal`.

## 3. Question Room & Communication Privacy
- `privateQuestionResponses` is restricted to `ownerId == request.auth.uid`; Admin can read a response **only** when Hira explicitly sets `isSharedWithAdmin == true`.
- Private Messages has no AI auto-responder, no fake online indicators, and no simulated typing indicators.

## 4. Remaining Manual Configuration Checklist
- [ ] Enable **Email/Password** in Firebase Console → Authentication → Sign-in method.
- [ ] Create Hira's account and Admin's account in Firebase Authentication → Users.
- [ ] Deploy `storage.rules` and `firestore.indexes.json` to your Firebase project (`firebase deploy --only storage,firestore:indexes`).
- [ ] Set `ADMIN_EMAIL`, `ADMIN_UID`, `HIRA_EMAIL`, `HIRA_UID`, and `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel / `.env` before sharing publicly.
- [ ] Review `firestore.rules` before broad production use.
