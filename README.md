# HIRA — A Universe Made Just for You

**HIRA** is a private, bilingual (Bengali default + English toggle) digital universe designed exclusively for **Hira** and managed by **The Creator (Admin)**.

## Key Chambers

1. **Memory Galaxy (`/galaxy`)** — Interactive celestial star-map and timeline view with photographs, notes, audio, video, favorites, and search.
2. **Daily Discovery (`/discovery`)** — Daily content scheduled in **Asia/Dhaka (Bangladesh Standard Time)** with archive history.
3. **Question Room (`/questions`)** — Reflective prompts with private answers (explicit opt-in sharing only).
4. **Letter Archive (`/letters`)** — Categorized digital letters with scheduled opening times and read status.
5. **Time Machine (`/time-machine`)** — Past, Present, and Future timeline featuring the editable recurring **October 13** birthday marker.
6. **Hidden Universe (`/hidden`)** — Clues and optional passphrase-protected discoveries.
7. **Sound of Memories (`/sound`)** — Accessible audio player (no autoplay) for voice notes and soundscapes.
8. **The Mirror (`/mirror`)** — End-to-end browser-encrypted private journal (`PBKDF2 SHA-256` + `AES-256-GCM`). Zero admin access.
9. **Unfinished Story (`/story`)** — Chapter-by-chapter digital book reader with reading progress.
10. **Science Laboratory (`/science`)** — Cosmology, neuroscience, and consciousness articles separating established facts, theories, hypotheses, speculation, and philosophy.
11. **Private Messages (`/messages`)** — Direct messaging with manual replies written by The Creator (never AI-generated).
12. **Admin Portal (`/admin`)** — Hidden, server-verified management portal with real metrics, scheduling in `Asia/Dhaka`, Media Library, and manual Inbox.

## Documentation

- [Firebase Setup Guide](firebase/SETUP_GUIDE.md)
- [Vercel Deployment Guide](docs/VERCEL_DEPLOYMENT.md)
- [Security & Privacy Architecture](docs/SECURITY_AND_PRIVACY.md)

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

Runs on `http://localhost:3000`.
