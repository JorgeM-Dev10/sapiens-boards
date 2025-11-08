# Script para deployar en Vercel después de hacer push
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan

$response = Invoke-WebRequest -Uri "https://api.vercel.com/v1/integrations/deploy/prj_Me7bHRODTEogXs9QnASEGu9WreFU/KxJ2vMRF9Q" -Method POST

if ($response.StatusCode -eq 201) {
    Write-Host "✅ Deployment started successfully!" -ForegroundColor Green
    Write-Host "📦 Check status at: https://vercel.com/pepitobananinis-projects/sapiens-boards/deployments" -ForegroundColor Yellow
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
}










