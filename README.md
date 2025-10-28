# 🌟 Sapiens Labs - Sistema de Gestión Interna

Sistema completo de gestión interna para Sapiens Laboratories, desarrollado con Next.js 14, React, TypeScript, Prisma, y PostgreSQL.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)

---

## 📋 Índice

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Deployment](#-deployment)
- [Estructura](#-estructura)
- [Licencia](#-licencia)

---

## ✨ Características

### 👥 Gestión de Clientes
- Crear y administrar clientes
- Seguimiento de proyectos por fases
- Control de pagos (monto total vs. pagado)
- Timeline de avances y commits
- Estadísticas en tiempo real

### 🗺️ Roadmaps (Tableros Kanban)
- Sistema tipo Trello con drag & drop
- Tableros con imágenes de portada
- Listas y tareas personalizables
- Etiquetas con colores personalizados
- Fechas de inicio y vencimiento
- Asignación de tareas
- Edición completa de tareas

### 👷 Workers
- Gestión de empleados (humanos e IA)
- Tipos de pago: fijo, porcentaje, híbrido
- Seguimiento de salarios
- Estados: Founder, Early Employee, Employee, Contractor
- Fechas de ingreso y pago

### 🤖 Soluciones AI
- Catálogo de soluciones individuales
- Creación de paquetes (bundles)
- Categorías: Ventas, Project Management, Administrativa
- Gestión de precios y características
- Imágenes de productos

### 🔐 Autenticación
- NextAuth.js con estrategia JWT
- Hash de contraseñas con bcrypt
- Protección de rutas con middleware
- Sistema de sesiones seguro

---

## 🛠️ Tecnologías

### Frontend
- **Next.js 14** - App Router
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **TailwindCSS** - Styling
- **shadcn/ui** - Component Library
- **Lucide Icons** - Iconografía
- **@dnd-kit** - Drag & Drop

### Backend
- **Next.js API Routes** - API
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database (Supabase)
- **NextAuth.js** - Authentication
- **bcrypt** - Password Hashing

### DevOps
- **Vercel** - Hosting & Deployment
- **Git** - Version Control

---

## 🚀 Instalación

### Requisitos Previos
- Node.js 18+ instalado
- PostgreSQL database (Supabase recomendado)
- Cuenta de Vercel (para deployment)

### Paso 1: Clonar el Repositorio

```bash
git clone <tu-repositorio>
cd "TRELLO INTERNO"
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Variables de Entorno

Crea un archivo `.env` con:

```env
# Base de Datos - Supabase
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:password@host:5432/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-con: openssl rand -base64 32"

# Timezone
TZ="America/Mexico_City"
```

### Paso 4: Configurar Base de Datos

```bash
# Generar cliente Prisma
npx prisma generate

# Sincronizar schema con la base de datos
npx prisma db push
```

### Paso 5: Crear Usuario Admin

Ejecuta este SQL en Supabase:

```sql
INSERT INTO "User" (id, name, email, password, "createdAt", "updatedAt")
VALUES (
  'admin-sapiens-2025',
  'Super Admin',
  'admin@sapienslabs.com',
  -- Hash de 'admin123' - CAMBIAR EN PRODUCCIÓN
  '$2b$10$rXvY4qH3zH8GqQxH3XH3XOqH3XH3XH3XH3XH3XH3XH3XH3XH3XH3X',
  NOW(),
  NOW()
);
```

### Paso 6: Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deployment

Ver la **[Guía Completa de Deployment](./DEPLOYMENT_GUIDE.md)** para instrucciones detalladas.

### Resumen Rápido:

1. **Push a GitHub:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Importar en Vercel:**
   - Conectar repositorio
   - Configurar variables de entorno
   - Deploy automático

3. **Configurar Supabase:**
   - Ejecutar SQL para crear tablas
   - Crear usuario admin
   - Verificar conexiones

---

## 📁 Estructura del Proyecto

```
TRELLO INTERNO/
├── app/
│   ├── (dashboard)/          # Rutas protegidas
│   │   ├── clients/          # Gestión de clientes
│   │   ├── roadmaps/         # Tableros Kanban
│   │   ├── workers/          # Gestión de empleados
│   │   └── ai-solutions/     # Soluciones AI
│   ├── api/                  # API Routes
│   │   ├── boards/
│   │   ├── clients/
│   │   ├── workers/
│   │   ├── tasks/
│   │   └── tags/
│   ├── login/                # Página de login
│   └── layout.tsx
├── components/
│   ├── board/                # Componentes de Roadmaps
│   ├── layout/               # Header y Sidebar
│   ├── ui/                   # shadcn/ui components
│   └── providers/
├── lib/
│   ├── auth.ts               # Configuración NextAuth
│   ├── prisma.ts             # Cliente Prisma
│   └── utils.ts
├── prisma/
│   ├── schema.prisma         # Schema de base de datos
│   └── seed.ts
├── public/
│   └── background-video.mp4  # Video de fondo login
├── types/
│   └── index.ts
├── middleware.ts             # Protección de rutas
├── next.config.js
├── package.json
├── vercel.json
└── DEPLOYMENT_GUIDE.md
```

---

## 🎨 Características de UI/UX

- **Dark Theme:** Tema oscuro completo (negro y gris)
- **Hover Effects:** Efectos electric blue en hover
- **Drag & Drop:** Animaciones suaves para arrastrar tareas
- **Responsive:** Adaptable a todos los dispositivos
- **Glassmorphism:** Efectos de vidrio esmerilado
- **Video Background:** Fondo animado en login
- **Logo Sapiens:** Integrado con efectos de difuminado

---

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ Tokens JWT para sesiones
- ✅ Middleware de protección de rutas
- ✅ Validación de datos en API routes
- ✅ Variables de entorno para secrets
- ✅ HTTPS en producción (Vercel)

---

## 📊 Módulos

### 1. Clientes
- CRUD completo
- Fases: Planificación, Desarrollo, Pruebas, Despliegue, Completado
- Control de ingresos y pagos
- Timeline con commits

### 2. Roadmaps
- Tableros con imágenes
- Listas ordenables
- Tareas con drag & drop
- Etiquetas personalizables
- Fechas y asignaciones

### 3. Workers
- Humanos e IA
- Tipos de pago múltiples
- Estados de empleado
- Fechas de pago

### 4. AI Solutions
- Soluciones individuales
- Paquetes (bundles)
- Categorías
- Pricing

---

## 🐛 Solución de Problemas

### Prisma no genera
```bash
npx prisma generate
```

### Base de datos no sincroniza
```bash
npx prisma db push
```

### Video no carga
- Verificar que el archivo sea `background-video.mp4` (sin doble extensión)
- Verificar que esté en la carpeta `public/`

### Logo no aparece
- Verificar conexión a internet (usa Imgur)
- Verificar `next.config.js` tiene configurado Imgur

---

## 📝 Credenciales de Acceso

**Usuario por defecto:**
- Email: `admin@sapienslabs.com`
- Password: `admin123` (cambiar en producción)

⚠️ **IMPORTANTE:** Cambiar la contraseña del admin antes de deployment en producción.

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisar logs en Vercel
2. Verificar variables de entorno
3. Consultar `DEPLOYMENT_GUIDE.md`
4. Revisar consola del navegador (F12)

---

## 📜 Licencia

© 2025 Sapiens Laboratories. Todos los derechos reservados.

Este proyecto es propiedad de Sapiens Laboratories y está protegido por leyes de derechos de autor.

---

## 🎉 Características Futuras

- [ ] Notificaciones en tiempo real
- [ ] Dashboard de analytics
- [ ] Exportación de reportes
- [ ] Integración con terceros
- [ ] API pública
- [ ] Mobile app

---

**Desarrollado con ❤️ por Sapiens Laboratories**
