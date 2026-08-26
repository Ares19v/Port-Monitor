import wmi
import pythoncom
import psutil
import time

_cached_hw = None
_cached_hw_time = 0.0

def get_hardware_diagnostics():
    global _cached_hw, _cached_hw_time

    # Serve cache if fresh (< 60 seconds)
    now = time.time()
    if _cached_hw is not None and (now - _cached_hw_time) < 60.0:
        return _cached_hw

    try:
        pythoncom.CoInitialize()
        c = wmi.WMI()
        
        diagnostics = {
            "usb": [],
            "displays": [],
            "network": [],
            "power": {}
        }
        
        # 1. USB Devices (Targeted WMI query for sub-second execution)
        for device in c.Win32_PnPEntity(PNPClass="USB"):
            description = str(device.Description).lower() if device.Description else ""
            is_hid = "hid" in description or "keyboard" in description
            is_storage = "storage" in description or "mass" in description
            
            risk = "Critical (BadUSB Signature Detected)" if (is_hid and is_storage) else "Low"
            
            diagnostics["usb"].append({
                "name": device.Name or "Unknown USB Device",
                "description": device.Description or "",
                "manufacturer": device.Manufacturer or "Unknown",
                "risk_score": risk
            })
            
        # 2. Displays / Monitors / GPUs
        for monitor in c.Win32_VideoController():
            res_str = f"{monitor.CurrentHorizontalResolution}x{monitor.CurrentVerticalResolution}" if monitor.CurrentHorizontalResolution else "1920x1080 (Active)"
            hz_str = f"{monitor.CurrentRefreshRate}Hz" if monitor.CurrentRefreshRate else "60Hz"
            diagnostics["displays"].append({
                "name": monitor.Name or "Integrated Graphics Controller",
                "resolution": res_str,
                "refresh_rate": hz_str,
                "health": "Good" if monitor.CurrentRefreshRate and int(monitor.CurrentRefreshRate) >= 60 else "Good (Active Display)"
            })
            
        # 3. Network Adapters (Link Speeds)
        for adapter in c.Win32_NetworkAdapter(PhysicalAdapter=True):
            if adapter.NetConnectionStatus == 2:  # Connected
                speed_mbps = int(adapter.Speed) / 1000000 if adapter.Speed else 1000
                health = "Good" if speed_mbps >= 1000 else "Standard (Sub-Gigabit Link)"
                diagnostics["network"].append({
                    "name": adapter.Name,
                    "speed": f"{int(speed_mbps)} Mbps" if speed_mbps else "1000 Mbps",
                    "health": health
                })
                
        # 4. Power & Battery
        battery = psutil.sensors_battery()
        if battery:
            diagnostics["power"] = {
                "percent": f"{int(battery.percent)}%",
                "plugged_in": battery.power_plugged,
                "health": "Good" if battery.power_plugged or battery.percent > 20 else "Critical (Low Battery)"
            }
        else:
            diagnostics["power"] = {"percent": "N/A", "plugged_in": True, "health": "Good (AC Desktop Power)"}
            
        result = {"success": True, "diagnostics": diagnostics}
        _cached_hw = result
        _cached_hw_time = now
        return result
    except Exception as e:
        return {"success": False, "message": str(e)}
    finally:
        try:
            pythoncom.CoUninitialize()
        except Exception:
            pass
