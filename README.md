# easy-lyrics
an attempt to make a lyrics api that supports as much songs as possible | fully open source

Lyrics API (Next.js) backed by its own catalogue: one Neon/Postgres database,
no upstream calls at request time. Plain + synced LRC. Contributors sign in
(Better Auth, email + password), submit songs or corrections, and an admin
approves them into the live catalogue.

## Quick start

```bash
cp .env.example .env   # fill DATABASE_URL (Neon), BETTER_AUTH_SECRET, UPSTASH_*, ADMIN_KEY
pnpm install
pnpm exec prisma db push
pnpm dev
```

## Endpoints

- `GET /api/:title/:artist` — Lyrist-compat `{ lyrics, title, artist, image, source }`
- `GET /api/lyrics?title=&artist=&syncedOnly=` — catalogue lookup
- `GET /api/search?q=` — search the catalogue
- `POST /api/submit` — contribute a song/correction (signed-in session)
- `GET /api/submit` — your own submission history (signed-in session)
- `GET/POST /api/moderate` — admin queue (`x-admin-key` header)
- `/api/auth/*` — Better Auth (sign-up, sign-in, sign-out, session)

Playground: `/` · Docs: `/guide` · Contribute: `/contribute` · Moderation: `/admin`

## Contributing lyrics

1. Create an account on `/contribute` (email + password, stored by Better Auth
   in the same database).
2. Submit a song, correction or LRC sync fix. The session attributes it to you.
3. An admin approves it from `/admin`; approved versions go live and carry the
   contributor's id.

## Attribution

LRC parsing/normalization logic ported from `moehmeni/syncedlyrics` (MIT) — see
NOTICE. API shape for the compat endpoint inspired by `asrvd/lyrist` (MIT).
Every response carries `source` + `sourceUrl` — lyrics belong to their
publishers.
