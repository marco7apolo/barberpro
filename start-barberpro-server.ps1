# Script completo para rodar BarberPro no Windows Server 2022
# Executar como Administrador

Write-Host "=== BarberPro - Configuracao Windows Server 2022 ===" -ForegroundColor Cyan

# 1. Verificar Node.js
Write-Host "`n[1/5] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js nao encontrado. Baixando e instalando..." -ForegroundColor Red
    $nodeUrl = "https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstaller /quiet /norestart"
    Remove-Item $nodeInstaller
    Write-Host "Node.js instalado. Reinicie o PowerShell." -ForegroundColor Green
    exit
}

# 2. Configurar Firewall para porta 3000
Write-Host "`n[2/5] Configurando Firewall para porta 3000..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "BarberPro Next.js" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    Write-Host "Firewall configurado." -ForegroundColor Green
} catch {
    Write-Host "Aviso: Nao foi possivel configurar firewall (pode ja existir)." -ForegroundColor Yellow
}

# 3. Fazer Build do projeto
Write-Host "`n[3/5] Fazendo Build do projeto..." -ForegroundColor Yellow
$projectPath = "C:\Users\user\Documents\GitHub\barberpro\Design System para BarberPro"
Set-Location $projectPath

# Instalar dependencias se necessario
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Fazer build
Write-Host "Executando npm run build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build concluido com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Erro no build. Verifique os erros acima." -ForegroundColor Red
    exit 1
}

# 4. Criar script de inicializacao
Write-Host "`n[4/5] Criando script de inicializacao..." -ForegroundColor Yellow
$startScript = @"
# Script para iniciar BarberPro (Next.js)
Set-Location "$projectPath"
`$env:NODE_ENV = "production"
npm start
"@
$startScript | Out-File -FilePath "$projectPath\start-app.ps1" -Encoding UTF8
Write-Host "Script criado: $projectPath\start-app.ps1" -ForegroundColor Green

# 5. Criar tarefa agendada para iniciar com o Windows (Opcional)
Write-Host "`n[5/5] Deseja criar uma tarefa agendada para iniciar com o Windows? (S/N)" -ForegroundColor Yellow
$resposta = Read-Host
if ($resposta -eq "S" -or $resposta -eq "s") {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$projectPath\start-app.ps1`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    Register-ScheduledTask -TaskName "BarberProServer" -Action $action -Trigger $trigger -Principal $principal -Description "Inicia BarberPro no boot" -Force
    Write-Host "Tarefa agendada criada!" -ForegroundColor Green
}

# Informacoes finais
Write-Host "`n=== CONFIGURACAO CONCLUIDA ===" -ForegroundColor Cyan
Write-Host "Para iniciar o servidor agora, execute:" -ForegroundColor White
Write-Host "  cd `"$projectPath`"" -ForegroundColor Gray
Write-Host "  npm start" -ForegroundColor Gray
Write-Host "`nOu execute o script:" -ForegroundColor White
Write-Host "  $projectPath\start-app.ps1" -ForegroundColor Gray
Write-Host "`nAcesse: http://localhost:3000" -ForegroundColor Green
Write-Host "Ou pelo IP da maquina: http://<IP-DO-SERVIDOR>:3000" -ForegroundColor Green
