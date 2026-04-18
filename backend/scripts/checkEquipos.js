const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const equipos = await prisma.equipo.findMany({
    select: {
      id: true,
      nombre: true,
      ubicacion: true
    },
    take: 10
  })

  console.log('Equipos en BD:')
  equipos.forEach((eq) => {
    console.log(`ID: ${eq.id}, Nombre: "${eq.nombre}", Ubicación: "${eq.ubicacion}"`)
  })

  await prisma.$disconnect()
}

main().catch(console.error)
