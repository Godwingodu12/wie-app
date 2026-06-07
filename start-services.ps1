# start-services.ps1
# 1. Automatically detect the current machine IP
$currentIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notmatch 'Loopback|VirtualBox|VMware' -and $_.IPAddress -notmatch '^169' 
} | Select-Object -First 1).IPAddress

if (-not $currentIP) {
    Write-Host "❌ Could not detect a valid Local IP. Please check your network." -ForegroundColor Red
    exit
}

Write-Host "🚀 Detected Current IP: $currentIP" -ForegroundColor Cyan

# 2. List of files to update with the new IP
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

# 3. Perform the update in each file
foreach ($file in $filesToUpdate) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        # Replace any 192.168.x.x pattern with the current detected IP
        $newContent = $content -replace '192\.168\.\d{1,3}\.\d{1,3}', $currentIP

        # If it's a .env file, also ensure CORS_ORIGIN includes the common patterns
        if ($file.EndsWith(".env")) {
            $corsPattern = "CORS_ORIGIN=.*"
            $newCors = "CORS_ORIGIN=http://localhost:3000,http://$currentIP:8081,http://$currentIP:8082,exp://$currentIP:8081,exp://$currentIP:8082"
            if ($newContent -match $corsPattern) {
                $newContent = $newContent -replace $corsPattern, $newCors
            }
        }

        $newContent | Set-Content $file -NoNewline
        Write-Host "✅ Updated $file with IP $currentIP" -ForegroundColor Green
    }
}

# 3.1 Ensure all services listen on 0.0.0.0
Write-Host "`nEnsuring all services listen on 0.0.0.0..." -ForegroundColor Cyan
# Target specific service directories and avoid node_modules
$services = Get-ChildItem -Path "server/services" -Directory
$entryPoints = foreach ($service in $services) {
    # Check root of service and src folder only, avoiding node_modules
    Get-ChildItem -Path $service.FullName -Include "index.ts", "server.ts", "index.js", "server.js" -File -ErrorAction SilentlyContinue
    if (Test-Path "$($service.FullName)/src") {
        Get-ChildItem -Path "$($service.FullName)/src" -Include "index.ts", "server.ts", "index.js", "server.js" -File -ErrorAction SilentlyContinue
    }
}

foreach ($ep in $entryPoints) {
    $content = Get-Content $ep.FullName -Raw
    if ($content -match '(app|server)\.listen\(PORT, \(\) =>') {
        $newContent = $content -replace '(app|server)\.listen\(PORT, \(\) =>', "`$1.listen(PORT, '0.0.0.0', () =>"
        $newContent | Set-Content $ep.FullName -NoNewline
        Write-Host "✅ Fixed listen address in $($ep.FullName)" -ForegroundColor Green
    }
}

# 4. Clean old processes
Write-Host "`nStopping any old processes..."
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue

$nodeServices = @(
    @{ name = "auth"; path = "server/services/auth-service"; port = 5000 },
    @{ name = "chat"; path = "server/services/chat-service"; port = 5004 },
    @{ name = "connection"; path = "server/services/connection-service"; port = 5012 },
    @{ name = "notification"; path = "server/services/notification-service"; port = 5006 },
    @{ name = "ticket"; path = "server/services/ticket-service"; port = 5003 },
    @{ name = "transaction"; path = "server/services/transaction-service"; port = 5007 },
    @{ name = "user"; path = "server/services/wie-user-service"; port = 5005 },
    @{ name = "media"; path = "server/services/wie-media-service"; port = 5010 },
    @{ name = "follow"; path = "server/services/wie-follow-service"; port = 5009 }
)

Write-Host "`nGenerating Prisma clients..."
if (Test-Path "server/services/wie-user-service") {
    Write-Host "Generating Prisma for user-service..."
    Push-Location "server/services/wie-user-service"; pnpm run prisma:generate; Pop-Location
}
if (Test-Path "server/services/transaction-service") {
    Write-Host "Generating Prisma for transaction-service..."
    Push-Location "server/services/transaction-service"; pnpm run prisma:generate; Pop-Location
}

# Start Node Services
foreach ($s in $nodeServices) {
    if (Test-Path $s.path) {
        Write-Host "Starting $($s.name) on port $($s.port)..."
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $($s.path); pnpm run dev"
    }
}

# Start Python Services
Write-Host "`nStarting Python Services..." -ForegroundColor Cyan
if (Test-Path "server/services/wie-face-service") {
    Write-Host "Starting face-service on port 8002..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server/services/wie-face-service; python main.py"
}
if (Test-Path "server/services/seat-detector") {
    Write-Host "Starting seat-detector on port 8001..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server/services/seat-detector; python -m uvicorn app:app --host 0.0.0.0 --port 8001"
}
if (Test-Path "server/services/screenshot-detect-service") {
    Write-Host "Starting screenshot-detect-service on port 8003..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server/services/screenshot-detect-service; python main.py"
}

Write-Host "`nWaiting 5 seconds for port 8081 to be released..."
Start-Sleep -Seconds 5
Write-Host "Starting mobile app in LAN mode with IP $currentIP..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd mobile; `$env:REACT_NATIVE_PACKAGER_HOSTNAME='$currentIP'; `$env:CI=''; pnpm run start"

Write-Host "`n✅ ALL SYSTEMS READY" -ForegroundColor Green
