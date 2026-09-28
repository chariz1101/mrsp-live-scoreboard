import { sql } from "@/lib/db";
import { isAdmin, deny } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!(await isAdmin())) return deny();

  const { name, team } = await req.json();
  if (!name || !name.trim()) {
    return Response.json({ error: "name required" }, { status: 400 });
  }

  const [row] = await sql`
    insert into players (name, team)
    values (${name.trim()}, ${(team || "").trim()})
    returning id, name, team`;
  return Response.json(row);
}

export async function DELETE(req) {
  if (!(await isAdmin())) return deny();

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  // Runs and matches cascade away with the player.
  await sql`delete from players where id = ${id}`;
  return Response.json({ ok: true });
}
