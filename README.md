# easy-lyrics
an attempt to make a lyrics api that supports as much songs as possible | fully open source

Multi-source lyrics API (Next.js): own Neon DB → LRCLIB → LRC scrapers
(Megalobiz, NetEase, Tencent, lrc.cx, Musixmatch-flagged) → lyrics.ovh fallback.
Plain + synced LRC, community submits with admin approval.

## Quick start

```bash
cp .env.example .env   # fill DATABASE_URL (Neon), UPSTASH_*, ADMIN_KEY
pnpm install
pnpm exec prisma db push
pnpm dev
```

## Endpoints

- `GET /api/:title/:artist` — Lyrist-compat `{ lyrics, title, artist, image, source }`
- `GET /api/lyrics?title=&artist=&album=&duration=&sources=&syncedOnly=&debug=`
- `GET /api/search?q=`
- `POST /api/submit` — community submit (pending approval)
- `GET/POST /api/moderate` — admin (`x-admin-key` header)

Playground: `/` · Docs: `/guide` · Moderation: `/admin`

## Attribution

LRC parsing/search logic ported from `moehmeni/syncedlyrics` (MIT) — see
NOTICE. LRCLIB (`https://lrclib.net`) is MIT. Every response carries
`source` + `sourceUrl` — lyrics belong to their publishers.
