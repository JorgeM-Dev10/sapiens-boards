import bcrypt from 'bcrypt'

async function generateHash() {
  const password = 'admin123'
  console.log('🔐 Generando hash para contraseña:', password)
  
  const hash = await bcrypt.hash(password, 10)
  console.log('\n✅ Hash generado:')
  console.log(hash)
  console.log('\n📝 SQL para crear/actualizar usuario:')
  console.log('\n-- Crear usuario:')
  console.log(`INSERT INTO "User" (id, name, email, password, "createdAt", "updatedAt")`)
  console.log(`VALUES (`)
  console.log(`    'admin-sapiens-2025',`)
  console.log(`    'Admin Sapiens',`)
  console.log(`    'admin@sapiens.com',`)
  console.log(`    '${hash}',`)
  console.log(`    NOW(),`)
  console.log(`    NOW()`)
  console.log(`)`)
  console.log(`ON CONFLICT (email) DO NOTHING;`)
  console.log('\n-- Actualizar contraseña:')
  console.log(`UPDATE "User"`)
  console.log(`SET password = '${hash}', "updatedAt" = NOW()`)
  console.log(`WHERE email = 'admin@sapiens.com';`)
}

generateHash().catch(console.error)






