import winreg

STARTUP_KEYS = [
    (winreg.HKEY_CURRENT_USER,  r'Software\Microsoft\Windows\CurrentVersion\Run', 'HKCU'),
    (winreg.HKEY_LOCAL_MACHINE, r'Software\Microsoft\Windows\CurrentVersion\Run', 'HKLM'),
    (winreg.HKEY_LOCAL_MACHINE, r'Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run', 'HKLM32'),
]

def get_startup_programs():
    programs = []
    for hive, path, scope in STARTUP_KEYS:
        try:
            key = winreg.OpenKey(hive, path, 0, winreg.KEY_READ)
            i = 0
            while True:
                try:
                    name, value, _ = winreg.EnumValue(key, i)
                    exe = value.strip('"').split('"')[0].split('\\')[-1].split('/') [-1]
                    programs.append({
                        'name': name,
                        'command': value,
                        'exe': exe,
                        'scope': scope,
                        'hive': 'HKCU' if hive == winreg.HKEY_CURRENT_USER else 'HKLM',
                        'key_path': path,
                        'removable': hive == winreg.HKEY_CURRENT_USER,
                    })
                    i += 1
                except OSError:
                    break
            winreg.CloseKey(key)
        except Exception:
            pass
    return {'success': True, 'programs': programs}

def disable_startup(name: str, hive_str: str, key_path: str):
    hive = winreg.HKEY_CURRENT_USER if hive_str == 'HKCU' else winreg.HKEY_LOCAL_MACHINE
    try:
        key = winreg.OpenKey(hive, key_path, 0, winreg.KEY_SET_VALUE)
        winreg.DeleteValue(key, name)
        winreg.CloseKey(key)
        return {'success': True, 'message': f'Removed "{name}" from startup'}
    except PermissionError:
        return {'success': False, 'message': 'Access denied. Admin privileges required for HKLM keys.'}
    except FileNotFoundError:
        return {'success': False, 'message': f'Entry "{name}" not found.'}
    except Exception as e:
        return {'success': False, 'message': str(e)}
