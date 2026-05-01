# ─────────────────────────────────────────────────────────────────────────────
# Port-Monitor — Backend Dockerfile
# NOTE: Windows-specific modules (wmi, pywin32, winotify) are excluded here.
#       This image targets the CI pipeline and web-only deployment.
#       For the full desktop experience, use the PyInstaller build on Windows.
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python deps (Linux-compatible subset)
COPY requirements-linux.txt .
RUN pip install --no-cache-dir -r requirements-linux.txt

# Copy source
COPY *.py ./
COPY static/ ./static/

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
