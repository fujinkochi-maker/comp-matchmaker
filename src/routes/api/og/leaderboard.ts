import { ImageResponse } from "@vercel/og";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export async function GET() {
  const { data: players } = await supabase
    .from("players")
    .select("discord_id, username, avatar_url, elo, wins, losses")
    .order("elo", { ascending: false })
    .limit(10);

  const rows = (players ?? []).map((p, i) => {
    const name = p.username ?? p.discord_id;
    const avatarUrl = p.avatar_url
      ? `https://cdn.discordapp.com/avatars/${p.discord_id}/${p.avatar_url}.png?size=64`
      : `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${p.discord_id}`;
    const rankColor = ["#f59e0b", "#9ca3af", "#cd7f32"][i] ?? "transparent";
    const rankBg = ["#f59e0b20", "#9ca3af20", "#cd7f3220"][i] ?? "transparent";

    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 12px",
          borderRadius: 8,
          background: rankBg,
        },
        children: [
          {
            type: "span",
            props: {
              style: {
                width: 24,
                fontSize: i < 3 ? 18 : 14,
                fontWeight: i < 3 ? 800 : 600,
                color: rankColor,
                textAlign: "center",
              },
              children: String(i + 1),
            },
          },
          {
            type: "img",
            props: {
              src: avatarUrl,
              width: 36,
              height: 36,
              style: { borderRadius: "50%" },
            },
          },
          {
            type: "span",
            props: {
              style: { flex: 1, fontSize: 16, fontWeight: 600 },
              children: name.length > 18 ? name.slice(0, 16) + ".." : name,
            },
          },
          {
            type: "div",
            props: {
              style: { display: "flex", alignItems: "center", gap: 16 },
              children: [
                { type: "span", props: { style: { fontSize: 18, fontWeight: 800, color: "#f59e0b" }, children: String(p.elo) } },
                { type: "span", props: { style: { fontSize: 12, color: "#94a3b8" }, children: `${p.wins}W ${p.losses}L` } },
              ],
            },
          },
        ],
      },
    };
  });

  return new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          padding: "32px",
        },
        children: [
          {
            type: "div",
            props: {
              style: { marginBottom: 20 },
              children: [
                {
                  type: "span",
                  props: {
                    style: { fontSize: 28, fontWeight: 800 },
                    children: "Leaderboard",
                  },
                },
                {
                  type: "span",
                  props: {
                    style: { fontSize: 14, color: "#94a3b8", marginLeft: 8 },
                    children: "Season 1",
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: 4,
                flex: 1,
              },
              children: rows,
            },
          },
        ],
      },
    },
    { width: 600, height: rows.length * 52 + 100 },
  );
}
