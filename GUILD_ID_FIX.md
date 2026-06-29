# Fix Discord Bot Queue Integration

## Problem
Your Discord bot's `/host` command shows 0 players even though you queued on the website.

## Root Cause
The bot and web app need to use the **same Guild ID** to read from the same `web_queue` table.

**Your Server ID:** `1484564086074380311`

## Solution: Update Environment Variables

### 1. Vercel (Web App) - Set Guild ID

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Add or Update:**
```
DISCORD_GUILD_ID = 1484564086074380311
```

Select: Production, Preview, Development

Click **Save**

### 2. Cloudflare Worker (Discord Bot) - Set Guild ID

Open terminal in the `worker/` folder:

```bash
cd worker
npx wrangler secret put DISCORD_GUILD_ID
# When prompted, paste: 1484564086074380311
```

### 3. Redeploy Both

**Vercel (Web App):**
- Go to Deployments tab
- Click "..." on latest deployment
- Click "Redeploy"

**Cloudflare Worker (Bot):**
```bash
cd worker
npx wrangler deploy
```

## Verify Configuration

### Check Web App
1. Go to your site
2. Join queue
3. Open browser console (F12)
4. Type: `fetch('/api/queue').then(r => r.json()).then(console.log)`
5. Should show your user in the queue

### Check Bot
1. In Discord, run `/host` (or `/test_host` with 2+ players)
2. Bot should now see the queued players
3. Match should be created successfully

## Quick Test Commands

```bash
# Check if bot can read queue
# In Discord: /test_host (needs 2+ players in web queue)

# Check web queue via API
curl https://your-site.vercel.app/api/queue
```

## Environment Variables Checklist

### Vercel (Web App)
- [x] `VITE_DISCORD_CLIENT_ID`
- [x] `DISCORD_CLIENT_SECRET`
- [x] `VITE_REDIRECT_URI`
- [ ] `DISCORD_GUILD_ID` ← **ADD THIS: 1484564086074380311**
- [x] `COOKIE_SECRET`
- [x] `VITE_SUPABASE_URL`
- [x] `VITE_SUPABASE_ANON_KEY`

### Cloudflare Worker (Bot)
- [ ] `DISCORD_PUBLIC_KEY`
- [ ] `DISCORD_TOKEN`
- [ ] `DISCORD_CLIENT_ID`
- [ ] `DISCORD_GUILD_ID` ← **ADD THIS: 1484564086074380311**
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`

## After Configuration

Once both are configured with the same Guild ID:
1. Queue on website → Shows in `/api/queue`
2. Run `/host` in Discord → Bot reads from same `web_queue` table
3. Match is created with queued players
4. Queue is cleared after match starts

## Troubleshooting

**Bot still shows 0 players:**
- Check Cloudflare Worker logs for errors
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Worker
- Verify `web_queue` table exists in Supabase
- Check if Guild ID matches exactly (no spaces)

**Web queue not showing players:**
- Check browser console for errors
- Verify Supabase credentials in Vercel
- Check if `web_queue` table has RLS policies enabled
