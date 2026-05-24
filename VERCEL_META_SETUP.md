# Vercel and Meta Setup

## 1. Meta Pixel ID

Open `site-config.js` and add the existing Pixel ID from Meta Events Manager:

```js
window.EnglishDreamConfig = {
    metaPixelId: 'YOUR_PIXEL_ID',
    kakaoChatUrl: ''
};
```

The site tracks:

- `PageView` when the page loads
- `Lead` when the consultation form is submitted
- `Lead` when the business education inquiry form is submitted

## 2. KakaoTalk 1:1 Chat

Add the KakaoTalk channel chat URL to `site-config.js`:

```js
window.EnglishDreamConfig = {
    metaPixelId: 'YOUR_PIXEL_ID',
    kakaoChatUrl: 'https://pf.kakao.com/_YOUR_CHANNEL/chat'
};
```

If `kakaoChatUrl` is empty, the fixed KakaoTalk button opens the on-page reservation form instead.

## 3. Vercel Deployment

This is a static site, so Vercel can deploy it directly from the repository root.

Recommended Vercel settings:

- Framework Preset: `Other`
- Build Command: leave empty
- Output Directory: leave empty or use `.`

## 4. Domain DNS

After adding the domain in Vercel Project Settings > Domains, copy the DNS records Vercel shows.

Usually this means:

- Root domain: `A` record to Vercel's IP
- `www`: `CNAME` record to Vercel

If the domain is currently managed in Iamweb, update the DNS there or move DNS management back to the registrar first.

## 5. Meta Domain Verification

If Meta domain verification breaks after moving DNS, add Meta's TXT verification record to the same DNS provider that points the domain to Vercel.
