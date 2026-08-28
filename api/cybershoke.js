// Vercel serverless proxy -> Cybershoke (обходит CORS + гео)
export default async function handler(req, res) {
  const user = (req.query.user || '').toString().trim();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!user) return res.status(400).json({ error: 'no user' });

  try {
    const upstream = await fetch('https://cybershoke.net/api/user/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://cybershoke.net',
        'Referer': 'https://cybershoke.net/'
      },
      body: JSON.stringify({ steamid64: user })
    });

    if (!upstream.ok) return res.status(upstream.status).json({ error: 'upstream ' + upstream.status });

    const j = await upstream.json();
    if (j && j.basic) {
      delete j.basic.friends;
      delete j.basic.friends_servers_online;
      delete j.basic.friends_site_online;
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(j);
  } catch (e) {
    return res.status(502).json({ error: String(e) });
  }
}
