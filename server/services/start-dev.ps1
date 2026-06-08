# Start multiple instances for testing load balancer

Write-Host "Starting wie-user-service instances..." -ForegroundColor Cyan

# Terminal 1 - Instance 1 (Port 5005)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\projectnew\server\services\wie-user-service; `$env:PORT=5005; `$env:INSTANCE_ID='wie-user-1'; pnpm run dev"

Start-Sleep -Seconds 2

# Terminal 2 - Instance 2 (Port 5008)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\projectnew\server\services\wie-user-service; `$env:PORT=5008; `$env:GRPC_PORT=50055; `$env:INSTANCE_ID='wie-user-2'; pnpm run dev"

Start-Sleep -Seconds 2

# Terminal 3 - Instance 3 (Port 5009)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\projectnew\server\services\wie-user-service; `$env:PORT=5009; `$env:GRPC_PORT=50056; `$env:INSTANCE_ID='wie-user-3'; pnpm run dev"

Write-Host "`nAll instances starting in separate windows..." -ForegroundColor Green
Write-Host "Wait 10 seconds, then start Nginx" -ForegroundColor Yellow