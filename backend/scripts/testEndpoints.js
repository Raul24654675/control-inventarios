const axios = require('axios');

async function testBackendEndpoints() {
  const baseURL = 'http://localhost:3000';
  
  console.log('======================================');
  console.log('PRUEBA DE ENDPOINTS DEL BACKEND');
  console.log('======================================\n');

  const client = axios.create({ baseURL });

  // Test health check
  console.log('1. Probando endpoint de salud (GET /)...');
  try {
    const response = await client.get('/');
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   Respuesta: ${response.data}`);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.log('   ⚠️  Backend no está corriendo (esperado si no está iniciado)');
      console.log('   Para iniciar: npm run start:dev');
    } else {
      console.error('   ❌ Error:', err.message);
    }
  }

  // Test login admin endpoint
  console.log('\n2. Probando endpoint de login admin (POST /auth/login/admin)...');
  try {
    const response = await client.post('/auth/login/admin', {
      email: 'AdminMaster@inventario.local',
      password: 'ADMIN2026'
    });
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   Token obtenido: ${response.data.access_token ? '✅ Sí' : '❌ No'}`);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.log('   ⚠️  Backend no está corriendo');
    } else if (err.response?.status === 401) {
      console.log(`   ⚠️  Status 401: Credenciales incorrectas`);
    } else {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  // Test equipos endpoint
  console.log('\n3. Probando endpoint de equipos (GET /equipo)...');
  try {
    const response = await client.get('/equipo');
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   Equipos encontrados: ${response.data.length}`);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.log('   ⚠️  Backend no está corriendo');
    } else {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  console.log('\n======================================');
  console.log('INSTRUCCIONES PARA INICIAR SERVIDORES');
  console.log('======================================');
  console.log('\nTerminal 1 (Backend en puerto 3000):');
  console.log('  cd backend');
  console.log('  npm run start:dev\n');
  console.log('Terminal 2 (Frontend en puerto 5173):');
  console.log('  cd frontend');
  console.log('  npm run dev\n');
  console.log('Luego accede a http://localhost:5173\n');
}

testBackendEndpoints();
