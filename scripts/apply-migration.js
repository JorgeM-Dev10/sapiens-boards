const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Aplicando migración: agregando campos difficulty y hours a Task...');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Task" 
      ADD COLUMN IF NOT EXISTS "difficulty" TEXT,
      ADD COLUMN IF NOT EXISTS "hours" DOUBLE PRECISION;
    `);
    
    console.log('✅ Migración aplicada exitosamente!');
    console.log('Los campos difficulty y hours han sido agregados a la tabla Task.');
  } catch (error) {
    console.error('❌ Error al aplicar la migración:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();



