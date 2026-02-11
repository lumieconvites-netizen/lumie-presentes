# Script para limpar cache e rebuild do Next.js
Write-Host "Parando processos Node..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Aguardando processos encerrarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Removendo cache .next..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item .next -Recurse -Force
    Write-Host "Cache removido com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Pasta .next não encontrada" -ForegroundColor Gray
}

Write-Host "" 
Write-Host "Agora execute: npm run dev" -ForegroundColor Cyan
Write-Host "E depois faça Ctrl+Shift+R no navegador" -ForegroundColor Cyan
