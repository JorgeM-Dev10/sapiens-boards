import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Limpiar datos existentes
  await prisma.taskTag.deleteMany()
  await prisma.task.deleteMany()
  await prisma.list.deleteMany()
  await prisma.boardMember.deleteMany()
  await prisma.board.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.user.deleteMany()

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Sapiens',
      email: 'admin@sapiens.com',
      password: hashedPassword,
      image: null,
    },
  })

  console.log('✅ Usuario admin creado:', adminUser.email)

  // Crear etiquetas
  const tags = await Promise.all([
    prisma.tag.create({
      data: { name: 'Urgente', color: '#EF4444' },
    }),
    prisma.tag.create({
      data: { name: 'Diseño', color: '#8B5CF6' },
    }),
    prisma.tag.create({
      data: { name: 'Desarrollo', color: '#3B82F6' },
    }),
    prisma.tag.create({
      data: { name: 'QA', color: '#10B981' },
    }),
  ])

  console.log('✅ Etiquetas creadas:', tags.length)

  // Crear tablero de ejemplo
  const board = await prisma.board.create({
    data: {
      title: 'Proyecto Sapiens Boards',
      description: 'Desarrollo del sistema de gestión de proyectos',
      image: null,
      ownerId: adminUser.id,
    },
  })

  console.log('✅ Tablero creado:', board.title)

  // Crear listas
  const todoList = await prisma.list.create({
    data: {
      title: 'Por hacer',
      order: 0,
      boardId: board.id,
    },
  })

  const inProgressList = await prisma.list.create({
    data: {
      title: 'En progreso',
      order: 1,
      boardId: board.id,
    },
  })

  const doneList = await prisma.list.create({
    data: {
      title: 'Hecho',
      order: 2,
      boardId: board.id,
    },
  })

  console.log('✅ Listas creadas: 3')

  // Crear tareas en "Por hacer"
  const task1 = await prisma.task.create({
    data: {
      title: 'Implementar autenticación',
      description: 'Configurar NextAuth con credenciales y proveedores OAuth',
      order: 0,
      status: 'pending',
      listId: todoList.id,
      assignedTo: adminUser.id,
    },
  })

  await prisma.taskTag.create({
    data: {
      taskId: task1.id,
      tagId: tags[2].id, // Desarrollo
    },
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Diseñar componentes UI',
      description: 'Crear sistema de diseño con Tailwind y shadcn/ui',
      order: 1,
      status: 'pending',
      listId: todoList.id,
    },
  })

  await prisma.taskTag.create({
    data: {
      taskId: task2.id,
      tagId: tags[1].id, // Diseño
    },
  })

  // Crear tareas en "En progreso"
  const task3 = await prisma.task.create({
    data: {
      title: 'Implementar drag & drop',
      description: 'Usar @dnd-kit para permitir reorganizar tareas entre listas',
      order: 0,
      status: 'in_progress',
      listId: inProgressList.id,
      assignedTo: adminUser.id,
    },
  })

  await prisma.taskTag.createMany({
    data: [
      { taskId: task3.id, tagId: tags[0].id }, // Urgente
      { taskId: task3.id, tagId: tags[2].id }, // Desarrollo
    ],
  })

  const task4 = await prisma.task.create({
    data: {
      title: 'Configurar base de datos',
      description: 'Setup de PostgreSQL con Prisma ORM',
      order: 1,
      status: 'in_progress',
      listId: inProgressList.id,
    },
  })

  await prisma.taskTag.create({
    data: {
      taskId: task4.id,
      tagId: tags[2].id, // Desarrollo
    },
  })

  // Crear tareas en "Hecho"
  const task5 = await prisma.task.create({
    data: {
      title: 'Configurar proyecto Next.js',
      description: 'Inicializar proyecto con TypeScript y configuraciones base',
      order: 0,
      status: 'completed',
      listId: doneList.id,
      assignedTo: adminUser.id,
    },
  })

  await prisma.taskTag.create({
    data: {
      taskId: task5.id,
      tagId: tags[2].id, // Desarrollo
    },
  })

  const task6 = await prisma.task.create({
    data: {
      title: 'Setup de repositorio Git',
      description: 'Configurar GitHub repository y CI/CD',
      order: 1,
      status: 'completed',
      listId: doneList.id,
    },
  })

  console.log('✅ Tareas creadas: 6')

  console.log('\n🎉 Seed completado exitosamente!\n')
  console.log('📧 Email: admin@sapiens.com')
  console.log('🔑 Password: admin123\n')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



