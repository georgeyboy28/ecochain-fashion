export default async function handler(req, res) {
  try {
    const { batch_summary_json, rows_html } = (req.method === 'POST' ? req.body : req.query);
    if (!batch_summary_json) return res.status(400).json({ error: "Missing batch_summary_json" });
    const summary = typeof batch_summary_json === "string" ? JSON.parse(batch_summary_json) : batch_summary_json;
    const today = new Date().toISOString().slice(0,10);
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>EcoChain Fashion – Impact Report</title>
<style>
body { font-family: Arial, sans-serif; margin: 32px; }
h1 { margin-bottom: 0; }
.small { color: #666; margin-top: 4px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px;}
.card { border: 1px solid #ccc; padding: 16px; border-radius: 8px; }
table { width: 100%; border-collapse: collapse; margin-top: 16px;}
th, td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
th { background: #f5f5f5; text-align: left; }
.footer { margin-top: 24px; font-size: 12px; color: #888;}
</style></head>
<body>
<h1>EcoChain Fashion – Sustainability Impact Report</h1>
<div class="small">Generated on ${today}</div>
<div class="grid">
  <div class="card"><h3>Baseline CO2e</h3><div>${summary.baseline_co2e_kg ?? "—"} kg</div></div>
  <div class="card"><h3>Optimized CO2e</h3><div>${summary.optimized_co2e_kg ?? "—"} kg (${summary.co2e_change_pct ?? "—"}%)</div></div>
  <div class="card"><h3>Cost Impact</h3><div>£${summary.cost_change_gbp ?? "—"} (${summary.cost_change_pct ?? "—"}%)</div></div>
</div>
<h2>Shipment Recommendations</h2>
<table><thead><tr><th>Order ID</th><th>Baseline</th><th>Recommendation</th><th>Expected Impact</th></tr></thead>
<tbody>${rows_html || ""}</tbody></table>
<h2>Next Actions</h2>
<ol><li>Approve mode/route changes in TMS</li><li>Trial supplier swaps on low-risk SKUs</li><li>Confirm lead-time tolerance with Merchandising</li></ol>
<div class="footer">EcoChain AI – draft MVP report template.</div>
</body></html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (e) { return res.status(500).json({ error: String(e) }); }
}