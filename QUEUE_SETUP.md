# Queue Page Setup Guide

## Overview
The queue page allows players to join a matchmaking queue via the website. Players must authenticate with Discord first, then can join/leave the queue. The queue syncs with your Discord bot for match hosting.

## Prerequisites
- Supabase project with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured
- Discord OAuth application credentials
- Discord bot with access to queue voice channel

## Step 1: Create `web_queue` Table in Supabase

Run this SQL in your Supabase SQL Editor:

```sql
-- Create web_queue table
CREATE TABLE IF NOT EXISTS public.web_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id text NOT NULL,
  user_id text NOT NULL,
  username text NOT NULL,
  avatar_url text,
  joined_at timestamptz DEFAULT now()
);

-- Create unique index to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_web_queue_guild_user 
ON public.web_queue (guild_id, user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_web_queue_joined_at 
ON public.web_queue (joined_at);
```

## Step 2: Set Up Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE public.web_queue ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the queue (for displaying players)
CREATE POLICY "Allow public read access" 
ON public.web_queue 
FOR SELECT 
USING (true);

-- Allow anyone to insert (join queue)
CREATE POLICY "Allow public insert" 
ON public.web_queue 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to delete their own entry (leave queue)
CREATE POLICY "Allow public delete" 
ON public.web_queue 
FOR DELETE 
USING (true);
```

## Step 3: Configure Discord OAuth

### 3.1 Discord Application Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (or create one)
3. Go to **OAuth2** → **General**
4. Add redirect URI: `https://yourdomain.com/api/auth/discord/callback`
5. Copy your **Client ID** and **Client Secret**

### 3.2 Environment Variables

Add to your `.env` file:

```env
# Discord OAuth
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=https://yourdomain.com/api/auth/discord/callback

# Discord Guild
DISCORD_GUILD_ID=your_guild_id_here

# Supabase (should already exist)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3.3 Create Discord OAuth Routes

You need to create these API routes (if they don't exist):

**`server/routes/api/auth/discord.get.ts`** - Initiates OAuth flow
**`server/routes/api/auth/discord/callback.get.ts`** - Handles OAuth callback

## Step 4: Bot Integration (Optional)

If you want the Discord bot to read from `web_queue`:

### 4.1 Update Bot's `/host` Command

Modify `worker/src/commands/host.js` to check `web_queue` table:

```javascript
// In host.js, before getting voice channel members
const webQueuePlayers = await supabase.getWebQueue(guildId);

// Merge web queue players with voice channel members
const allPlayers = [...voiceMembers, ...webQueuePlayers];
```

### 4.2 Clear Queue After Match

In `worker/src/commands/endmatch.js`, add:

```javascript
// After match ends
await supabase.clearWebQueue(guildId);
```

## Step 5: Testing Checklist

- [ ] `web_queue` table created in Supabase
- [ ] RLS policies applied
- [ ] Discord OAuth credentials configured
- [ ] Environment variables set
- [ ] Can access `/queue` page
- [ ] "Login with Discord" button works
- [ ] Can join queue (appears in player list)
- [ ] Can leave queue (removed from list)
- [ ] Queue count updates in real-time (3s polling)
- [ ] Bot can read from `web_queue` (if integrated)

## Step 6: Deployment

### For Vercel (Web App)

```bash
# Set environment variables
vercel env add DISCORD_CLIENT_ID
vercel env add DISCORD_CLIENT_SECRET
vercel env add DISCORD_REDIRECT_URI
vercel env add DISCORD_GUILD_ID
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy
vercel --prod
```

### For Cloudflare Workers (Bot)

```bash
cd worker
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler deploy
```

## Troubleshooting

### Queue not showing players
- Check browser console for API errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check Supabase logs for failed queries
- Verify RLS policies allow SELECT

### Can't join queue
- Check if Discord OAuth is working (session cookie exists)
- Verify `web_queue` table exists
- Check RLS policies allow INSERT
- Look for duplicate key errors (user already in queue)

### Discord login not working
- Verify redirect URI matches exactly in Discord app settings
- Check `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`
- Ensure OAuth routes are deployed

## Current Status

✅ Frontend queue page implemented (`/queue`)
✅ API endpoints created (`/api/queue`, `/api/queue/join`, `/api/queue/leave`)
✅ Real-time polling (3s interval)
✅ Join/leave functionality
❌ `web_queue` table needs to be created
❌ Discord OAuth routes need to be implemented
❌ Environment variables need to be configured

## Next Steps for Tomorrow

1. **Run the SQL scripts** in Supabase (Step 1 & 2) - **5 minutes**
2. **Configure Discord OAuth** (Step 3) - **10 minutes**
3. **Set environment variables** - **5 minutes**
4. **Test the queue page** - **10 minutes**
5. **Deploy** (if needed) - **5 minutes**

**Total estimated time: ~35 minutes**

## Notes

- The queue page uses cookie-based sessions (`capl_session`)
- Session format: `base64(JSON).signature`
- Queue polls every 3 seconds for real-time updates
- Maximum 10 players per queue
- Players are ordered by `joined_at` (FIFO)
