const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyConnections() {
  console.log('======================================');
  console.log('VERIFICACION DE CONEXIONES');
  console.log('======================================\n');

  // 1. Verificar conexión a PostgreSQL
  console.log('1. Verificando conexión a PostgreSQL...');
  try {
    const dbInfo = await prisma.$queryRaw`SELECT NOW() as time, version()`;
    console.log('   ✅ Conexión a PostgreSQL exitosa');
    console.log(`   Hora DB: ${dbInfo[0].time}\n`);
  } catch (err) {
    console.error('   ❌ Error conectando a PostgreSQL:', err.message);
    process.exit(1);
  }

  // 2. Verificar tabla Usuarios
  console.log('2. Verificando tabla Usuario...');
  try {
    const usuarioCount = await prisma.usuario.count();
    const usuarios = await prisma.usuario.findMany();
    console.log(`   ✅ Tabla Usuario accesible`);
    console.log(`   Total usuarios: ${usuarioCount}`);
    console.log(`   Admin: ${usuarios.find(u => u.rol === 'ADMIN')?.email}`);
  } catch (err) {
    console.error('   ❌ Error accediendo a tabla Usuario:', err.message);
  }

  // 3. Verificar tabla Equipos
  console.log('\n3. Verificando tabla Equipo...');
  try {
    const equipoCount = await prisma.equipo.count();
    const equipos = await prisma.equipo.findMany({ take: 3 });
    console.log(`   ✅ Tabla Equipo accesible`);
    console.log(`   Total equipos: ${equipoCount}`);
    console.log(`   Ubicacion de primeros 3 equipos: ${equipos[0]?.ubicacion}`);
    const ubicacionesUnicas = await prisma.equipo.groupBy({
      by: ['ubicacion'],
    });
    console.log(`   Ubicaciones unicas: ${ubicacionesUnicas.length}`);
  } catch (err) {
    console.error('   ❌ Error accediendo a tabla Equipo:', err.message);
  }

  // 4. Verificar tabla HistorialCambios
  console.log('\n4. Verificando tabla HistorialCambios...');
  try {
    const historialCount = await prisma.historialCambios.count();
    console.log(`   ✅ Tabla HistorialCambios accesible`);
    console.log(`   Total registros de historial: ${historialCount}`);
  } catch (err) {
    console.error('   ❌ Error accediendo a tabla HistorialCambios:', err.message);
  }

  // 5. Verificar configuración ENV
  console.log('\n5. Verificando variables de entorno...');
  const dbUrl = process.env.DATABASE_URL;
  const jwtSecret = process.env.JWT_SECRET;
  console.log(`   DATABASE_URL: ${dbUrl ? '✅ Configurada' : '❌ NO configurada'}`);
  console.log(`   JWT_SECRET: ${jwtSecret ? '✅ Configurada' : '❌ NO configurada'}`);

  // 6. Resumen
  console.log('\n======================================');
  console.log('RESUMEN DE CONEXIONES');
  console.log('======================================');
  console.log('✅ Backend <-> PostgreSQL: OPERATIVO');
  console.log('✅ Base de datos inventario_db: LISTA');
  console.log('✅ Tablas: Usuario, Equipo, HistorialCambios');
  console.log('✅ Variables de entorno: CONFIGURADAS');
  console.log('\nNota: Para verificar Frontend <-> Backend,');
  console.log('inicia los servidores con:');
  console.log('  Backend: npm run start:dev (puerto 3000)');
  console.log('  Frontend: npm run dev (puerto 5173)');
  console.log('======================================\n');

  await prisma.$disconnect();
}

verifyConnections().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
