# HIRA Security Specification & Payload-First TDD

## 1. Data Invariants

1. **Two-Account Isolation**: Only authorized accounts (Admin and Hira) may access protected universe content. Public/unauthenticated reads and writes are completely denied.
2. **No Self-Assigned Admin Privileges**: A user creating or updating `/users/{userId}` can never set `role: 'admin'` unless already verified as an Admin via `isAdmin()`. Admin membership in `/admins/{adminId}` is writable only by an existing Admin.
3. **Email Verification Enforcement**: All email-based admin checks and standard write operations strictly require `request.auth.token.email_verified == true`.
4. **Admin-Only Content Publishing**: Only Admin may create, edit, schedule, publish, unpublish, or delete `siteSettings`, `memories`, `dailyDiscoveries`, `questions`, `letters`, `timelineEntries`, `hiddenDiscoveries`, `audioItems`, `storyChapters`, `scienceArticles`, and `mediaLibrary`.
5. **Scoped Hira Interactions (Tier 2 Updates)**: Hira may only update explicitly allowlisted interaction fields (`isFavoriteByHira` on `memories`, `isReadByHira` on `letters`/`storyChapters`/`scienceArticles`, `isUnlockedByHira` on `hiddenDiscoveries`) on already-published items, and must preserve all other fields and update `updatedAt == request.time`.
6. **Private Question Responses**: `privateQuestionResponses` documents are readable and writable only by `ownerId == request.auth.uid`. Admin can read a response ONLY if `resource.data.isSharedWithAdmin == true`, and can never write or delete Hira's responses.
7. **Absolute Journal Privacy (`privateJournal`)**: `privateJournal` documents contain client-side AES-256-GCM ciphertext (`ciphertextTitle`, `ciphertextBody`, `ivTitle`, `ivBody`, `salt`). Rules strictly restrict `get`, `list`, `create`, `update`, and `delete` to `ownerId == request.auth.uid`. There is NO admin override on `privateJournal`.
8. **Strict Schema & Size Bounds**: Every write validates required/allowed keys (`hasAll` + `hasOnly`), string `.size()` bounds, bounded list sizes (`<= 10` or `<= 12`), ID regex (`^[a-zA-Z0-9_\-]+$`), and server-time invariants (`createdAt == request.time`, `updatedAt == request.time`).

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Unauthenticated Memory Read**: Unauthenticated client requests `get(/memories/mem-1)`. Expect `PERMISSION_DENIED`.
2. **Privilege Escalation in User Profile**: Non-admin user creates `/users/{uid}` with `role: 'admin'`. Expect `PERMISSION_DENIED`.
3. **Email Spoof Without Verification**: User with `email: 'hiramoniamar@gmail.com'` and `email_verified: false` attempts to write `/siteSettings/main`. Expect `PERMISSION_DENIED`.
4. **Shadow Field Injection ("Ghost Field")**: Admin or Hira submits valid fields plus an undeclared `isSuperAdmin: true` field on `/memories/mem-1`. Expect `PERMISSION_DENIED`.
5. **Hira Modifying Published Content Body**: Hira attempts to update `story` or `status` on `/memories/mem-1`. Expect `PERMISSION_DENIED` (`affectedKeys().hasOnly(['isFavoriteByHira', 'updatedAt'])` rejects it).
6. **Hira Reading Draft Letter**: Hira attempts `get(/letters/draft-1)` where `status == 'draft'`. Expect `PERMISSION_DENIED`.
7. **Hira Reading Future Scheduled Discovery Early**: Hira attempts `get(/dailyDiscoveries/future-1)` where `status == 'scheduled'` and `scheduledAt > request.time`. Expect `PERMISSION_DENIED`.
8. **Admin Reading Unshared Private Question Response**: Admin attempts `get(/privateQuestionResponses/resp-1)` where `ownerId == hiraUid` and `isSharedWithAdmin == false`. Expect `PERMISSION_DENIED`.
9. **Admin Reading Hira's Private Journal**: Admin attempts `get(/privateJournal/journal-1)` or `list(/privateJournal)` where `ownerId == hiraUid`. Expect `PERMISSION_DENIED`.
10. **Journal Owner Spoofing**: User A attempts to create `/privateJournal/j-1` with `ownerId: hiraUid`. Expect `PERMISSION_DENIED`.
11. **ID Poisoning / Oversized Payload**: Authenticated user attempts `create` on `/messages/{200-char-invalid-id!}` or `body` > 5000 chars. Expect `PERMISSION_DENIED`.
12. **Client-Forged Timestamp**: Authenticated user attempts to create `/messages/msg-1` with `createdAt` in the past instead of `request.time`. Expect `PERMISSION_DENIED`.
