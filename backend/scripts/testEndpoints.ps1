# Script para probar endpoints del backend usando PowerShell
Write-Host "======================================"
Write-Host "PRUEBA DE ENDPOINTS DEL BACKEND"
Write-Host "======================================`n" -ForegroundColor Blue

$baseURL = "http://localhost:3000"
$timeout = 3

# Test 1: Health check
Write-Host "1. Probando endpoint de salud (GET /)..."
try {
    $response = Invoke-WebRequest -Uri "$baseURL/" -TimeoutSec $timeout -ErrorAction Stop
    Write-Host "   ✅ Status: $($response.StatusCode)"
    Write-Host "   Respuesta: $($response.Content)`n"
} catch {
    if ($_.Exception.Message -match "No se puede conectar") {
        Write-Host "   ⚠️  Backend no está corriendo (esperado si no está iniciado)" -ForegroundColor Yellow
        Write-Host "   Para iniciar: npm run start:dev`n"
    } else {
        Write-Host "   ❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
    }
}

# Test 2: Login endpoint
Write-Host "2. Probando endpoint de login admin (POST /auth/login/admin)..."
try {
    $body = @{
        email = "AdminMaster@inventario.local"
        password = "ADMIN2026"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseURL/auth/login/admin" -Method POST -Body $body -ContentType "application/json" -TimeoutSec $timeout -ErrorAction Stop
    Write-Host "   ✅ Status: $($response.StatusCode)"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   Token obtenido: $(if ($data.access_token) { '✅ Sí' } else { '❌ No' })`n"
} catch {
    if ($_.Exception.Message -match "No se puede conectar") {
        Write-Host "   ⚠️  Backend no está corriendo" -ForegroundColor Yellow
    } elseif ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ⚠️  Status 401: Credenciales incorrectas`n" -ForegroundColor Yellow
    } else {
        Write-Host "   ℹ️  Esperado: Backend no iniciado`n" -ForegroundColor Cyan
    }
}

# Test 3: Equipos endpoint
Write-Host "3. Probando endpoint de equipos (GET /equipo)..."
try {
    $response = Invoke-WebRequest -Uri "$baseURL/equipo" -TimeoutSec $timeout -ErrorAction Stop
    Write-Host "   ✅ Status: $($response.StatusCode)"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   Equipos encontrados: $($data.Count)`n"
} catch {
    if ($_.Exception.Message -match "No se puede conectar") {
        Write-Host "   ⚠️  Backend no está corriendo" -ForegroundColor Yellow
    } else {
        Write-Host "   ℹ️  Esperado: Backend no iniciado`n" -ForegroundColor Cyan
    }
}

Write-Host "======================================"
Write-Host "INSTRUCCIONES PARA INICIAR SERVIDORES"
Write-Host "======================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Terminal 1 (Backend en puerto 3000):" -ForegroundColor Green
Write-Host "  cd backend"
Write-Host "  npm run start:dev`n"

Write-Host "Terminal 2 (Frontend en puerto 5173):" -ForegroundColor Green
Write-Host "  cd frontend"
Write-Host "  npm run dev`n"

Write-Host "Luego accede a: http://localhost:5173" -ForegroundColor Cyan
