const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'AdminMaster@inventario.local';
const ADMIN_PASSWORD = 'ADMIN2026';
const OPERARIO_PASSWORD = 'OPERADOR2026';

const sectores = ['ELECTRICA', 'NEUMATICA', 'MECANICA'];
const estados = ['ACTIVO', 'INACTIVO', 'MANTENIMIENTO'];

const equiposBase = [
  'Bomba',
  'Compresor',
  'Tablero',
  'Prensa',
  'Valvula',
  'Torno',
  'Generador',
  'Secador',
  'Transportador',
  'Intercambiador',
  'Extractor',
  'Dosificador',
  'Robot',
  'Caldera',
  'Fresadora',
  'Soldadora',
  'Molino',
  'Mezclador',
  'Empacadora',
  'Etiquetadora',
  'Cinta',
  'Elevador',
  'Pulidora',
  'Cortadora',
  'Ventilador',
  'Horno',
  'PLC',
  'Variador',
  'UPS',
  'Transformador',
];

function pick(arr, indexSeed) {
  return arr[indexSeed % arr.length];
}

async function main() {
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const operarioHash = await bcrypt.hash(OPERARIO_PASSWORD, 10);

  await prisma.$transaction(async (tx) => {
    await tx.historialCambios.deleteMany({});
    await tx.equipo.deleteMany({});
    await tx.usuario.deleteMany({});

    await tx.usuario.create({
      data: {
        nombre: 'Admin Master',
        email: ADMIN_EMAIL,
        password: adminHash,
        rol: 'ADMIN',
      },
    });

    for (let i = 1; i <= 15; i += 1) {
      await tx.usuario.create({
        data: {
          nombre: `Operario A${i}`,
          email: `OperarioA${i}@inventario.local`,
          password: operarioHash,
          rol: 'OPERADOR',
        },
      });
    }

    for (let i = 1; i <= 30; i += 1) {
      const sector = pick(sectores, i * 7);
      const estado = pick(estados, i * 11);
      const base = pick(equiposBase, i * 13);

      await tx.equipo.create({
        data: {
          nombre: `${base} IND-${String(i).padStart(2, '0')}`,
          sector,
          estado,
          descripcion: `Equipo ${base.toLowerCase()} para linea industrial ${i}, con mantenimiento planificado y registro tecnico completo.`,
          ubicacion: `Planta ${((i - 1) % 5) + 1} - Zona ${String.fromCharCode(65 + ((i - 1) % 6))} - Estacion ${i}`,
        },
      });
    }
  });

  const adminCount = await prisma.usuario.count({ where: { rol: 'ADMIN' } });
  const operarioCount = await prisma.usuario.count({ where: { rol: 'OPERADOR' } });
  const equiposCount = await prisma.equipo.count();

  console.log('Admin unico:', ADMIN_EMAIL);
  console.log('Admins:', adminCount);
  console.log('Operarios:', operarioCount);
  console.log('Equipos:', equiposCount);
  console.log('Password admin:', ADMIN_PASSWORD);
  console.log('Password operarios:', OPERARIO_PASSWORD);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
