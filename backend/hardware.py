import wmi
import pythoncom
import psutil

def get_hardware_diagnostics():
    try:
        pythoncom.CoInitialize()
        c = wmi.WMI()
        
        diagnostics = {
            "usb": [],
            "displays": [],
            "network": [],
            "power": {}
        }
        
        # 1. USB Devices
        for device in c.Win32_PnPEntity():
            if device.DeviceID and 'USB' in device.DeviceID:
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
                
        # 2. Displays / Monitors
        for monitor in c.Win32_VideoController():
            # CurrentRefreshRate and CurrentHorizontalResolution
            diagnostics["displays"].append({
                "name": monitor.Name,
                "resolution": f"{monitor.CurrentHorizontalResolution}x{monitor.CurrentVerticalResolution}" if monitor.CurrentHorizontalResolution else "Unknown",
                "refresh_rate": f"{monitor.CurrentRefreshRate}Hz" if monitor.CurrentRefreshRate else "Unknown",
                "health": "Good" if monitor.CurrentRefreshRate and int(monitor.CurrentRefreshRate) >= 60 else "Suboptimal (Low Refresh Rate)"
            })
            
        # 3. Network Adapters (Link Speeds)
        for adapter in c.Win32_NetworkAdapter(PhysicalAdapter=True):
            if adapter.NetConnectionStatus == 2: # Connected
                speed_mbps = int(adapter.Speed) / 1000000 if adapter.Speed else 0
                health = "Good" if speed_mbps >= 1000 else "Warning (Sub-Gigabit Link)"
                diagnostics["network"].append({
                    "name": adapter.Name,
                    "speed": f"{speed_mbps} Mbps" if speed_mbps else "Unknown",
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
            diagnostics["power"] = {"percent": "N/A", "plugged_in": True, "health": "Good (Desktop)"}
            
        return {"success": True, "diagnostics": diagnostics}
    except Exception as e:
        return {"success": False, "message": str(e)}
    finally:
        pythoncom.CoUninitialize()
