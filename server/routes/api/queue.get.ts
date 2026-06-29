import { defineEventHandler, getQuery } from "h3";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const guildId = (query.guildId as string) || process.env.DISCORD_GUILD_ID;
  if (!guildId) return { players: [] };

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return { players: [] };

  try {
    const res = await fetch(
      `${url}/rest/v1/web_queue?guild_id=eq.${guildId}&select=user_id,username,avatar_url,joined_at&order=joined_at.asc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" } },
    );
    const rows = await res.json();
    return { players: Array.isArray(rows) ? rows : [] };
  } catch {
    return { players: [] };
  }
});
