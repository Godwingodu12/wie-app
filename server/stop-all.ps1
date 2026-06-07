Write-Host "🛑 Stopping all WIE services..." -ForegroundColor Yellow

# Stop PM2 services
Write-Host "Stopping PM2 services..." -ForegroundColor Cyan
pm2 stop all

# Stop Nginx
Write-Host "Stopping Nginx..." -ForegroundColor Cyan
if (Test-Path "D:\nginx\nginx.exe") {
    Push-Location "D:\nginx"
    .\nginx.exe -s stop
    Pop-Location
}

Write-Host "✅ All services stopped" -ForegroundColor Green
pm2 status