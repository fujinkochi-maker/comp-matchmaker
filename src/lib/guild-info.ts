import { createServerFn } from "@tanstack/react-start";

export const getGuildInfo = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const res = await fetch("https://discord.com/api/v10/invites/F6ZfYevYXd?with_counts=true");
    if (!res.ok) throw new Error(`Discord API ${res.status}`);
    const data = await res.json();
    return { online: data.approximate_presence_count ?? 0, members: data.approximate_member_count ?? 0 };
  } catch {
    return { online: 0, members: 0 };
  }
});
