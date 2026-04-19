$root = "c:\Users\Lorena\Desktop\inventario-industrial"

# Backend TypeScript
$backendTsFiles = @(Get-ChildItem "$root\backend\src" -Recurse -Include "*.ts" -Exclude "*.spec.ts" -ErrorAction SilentlyContinue)
$backendTs = 0
foreach ($f in $backendTsFiles) {
  try {
    $backendTs += @(Get-Content $f | Measure-Object -Line).Lines
  } catch { }
}

# Frontend TypeScript/React
$frontendFiles = @(Get-ChildItem "$root\frontend\src" -Recurse -Include "*.ts", "*.tsx" -ErrorAction SilentlyContinue)
$frontendTs = 0
foreach ($f in $frontendFiles) {
  try {
    $frontendTs += @(Get-Content $f | Measure-Object -Line).Lines
  } catch { }
}

# Frontend CSS
$cssFiles = @(Get-ChildItem "$root\frontend\src" -Recurse -Include "*.css" -ErrorAction SilentlyContinue)
$frontendCss = 0
foreach ($f in $cssFiles) {
  try {
    $frontendCss += @(Get-Content $f | Measure-Object -Line).Lines
  } catch { }
}

# Backend Scripts
$scriptFiles = @(Get-ChildItem "$root\backend\scripts" -Recurse -Include "*.js" -ErrorAction SilentlyContinue)
$scripts = 0
foreach ($f in $scriptFiles) {
  try {
    $scripts += @(Get-Content $f | Measure-Object -Line).Lines
  } catch { }
}

# Backend tests
$testFiles = @(Get-ChildItem "$root\backend\src" -Recurse -Include "*.spec.ts" -ErrorAction SilentlyContinue)
$tests = 0
foreach ($f in $testFiles) {
  try {
    $tests += @(Get-Content $f | Measure-Object -Line).Lines
  } catch { }
}

# E2E tests
$e2eFiles = @(Get-ChildItem "$root\backend\test" -Recurse -Include "*.ts" -ErrorAction SilentlyContinue)
$e2e = 0
foreach ($f in $e2eFiles) {
  try {
    $e2e += @(Get-Content $f | Measure-Object -Line).Lines
  } catch { }
}

# Prisma schema
$prisma = 0
try {
  $prisma = @(Get-Content "$root\backend\prisma\schema.prisma" | Measure-Object -Line).Lines
} catch { }

$total = $backendTs + $frontendTs + $frontendCss + $scripts + $tests + $e2e + $prisma

Write-Host ""
Write-Host "════════════════════════════════════════════"
Write-Host "   CONTEO DE LINEAS DE CODIGO"
Write-Host "════════════════════════════════════════════"
Write-Host ""
Write-Host "Backend TypeScript (src)     : $backendTs lineas"
Write-Host "Frontend TypeScript/React    : $frontendTs lineas"
Write-Host "Frontend CSS                 : $frontendCss lineas"
Write-Host "Backend Scripts (Node.js)    : $scripts lineas"
Write-Host "Backend Unit Tests           : $tests lineas"
Write-Host "Backend E2E Tests            : $e2e lineas"
Write-Host "Prisma Schema                : $prisma lineas"
Write-Host ""
Write-Host "════════════════════════════════════════════"
Write-Host "TOTAL PROYECTO               : $total lineas"
Write-Host "════════════════════════════════════════════"
