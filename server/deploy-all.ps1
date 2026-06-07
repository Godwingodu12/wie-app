# WIE Complete Deployment Script
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   WIE Microservices Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Start Redis
Write-Host "`nStarting Redis..." -ForegroundColor Yellow
$redisProc = Get-Process redis-server -ErrorAction SilentlyContinue
if (-not $redisProc) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\Redis; .\redis-server.exe" -WindowStyle Minimized
    Start-Sleep -Seconds 2
    Write-Host "Redis started" -ForegroundColor Green
} else {
    Write-Host "Redis already running" -ForegroundColor Green
}

# Build services that need building
Write-Host "`nBuilding services..." -ForegroundColor Yellow

# Build wie-user-service (TypeScript)
Write-Host "Building wie-user-service..." -ForegroundColor Cyan
Push-Location "services\wie-user-service"
pnpm build
Pop-Location

# Build transaction-service (TypeScript)
Write-Host "Building transaction-service..." -ForegroundColor Cyan
Push-Location "services\transaction-service"
pnpm build
Pop-Location

# Create logs directory
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Start all services with PM2
Write-Host "`nStarting all services with PM2..." -ForegroundColor Yellow
pm2 start ecosystem.config.js

Start-Sleep -Seconds 5

# Start Nginx
Write-Host "`nStarting Nginx..." -ForegroundColor Yellow
cd D:\nginx
$nginxProc = Get-Process nginx -ErrorAction SilentlyContinue
if ($nginxProc) {
    .\nginx.exe -s reload
    Write-Host "Nginx reloaded" -ForegroundColor Green
} else {
    Start-Process "nginx.exe" -WindowStyle Hidden
    Write-Host "Nginx started" -ForegroundColor Green
}

# Show status
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

pm2 list

Write-Host "`nService URLs:" -ForegroundColor Cyan
Write-Host "  Auth:          http://localhost:5000" -ForegroundColor White
Write-Host "  Profile:       http://localhost:5002" -ForegroundColor White
Write-Host "  Ticket:        http://localhost:5003" -ForegroundColor White
Write-Host "  Chat:          http://localhost:5004" -ForegroundColor White
Write-Host "  User (LB):     http://localhost/api/user" -ForegroundColor White
Write-Host "  Notification:  http://localhost:5006" -ForegroundColor White
Write-Host "  Transaction:   http://localhost:5007" -ForegroundColor White
Write-Host "`nFrontend:" -ForegroundColor Cyan
Write-Host "  User App:      http://localhost:3000" -ForegroundColor White
Write-Host "  Admin App:     http://localhost:5173" -ForegroundColor White
Write-Host "`nMonitoring:" -ForegroundColor Cyan
Write-Host "  pm2 monit" -ForegroundColor White
Write-Host "  pm2 logs" -ForegroundColor White