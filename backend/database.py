import sqlite3
import os
import datetime as dt
import sys

def _get_db_path() -> str:
    """Return a writable path for the SQLite database.

    In packaged (PyInstaller) mode, sys._MEIPASS is set and the exe
    directory may be read-only, so we write to %APPDATA%/Port-Monitor/.
    In dev mode, write next to the script as before.
    """
    if getattr(sys, "frozen", False):
        appdata = os.environ.get("APPDATA", os.path.expanduser("~"))
        db_dir = os.path.join(appdata, "Port-Monitor")
    else:
        db_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(db_dir, exist_ok=True)
    return os.path.join(db_dir, "portmonitor.db")

DB_PATH = _get_db_path()

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_conn() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS performance_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                cpu_percent REAL, cpu_freq_ghz REAL,
                mem_percent REAL, mem_used_gb REAL, mem_total_gb REAL,
                disk_read_mbps REAL, disk_write_mbps REAL,
                net_recv_mbps REAL, net_sent_mbps REAL,
                gpu_utilization REAL, gpu_temp_c REAL
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                metric TEXT NOT NULL,
                value REAL NOT NULL,
                threshold REAL NOT NULL,
                message TEXT
            )
        ''')
        conn.commit()

def insert_snapshot(data: dict):
    with get_conn() as conn:
        gpu = data.get('gpu') or {}
        conn.execute('''
            INSERT INTO performance_snapshots
            (timestamp, cpu_percent, cpu_freq_ghz, mem_percent, mem_used_gb, mem_total_gb,
             disk_read_mbps, disk_write_mbps, net_recv_mbps, net_sent_mbps, gpu_utilization, gpu_temp_c)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            dt.datetime.utcnow().isoformat(),
            data.get('cpu', {}).get('percent'),
            data.get('cpu', {}).get('freq_ghz'),
            data.get('memory', {}).get('percent'),
            data.get('memory', {}).get('used_gb'),
            data.get('memory', {}).get('total_gb'),
            data.get('disk', {}).get('read_mbps'),
            data.get('disk', {}).get('write_mbps'),
            data.get('network', {}).get('recv_mbps'),
            data.get('network', {}).get('sent_mbps'),
            gpu.get('utilization'),
            gpu.get('temp_c'),
        ))
        conn.commit()

def get_history(hours: int = 1):
    ago = (dt.datetime.utcnow() - dt.timedelta(hours=hours)).isoformat()
    with get_conn() as conn:
        rows = conn.execute(
            'SELECT * FROM performance_snapshots WHERE timestamp >= ? ORDER BY timestamp ASC',
            (ago,)
        ).fetchall()
    return [dict(r) for r in rows]

def insert_alert(metric, value, threshold, message):
    with get_conn() as conn:
        conn.execute(
            'INSERT INTO alerts (timestamp, metric, value, threshold, message) VALUES (?, ?, ?, ?, ?)',
            (dt.datetime.utcnow().isoformat(), metric, value, threshold, message)
        )
        conn.commit()

def get_recent_alerts(limit=50):
    with get_conn() as conn:
        rows = conn.execute(
            'SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?', (limit,)
        ).fetchall()
    return [dict(r) for r in rows]
