import { COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { pin } = await req.json();

  if (!pin || pin !== process.env.ADMIN_PIN) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const res = Response.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    `${COOKIE}=${encodeURIComponent(pin)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`
  );
  return res;
}

/* Sign out. */
export async function DELETE() {
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return res;
}
