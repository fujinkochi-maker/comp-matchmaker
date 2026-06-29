import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Swords, Users, LogIn, Loader2 } from "lucide-react";

type QueuePlayer = {
  user_id: string;
  username: string;
  avatar_url: string;
  joined_at: string;
};

export const Route = createFileRoute("/queue")({
  component: QueuePage,
});

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function parseSession(): { user_id: string; username: string; avatar_url: string } | null {
  const cookie = getCookie("capl_session");
  if (!cookie) return null;
  const parts = cookie.split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(atob(parts[0]));
  } catch {
    return null;
  }
}

function QueuePage() {
  const [players, setPlayers] = useState<QueuePlayer[]>([]);
  const [session, setSession] = useState<ReturnType<typeof parseSession>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(parseSession());
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/queue");
      const data = await res.json();
      if (data.players) setPlayers(data.players);
    } catch {
      // ignore polling errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const inQueue = session ? players.some((p) => p.user_id === session.user_id) : false;
  const count = players.length;
  const needed = Math.max(0, 10 - count);

  async function handleJoin() {
    if (!session) return;
    setLoading(true);
    try {
      await fetch("/api/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      });
      await fetchQueue();
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    if (!session) return;
    setLoading(true);
    try {
      await fetch("/api/queue/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user_id }),
      });
      await fetchQueue();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <Swords className="h-6 w-6 text-primary" />
          <h1 className="text-display text-2xl font-bold">Matchmaking Queue</h1>
        </div>

        <Card className="border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">
              {count} / 10 Players
            </span>
            <span className="text-sm font-semibold text-primary">
              {count >= 10 ? "Ready!" : `Need ${needed} more`}
            </span>
          </div>
          <div className="mb-6 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, (count / 10) * 100)}%` }}
            />
          </div>

          {!session ? (
            <Button asChild className="w-full gap-2 bg-[#5865F2] text-white hover:bg-[#4752c4]">
              <a href="/api/auth/discord">
                <LogIn className="h-4 w-4" /> Login with Discord
              </a>
            </Button>
          ) : inQueue ? (
            <Button
              onClick={handleLeave}
              disabled={loading}
              variant="destructive"
              className="w-full gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Leave Queue
            </Button>
          ) : (
            <Button onClick={handleJoin} disabled={loading} className="w-full gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              Join Queue
            </Button>
          )}
        </Card>

        <div className="space-y-2">
          {players.map((p) => (
            <Card key={p.user_id} className="border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={p.avatar_url} alt={p.username} />
                  <AvatarFallback>{p.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{p.username}</div>
                  <div className="text-[11px] text-muted-foreground">In Queue</div>
                </div>
              </div>
            </Card>
          ))}
          {players.length === 0 && !loading && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Queue is empty. Click Join to get in line!
            </div>
          )}
          {players.length === 0 && loading && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
