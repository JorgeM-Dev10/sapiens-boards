# Script para sincronizar la base de datos con Prisma
Write-Host "🔄 Sincronizando base de datos..." -ForegroundColor Cyan

# Generar cliente de Prisma
Write-Host "`n📦 Generando cliente de Prisma..." -ForegroundColor Yellow
npx prisma generate

# Aplicar cambios a la base de datos
Write-Host "`n🗄️ Aplicando cambios a la base de datos..." -ForegroundColor Yellow
npx prisma db push

Write-Host "`n✅ ¡Base de datos sincronizada!" -ForegroundColor Green
Write-Host "Ahora puedes agregar clientes y abrir proyectos." -ForegroundColor Green

