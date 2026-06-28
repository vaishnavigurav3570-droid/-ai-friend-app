# ============================================
# Deploy Antigravity Backend to Google Cloud Run
# ============================================

$ErrorActionPreference = "Stop"

# Check if gcloud is installed and available
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERROR: 'gcloud' is not installed or not in your PATH." -ForegroundColor Red
    Write-Host "Please install it, or if you already did, restart your terminal!" -ForegroundColor Red
    exit 1
}

$PROJECT_ID = "helpful-symbol-473316-i3"
$SERVICE_NAME = "antigravity-api"
$REGION = "us-central1"

Write-Host "-> Starting deployment to Google Cloud Run for project: $PROJECT_ID" -ForegroundColor Cyan

# 1. Ensure gcloud is configured to the correct project
Write-Host "-> Setting gcloud project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# 2. Enable necessary APIs
Write-Host "-> Enabling necessary Google Cloud APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# 3. Create Artifact Registry repository if it doesn't exist
Write-Host "-> Ensuring Artifact Registry repository exists..."
gcloud artifacts repositories describe run-apps --location=$REGION 2>$null
if ($LASTEXITCODE -ne 0) {
    gcloud artifacts repositories create run-apps --repository-format=docker --location=$REGION --description="Docker repository for Cloud Run apps"
}

# 4. Build the image via Cloud Build
$IMAGE_TAG = "us-central1-docker.pkg.dev/$PROJECT_ID/run-apps/$SERVICE_NAME`:$((Get-Date).ToString('yyyyMMdd-HHmmss'))"
Write-Host "-> Submitting build to Google Cloud Build ($IMAGE_TAG)..." -ForegroundColor Yellow
gcloud builds submit --tag $IMAGE_TAG

# 5. Deploy to Cloud Run
Write-Host "-> Deploying image to Cloud Run..." -ForegroundColor Yellow

# Read the .env file from apps/backend to pass secrets to Cloud Run
$envPath = "apps\backend\.env"
if (Test-Path $envPath) {
    # Extract keys we need
    $supabaseUrl = (Select-String -Path $envPath -Pattern "^SUPABASE_URL=(.*)").Matches.Groups[1].Value
    $supabaseAnonKey = (Select-String -Path $envPath -Pattern "^SUPABASE_ANON_KEY=(.*)").Matches.Groups[1].Value
    $supabaseServiceKey = (Select-String -Path $envPath -Pattern "^SUPABASE_SERVICE_ROLE_KEY=(.*)").Matches.Groups[1].Value
    $openRouterKey = (Select-String -Path $envPath -Pattern "^OPENROUTER_API_KEY=(.*)").Matches.Groups[1].Value
    $zhipuKey = (Select-String -Path $envPath -Pattern "^ZHIPU_API_KEY=(.*)").Matches.Groups[1].Value

    gcloud run deploy $SERVICE_NAME `
        --image $IMAGE_TAG `
        --region $REGION `
        --allow-unauthenticated `
        --port 8080 `
        --set-env-vars="SUPABASE_URL=$supabaseUrl,SUPABASE_ANON_KEY=$supabaseAnonKey,SUPABASE_SERVICE_ROLE_KEY=$supabaseServiceKey,OPENROUTER_API_KEY=$openRouterKey,ZHIPU_API_KEY=$zhipuKey,NODE_ENV=production"
} else {
    Write-Host "-> Warning: No .env file found in apps/backend! Deploying without environment variables." -ForegroundColor Red
    gcloud run deploy $SERVICE_NAME `
        --image $IMAGE_TAG `
        --region $REGION `
        --allow-unauthenticated `
        --port 8080
}

Write-Host "-> Deployment script finished successfully!" -ForegroundColor Green
