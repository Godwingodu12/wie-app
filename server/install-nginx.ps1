# WIE Nginx Installation Script for D Drive

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Installing Nginx on D Drive" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Check if already installed
if (Test-Path "D:\nginx\nginx.exe") {
    Write-Host "`nWarning: Nginx already installed at D:\nginx" -ForegroundColor Yellow
    $response = Read-Host "Reinstall? (y/n)"
    if ($response -ne 'y') {
        Write-Host "Installation cancelled" -ForegroundColor Yellow
        exit
    }
}

# Create directory
Write-Host "`nCreating directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "D:\nginx" -Force | Out-Null

# Download Nginx
$nginxUrl = "https://nginx.org/download/nginx-1.24.0.zip"
$downloadPath = "$env:TEMP\nginx-download.zip"

Write-Host "Downloading Nginx from nginx.org..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $nginxUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "Download complete" -ForegroundColor Green
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    exit 1
}

# Extract
Write-Host "Extracting files..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $downloadPath -DestinationPath "D:\" -Force
    Write-Host "Extraction complete" -ForegroundColor Green
} catch {
    Write-Host "Extraction failed: $_" -ForegroundColor Red
    exit 1
}

# Move files to D:\nginx
if (Test-Path "D:\nginx-1.24.0") {
    Write-Host "Moving files..." -ForegroundColor Yellow
    Get-ChildItem "D:\nginx-1.24.0\*" | Move-Item -Destination "D:\nginx\" -Force
    Remove-Item "D:\nginx-1.24.0" -Recurse -Force
    Write-Host "Files moved" -ForegroundColor Green
}

# Clean up download
Remove-Item -Path $downloadPath -Force -ErrorAction SilentlyContinue

# Create nginx.conf
Write-Host "Creating nginx.conf..." -ForegroundColor Yellow

$nginxConfig = @'
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    access_log logs/access.log;
    error_log logs/error.log;

    sendfile        on;
    tcp_nopush     on;
    tcp_nodelay    on;
    keepalive_timeout  65;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    upstream wie_user_service {
        least_conn;
        server localhost:5005 weight=1 max_fails=3 fail_timeout=30s;
        server localhost:5008 weight=1 max_fails=3 fail_timeout=30s backup;
        server localhost:5009 weight=1 max_fails=3 fail_timeout=30s backup;
        keepalive 32;
    }

    upstream wie_auth_service {
        server localhost:5000 max_fails=3 fail_timeout=30s;
    }

    upstream wie_profile_service {
        server localhost:5002 max_fails=3 fail_timeout=30s;
    }

    upstream wie_ticket_service {
        server localhost:5003 max_fails=3 fail_timeout=30s;
    }

    upstream wie_chat_service {
        server localhost:5004 max_fails=3 fail_timeout=30s;
    }

    upstream wie_notification_service {
        server localhost:5006 max_fails=3 fail_timeout=30s;
    }

    upstream wie_transaction_service {
        server localhost:5007 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;
        server_name localhost;

        client_max_body_size 20M;
        client_body_buffer_size 128k;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        gzip on;
        gzip_vary on;
        gzip_types text/plain text/css application/json application/javascript;

        location /api/auth {
            proxy_pass http://wie_auth_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_http_version 1.1;
        }

        location /api/profile {
            proxy_pass http://wie_profile_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /api/user {
            proxy_pass http://wie_user_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_buffering off;
        }

        location /api/tickets {
            proxy_pass http://wie_user_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /api/ticket {
            proxy_pass http://wie_ticket_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /api/chat {
            proxy_pass http://wie_chat_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        location /api/notification {
            proxy_pass http://wie_notification_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_buffering off;
        }

        location /api/transaction {
            proxy_pass http://wie_transaction_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /health {
            proxy_pass http://wie_user_service;
            access_log off;
        }

        location /lb-status {
            stub_status on;
            access_log off;
            allow 127.0.0.1;
            deny all;
        }

        location /admin {
            proxy_pass http://localhost:5173;
            proxy_set_header Host $host;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        location / {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
'@

$nginxConfig | Out-File "D:\nginx\conf\nginx.conf" -Encoding UTF8

Write-Host "nginx.conf created" -ForegroundColor Green

# Test configuration
Write-Host "`nTesting Nginx configuration..." -ForegroundColor Yellow
Push-Location "D:\nginx"
$testResult = & .\nginx.exe -t 2>&1
Pop-Location

if ($testResult -match "successful") {
    Write-Host "Configuration test passed" -ForegroundColor Green
} else {
    Write-Host "Configuration test result:" -ForegroundColor Yellow
    Write-Host $testResult
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   Installation Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`nNginx installed at: D:\nginx" -ForegroundColor White
Write-Host "`nTo start Nginx, run:" -ForegroundColor Cyan
Write-Host "   cd D:\nginx" -ForegroundColor White
Write-Host "   .\nginx.exe" -ForegroundColor White
Write-Host "`nTo reload configuration:" -ForegroundColor Cyan
Write-Host "   .\nginx.exe -s reload" -ForegroundColor White
Write-Host "`nTo stop Nginx:" -ForegroundColor Cyan
Write-Host "   .\nginx.exe -s stop" -ForegroundColor White
Write-Host ""