# Unimate.AI Deployment Script for Windows PowerShell

Write-Host "🚀 Starting Unimate.AI Deployment Process..." -ForegroundColor Cyan

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the project root."
    exit 1
}

Write-Info "Step 1: Building Frontend..."
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Success "Frontend build completed successfully"
} else {
    Write-Error "Frontend build failed"
    exit 1
}

Write-Info "Step 2: Building Backend..."
Set-Location backend
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend build completed successfully"
} else {
    Write-Error "Backend build failed"
    exit 1
}
Set-Location ..

Write-Info "Step 3: Running Tests..."
npm run lint
if ($LASTEXITCODE -eq 0) {
    Write-Success "Linting passed"
} else {
    Write-Warning "Linting issues found (not blocking deployment)"
}

Write-Success "🎉 Build process completed successfully!"
Write-Info "Next steps:"
Write-Host "1. Push your code to GitHub"
Write-Host "2. Connect your GitHub repo to Vercel (Frontend)"
Write-Host "3. Connect your GitHub repo to Railway (Backend)"
Write-Host "4. Set up MongoDB Atlas database"
Write-Host "5. Configure environment variables"

Write-Host ""
Write-Info "Useful commands:"
Write-Host "• Test frontend locally: npm run dev"
Write-Host "• Test backend locally: cd backend; npm run dev"
Write-Host "• View deployment guide: Get-Content DEPLOYMENT_GUIDE.md"
