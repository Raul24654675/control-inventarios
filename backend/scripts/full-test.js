/**
 * Suite de pruebas completas: Prisma, Backend, Seguridad, Endpoints
 * Uso: node scripts/full-test.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const BASE = 'http://localhost:3000';
let pass = 0, fail = 0, warn = 0;

function ok(msg)   { console.log('  \x1b[32m[OK]  \x1b[0m ' + msg); pass++; }
function ko(msg)   { console.log('  \x1b[31m[FAIL]\x1b[0m ' + msg); fail++; }
function wn(msg)   { console.log('  \x1b[33m[WARN]\x1b[0m ' + msg); warn++; }
function sec(t)    { console.log('\n\x1b[36m=== ' + t + ' ===\x1b[0m'); }

async function req(method, path, opts = {}) {
  const { headers = {}, body, expectStatus } = opts;
  const init = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) init.body = JSON.stringify(body);
  const r = await fetch(BASE + path, init);
  let data;
  try { data = await r.json(); } catch { data = {}; }
  if (expectStatus && r.status !== expectStatus) {
    ko(`${method} ${path} => esperado ${expectStatus}, obtenido ${r.status}`);
  }
  return { status: r.status, data, headers: r.headers };
}

async function main() {
  // ─────────────────────────────────────────────────────────────
  // 1. PRISMA / BASE DE DATOS
  // ─────────────────────────────────────────────────────────────
  sec('1. Prisma / Base de datos');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    ok('Conexion Prisma activa');

    const usuarios  = await prisma.usuario.count();
    const equipos   = await prisma.equipo.count();
    const historial = await prisma.historialCambios.count();
    ok(`Tablas accesibles — usuarios:${usuarios} equipos:${equipos} historial:${historial}`);

    const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' }, select: { email: true, activo: true } });
    if (admin) {
      ok(`Admin encontrado: ${admin.email} — activo:${admin.activo}`);
    } else {
      ko('No existe ningún usuario ADMIN en la BD');
    }

    const op = await prisma.usuario.findFirst({ where: { rol: 'OPERADOR' }, select: { email: true, activo: true } });
    if (op) {
      ok(`Operador encontrado: ${op.email} — activo:${op.activo}`);
    } else {
      wn('No existe ningún usuario OPERADOR en la BD');
    }

    await prisma.$disconnect();
  } catch (e) {
    ko('Error Prisma: ' + e.message);
    await prisma.$disconnect().catch(() => {});
  }

  // ─────────────────────────────────────────────────────────────
  // 2. HEALTH & HEADERS DE SEGURIDAD
  // ─────────────────────────────────────────────────────────────
  sec('2. Health & Headers de seguridad');
  try {
    const r = await fetch(BASE + '/');
    if (r.status === 200) ok('GET / => 200 OK'); else ko(`GET / => ${r.status}`);

    const requiredHeaders = [
      ['x-content-type-options', 'nosniff'],
      ['x-frame-options',        'deny'],   // comparar en minusculas
      ['referrer-policy',        null],
      ['permissions-policy',     null],
    ];
    for (const [name, expected] of requiredHeaders) {
      const val = r.headers.get(name);
      if (!val) {
        ko(`Header '${name}' AUSENTE`);
      } else if (expected && val.toLowerCase() !== expected) {
        wn(`Header '${name}' = '${val}' (esperado '${expected}')`);
      } else {
        ok(`Header '${name}' = '${val}'`);
      }
    }
  } catch (e) {
    ko('Health check fallo: ' + e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. AUTENTICACION — CASOS POSITIVOS
  // ─────────────────────────────────────────────────────────────
  sec('3. Autenticacion — casos positivos');
  let adminToken = null, opToken = null;

  try {
    const r = await req('POST', '/auth/login/admin', { body: { email: 'AdminMaster@inventario.local', password: 'ADMIN2026' } });
    if (r.status === 201 && r.data.access_token) {
      ok('Login admin OK — token recibido');
      adminToken = r.data.access_token;
    } else {
      ko(`Login admin => ${r.status}: ${JSON.stringify(r.data)}`);
    }
  } catch (e) { ko('Login admin excepcion: ' + e.message); }

  try {
    const r = await req('POST', '/auth/login/operador', { body: { email: 'OperarioA1@inventario.local', password: 'OPERADOR2026' } });
    if (r.status === 201 && r.data.access_token) {
      ok('Login operador OK — token recibido');
      opToken = r.data.access_token;
    } else {
      ko(`Login operador => ${r.status}: ${JSON.stringify(r.data)}`);
    }
  } catch (e) { ko('Login operador excepcion: ' + e.message); }

  // ─────────────────────────────────────────────────────────────
  // 4. AUTORIZACION — ENDPOINTS PROTEGIDOS
  // ─────────────────────────────────────────────────────────────
  sec('4. Autorizacion — endpoints protegidos');

  // Sin token → 401
  {
    const r = await req('GET', '/equipos');
    if (r.status === 401) ok('GET /equipos sin token => 401 (correcto)');
    else ko(`GET /equipos sin token => ${r.status} (esperado 401)`);
  }
  // Token invalido → 401
  {
    const r = await req('GET', '/equipos', { headers: { Authorization: 'Bearer token.invalido.xxx' } });
    if (r.status === 401) ok('GET /equipos token invalido => 401 (correcto)');
    else ko(`GET /equipos token invalido => ${r.status} (esperado 401)`);
  }

  if (adminToken) {
    // Admin puede listar equipos
    const r = await req('GET', '/equipos', { headers: { Authorization: `Bearer ${adminToken}` } });
    if (r.status === 200) ok('GET /equipos con token admin => 200');
    else ko(`GET /equipos admin => ${r.status}`);

    // Admin puede listar usuarios
    const ru = await req('GET', '/auth/users', { headers: { Authorization: `Bearer ${adminToken}` } });
    if (ru.status === 200) ok('GET /auth/users con token admin => 200');
    else ko(`GET /auth/users admin => ${ru.status}`);
  } else {
    wn('Sin token admin — pruebas de acceso autenticado omitidas');
  }

  if (opToken) {
    // Operador puede listar equipos
    const r = await req('GET', '/equipos', { headers: { Authorization: `Bearer ${opToken}` } });
    if (r.status === 200) ok('GET /equipos con token operador => 200');
    else ko(`GET /equipos operador => ${r.status}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. VALIDACION DE INPUTS (casos negativos)
  // ─────────────────────────────────────────────────────────────
  sec('5. Validacion de inputs (casos negativos)');

  // Credenciales incorrectas → 401
  {
    const r = await req('POST', '/auth/login/operador', { body: { email: 'OperarioA1@inventario.local', password: 'CLAVE_INCORRECTA' } });
    if (r.status === 401) ok('Login clave incorrecta => 401 (correcto)');
    else ko(`Login clave incorrecta => ${r.status} (esperado 401)`);
  }
  // Email invalido → 400
  {
    const r = await req('POST', '/auth/login/admin', { body: { email: 'no-es-email', password: 'algo' } });
    if (r.status === 400) ok('Login email invalido => 400 (ValidationPipe activo)');
    else ko(`Login email invalido => ${r.status} (esperado 400)`);
  }
  // Campo extra (forbidNonWhitelisted) → 400
  {
    const r = await req('POST', '/auth/login/admin', { body: { email: 'a@b.com', password: 'abc123', campoExtra: 'inyeccion' } });
    if (r.status === 400) ok('Login campo extra => 400 (forbidNonWhitelisted activo)');
    else ko(`Login campo extra => ${r.status} (esperado 400)`);
  }
  // Rol invalido al registrar → 400
  if (adminToken) {
    const r = await req('POST', '/auth/register', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { nombre: 'Test', email: 'test@test.com', password: 'Test1234', rol: 'ROOT' }
    });
    if (r.status === 400) ok('Register rol=ROOT => 400 (correcto, rol invalido)');
    else ko(`Register rol invalido => ${r.status} (esperado 400)`);
  }
  // Operador intenta registrar usuario → 403
  if (opToken) {
    const r = await req('POST', '/auth/register', {
      headers: { Authorization: `Bearer ${opToken}` },
      body: { nombre: 'Hack', email: 'hack@hack.com', password: 'Hack1234' }
    });
    if (r.status === 403) ok('Operador register => 403 (rol insuficiente correcto)');
    else ko(`Operador register => ${r.status} (esperado 403)`);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. RATE LIMITING LOGIN
  // ─────────────────────────────────────────────────────────────
  sec('6. Rate limiting (429 tras 8 intentos)');
  {
    const uniqueEmail = `ratelimit-test-${Date.now()}@inventario.local`;
    let got429 = false;
    for (let i = 1; i <= 10; i++) {
      const r = await req('POST', '/auth/login/admin', { body: { email: uniqueEmail, password: 'Wrong' } });
      if (r.status === 429) { got429 = true; ok(`Intento #${i} => 429 (rate limit disparado correctamente)`); break; }
    }
    if (!got429) ko('Rate limit NO disparado en 10 intentos (esperado 429)');
  }

  // ─────────────────────────────────────────────────────────────
  // 7. CORS
  // ─────────────────────────────────────────────────────────────
  sec('7. CORS');
  try {
    const r = await fetch(BASE + '/', { headers: { Origin: 'http://localhost:5173' } });
    const acao = r.headers.get('access-control-allow-origin');
    if (acao) ok(`CORS permite localhost:5173 => Access-Control-Allow-Origin: ${acao}`);
    else wn('Access-Control-Allow-Origin no presente para origen permitido');

    const rBad = await fetch(BASE + '/', { headers: { Origin: 'http://evil.com' } });
    const acaoBad = rBad.headers.get('access-control-allow-origin');
    if (!acaoBad || acaoBad === 'null') ok('CORS bloquea http://evil.com (correcto)');
    else wn(`CORS permite origen no esperado: ${acaoBad}`);
  } catch (e) { wn('CORS check: ' + e.message); }

  // ─────────────────────────────────────────────────────────────
  // 8. HISTORIAL — FILTROS
  // ─────────────────────────────────────────────────────────────
  sec('8. Historial — filtros');
  if (adminToken) {
    const r = await req('GET', '/historial', { headers: { Authorization: `Bearer ${adminToken}` } });
    if (r.status === 200 && Array.isArray(r.data)) ok(`GET /historial => 200 (${r.data.length} registros)`);
    else ko(`GET /historial => ${r.status}`);
  } else {
    wn('Sin token admin — test historial omitido');
  }

  // ─────────────────────────────────────────────────────────────
  // RESUMEN FINAL
  // ─────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log(`\x1b[32m[OK]  ${pass}\x1b[0m   \x1b[31m[FAIL] ${fail}\x1b[0m   \x1b[33m[WARN] ${warn}\x1b[0m`);
  if (fail === 0) {
    console.log('\x1b[32m✓ TODAS LAS PRUEBAS PASARON\x1b[0m');
  } else {
    console.log(`\x1b[31m✗ ${fail} prueba(s) fallaron\x1b[0m`);
    process.exit(1);
  }
}

main().catch(e => { console.error('Error inesperado:', e); process.exit(1); });
