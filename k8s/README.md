# Class Royale — Production Kubernetes Architecture & Deployment Guide

This directory contains the production-ready Kubernetes (K8s) manifests for **Class Royale**, designed following Cloud Native Computing Foundation (CNCF) and OpenGitOps principles.

---

## 1. System Architecture

```
                                      INTERNET
                                         │
                                   [TLS / HTTPS]
                                         ▼
                             ┌───────────────────────┐
                             │    Ingress NGINX      │
                             │ (cert-manager / TLS)  │
                             └───────────┬───────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
              Path: / (Port 3000)                      Path: /api/ml (Port 8000)
                    ▼                                         ▼
        ┌───────────────────────┐                 ┌───────────────────────┐
        │   Web App Service     │                 │   ML Microservice     │
        │      (ClusterIP)      │                 │      (ClusterIP)      │
        └───────────┬───────────┘                 └───────────┬───────────┘
                    │                                         │
                    ▼                                         ▼
        ┌───────────────────────┐                 ┌───────────────────────┐
        │   Web App Pods        │                 │   ML Engine Pods      │
        │  (Next.js Standalone) │──[HTTP Request]─▶  (FastAPI / Socratic) │
        │   Replicas: 2 - 10    │                 │   Replicas: 2 - 6     │
        └───────────┬───────────┘                 └───────────┬───────────┘
                    │                                         │
                    ▼                                         ▼
        ┌───────────────────────┐                 ┌───────────────────────┐
        │ Supabase / PostgreSQL │                 │ Persistent Storage    │
        │  (External Database)  │                 │  (Models & Artifacts) │
        └───────────────────────┘                 └───────────────────────┘
```

### Core Services
1. **`web-app` (Next.js 14 App Router)**
   - Port: `3000`
   - Multi-stage Alpine container running Next.js standalone mode.
   - Non-root user `nextjs:nodejs` (UID 1001).
   - Serves frontend UI, gamification engine, quiz battle coliseum, and API routes.
   - Probes: Liveness & Readiness at `/api/health`.
   - Autoscaling: HPA from 2 to 10 replicas (Target CPU: 70%, Memory: 80%).

2. **`ml-service` (Python 3.11 / FastAPI)**
   - Port: `8000`
   - Hardened container serving Mistral Socratic Tutor, vector embeddings, and spaCy NLP pipeline.
   - Non-root user `cruser` (UID 10001).
   - Probes: Liveness & Readiness at `/health`.
   - Volume: Mounted PVC (`ml-artifacts-pvc`) for trained `.joblib` pipelines and vector indices.
   - Autoscaling: HPA from 2 to 6 replicas (Target CPU: 75%).

3. **Zero-Trust Security & Network Policies**
   - Default-deny ingress across the `class-royale` namespace.
   - `ml-service` strictly accepts incoming traffic originating from `web-app` pods only.
   - Strict resource limits, read-only privilege escalation prevention, and dropped Linux capabilities.

---

## 2. Directory Layout

```
k8s/
├── 00-namespace.yaml        # Dedicated 'class-royale' namespace with Pod Security baseline
├── 01-configmaps.yaml       # Environment configs (cluster DNS, ports, logging, AI limits)
├── 02-secrets.yaml          # Sensitive credentials (JWT, Supabase keys, Mistral API)
├── 03-pvc.yaml              # PersistentVolumeClaims for ML models and data storage
├── 04-ml-service.yaml       # ML Engine Deployment & ClusterIP Service
├── 05-web-app.yaml          # Web App Deployment & ClusterIP Service
├── 06-ingress.yaml          # Ingress routing rules and TLS termination
├── 07-hpa.yaml              # Horizontal Pod Autoscalers (metrics-server driven)
├── 08-network-policy.yaml   # Pod-to-Pod microsegmentation & egress filtering
├── kustomization.yaml       # Declarative manifest orchestrator
└── README.md                # Architecture and operations guide
```

---

## 3. Quick Start Deployment

