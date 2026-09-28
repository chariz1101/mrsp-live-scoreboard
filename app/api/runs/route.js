import { sql } from "@/lib/db";
import { isAdmin, deny } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!(await isAdmin())) return deny();

  const { player_id, time_sec, drops, resets, dnf } = await req.json();
  if (!player_id) return Response.json({ error: "player required" }, { status: 400 });

  const finished = !dnf;
  if (finished && !(Number(time_sec) > 0)) {
    return Response.json({ error: "time required" }, { status: 400 });
  }

  // A negative count would take seconds off the time, so refuse it.
  const d = Number(drops ?? 0);
  const r = Number(resets ?? 0);
  if (!Number.isInteger(d) || !Number.isInteger(r) || d < 0 || r < 0) {
    return Response.json(
      { error: "Drops and hand touches must be whole numbers, 0 or more." },
      { status: 400 });
  }

  const [row] = await sql`
    insert into runs (player_id, time_sec, drops, resets, dnf)
    values (${player_id}, ${finished ? Number(time_sec) : 0},
            ${d}, ${r}, ${Boolean(dnf)})
    returning id`;
  return Response.json(row);
}

export async function DELETE(req) {
  if (!(await isAdmin())) return deny();

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  await sql`delete from runs where id = ${id}`;
  return Response.json({ ok: true });
}
