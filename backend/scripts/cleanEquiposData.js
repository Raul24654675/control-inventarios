const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const AULAS = ['201', '202', '203', '204', '301', '302', '303', '304']

function getRandomAula() {
  return AULAS[Math.floor(Math.random() * AULAS.length)]
}

function getRandomBloque() {
  const bloques = ['A', 'B']
  return bloques[Math.floor(Math.random() * bloques.length)]
}

async function main() {
  console.log('Iniciando limpieza de datos en BD...\n')

  const equipos = await prisma.equipo.findMany()
  console.log(`Total de equipos a actualizar: ${equipos.length}\n`)

  for (const eq of equipos) {
    // 1. Limpiar nombre: quitar " IND-0X" o " _IND-XX"
    let nuevoNombre = eq.nombre
    nuevoNombre = nuevoNombre.replace(/\s+IND-\d+$/i, '') // Quita " IND-01" al final
    nuevoNombre = nuevoNombre.trim()

    // 2. Generar nueva ubicación (Bloque + Aula)
    const aula = getRandomAula()
    const bloque = getRandomBloque()
    const nuevaUbicacion = `${aula}-${bloque}`

    console.log(`ID ${eq.id}:`)
    console.log(`  Nombre: "${eq.nombre}" → "${nuevoNombre}"`)
    console.log(`  Ubicación: "${eq.ubicacion}" → "${nuevaUbicacion}"`)

    // Actualizar en BD
    await prisma.equipo.update({
      where: { id: eq.id },
      data: {
        nombre: nuevoNombre,
        ubicacion: nuevaUbicacion
      }
    })
    console.log(`  ✓ Actualizado\n`)
  }

  console.log('✓ Limpieza completada exitosamente')
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
