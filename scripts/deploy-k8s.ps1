# ==============================================================================
# Class Royale — Kubernetes Production Deployment Script (PowerShell)
# ==============================================================================
param (
    [string]$Namespace = "class-royale",
    [switch]$SkipBuild = $false,
    [switch]$DryRunOnly = $false
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$K8sDir = Join-Path $RootDir "k8s"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Class Royale — Kubernetes Deployment Orchestrator" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Check tools
Write-Host "`n[1/5] Checking Kubernetes & Docker tools..." -ForegroundColor Yellow
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "kubectl is not installed or not in PATH."
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "docker is not installed or not in PATH."
}

# 2. Build Container Images (if not skipped)
if (-not $SkipBuild -and -not $DryRunOnly) {
    Write-Host "`n[2/5] Building Docker images..." -ForegroundColor Yellow
    Write-Host "Building Web App image (class-royale-web-app:latest)..." -ForegroundColor Gray
    docker build -t class-royale-web-app:latest -f (Join-Path $RootDir "Dockerfile") $RootDir

    Write-Host "Building ML Service image (class-royale-ml-service:latest)..." -ForegroundColor Gray
    docker build -t class-royale-ml-service:latest -f (Join-Path $RootDir "ml-service\Dockerfile") (Join-Path $RootDir "ml-service")
} else {
    Write-Host "`n[2/5] Skipping Docker image build." -ForegroundColor DarkGray
}

# 3. Dry-Run Validation
Write-Host "`n[3/5] Validating manifests via Kustomize..." -ForegroundColor Yellow
kubectl kustomize $K8sDir | Out-Null
Write-Host "All Kubernetes manifests successfully compiled and validated." -ForegroundColor Green

if ($DryRunOnly) {
    Write-Host "`nDry-run completed successfully. Exiting without cluster modifications." -ForegroundColor Cyan
    exit 0
}

# 4. Apply to Cluster
Write-Host "`n[4/5] Applying Kubernetes resources to namespace '$Namespace'..." -ForegroundColor Yellow
kubectl apply -k $K8sDir

# 5. Monitor Rollouts
Write-Host "`n[5/5] Monitoring rollout status..." -ForegroundColor Yellow
kubectl rollout status deployment/ml-service -n $Namespace --timeout=180s
kubectl rollout status deployment/web-app -n $Namespace --timeout=180s

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host " Class Royale Deployment Completed Successfully!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

kubectl get pods,services,ingress,hpa -n $Namespace
