# Deploy Queue Page NOW - Step by Step

## ✅ Good News: OAuth is Already Implemented!

Your Discord OAuth routes are already coded and ready. You just need to configure the database and environment variables.

---

## Step 1: Create Supabase Table (5 minutes)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

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

-- Enable RLS
ALTER TABLE public.web_queue ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the queue
CREATE POLICY "Allow public read access" 
ON public.web_queue 
FOR SELECT 
USING (true);

-- Allow anyone to insert (join queue)
CREATE POLICY "Allow public insert" 
ON public.web_queue 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to delete (leave queue)
CREATE POLICY "Allow public delete" 
ON public.web_queue 
FOR DELETE 
USING (true);
```

5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

---

## Step 2: Configure Discord OAuth App (5 minutes)

1. Go to https://discord.com/developers/applications
2. Select your application (or create a new one)
3. Go to **OAuth2** → **General** in the left sidebar
4. Under **Redirects**, click **Add Redirect**
5. Add your Vercel URL: `https://your-app-name.vercel.app/api/auth/callback`
   - Replace `your-app-name` with your actual Vercel project name
   - Example: `https://bloxarena.vercel.app/api/auth/callback`
6. Click **Save Changes**
7. Copy your **Client ID** (you'll need this next)
8. Click **Reset Secret** → Copy the new **Client Secret** (you'll need this too)

---

## Step 3: Set Vercel Environment Variables (5 minutes)

### Option A: Via Vercel Dashboard (Easier)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables (click **Add** for each):

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_DISCORD_CLIENT_ID` | Your Discord Client ID | Production, Preview, Development |
| `DISCORD_CLIENT_SECRET` | Your Discord Client Secret | Production, Preview, Development |
| `VITE_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/callback` | Production, Preview, Development |
| `DISCORD_GUILD_ID` | Your Discord Server ID | Production, Preview, Development |
| `COOKIE_SECRET` | Any random string (e.g., `my-super-secret-key-123`) | Production, Preview, Development |
| `VITE_SUPABASE_URL` | Your Supabase URL (should already exist) | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key (should already exist) | Production, Preview, Development |

5. Click **Save** after adding each variable

### Option B: Via Vercel CLI (Faster if you have it installed)

```bash
# Install Vercel CLI if you don't have it
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Add environment variables
vercel env add VITE_DISCORD_CLIENT_ID
# Paste your Client ID when prompted, select all environments

vercel env add DISCORD_CLIENT_SECRET
# Paste your Client Secret, select all environments

vercel env add VITE_REDIRECT_URI
# Paste https://your-app.vercel.app/api/auth/callback, select all environments

vercel env add DISCORD_GUILD_ID
# Paste your Discord Server ID, select all environments

vercel env add COOKIE_SECRET
# Paste any random string, select all environments
```

### How to Get Your Discord Server ID:

1. Open Discord
2. Go to **User Settings** → **Advanced**
3. Enable **Developer Mode**
4. Right-click your server icon → **Copy Server ID**

---

## Step 4: Redeploy on Vercel (2 minutes)

### Option A: Via Dashboard

1. Go to your Vercel project
2. Go to **Deployments** tab
3. Click the **...** menu on the latest deployment
4. Click **Redeploy**
5. Check **Use existing Build Cache** (optional, faster)
6. Click **Redeploy**

### Option B: Via Git Push

```bash
# Make a small change (or empty commit)
git commit --allow-empty -m "Redeploy with queue env vars"
git push
```

### Option C: Via Vercel CLI

```bash
vercel --prod
```

---

## Step 5: Test the Queue (3 minutes)

1. Go to your deployed site: `https://your-app.vercel.app/queue`
2. Click **Login with Discord**
3. Authorize the app (if prompted)
4. You should be redirected back to `/queue`
5. Click **Join Queue**
6. You should see yourself in the player list
7. Click **Leave Queue**
8. You should be removed from the list

### Troubleshooting:

**"Discord client ID not configured"**
- Check that `VITE_DISCORD_CLIENT_ID` is set in Vercel
- Redeploy after adding env vars

**"Token exchange failed"**
- Check that `DISCORD_CLIENT_SECRET` is correct
- Check that redirect URI matches exactly in Discord app settings

**"Failed to fetch user"**
- Check Discord app has `identify` scope enabled

**Not seeing players in queue**
- Check Supabase table was created successfully
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check browser console for errors

---

## Quick Reference: Environment Variables

```env
# Discord OAuth
VITE_DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
VITE_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
DISCORD_GUILD_ID=your_server_id_here
COOKIE_SECRET=any_random_string_here

# Supabase (should already exist)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## Total Time: ~20 minutes

1. ✅ Supabase SQL (5 min)
2. ✅ Discord OAuth setup (5 min)
3. ✅ Vercel env vars (5 min)
4. ✅ Redeploy (2 min)
5. ✅ Test (3 min)

---

## What Happens After Deployment?

- Users can visit `/queue` and login with Discord
- They can join/leave the matchmaking queue
- Queue updates in real-time (polls every 3 seconds)
- Shows player count and progress bar (0/10 → 10/10)
- When 10 players are in queue, your Discord bot can use `/host` to start a match

---

## Next Steps (Optional)

If you want the Discord bot to read from the web queue:

1. Update `worker/src/commands/host.js` to check `web_queue` table
2. Merge web queue players with voice channel members
3. Clear web queue after match ends

See `QUEUE_SETUP.md` for bot integration details.
