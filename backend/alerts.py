import threading
import database
from datetime import datetime, timedelta

THRESHOLDS = {
    'cpu_percent': 85.0,
    'mem_percent': 90.0,
}

_last_alert: dict = {}
COOLDOWN_SECONDS = 300

def _toast(title: str, message: str):
    try:
        from winotify import Notification, audio
        n = Notification(app_id="Port-Monitor", title=title, msg=message, duration="short")
        n.set_audio(audio.Default, loop=False)
        n.show()
    except Exception:
        pass  # winotify optional

def check_and_alert(perf_data: dict) -> list:
    now = datetime.utcnow()
    fired = []
    checks = [
        ('cpu_percent',  perf_data.get('cpu', {}).get('percent', 0),    'CPU Usage Critical',    'CPU hit {v:.1f}% (limit {t:.0f}%)'),
        ('mem_percent',  perf_data.get('memory', {}).get('percent', 0), 'Memory Usage Critical', 'RAM hit {v:.1f}% (limit {t:.0f}%)'),
    ]
    for key, value, title, tmpl in checks:
        threshold = THRESHOLDS.get(key, 90.0)
        if value < threshold:
            continue
        last = _last_alert.get(key)
        if last and (now - last).total_seconds() < COOLDOWN_SECONDS:
            continue
        _last_alert[key] = now
        msg = tmpl.format(v=value, t=threshold)
        threading.Thread(target=_toast, args=(title, msg), daemon=True).start()
        database.insert_alert(key, value, threshold, msg)
        fired.append({'metric': key, 'value': value, 'threshold': threshold, 'message': msg})
    return fired

def get_thresholds():
    return THRESHOLDS

def update_thresholds(new: dict):
    for k, v in new.items():
        if k in THRESHOLDS:
            THRESHOLDS[k] = float(v)
    return THRESHOLDS
