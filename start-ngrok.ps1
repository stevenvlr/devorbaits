# Script pour démarrer Next.js et ngrok
Write-Host "🚀 Démarrage du serveur Next.js et ngrok..." -ForegroundColor Green

# Vérifier si le port 3000 est déjà utilisé
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "✅ Le serveur Next.js est déjà en cours d'exécution sur le port 3000" -ForegroundColor Yellow
} else {
    Write-Host "📦 Démarrage du serveur Next.js..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Minimized
    Start-Sleep -Seconds 5
}

# Vérifier si ngrok est déjà en cours d'exécution
$ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrokProcess) {
    Write-Host "⚠️  ngrok est déjà en cours d'exécution" -ForegroundColor Yellow
    Write-Host "   Arrêtez-le d'abord si vous voulez le relancer" -ForegroundColor Yellow
} else {
    Write-Host "🌐 Démarrage de ngrok sur le port 3000..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; ngrok http 3000" -WindowStyle Minimized
    Start-Sleep -Seconds 3
}

# Attendre un peu pour que ngrok démarre
Start-Sleep -Seconds 2

# Récupérer l'URL ngrok
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4040/api/tunnels" -UseBasicParsing -ErrorAction Stop
    $tunnels = ($response.Content | ConvertFrom-Json).tunnels
    if ($tunnels -and $tunnels.Count -gt 0) {
        $publicUrl = $tunnels[0].public_url
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "✅ ngrok est actif !" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 URL publique : $publicUrl" -ForegroundColor Cyan
        Write-Host "📍 URL locale   : http://localhost:3000" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "💡 Interface ngrok : http://localhost:4040" -ForegroundColor Yellow
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        
        # Copier l'URL dans le presse-papiers
        $publicUrl | Set-Clipboard
        Write-Host "📋 URL copiée dans le presse-papiers !" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ngrok a démarré mais aucune URL n'est disponible pour le moment" -ForegroundColor Yellow
        Write-Host "   Ouvrez http://localhost:4040 pour voir l'interface ngrok" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Impossible de récupérer l'URL ngrok automatiquement" -ForegroundColor Yellow
    Write-Host "   Ouvrez http://localhost:4040 pour voir l'interface ngrok" -ForegroundColor Yellow
    Write-Host "   Ou attendez quelques secondes et relancez ce script" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur Entree pour continuer..." -ForegroundColor Gray
Read-Host