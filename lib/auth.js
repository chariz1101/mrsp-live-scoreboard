import { cookies } from "next/headers";

export const COOKIE = "mrsp_admin";

/* The PIN is compared server-side and never reaches the browser bundle,
   so a visitor cannot read it out of the page source. */
export async function isAdmin() {
  const jar = await cookies();
  const got = jar.get(COOKIE)?.value;
  return Boolean(got) && got === process.env.ADMIN_PIN;
}

export function deny() {
  return Response.json({ error: "not_authorised" }, { status: 401 });
}
