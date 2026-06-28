const INVITE_CODE = "F6ZfYevYXd";

export async function GET() {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/invites/${INVITE_CODE}?with_counts=true`,
    );
    if (!res.ok) throw new Error(`Discord API ${res.status}`);
    const data = await res.json();
    return Response.json({
      online: data.approximate_presence_count ?? 0,
      members: data.approximate_member_count ?? 0,
    });
  } catch {
    return Response.json({ online: 0, members: 0 });
  }
}
