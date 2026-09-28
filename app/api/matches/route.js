import { sql } from "@/lib/db";
import { isAdmin, deny } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!(await isAdmin())) return deny();

  const { a_id, b_id, winner_id } = await req.json();
  if (!a_id || !b_id) return Response.json({ error: "two players required" }, { status: 400 });
  if (a_id === b_id) return Response.json({ error: "same player twice" }, { status: 400 });
  if (winner_id !== a_id && winner_id !== b_id) {
    return Response.json({ error: "winner must be one of the two" }, { status: 400 });
  }

  const [row] = await sql`
    insert into matches (a_id, b_id, winner_id)
    values (${a_id}, ${b_id}, ${winner_id})
    returning id`;
  return Response.json(row);
}

export async function DELETE(req) {
  if (!(await isAdmin())) return deny();

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  await sql`delete from matches where id = ${id}`;
  return Response.json({ ok: true });
}
