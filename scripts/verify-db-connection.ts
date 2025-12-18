import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyConnection() {
  console.log('🔍 Verificando conexión a la base de datos...\n')

  try {
    // 1. Verificar conexión básica
    console.log('1️⃣ Probando conexión...')
    await prisma.$connect()
    console.log('✅ Conexión exitosa\n')

    // 2. Verificar que la tabla User existe
    console.log('2️⃣ Verificando tabla User...')
    const userCount = await prisma.user.count()
    console.log(`✅ Tabla User existe. Total de usuarios: ${userCount}\n`)

    // 3. Buscar usuario admin
    console.log('3️⃣ Buscando usuario admin@sapiens.com...')
    const adminUser = await prisma.user.findUnique({
      where: {
        email: 'admin@sapiens.com',
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        createdAt: true,
      },
    })

    if (!adminUser) {
      console.error('❌ Usuario admin@sapiens.com NO encontrado')
      console.log('\n💡 Ejecuta: npm run create-admin')
      return
    }

    console.log('✅ Usuario encontrado:')
    console.log(`   - ID: ${adminUser.id}`)
    console.log(`   - Nombre: ${adminUser.name}`)
    console.log(`   - Email: ${adminUser.email}`)
    console.log(`   - Tiene contraseña: ${adminUser.password ? '✅ SÍ' : '❌ NO'}`)
    
    if (adminUser.password) {
      const hashLength = adminUser.password.length
      const hashPrefix = adminUser.password.substring(0, 7)
      console.log(`   - Longitud del hash: ${hashLength} caracteres`)
      console.log(`   - Prefijo del hash: ${hashPrefix}`)
      
      if (hashPrefix.startsWith('$2a$') || hashPrefix.startsWith('$2b$') || hashPrefix.startsWith('$2y$')) {
        console.log('   - Formato: ✅ BCrypt válido')
      } else {
        console.log('   - Formato: ❌ No parece ser BCrypt')
      }
    }
    console.log(`   - Creado: ${adminUser.createdAt}\n`)

    // 4. Verificar variables de entorno
    console.log('4️⃣ Verificando variables de entorno...')
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configurado' : '❌ NO CONFIGURADO'}`)
    console.log(`   DIRECT_URL: ${process.env.DIRECT_URL ? '✅ Configurado' : '⚠️  No configurado (opcional)'}`)
    console.log(`   NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ Configurado' : '❌ NO CONFIGURADO'}`)
    console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '⚠️  No configurado'}`)
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`)

    // 5. Probar una query simple
    console.log('5️⃣ Probando query simple...')
    const allUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
      },
    })
    console.log(`✅ Query exitosa. Encontrados ${allUsers.length} usuario(s):`)
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name})`)
    })

    console.log('\n✅ Verificación completada exitosamente')
  } catch (error) {
    console.error('\n❌ Error en la verificación:')
    console.error(error)
    
    if (error instanceof Error) {
      if (error.message.includes('P1001')) {
        console.error('\n💡 El servidor de base de datos no puede ser alcanzado.')
        console.error('   Verifica tu DATABASE_URL en las variables de entorno.')
      } else if (error.message.includes('P1000')) {
        console.error('\n💡 Error de autenticación con la base de datos.')
        console.error('   Verifica las credenciales en DATABASE_URL.')
      } else if (error.message.includes('P1017')) {
        console.error('\n💡 La conexión a la base de datos fue cerrada.')
        console.error('   Verifica DIRECT_URL para migraciones.')
      }
    }
  } finally {
    await prisma.$disconnect()
  }
}

verifyConnection()











