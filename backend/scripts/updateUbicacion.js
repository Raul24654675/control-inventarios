const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.equipo.updateMany({
    data: { ubicacion: 'EN ALMACEN' }
  });
  console.log('Equipos actualizados:', result.count);
  console.log('Ubicacion actualizada a: EN ALMACEN');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
