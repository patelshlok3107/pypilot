#!/usr/bin/env powershell
# Offline AI Tutor - Setup & Run Script
# This script sets up and runs the fully offline AI learning system

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Commands
)

$ProjectName = "ai-learning-saas"
$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$DockerComposePath = Join-Path $ProjectPath "docker-compose.yml"

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
}

function Write-Status {
    param([string]$Text, [string]$Status = "info")
    $Color = @{
        "success" = "Green"
        "error" = "Red"
        "warning" = "Yellow"
        "info" = "Cyan"
    }[$Status]
    Write-Host "  ► $Text" -ForegroundColor $Color
}

function Main {
    Write-Header "Offline AI Tutor Setup & Launcher"
    
    Write-Host "`n📋 What would you like to do?`n"
    Write-Host "  1) Build & start system (includes Ollama)"
    Write-Host "  2) Start existing system"
    Write-Host "  3) Stop system"
    Write-Host "  4) View logs"
    Write-Host "  5) Check status"
    Write-Host "  6) Clean up (remove containers)"
    Write-Host "  7) Full rebuild"
    Write-Host ""

    $choice = Read-Host "Enter choice (1-7)"

    switch ($choice) {
        "1" { StartFresh }
        "2" { StartExisting }
        "3" { StopSystem }
        "4" { ViewLogs }
        "5" { CheckStatus }
        "6" { Cleanup }
        "7" { FullRebuild }
        default { Write-Status "Invalid choice" "error"; Main }
    }
}

function StartFresh {
    Write-Header "Building & Starting System"
    
    Write-Status "Pulling latest images..." "info"
    docker-compose -f $DockerComposePath pull
    
    Write-Status "Building services..." "info"
    docker-compose -f $DockerComposePath build
    
    Write-Status "Starting services..." "info"
    docker-compose -f $DockerComposePath up -d
    
    Write-Status "Waiting for services to start..." "info"
    Start-Sleep -Seconds 3
    
    Write-Status "Checking system status..." "info"
    docker-compose -f $DockerComposePath ps
    
    Write-Header "System Started! 🚀"
    Write-Host ""
    Write-Host "  🌐 Web UI:        http://localhost:3000"
    Write-Host "  🔗 API:          http://localhost:8000"
    Write-Host "  🤖 Ollama:       http://localhost:11434"
    Write-Host "  📊 API Docs:     http://localhost:8000/docs"
    Write-Host ""
    Write-Host "  ⏳ First start: Ollama is downloading the Mistral model (~5-10 mins)"
    Write-Host "  💡 Check logs:   docker-compose logs -f ollama"
    Write-Host ""
    Write-Status "System ready! Access http://localhost:3000" "success"
}

function StartExisting {
    Write-Header "Starting Existing System"
    
    Write-Status "Starting services..." "info"
    docker-compose -f $DockerComposePath start
    
    Write-Status "Checking status..." "info"
    docker-compose -f $DockerComposePath ps
    
    Write-Host ""
    Write-Status "System started!" "success"
    Write-Host "  🌐 Web: http://localhost:3000"
}

function StopSystem {
    Write-Header "Stopping System"
    
    Write-Status "Stopping all services..." "info"
    docker-compose -f $DockerComposePath stop
    
    Write-Host ""
    Write-Status "System stopped" "success"
}

function ViewLogs {
    Write-Header "System Logs"
    
    Write-Host "`n📋 Which service's logs do you want?`n"
    Write-Host "  1) All services"
    Write-Host "  2) API"
    Write-Host "  3) Ollama (AI Model)"
    Write-Host "  4) Web"
    Write-Host "  5) Database"
    Write-Host ""

    $choice = Read-Host "Enter choice (1-5)"

    $service = @{
        "1" = ""
        "2" = "api"
        "3" = "ollama"
        "4" = "web"
        "5" = "db"
    }[$choice]

    if ($choice -in "1", "2", "3", "4", "5") {
        if ($service) {
            docker-compose -f $DockerComposePath logs -f $service
        } else {
            docker-compose -f $DockerComposePath logs -f
        }
    } else {
        Write-Status "Invalid choice" "error"
    }
}

function CheckStatus {
    Write-Header "System Status"
    
    Write-Status "Container Status:" "info"
    docker-compose -f $DockerComposePath ps
    
    Write-Host ""
    Write-Status "Testing Connections..." "info"
    
    # Check API
    try {
        $apiHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -ErrorAction SilentlyContinue
        Write-Status "API: ✅ Online" "success"
    } catch {
        Write-Status "API: ❌ Offline or unavailable" "error"
    }
    
    # Check Web
    try {
        $webCheck = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue
        if ($webCheck) {
            Write-Status "Web: ✅ Online" "success"
        }
    } catch {
        Write-Status "Web: ❌ Offline or unavailable" "error"
    }
    
    # Check Ollama
    try {
        $ollamaCheck = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -ErrorAction SilentlyContinue
        Write-Status "Ollama: ✅ Online ($(($ollamaCheck.models | Measure-Object).Count) models)" "success"
    } catch {
        Write-Status "Ollama: ⏳ Starting (downloading model...)" "warning"
    }
    
    Write-Host ""
}

function Cleanup {
    Write-Header "Cleaning Up"
    
    Write-Host "`n⚠️  This will remove all containers and volumes!`n"
    Write-Host "  1) Keep volumes (keep database data)"
    Write-Host "  2) Remove everything including data"
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1-2)"
    
    if ($choice -eq "1") {
        Write-Status "Stopping and removing containers..." "info"
        docker-compose -f $DockerComposePath down
        Write-Status "Cleanup complete (data preserved)" "success"
    } elseif ($choice -eq "2") {
        Write-Status "Removing everything including volumes..." "warning"
        docker-compose -f $DockerComposePath down -v
        Write-Status "Complete cleanup done" "success"
    }
}

function FullRebuild {
    Write-Header "Full Rebuild"
    
    Write-Status "Removing all containers and volumes..." "warning"
    docker-compose -f $DockerComposePath down -v
    
    Write-Status "Rebuilding from scratch..." "info"
    docker-compose -f $DockerComposePath build --no-cache
    
    Write-Status "Starting fresh system..." "info"
    docker-compose -f $DockerComposePath up -d
    
    Start-Sleep -Seconds 3
    
    Write-Header "Full Rebuild Complete! 🚀"
    Write-Status "System is ready" "success"
}

# Show menu and run
Main

# Ask if user wants to continue
Write-Host ""
$continue = Read-Host "Press Enter to exit or enter 'menu' to return to menu"
if ($continue -eq "menu") {
    Main
}
