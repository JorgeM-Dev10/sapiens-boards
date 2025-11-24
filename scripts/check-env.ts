// Script simple para verificar variables de entorno
// Nota: Next.js carga .env automáticamente, pero este script ayuda a verificar

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
]

console.log('🔍 Verificando variables de entorno...\n')
console.log('⚠️  Nota: Este script verifica process.env. Asegúrate de tener un archivo .env en la raíz del proyecto.\n')

let allPresent = true

requiredEnvVars.forEach((varName) => {
  const value = process.env[varName]
  if (value) {
    // Ocultar valores sensibles
    let displayValue = '***'
    if (varName === 'DATABASE_URL') {
      displayValue = value.substring(0, 30) + '...'
    } else if (varName === 'NEXTAUTH_URL') {
      displayValue = value
    }
    console.log(`✅ ${varName}: ${displayValue}`)
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADA`)
    allPresent = false
  }
})

console.log('\n' + '='.repeat(50))

if (allPresent) {
  console.log('✅ Todas las variables de entorno están configuradas')
  console.log('\n💡 Si aún tienes problemas de login:')
  console.log('   1. Verifica que el servidor esté corriendo: npm run dev')
  console.log('   2. Revisa la consola del navegador (F12) para errores')
  console.log('   3. Verifica los logs del servidor en la terminal')
} else {
  console.log('❌ Faltan variables de entorno requeridas')
  console.log('\n💡 Crea un archivo .env en la raíz del proyecto con:')
  console.log('DATABASE_URL="postgresql://user:password@host:5432/database"')
  console.log('NEXTAUTH_URL="http://localhost:3000"')
  console.log('NEXTAUTH_SECRET="genera-con: openssl rand -base64 32"')
  console.log('\n📝 Ejemplo de .env:')
  console.log('DATABASE_URL="postgresql://..."')
  console.log('DIRECT_URL="postgresql://..."')
  console.log('NEXTAUTH_URL="http://localhost:3000"')
  console.log('NEXTAUTH_SECRET="tu-secreto-aqui"')
  console.log('TZ="America/Mexico_City"')
  process.exit(1)
}

