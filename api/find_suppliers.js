import fs from "fs";
import path from "path";

const CSV_FALLBACK = `supplier_name,city,country,material_category,unit_cost_gbp,lead_time_days,moq_units,esg_score_0_100,certifications,lat_optional,lng_optional
Lusitano Fabrics,Porto,Portugal,merino knit,4.10,5,200,78,"OEKO-TEX, GOTS",41.1579,-8.6291
EcoThread UK,Leeds,UK,recycled cotton,3.60,6,300,88,"GOTS, Fair Wear",,
`;

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const cells = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') inQ = !inQ;
      else if (ch === "," && !inQ) { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = (cells[idx] ?? "").trim()));
    return obj;
  });
}

async function getCO2Estimate(material, weightKg) {
  const apiKey = process.env.CLIMATIQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://beta3.api.climatiq.io/estimate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        emission_factor: {
          activity_id: `material:${material.toLowerCase()}`,
          region: "GB"
        },
        parameters: {
          weight: weightKg,
          weight_unit: "kg"
        }
      })
    });
    const data = await res.json();
    return data.co2e || null;
  } catch (err) {
    console.error("CO2 API error:", err);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const { material_category, max_lead_days, min_esg } =
      (req.method === "POST" ? req.body : req.query);

    const absPath = path.join(process.cwd(), "data", "ecochain_suppliers_sample.csv");

    let text;
    try {
      text = fs.readFileSync(absPath, "utf-8");
    } catch {
      text = CSV_FALLBACK;
    }

    const rows = parseCSV(text);
    const lead = Number(max_lead_days || 999);
    const esg = Number(min_esg || 0);

    let out = rows.filter(r => {
      const okCat = material_category
        ? (r.material_category || "").toLowerCase().includes(String(material_category).toLowerCase())
        : true;
      const okLead = Number(r.lead_time_days || 999) <= lead;
      const okESG = Number(r.esg_score_0_100 || 0) >= esg;
      return okCat && okLead && okESG;
    }).slice(0, 25);

    // Add CO₂ estimates for each supplier
    for (let supplier of out) {
      supplier.co2_kg_per_batch = await getCO2Estimate(
        supplier.material_category.split(" ")[0],
        Number(supplier.moq_units) * 0.2 // example weight per unit
      );
    }

    return res.status(200).json({ count: out.length, suppliers: out });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
