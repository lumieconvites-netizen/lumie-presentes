# Script de Diagnóstico LUMIE
Write-Host "=== DIAGNÓSTICO LUMIE ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar estrutura
Write-Host "1. Verificando estrutura de pastas..." -ForegroundColor Yellow
$editorExists = Test-Path "app\dashboard\editor\page.tsx"
$layoutExists = Test-Path "app\dashboard\layout.tsx"
$oldFolder = Test-Path 'app\(dashboard)'

Write-Host "   Editor existe: $editorExists" -ForegroundColor $(if($editorExists){"Green"}else{"Red"})
Write-Host "   Layout existe: $layoutExists" -ForegroundColor $(if($layoutExists){"Green"}else{"Red"})
Write-Host "   Pasta antiga (dashboard) existe: $oldFolder" -ForegroundColor $(if($oldFolder){"Red"}else{"Green"})
Write-Host ""

# 2. Verificar cache
Write-Host "2. Verificando cache..." -ForegroundColor Yellow
$cacheExists = Test-Path ".next"
Write-Host "   Cache .next existe: $cacheExists" -ForegroundColor Yellow
Write-Host ""

# 3. Instruções
Write-Host "=== INSTRUÇÕES PARA CORRIGIR ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. PARE o servidor Next.js (Ctrl+C no terminal)" -ForegroundColor Red
Write-Host ""
Write-Host "2. Execute este comando para limpar o cache:" -ForegroundColor Yellow
Write-Host '   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue' -ForegroundColor White
Write-Host ""
Write-Host "3. Execute este comando para remover a pasta antiga:" -ForegroundColor Yellow
Write-Host '   Remove-Item -Recurse -Force "app\(dashboard)" -ErrorAction SilentlyContinue' -ForegroundColor White
Write-Host ""
Write-Host "4. Reinicie o servidor:" -ForegroundColor Yellow
Write-Host '   npm run dev' -ForegroundColor White
Write-Host ""
Write-Host "5. Acesse: http://localhost:3000/dashboard/editor" -ForegroundColor Green
Write-Host ""
Write-Host "=== FIM DO DIAGNÓSTICO ===" -ForegroundColor Cyan
