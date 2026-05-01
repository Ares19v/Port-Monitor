import psutil
import database
from datetime import datetime

def generate_html_report(processes=None):
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
    mem = psutil.virtual_memory()
    cpu_count = psutil.cpu_count()
    alerts = database.get_recent_alerts(limit=20)

    alert_rows = ''.join(f"""
        <tr><td>{a['timestamp'][:19].replace('T',' ')}</td><td>{a['metric']}</td>
        <td style="color:#ef4444;font-family:monospace">{a['value']:.1f}</td>
        <td style="font-family:monospace">{a['threshold']:.0f}</td><td>{a['message']}</td></tr>
    """ for a in alerts) or '<tr><td colspan="5" class="empty">No alerts recorded</td></tr>'

    proc_rows = ''.join(f"""
        <tr><td>{p['name']}</td><td style="font-family:monospace">{p['pid']}</td>
        <td style="font-family:monospace">{p['memory_mb']:.1f} MB</td>
        <td style="font-family:monospace">{p['cpu']:.1f}%</td></tr>
    """ for p in (processes or [])[:20]) or '<tr><td colspan="4" class="empty">No process data</td></tr>'

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Port-Monitor Report</title>
<style>
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{font-family:system-ui,sans-serif;background:#121212;color:#e4e4e7;padding:40px;line-height:1.6}}
  h1{{font-weight:300;font-size:2rem;color:#fff;margin-bottom:4px}}
  .sub{{color:#71717a;font-size:.875rem;margin-bottom:32px}}
  .grid{{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}}
  .card{{background:#1e1e1e;border:1px solid #2c2c2c;border-radius:12px;padding:20px}}
  .card h3{{font-size:.7rem;color:#71717a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}}
  .card p{{font-size:2rem;font-weight:300;color:#fff}}
  section{{margin-bottom:32px}}
  section h2{{font-size:.875rem;font-weight:500;color:#a1a1aa;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}}
  .table-wrap{{background:#1e1e1e;border:1px solid #2c2c2c;border-radius:12px;overflow:hidden}}
  table{{width:100%;border-collapse:collapse;font-size:.85rem}}
  th{{text-align:left;padding:12px 16px;color:#71717a;font-weight:500;font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #2c2c2c}}
  td{{padding:10px 16px;border-bottom:1px solid #2c2c2c30}}
  .empty{{color:#52525b;text-align:center;padding:24px}}
</style></head>
<body>
<h1>⬡ Port-Monitor Diagnostic Report</h1>
<p class="sub">Generated: {now} &nbsp;·&nbsp; {cpu_count} CPU cores &nbsp;·&nbsp; {round(mem.total/(1024**3),1)} GB RAM total</p>
<div class="grid">
  <div class="card"><h3>CPU Cores</h3><p>{cpu_count}</p></div>
  <div class="card"><h3>Total RAM</h3><p>{round(mem.total/(1024**3),1)} GB</p></div>
  <div class="card"><h3>RAM Used</h3><p>{round(mem.used/(1024**3),1)} GB</p></div>
  <div class="card"><h3>Load</h3><p>{mem.percent}%</p></div>
</div>
<section>
  <h2>Recent Alerts</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Time</th><th>Metric</th><th>Value</th><th>Threshold</th><th>Message</th></tr></thead>
    <tbody>{alert_rows}</tbody>
  </table></div>
</section>
<section>
  <h2>Top 20 Processes by Memory</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Name</th><th>PID</th><th>Memory</th><th>CPU</th></tr></thead>
    <tbody>{proc_rows}</tbody>
  </table></div>
</section>
</body></html>"""
