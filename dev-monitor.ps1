# dev-monitor.ps1
# Unified Development Startup and Monitoring Script

Write-Host "🔍 Starting System Diagnostics..." -ForegroundColor Cyan

# 1. Detect Local IP
$currentIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notmatch 'Loopback|VirtualBox|VMware' -and $_.IPAddress -notmatch '^169' 
} | Select-Object -First 1).IPAddress

if (-not $currentIP) {
    Write-Host "❌ Could not detect a valid Local IP. Please check your network." -ForegroundColor Red
    exit
}

Write-Host "🚀 Detected Current IP: $currentIP" -ForegroundColor Cyan

# 2. Update Configuration Files with Current IP
$filesToUpdate = @(
    "mobile\src\constants\config.ts",
    "mobile\src\config\api.config.ts",
    "mobile\src\services\api.js",
    "mobile\src\services\api.ts",
    "mobile\src\constants\config.js",
    "server\services\wie-user-service\.env",
    "server\services\wie-follow-service\.env",
    "server\services\wie-media-service\.env",
    "server\services\auth-service\.env",
    "server\services\chat-service\.env",
    "server\services\connection-service\.env",
    "server\services\notification-service\.env",
    "server\services\ticket-service\.env",
    "server\services\transaction-service\.env"
)

foreach ($file in $filesToUpdate) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        # Replace any IP pattern with the current detected IP
        $newContent = $content -replace '\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', $currentIP

        if ($file.EndsWith(".env")) {
            $corsPattern = "CORS_ORIGIN=.*"
            $newCors = "CORS_ORIGIN=http://localhost:3000,http://$currentIP:8081,http://$currentIP:8082,exp://$currentIP:8081,exp://$currentIP:8082"
            if ($newContent -match $corsPattern) {
                $newContent = $newContent -replace $corsPattern, $newCors
            } else {
                $newContent += "`n$newCors"
            }
        }

        $newContent | Set-Content $file -NoNewline
        Write-Host "✅ Updated $file" -ForegroundColor Green
    }
}

# 3. Ensure Services Listen on 0.0.0.0 (required for LAN access)
Write-Host "`n🔧 Patching listen addresses to 0.0.0.0..." -ForegroundColor Cyan
$services = Get-ChildItem -Path "server/services" -Directory
foreach ($service in $services) {
    $entryPoints = Get-ChildItem -Path $service.FullName -Include "index.ts", "server.ts", "index.js", "server.js" -Recurse -File -Exclude "node_modules"
    foreach ($ep in $entryPoints) {
        $content = Get-Content $ep.FullName -Raw
        if ($content -match '(app|server)\.listen\(PORT, \(\) =>') {
            $newContent = $content -replace '(app|server)\.listen\(PORT, \(\) =>', "`$1.listen(PORT, '0.0.0.0', () =>"
            $newContent | Set-Content $ep.FullName -NoNewline
            Write-Host "   ✅ Patched $($ep.FullName)" -ForegroundColor Gray
        }
    }
}

# 4. Stop existing processes
Write-Host "`n🛑 Cleaning up old processes..." -ForegroundColor Yellow
pm2 kill | Out-Null
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue

# 5. Generate Prisma Clients
Write-Host "`n💎 Generating Prisma Clients..." -ForegroundColor Cyan
if (Test-Path "server/services/wie-user-service") {
    Push-Location "server/services/wie-user-service"; pnpm run prisma:generate; Pop-Location
}
if (Test-Path "server/services/transaction-service") {
    Push-Location "server/services/transaction-service"; pnpm run prisma:generate; Pop-Location
}

# 6. Start Backend Services with PM2 (Consolidated Monitoring)
Write-Host "`n🚀 Starting Backend Services with PM2..." -ForegroundColor Green

$nodeServices = @(
    @{ name = "auth"; path = "server/services/auth-service" },
    @{ name = "chat"; path = "server/services/chat-service" },
    @{ name = "connection"; path = "server/services/connection-service" },
    @{ name = "notification"; path = "server/services/notification-service" },
    @{ name = "ticket"; path = "server/services/ticket-service" },
    @{ name = "transaction"; path = "server/services/transaction-service" },
    @{ name = "user"; path = "server/services/wie-user-service" },
    @{ name = "media"; path = "server/services/wie-media-service" },
    @{ name = "follow"; path = "server/services/wie-follow-service" }
)

foreach ($s in $nodeServices) {
    if (Test-Path $s.path) {
        pm2 start "pnpm run dev" --name "wie-$($s.name)" --cwd $s.path
    }
}

# Python Services
if (Test-Path "server/services/wie-face-service") {
    pm2 start "python main.py" --name "wie-face" --cwd "server/services/wie-face-service"
}
if (Test-Path "server/services/seat-detector") {
    pm2 start "python -m uvicorn app:app --host 0.0.0.0 --port 8001" --name "wie-seat" --cwd "server/services/seat-detector"
}
if (Test-Path "server/services/screenshot-detect-service") {
    pm2 start "python main.py" --name "wie-screenshot" --cwd "server/services/screenshot-detect-service"
}

# 7. Start PM2 Monitor in a separate window
# Start-Process powershell -ArgumentList "-Command", "pm2 monit"

# 8. Start Mobile Frontend in the foreground
Write-Host "Backend is ready. Expo will be started separately..." -ForegroundColor Green
# cd mobile
# pnpm run start
