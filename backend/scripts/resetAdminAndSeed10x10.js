const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const TARGET_ADMIN_EMAIL = process.argv[2] || 'admin.1774129619778@inventario.local';
const TARGET_ADMIN_PASSWORD = process.argv[3] || 'ADMIN2026';

const usersSeed = Array.from({ length: 10 }).map((_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    nombre: `Operador ${n}`,
    email: `op${n}@inventario.local`,
    rol: 'OPERADOR',
  };
});

const equiposSeed = [
  {
    nombre: 'Bomba Centrifuga BC-01',
    sector: 'MECANICA',
    descripcion: 'Bomba principal del circuito de refrigeracion',
    estado: 'ACTIVO',
    ubicacion: 'Planta Norte - Sala Bombas',
  },
  {
    nombre: 'Compresor Tornillo CT-02',
    sector: 'NEUMATICA',
    descripcion: 'Compresor de aire para linea de produccion',
    estado: 'ACTIVO',
    ubicacion: 'Planta Norte - Cuarto Compresores',
  },
  {
    nombre: 'Tablero Potencia TP-03',
    sector: 'ELECTRICA',
    descripcion: 'Tablero de distribucion de cargas criticas',
    estado: 'MANTENIMIENTO',
    ubicacion: 'Subestacion - Modulo A',
  },
  {
    nombre: 'Prensa Hidraulica PH-04',
    sector: 'MECANICA',
    descripcion: 'Prensa para conformado de piezas metalicas',
    estado: 'ACTIVO',
    ubicacion: 'Taller de Conformado - Estacion 4',
  },
  {
    nombre: 'Valvula Neumatica VN-05',
    sector: 'NEUMATICA',
    descripcion: 'Control de actuadores en linea de empaque',
    estado: 'INACTIVO',
    ubicacion: 'Linea Empaque - Nodo 5',
  },
  {
    nombre: 'Centro Carga CC-06',
    sector: 'ELECTRICA',
    descripcion: 'Centro de carga secundario para servicios',
    estado: 'ACTIVO',
    ubicacion: 'Cuarto Electrico Sur - Panel 6',
  },
  {
    nombre: 'Transportador Banda TB-07',
    sector: 'MECANICA',
    descripcion: 'Traslado de material entre estaciones',
    estado: 'ACTIVO',
    ubicacion: 'Linea Produccion - Tramo 7',
  },
  {
    nombre: 'Secador Aire SA-08',
    sector: 'NEUMATICA',
    descripcion: 'Elimina humedad en red de aire comprimido',
    estado: 'MANTENIMIENTO',
    ubicacion: 'Sala Compresores - Modulo 8',
  },
  {
    nombre: 'Generador Respaldo GR-09',
    sector: 'ELECTRICA',
    descripcion: 'Respaldo energetico para cargas esenciales',
    estado: 'ACTIVO',
    ubicacion: 'Patio de Energia - Bahia 9',
  },
  {
    nombre: 'Torno CNC TC-10',
    sector: 'MECANICA',
    descripcion: 'Maquinado de precision para piezas criticas',
    estado: 'ACTIVO',
    ubicacion: 'Taller CNC - Estacion 10',
  },
];

async function main() {
  const adminPasswordHash = await bcrypt.hash(TARGET_ADMIN_PASSWORD, 10);

  const admin = await prisma.usuario.upsert({
    where: { email: TARGET_ADMIN_EMAIL },
    update: {
      nombre: 'Admin',
      password: adminPasswordHash,
      rol: 'ADMIN',
    },
    create: {
      nombre: 'Admin',
      email: TARGET_ADMIN_EMAIL,
      password: adminPasswordHash,
      rol: 'ADMIN',
    },
  });

  await prisma.historialCambios.deleteMany({});
  await prisma.equipo.deleteMany({});
  await prisma.usuario.deleteMany({
    where: {
      id: { not: admin.id },
    },
  });

  const operadorPasswordHash = await bcrypt.hash('OPERADOR2026', 10);

  for (const u of usersSeed) {
    await prisma.usuario.create({
      data: {
        nombre: u.nombre,
        email: u.email,
        password: operadorPasswordHash,
        rol: u.rol,
      },
    });
  }

  const createdEquipos = [];
  for (const eq of equiposSeed) {
    const row = await prisma.equipo.create({ data: eq });
    createdEquipos.push({ id: row.id, nombre: row.nombre, sector: row.sector, estado: row.estado });
  }

  const adminCount = await prisma.usuario.count({ where: { rol: 'ADMIN' } });
  const usersCount = await prisma.usuario.count();
  const equiposCount = await prisma.equipo.count();

  console.log('ADMIN unico:', TARGET_ADMIN_EMAIL);
  console.log('Cantidad admins:', adminCount);
  console.log('Cantidad usuarios total:', usersCount);
  console.log('Cantidad equipos total:', equiposCount);
  console.log('Equipos creados:');
  console.log(JSON.stringify(createdEquipos, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
