const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const equipos = [
  { nombre: 'Robot Paletizador RP-01', sector: 'MECANICA', estado: 'ACTIVO', descripcion: 'Robot para paletizado de producto terminado', ubicacion: 'Nave Empaque - Celda Robot 1' },
  { nombre: 'Banco de Pruebas BP-09', sector: 'ELECTRICA', estado: 'ACTIVO', descripcion: 'Banco para pruebas electricas de motores', ubicacion: 'Laboratorio Electrico - Zona A' },
  { nombre: 'Secador de Aire SA-15', sector: 'NEUMATICA', estado: 'MANTENIMIENTO', descripcion: 'Secador frigorifico para linea de aire comprimido', ubicacion: 'Planta Norte - Sala Compresores' },
  { nombre: 'Caldera Industrial CI-02', sector: 'MECANICA', estado: 'ACTIVO', descripcion: 'Generacion de vapor para procesos termicos', ubicacion: 'Cuarto de Calderas - Patio Sur' },
  { nombre: 'Subestacion SS-13.2kV', sector: 'ELECTRICA', estado: 'ACTIVO', descripcion: 'Subestacion principal de distribucion interna', ubicacion: 'Patio Electrico - Modulo Subestacion' },
  { nombre: 'Modulo FRL FRL-07', sector: 'NEUMATICA', estado: 'INACTIVO', descripcion: 'Filtro-regulador-lubricador de linea secundaria', ubicacion: 'Linea Ensamble - Estacion 7' },
  { nombre: 'Elevador de Cangilones EC-03', sector: 'MECANICA', estado: 'ACTIVO', descripcion: 'Transporte vertical de material a tolva', ubicacion: 'Area Procesos - Torre 1' },
  { nombre: 'Centro de Carga CC-22', sector: 'ELECTRICA', estado: 'MANTENIMIENTO', descripcion: 'Centro de carga para alimentadores de produccion', ubicacion: 'Cuarto Electrico Sur - Panel 22' },
  { nombre: 'Reductor Neumatico RN-11', sector: 'NEUMATICA', estado: 'ACTIVO', descripcion: 'Reduccion de presion en linea de actuadores', ubicacion: 'Linea Empaque - Nodo 11' },
  { nombre: 'Cizalla Hidraulica CH-04', sector: 'MECANICA', estado: 'ACTIVO', descripcion: 'Corte de lamina para fabricacion de piezas', ubicacion: 'Taller de Corte - Estacion 4' },
];

async function main() {
  const created = [];
  for (const eq of equipos) {
    const row = await prisma.equipo.create({ data: eq });
    created.push({ id: row.id, nombre: row.nombre, sector: row.sector, estado: row.estado });
  }

  console.log('Equipos creados:', created.length);
  console.log(JSON.stringify(created, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
