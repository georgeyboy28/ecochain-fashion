export default async function handler(req, res) {
  try {
    const { origin_city, origin_country, dest_city, dest_country, google_api_key } = (req.method === 'POST' ? req.body : req.query);
    if (!origin_city || !origin_country || !dest_city || !dest_country || !google_api_key) {
      return res.status(400).json({ error: "Missing required params" });
    }
    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", `${origin_city},${origin_country}`);
    url.searchParams.set("destinations", `${dest_city},${dest_country}`);
    url.searchParams.set("mode", "driving");
    url.searchParams.set("key", google_api_key);
    const r = await fetch(url);
    const j = await r.json();
    const metres = j?.rows?.[0]?.elements?.[0]?.distance?.value;
    if (!metres) return res.status(200).json({ km: null, raw: j });
    const km = metres / 1000.0;
    return res.status(200).json({ km, raw: j });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}