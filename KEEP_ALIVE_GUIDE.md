# Keep Your Render Server Awake

## Problem
Render's free tier puts services to sleep after 15 minutes of inactivity, causing slow cold starts when users visit your app.

## Solution 1: Built-in Keep-Alive Service ✅
I've added an internal keep-alive service to your backend that pings itself every 10 minutes.

### Environment Variables (Set in Render Dashboard)
```
ENABLE_KEEP_ALIVE=true
RENDER_EXTERNAL_URL=https://unimate-ai.onrender.com
```

## Solution 2: External Monitoring Services (Free)

### UptimeRobot (Recommended)
1. Sign up at https://uptimerobot.com (Free plan: 50 monitors)
2. Create HTTP(s) monitor:
   - URL: `https://unimate-ai.onrender.com/api/health`
   - Monitoring Interval: 5 minutes
   - Alert Contacts: Your email

### Pingdom
1. Sign up at https://www.pingdom.com (Free: 1 check)
2. Add uptime check for `https://unimate-ai.onrender.com/api/health`

### StatusCake
1. Sign up at https://www.statuscake.com (Free plan available)
2. Monitor `https://unimate-ai.onrender.com/api/health`

## Solution 3: GitHub Actions (Free)

Create `.github/workflows/keep-alive.yml` in your repo:

```yaml
name: Keep Render Service Awake
on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Service
        run: |
          curl -f https://unimate-ai.onrender.com/api/health || exit 1
          echo "✅ Service is awake"
```

## Solution 4: Simple Node.js Cron Job

If you have another always-on server, create this script:

```javascript
const cron = require('node-cron');
const fetch = require('node-fetch');

// Ping every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  try {
    const response = await fetch('https://unimate-ai.onrender.com/api/health');
    console.log(`✅ Ping successful: ${response.status}`);
  } catch (error) {
    console.error('❌ Ping failed:', error.message);
  }
});
```

## Recommended Approach

1. **For Production**: Upgrade to Render Starter ($7/month)
2. **For Free Tier**: Use built-in keep-alive service + UptimeRobot
3. **For Development**: Keep the built-in service disabled

## Monitoring Your Service

Check your Render logs to see the keep-alive pings working:
```
✅ Keep-alive ping successful: 200
🔄 Keep-alive service started - pinging every 10 minutes
```
