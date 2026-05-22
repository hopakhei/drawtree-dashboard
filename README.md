# drawtree-dashboard

Public dashboard for [drawtree-api](https://github.com/hopakhei/drawtree-api) — the wire protocol for AI-native equity research.

Live at: https://drawtree-dashboard.vercel.app

## Local dev

```bash
npm install
NEXT_PUBLIC_API_BASE=https://drawtree-api.onrender.com npm run dev
```

## Deploy

```bash
npx vercel deploy --prod
```

Set `NEXT_PUBLIC_API_BASE` in Vercel project settings to point at the API host.
