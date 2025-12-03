import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function testAuth() {
  console.log('🧪 Probando autenticación...\n')

  const testEmail = 'admin@sapiens.com'
  const testPassword = 'admin123'

  try {
    // 1. Verificar que el usuario existe
    console.log('1️⃣ Buscando usuario...')
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    })

    if (!user) {
      console.error('❌ Usuario no encontrado')
      return
    }

    console.log('✅ Usuario encontrado:', user.email)
    console.log('   - ID:', user.id)
    console.log('   - Nombre:', user.name)
    console.log('   - Tiene contraseña:', !!user.password)

    if (!user.password) {
      console.error('❌ Usuario no tiene contraseña')
      return
    }

    // 2. Verificar contraseña
    console.log('\n2️⃣ Verificando contraseña...')
    const isValid = await bcrypt.compare(testPassword, user.password)

    if (isValid) {
      console.log('✅ Contraseña válida')
    } else {
      console.error('❌ Contraseña inválida')
      console.log('   Hash almacenado:', user.password.substring(0, 20) + '...')
    }

    // 3. Verificar variables de entorno
    console.log('\n3️⃣ Verificando variables de entorno...')
    console.log('   NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Configurado' : '❌ NO CONFIGURADO')
    console.log('   NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ NO CONFIGURADO')
    console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ NO CONFIGURADO')

    console.log('\n✅ Prueba completada')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()








