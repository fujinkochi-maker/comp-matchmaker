import { defineEventHandler, getQuery, readBody, setResponseStatus } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));
  const query = getQuery(event);
  const userId = body.user_id || query.userId;
  const username = body.username || "Unknown";
  const avatarUrl = body.avatar_url || "";
  const guildId = (query.guildId as string) || process.env.DISCORD_GUILD_ID;

  if (!userId || !guildId) {
    setResponseStatus(event, 400);
    return { ok: false, error: "Missing userId or guildId" };
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    setResponseStatus(event, 500);
    return { ok: false, error: "Supabase env missing" };
  }

  try {
    const matchesRes = await fetch(
      `${url}/rest/v1/matches?select=atk_team,def_team,status&status=eq.active&guild_id=eq.${guildId}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    const matches = await matchesRes.json();
    if (Array.isArray(matches) && matches.some((m: any) =>
      (m.atk_team || []).includes(userId) || (m.def_team || []).includes(userId),
    )) {
      setResponseStatus(event, 409);
      return { ok: false, error: "You are already in an active match." };
    }

    await fetch(`${url}/rest/v1/web_queue`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ guild_id: guildId, user_id: userId, username, avatar_url: avatarUrl }),
    });
    return { ok: true };
  } catch (err: any) {
    setResponseStatus(event, 500);
    return { ok: false, error: err?.message || "Failed to join queue" };
  }
});
