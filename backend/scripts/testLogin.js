const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  // Get all users
  const users = await prisma.usuario.findMany()
  console.log('Total users:', users.length)
  
  if (users.length > 0) {
    console.log('\nUsers in database:')
    users.forEach((u) => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Rol: ${u.rol}, Activo: ${u.activo}`)
    })
  }

  // Test password comparison for admin user
  const admin = await prisma.usuario.findUnique({
    where: { email: 'AdminMaster@inventario.local' }
  })

  if (admin) {
    console.log('\nTesting admin credentials:')
    const passwordMatch = await bcrypt.compare('ADMIN2026', admin.password)
    console.log(`Password match: ${passwordMatch}`)
    console.log(`User active: ${admin.activo}`)
    console.log(`User role: ${admin.rol}`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
