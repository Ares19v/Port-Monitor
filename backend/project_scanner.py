import os
import json

PROJECT_TYPE_RULES = [
    ('Next.js',     lambda d, f: 'package.json' in f and _pkg_has(d, 'next')),
    ('React',       lambda d, f: 'package.json' in f and _pkg_has(d, 'react')),
    ('Vue',         lambda d, f: 'package.json' in f and _pkg_has(d, 'vue')),
    ('Node.js',     lambda d, f: 'package.json' in f),
    ('FastAPI',     lambda d, f: 'requirements.txt' in f and _req_has(d, 'fastapi')),
    ('Django',      lambda d, f: 'manage.py' in f),
    ('Flask',       lambda d, f: 'requirements.txt' in f and _req_has(d, 'flask')),
    ('Python',      lambda d, f: 'requirements.txt' in f or 'pyproject.toml' in f),
    ('Go',          lambda d, f: 'go.mod' in f),
    ('Rust',        lambda d, f: 'Cargo.toml' in f),
    ('Java/Maven',  lambda d, f: 'pom.xml' in f),
    ('Docker',      lambda d, f: 'docker-compose.yml' in f or 'docker-compose.yaml' in f),
]

def _read_json(path):
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            return json.load(f)
    except Exception:
        return {}

def _pkg_has(directory, pkg):
    data = _read_json(os.path.join(directory, 'package.json'))
    all_deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
    return pkg in all_deps

def _req_has(directory, name):
    try:
        with open(os.path.join(directory, 'requirements.txt'), 'r', errors='ignore') as f:
            return name.lower() in f.read().lower()
    except Exception:
        return False

def _suggested_commands(ptype, directory, files):
    if 'package.json' in files:
        scripts = _read_json(os.path.join(directory, 'package.json')).get('scripts', {})
        cmds = []
        for s in ['dev', 'start', 'serve']:
            if s in scripts:
                cmds.append(f'npm run {s}')
                break
        if not cmds:
            cmds.append('npm install && npm run dev')
        return cmds
    mapping = {
        'FastAPI': ['uvicorn main:app --reload --port $PORT'],
        'Django':  ['python manage.py runserver 0.0.0.0:$PORT'],
        'Flask':   ['flask run --port $PORT'],
        'Python':  ['python main.py'],
        'Go':      ['go run .'],
        'Rust':    ['cargo run'],
        'Docker':  ['docker-compose up'],
    }
    return mapping.get(ptype, [])

def scan_projects(base_path: str):
    if not os.path.exists(base_path):
        return {'success': False, 'message': f'Path not found: {base_path}', 'projects': []}
    try:
        projects = []
        for entry in os.scandir(base_path):
            if not entry.is_dir() or entry.name.startswith('.'):
                continue
            try:
                files = set(os.listdir(entry.path))
            except PermissionError:
                continue

            ptype = 'Unknown'
            for name, check in PROJECT_TYPE_RULES:
                try:
                    if check(entry.path, files):
                        ptype = name
                        break
                except Exception:
                    pass

            projects.append({
                'name': entry.name,
                'path': entry.path,
                'type': ptype,
                'has_frontend': any(s in files for s in ['frontend', 'client', 'web']),
                'has_backend': any(s in files for s in ['backend', 'server', 'api']),
                'suggested_commands': _suggested_commands(ptype, entry.path, files),
            })

        projects.sort(key=lambda x: x['name'].lower())
        return {'success': True, 'projects': projects}
    except Exception as e:
        return {'success': False, 'message': str(e), 'projects': []}
