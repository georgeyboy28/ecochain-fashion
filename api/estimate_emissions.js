export default async function handler(req, res) {
  try {
    const { mode, weight_kg, distance_km, climatiq_key } = (req.method === 'POST' ? req.body : req.query);
    if (!mode || !weight_kg || !distance_km || !climatiq_key) {
      return res.status(400).json({ error: "Missing required params" });
    }
    const map = { air: "freighting_air", sea: "freighting_sea", road: "freighting_road", rail: "freighting_rail" };
    const activity_id = map[mode] || "freighting_road";
    const body = {
      emission_factor: { activity_id },
      parameters: {
        weight: Number(weight_kg),
        weight_unit: "kg",
        distance: Number(distance_km),
        distance_unit: "km"
      }
    };
    const r = await fetch("https://beta3.api.climatiq.io/estimate", {
      method: "POST",
      headers: { "Authorization": `Bearer ${climatiq_key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    return res.status(200).json(j);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}