// Free Cloudflare Worker that hands Dxel Chat short-lived TURN credentials, so your secret key never goes inside index.html.
// Setup (all free, see the guide): create a Cloudflare account, make a TURN key (Realtime > TURN), then create a Worker,
// paste this file, and add these Variables/Secrets on the Worker:
//   TURN_KEY_ID      (text)    the TURN key ID
//   TURN_API_TOKEN   (secret)  the TURN key API token
//   ALLOWED_ORIGIN   (text)    your site, for example https://yourname.github.io   (no trailing slash)
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = { 'Access-Control-Allow-Origin': origin === env.ALLOWED_ORIGIN ? origin : 'null', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Vary': 'Origin' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (origin !== env.ALLOWED_ORIGIN) return new Response('Forbidden', { status: 403, headers: cors });
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.TURN_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: 86400 })
    });
    if (!r.ok) return new Response('TURN error', { status: 502, headers: cors });
    return new Response(await r.text(), { headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
};
