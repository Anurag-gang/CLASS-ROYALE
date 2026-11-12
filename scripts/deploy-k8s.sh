#!/usr/bin/env bash
# ==============================================================================
# Class Royale — Kubernetes Production Deployment Script
# ==============================================================================
set -euo pipefail

NAMESPACE="class-royale"
K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../k8s" && pwd)"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== [1/5] Validating Prerequisites ==="
command -v kubectl >/dev/null 2>&1 || { echo >&2 "Error: kubectl is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo >&2 "Error: docker is required but not installed."; exit 1; }

echo "Kubectl client version: $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
echo "Target Kubernetes namespace: ${NAMESPACE}"

echo "=== [2/5] Building Container Images ==="
# Build Next.js Web App
echo "Building Web App image: class-royale-web-app:latest..."
docker build -t class-royale-web-app:latest -f "${ROOT_DIR}/Dockerfile" "${ROOT_DIR}"

# Build Python ML Microservice
echo "Building ML Microservice image: class-royale-ml-service:latest..."
docker build -t class-royale-ml-service:latest -f "${ROOT_DIR}/ml-service/Dockerfile" "${ROOT_DIR}/ml-service"

echo "=== [3/5] Validating Kubernetes Manifests (Dry-Run) ==="
kubectl kustomize "${K8S_DIR}" > /dev/null
echo "Kustomize manifests validated successfully."

echo "=== [4/5] Applying Manifests to Cluster ==="
kubectl apply -k "${K8S_DIR}"

echo "=== [5/5] Waiting for Rollout Completion ==="
kubectl rollout status deployment/ml-service -n "${NAMESPACE}" --timeout=180s
kubectl rollout status deployment/web-app -n "${NAMESPACE}" --timeout=180s

echo "=== Deployment Successful! ==="
kubectl get all -n "${NAMESPACE}"
kubectl get ingress -n "${NAMESPACE}"