### Prerequisites
- Kubernetes cluster: v1.26+ (Docker Desktop Kubernetes, Minikube, Kind, EKS, GKE, or AKS)
- `kubectl` v1.28+
- Docker v24+

### Option A: One-Command Kustomize Apply
```bash
# 1. Update secrets in k8s/02-secrets.yaml with your actual keys
# 2. Deploy all resources to the cluster
kubectl apply -k k8s/

# 3. Check deployment status
kubectl get pods,services,ingress,hpa -n class-royale
```

### Option B: Automated Deployment Scripts

**Linux / macOS:**
```bash
chmod +x scripts/deploy-k8s.sh
./scripts/deploy-k8s.sh
```

**Windows PowerShell:**
```powershell
.\scripts\deploy-k8s.ps1
```

---

## 4. Local Cluster Setup (Docker Desktop / Minikube / Kind)

### Using Docker Desktop:
1. Open Docker Desktop Settings ➔ **Kubernetes** ➔ Check **"Enable Kubernetes"** ➔ Click **Apply & restart**.
2. Verify context:
   ```bash
   kubectl config use-context docker-desktop
   ```
3. Build the container images locally:
   ```bash
   docker build -t class-royale-web-app:latest -f Dockerfile .
   docker build -t class-royale-ml-service:latest -f ml-service/Dockerfile ml-service
   ```
4. Deploy:
   ```bash
   kubectl apply -k k8s/
   ```

### Using Minikube:
```bash
# Start minikube with ingress and metrics-server addons
minikube start --cpus=4 --memory=8192
minikube addons enable ingress
minikube addons enable metrics-server

# Point your shell to minikube's Docker daemon
eval $(minikube docker-env)

# Build images inside minikube
docker build -t class-royale-web-app:latest -f Dockerfile .
docker build -t class-royale-ml-service:latest -f ml-service/Dockerfile ml-service

# Deploy
kubectl apply -k k8s/
```

---

## 5. Production Cloud Deployment (EKS / GKE / AKS)

### 1. Push Images to Container Registry (ECR / GCR / ACR / Harbor)
```bash
# Example with AWS ECR:
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account_id>.dkr.ecr.us-east-1.amazonaws.com

docker tag class-royale-web-app:latest <account_id>.dkr.ecr.us-east-1.amazonaws.com/class-royale-web-app:v1.0.0
docker tag class-royale-ml-service:latest <account_id>.dkr.ecr.us-east-1.amazonaws.com/class-royale-ml-service:v1.0.0

docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/class-royale-web-app:v1.0.0
docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/class-royale-ml-service:v1.0.0
```

### 2. Update Image Tags with Kustomize
```bash
cd k8s
kustomize edit set image class-royale-web-app:latest=<account_id>.dkr.ecr.us-east-1.amazonaws.com/class-royale-web-app:v1.0.0
kustomize edit set image class-royale-ml-service:latest=<account_id>.dkr.ecr.us-east-1.amazonaws.com/class-royale-ml-service:v1.0.0
kubectl apply -k .
```

---

## 6. Observability, Health Checks & Rollbacks

### Health Checks
- **Web App Liveness & Readiness:**
  ```bash
  curl http://<INGRESS_OR_CLUSTER_IP>/api/health
  # Returns: {"status":"ok","app":"class-royale-web","uptimeSeconds":124,...}
  ```
- **ML Service Liveness & Readiness:**
  ```bash
  curl http://<INGRESS_OR_CLUSTER_IP>/api/ml/health
  # Returns: {"status":"healthy","service":"class-royale-ml-engine",...}
  ```

### Live Log Streaming
```bash
# Web application logs:
kubectl logs -f -l app=web-app -n class-royale

# ML microservice logs:
kubectl logs -f -l app=ml-service -n class-royale
```

### Zero-Downtime Rollbacks
If an issue is detected during a rolling release:
```bash
# Rollback Web App:
kubectl rollout undo deployment/web-app -n class-royale

# Rollback ML Microservice:
kubectl rollout undo deployment/ml-service -n class-royale

# Inspect rollout revision history:
kubectl rollout history deployment/web-app -n class-royale
```
