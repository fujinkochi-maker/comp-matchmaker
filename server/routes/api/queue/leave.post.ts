import { defineEventHandler, getQuery, readBody, setResponseStatus } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));
  const query = getQuery(event);
  const userId = body.user_id || query.userId;
  const guildId = (query.guildId as string) || process.env.DISCORD_GUILD_ID;

  if (!userId || !guildId) {
    setResponseStatus(event, 400);
    return { ok: false, error: "Missing userId or guildId" };
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  try {
    await fetch(
      `${url}/rest/v1/web_queue?guild_id=eq.${guildId}&user_id=eq.${userId}`,
      { method: "DELETE", headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    return { ok: true };
  } catch (err: any) {
    setResponseStatus(event, 500);
    return { ok: false, error: err?.message || "Failed to leave queue" };
  }
});
