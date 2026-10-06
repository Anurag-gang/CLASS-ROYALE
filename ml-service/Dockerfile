# ==============================================================================
# Class Royale Adaptive Learning Machine Learning Service Dockerfile
# Production-ready, non-root, multi-stage Python 3.11/3.12/3.13 container
# ==============================================================================

FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt


FROM python:3.11-slim AS runtime

LABEL maintainer="Class Royale Engineering <engineering@classroyale.edu>"
LABEL description="Dataset-agnostic Supervised ML Service for Adaptive Learning"

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Create non-root user for security compliance
RUN groupadd -r cruser && useradd -r -g cruser -d /app cruser

# Copy application source code
COPY app/ ./app/
COPY training/ ./training/
COPY evaluation/ ./evaluation/
COPY artifacts/ ./artifacts/
COPY datasets/ ./datasets/
COPY pyproject.toml .
COPY README.md .

RUN chown -R cruser:cruser /app
USER cruser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--log-level", "info"]
