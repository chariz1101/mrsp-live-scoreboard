import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/* Everything the scoreboard needs in one round trip. The client polls
   this, so keep it to a single response rather than three requests. */
export async function GET() {
  try {
    const [players, runs, matches] = await Promise.all([
      sql`select id, name, team from players order by name`,
      sql`select id, player_id, time_sec, drops, resets, dnf from runs order by id`,
      sql`select id, a_id, b_id, winner_id from matches order by id`,
    ]);
    return Response.json({ players, runs, matches });
  } catch (e) {
    // Details go to the Vercel logs, not to the public scoreboard.
    console.error("GET /api/state failed:", e);
    return Response.json({ error: "Scores unavailable." }, { status: 500 });
  }
}
