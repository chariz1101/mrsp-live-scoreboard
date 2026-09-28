# MRSP Western Visayas — Live Scoreboard

Next.js + Neon Postgres, deployed on Vercel.

- `/` — live scoreboard, polls every 3 seconds. Safe to show publicly.
- `/admin` — PIN-gated dashboard for facilitators.

## Scoring

**Robotic Arm Tank Challenge** — two attempts, the better one counts.
Penalties are added to the raw time before banding:
drop = +5s, hand touch or manual reset = +10s.

| Adjusted time | Points |
| --- | --- |
| Under 1:30 | 10 |
| Under 2:00 | 8 |
| Under 2:30 | 6 |
| Under 3:00 | 4 |
| 3:00 or over | 2 |
| Did not finish | 1 |

**Pop the Balloon Challenge** — 3 points per win, plus 1 for taking part.

**Overall Champion** — the two totals added together.

All of this lives in `lib/scoring.js`. Change the numbers there and both
pages follow.

## Setup

### 1. Neon

Create a free project at neon.tech. Open the SQL Editor, paste the
contents of `schema.sql`, and run it.

Then go to Connection Details and copy the **pooled** connection string.
The pooled one matters: Vercel's serverless functions open a new
connection per request, and the non-pooled endpoint will run out.

### 2. Local

```bash
npm install
cp .env.example .env.local     # paste your DATABASE_URL, set ADMIN_PIN
npm run dev
```

### 3. Vercel

Push to GitHub, then import the repo at vercel.com. Under Settings >
Environment Variables add:

- `DATABASE_URL` — the pooled Neon string
- `ADMIN_PIN` — whatever PIN the facilitators will type

Redeploy after adding them. Environment variables are only read at
build and request time, so a deploy that ran before you added them
will not pick them up.

## Booth setup on the day

Open `/` on the display laptop and turn on Auto-rotate; it cycles the
three boards every 9 seconds. Facilitators open `/admin` on their
phones, unlock once, and the session lasts 12 hours.

The admin page has a built-in stopwatch. Start it when the player
begins, stop when they finish, tap "Use this time", and it fills the
field. Before saving, the panel previews exactly what the run will
score, so you can tell the player their points immediately.

## Notes

- The PIN is checked on the server and stored in an HttpOnly cookie, so
  it never appears in the client bundle. It keeps visitors out of the
  dashboard; it is not protection against someone determined.
- Removing a player cascades: their runs and matches go too.
- Neon's free tier suspends the database after a few minutes idle. The
  first request after that takes a second or two to wake it. Load the
  scoreboard a few minutes before the booth opens.
