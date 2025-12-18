import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando usuario admin...')

  // Verificar si existe el usuario
  const existingUser = await prisma.user.findUnique({
    where: {
      email: 'admin@sapiens.com',
    },
  })

  if (existingUser) {
    console.log('✅ Usuario admin ya existe:', existingUser.email)
    console.log('📧 Email: admin@sapiens.com')
    console.log('🔑 Password: admin123')
    return
  }

  // Crear usuario admin si no existe
  console.log('📝 Creando usuario admin...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Sapiens',
      email: 'admin@sapiens.com',
      password: hashedPassword,
      image: null,
    },
  })

  console.log('✅ Usuario admin creado exitosamente!')
  console.log('📧 Email: admin@sapiens.com')
  console.log('🔑 Password: admin123')
  console.log('🆔 ID:', adminUser.id)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })











