# MRSP Western Visayas — Live Scoreboard

Next.js + Neon Postgres, deployed on Vercel.

- `/` — live scoreboard, polls every 3 seconds. Safe to show publicly.
- `/admin` — PIN-gated dashboard for facilitators.

## Scoring

**Robotic Arm Tank Challenge** — unlimited attempts, the best time counts.
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

**Pop the Balloon Challenge** — each match, the winner gets 3 points and
the other player gets 1.

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

Time the Arm Tank runs with the booth's own timer, then type the time
into the admin page as `1:27.5` or `87.5` (seconds). Before saving, the
panel previews exactly what the run will score, so you can tell the
player their points immediately.

## Branding

Colours come from the chapter logo (`public/mrsp-logo.jpg`, also used
as the favicon). Oswald (Google Fonts, loaded automatically in
`app/layout.jsx`) is used for body text, names, scores and times.
Headings, the banner titles and the MRSP wordmark use Butler by Fabian
De Smet, which is free for personal and commercial use but is not on
Google Fonts: download it from
https://www.fabiandesmet.com/portfolio/butler-font/ and put
`Butler_Bold.woff2` (or `Butler_Bold.otf`) in `public/fonts/`. Until
then those headings fall back to Oswald.

The Facebook link lives in `app/brand.jsx`.

## RSTW 2026 attendance popup

The first time someone opens the scoreboard, a card shows the RSTW 2026
event details and the InnoVents attendance QR (activity 891). Closing it
is remembered in that browser; the QR button in the header
(**Attendance QR** on the display, **Check in** on phones) reopens it. The content is in `app/welcome.jsx` and the images in `public/rstw/`.
To show it again to everyone, bump `SEEN_KEY` in that file.

On the booth laptop, close it once before the event and use Attendance
QR when a visitor needs to check in.

## Notes

- The PIN is checked on the server and stored in an HttpOnly cookie, so
  it never appears in the client bundle. It keeps visitors out of the
  dashboard; it is not protection against someone determined.
- Removing a player cascades: their runs and matches go too.
- Neon's free tier suspends the database after a few minutes idle. The
  first request after that takes a second or two to wake it. Load the
  scoreboard a few minutes before the booth opens.
