$BASE='http://localhost:3000'

function Show-Case($name, $code, $details) {
  $msg = ($details | Out-String).Trim()
  Write-Host ("$name => HTTP $code | $msg")
}

try {
  $adminLogin=Invoke-RestMethod -Method Post -Uri "$BASE/auth/login/admin" -ContentType 'application/json' -Body (@{email='AdminMaster@inventario.local';password='ADMIN2026'}|ConvertTo-Json)
  $opLogin=Invoke-RestMethod -Method Post -Uri "$BASE/auth/login/operador" -ContentType 'application/json' -Body (@{email='OperarioA1@inventario.local';password='OPERADOR2026'}|ConvertTo-Json)
} catch {
  Write-Host "No se pudo iniciar sesion con credenciales baseline. Detalle: $($_.ErrorDetails.Message)"
  exit 1
}
$hAdmin=@{Authorization="Bearer $($adminLogin.access_token)"}
$hOp=@{Authorization="Bearer $($opLogin.access_token)"}

try { Invoke-RestMethod -Method Delete -Uri "$BASE/equipos/1" -Headers $hOp | Out-Null } catch { Show-Case 'operador delete equipo' $_.Exception.Response.StatusCode.value__ $_.ErrorDetails.Message }
try { Invoke-RestMethod -Method Post -Uri "$BASE/auth/register" -Headers $hOp -ContentType 'application/json' -Body (@{nombre='X';email='x@x.com';password='123';rol='OPERADOR'}|ConvertTo-Json) | Out-Null } catch { Show-Case 'operador register user' $_.Exception.Response.StatusCode.value__ $_.ErrorDetails.Message }
try { Invoke-RestMethod -Method Post -Uri "$BASE/auth/login/operador" -ContentType 'application/json' -Body (@{email='OperarioA1@inventario.local';password='MAL'}|ConvertTo-Json) | Out-Null } catch { Show-Case 'login clave incorrecta' $_.Exception.Response.StatusCode.value__ $_.ErrorDetails.Message }
try { Invoke-RestMethod -Method Get -Uri "$BASE/equipos" | Out-Null } catch { Show-Case 'sin token' $_.Exception.Response.StatusCode.value__ $_.ErrorDetails.Message }
try { Invoke-RestMethod -Method Get -Uri "$BASE/equipos" -Headers @{Authorization='Bearer token.invalido'} | Out-Null } catch { Show-Case 'token invalido' $_.Exception.Response.StatusCode.value__ $_.ErrorDetails.Message }
try { Invoke-RestMethod -Method Get -Uri "$BASE/equipos/999999" -Headers $hAdmin | Out-Null } catch { Show-Case 'equipo no encontrado' $_.Exception.Response.StatusCode.value__ $_.ErrorDetails.Message }
try { Invoke-RestMethod -Method Get -Uri "$BASE/equipos/abc" -Headers $hAdmin | Out-Null } catch { Show-Case 'id invalido' $_.Exception.Response.StatusCode.value__ $_.ErrorDetails.Message }
try { Invoke-RestMethod -Method Post -Uri "$BASE/auth/register" -Headers $hAdmin -ContentType 'application/json' -Body (@{nombre='Y';email='y@x.com';password='123';rol='ROOT'}|ConvertTo-Json) | Out-Null } catch { Show-Case 'rol invalido' $_.Exception.Response.StatusCode.value__ $_.ErrorDetails.Message }
try { Invoke-RestMethod -Method Post -Uri "$BASE/equipos" -Headers $hAdmin -ContentType 'application/json' -Body (@{nombre='Q';sector='OTRO';estado='ACTIVO'}|ConvertTo-Json) | Out-Null } catch { Show-Case 'sector invalido' $_.Exception.Response.StatusCode.value__ $_.ErrorDetails.Message }
try { Invoke-RestMethod -Method Get -Uri "$BASE/historial?equipoId=abc" -Headers $hAdmin | Out-Null } catch { Show-Case 'historial equipoId invalido' $_.Exception.Response.StatusCode.value__ $_.ErrorDetails.Message }
