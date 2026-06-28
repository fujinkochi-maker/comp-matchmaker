import { ImageResponse } from "@vercel/og";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const rankColors: Record<string, string> = {
  Iron: "#6b7280",
  Bronze: "#cd7f32",
  Silver: "#9ca3af",
  Gold: "#f59e0b",
  Platinum: "#14b8a6",
  Diamond: "#3b82f6",
  Ruby: "#ef4444",
  Obsidian: "#1e293b",
};

function getRank(elo: number): string {
  if (elo >= 180) return "Obsidian";
  if (elo >= 160) return "Ruby";
  if (elo >= 140) return "Diamond";
  if (elo >= 120) return "Platinum";
  if (elo >= 110) return "Gold";
  if (elo >= 105) return "Silver";
  if (elo >= 100) return "Bronze";
  return "Iron";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }

  const { data: player } = await supabase
    .from("players")
    .select("discord_id, username, avatar_url, elo, wins, losses")
    .eq("discord_id", userId)
    .single();

  if (!player) {
    return new Response("Player not found", { status: 404 });
  }

  const { data: history } = await supabase
    .from("elo_history")
    .select("elo")
    .eq("discord_id", userId)
    .order("created_at", { ascending: true })
    .limit(10);

  const eloHistory = (history ?? []).map((h) => h.elo);
  const name = player.username ?? player.discord_id;
  const total = player.wins + player.losses;
  const winPct = total > 0 ? Math.round((player.wins / total) * 100) : 0;
  const rank = getRank(player.elo);
  const rankColor = rankColors[rank] ?? "#6b7280";
  const avatarUrl = player.avatar_url
    ? `https://cdn.discordapp.com/avatars/${player.discord_id}/${player.avatar_url}.png?size=128`
    : `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${player.discord_id}`;

  const chartBar = (value: number, max: number, i: number) => {
    const h = max > 0 ? Math.max(8, (value / max) * 60) : 8;
    return `<rect x="${i * 28 + 4}" y="${72 - h}" width="20" height="${h}" rx="4" fill="${player.elo <= value ? "#22c55e" : "#ef4444"}"/>`;
  };
  const maxElo = Math.max(...eloHistory, player.elo);
  const bars = eloHistory.map((v, i) => chartBar(v, maxElo, i)).join("");

  return new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          fontFamily: "sans-serif",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          padding: "32px",
        },
        children: [
          {
            type: "div",
            props: {
              style: { display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between" },
              children: [
                {
                  type: "div",
                  props: {
                    style: { display: "flex", alignItems: "center", gap: 20 },
                    children: [
                      {
                        type: "img",
                        props: {
                          src: avatarUrl,
                          width: 72,
                          height: 72,
                          style: { borderRadius: "50%", border: `3px solid ${rankColor}` },
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: { display: "flex", flexDirection: "column" },
                          children: [
                            {
                              type: "span",
                              props: {
                                style: { fontSize: 28, fontWeight: 700, lineHeight: 1.2 },
                                children: name.length > 16 ? name.slice(0, 14) + ".." : name,
                              },
                            },
                            {
                              type: "span",
                              props: {
                                style: { fontSize: 16, color: rankColor, fontWeight: 600 },
                                children: rank,
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  type: "div",
                  props: {
                    style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between" },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: { display: "flex", gap: 20 },
                          children: [
                            { type: "span", props: { style: { fontSize: 44, fontWeight: 800, lineHeight: 1 }, children: String(player.elo) } },
                            { type: "span", props: { style: { fontSize: 16, color: "#94a3b8", lineHeight: 1.4 }, children: `${player.wins}W ${player.losses}L` } },
                            { type: "span", props: { style: { fontSize: 16, color: "#22c55e", lineHeight: 1.4 }, children: `${winPct}%` } },
                          ],
                        },
                      },
                      eloHistory.length > 0
                        ? {
                            type: "svg",
                            props: {
                              width: 300,
                              height: 80,
                              viewBox: "0 0 300 80",
                              children: {
                                type: "g",
                                props: {
                                  dangerouslySetInnerHTML: { __html: bars },
                                },
                              },
                            },
                          }
                        : null,
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    { width: 600, height: 300 },
  );
}
