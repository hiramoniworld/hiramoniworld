# HIRA — Step-by-Step Firebase Setup Guide

Follow these steps in order to configure Firebase for **HIRA**.

## 1. Create or Open Your Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (for this workspace: `gen-lang-client-0067104664`) or create a new Firebase project.

## 2. Enable Firebase Authentication
1. In the left sidebar, open **Build → Authentication**.
2. Click **Get started**.
3. Under **Sign-in method**, enable:
   - **Email/Password** (required for Hira and Admin email/password login; leave "Email link (passwordless)" disabled).
   - **Google** (optional, already active for your admin Google account).
4. **Do NOT enable public sign-up flows** inside the app; accounts are provisioned only by you in the Firebase Console.

## 3. Create the Two Authorized Accounts
1. Open **Authentication → Users → Add user**.
2. Create **Admin** account (e.g., `hiramoniamar@gmail.com`) with a strong password.
3. Create **Hira** account (e.g., Hira's email address) with a strong password.
4. Ensure both accounts have **verified emails**:
   - Sign in once and click the verification email link sent by the login screen, **or** mark `emailVerified: true` via the Firebase Admin SDK / Console user details.
5. Copy the **UID** of both users from the Users table and record them in your server environment variables (`ADMIN_UID`, `ADMIN_EMAIL`, `HIRA_UID`, `HIRA_EMAIL`).

## 4. Assign Admin Authorization
- The primary Admin email (`hiramoniamar@gmail.com`) is bootstrapped in `firestore.rules` and `storage.rules` (strictly requiring `email_verified == true`).
- To authorize another Admin UID, create a document in Firestore at `/admins/{uid}` with fields: `{ uid, label: "Admin", createdAt: <Timestamp> }`, and set `ADMIN_EMAIL` / `ADMIN_UID` in Vercel Environment Variables.

## 5. Create & Verify Cloud Firestore
1. Go to **Build → Firestore Database**.
2. Confirm your database exists (this workspace uses database ID `ai-studio-75bfe305-3a5f-438c-bb7b-fbb2e46fcdcb`, or `(default)` on standalone projects).
3. Select a production region close to Bangladesh (such as `asia-south1` or `asia-east1`).

## 6. Configure Firebase Storage
1. Go to **Build → Storage** and click **Get started**.
2. Choose the same region as Firestore.

## 7. Apply Firestore Security Rules
- In **Firestore Database → Rules**, paste the contents of `firestore.rules` (already deployed in this workspace) and click **Publish**.
- **Never** set rules to `allow read, write: if true;`.

## 8. Apply Storage Security Rules
- In **Storage → Rules**, paste the contents of `storage.rules` and click **Publish**.

## 9. Deploy Required Firestore Indexes
Using Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:indexes,firestore:rules,storage
```

## 10. Connect Firebase to Vercel
1. In **Project Settings → General → Your apps → Web app**, copy your Firebase web config values (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
2. In **Project Settings → Service accounts**, click **Generate new private key** to download the JSON key for server-side `firebase-admin` token verification on Vercel.
3. Paste those values into Vercel Environment Variables as documented in [Vercel Deployment Guide](../docs/VERCEL_DEPLOYMENT.md).
