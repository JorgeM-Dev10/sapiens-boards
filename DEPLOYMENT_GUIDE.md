# 🚀 Guía de Deployment en Vercel - Sapiens Labs

## 📋 Pre-requisitos

### 1. Variables de Entorno Requeridas

Crea estas variables en tu proyecto de Vercel:

```bash
# Base de Datos - Supabase PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:password@host:5432/database"

# NextAuth.js Configuration
NEXTAUTH_URL="https://tu-dominio.vercel.app"
NEXTAUTH_SECRET="genera-un-secreto-con: openssl rand -base64 32"

# Timezone Configuration
TZ="America/Mexico_City"
```

---

## 🗄️ Configuración de Base de Datos (Supabase)

### Paso 1: Crear las Tablas

Ejecuta el siguiente SQL en Supabase SQL Editor:

```sql
-- Crear todas las tablas necesarias
-- (El SQL completo está en tu base de datos actual)
```

### Paso 2: Crear el Super Admin

```sql
-- Usuario: admin@sapienslabs.com
-- Contraseña: admin123 (CAMBIAR EN PRODUCCIÓN)

INSERT INTO "User" (id, name, email, password, "createdAt", "updatedAt")
VALUES (
  'admin-sapiens-2025',
  'Super Admin',
  'admin@sapienslabs.com',
  '$2b$10$rXvY4qH3zH8GqQxH3XH3XOqH3XH3XH3XH3XH3XH3XH3XH3XH3XH3X',
  NOW(),
  NOW()
);
```

**🔴 IMPORTANTE:** Genera una nueva contraseña hasheada con:
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('TU_CONTRASEÑA_SEGURA', 10);
console.log(hash);
```

---

## 📦 Archivos Necesarios

### ✅ Ya están listos:
- `package.json` - Con script `postinstall: prisma generate`
- `vercel.json` - Configuración de build
- `prisma/schema.prisma` - Schema completo
- `next.config.js` - Configuración de Next.js
- `middleware.ts` - Protección de rutas

### ⚠️ Archivos Multimedia:

**VIDEO DE LOGIN:**
- Ubicación: `public/background-video.mp4`
- ⚠️ NOTA: Actualmente tiene doble extensión (`.mp4.mp4`)
- Renombrar a: `background-video.mp4`

**LOGO:**
- Usando Imgur: `https://i.imgur.com/stB5YvK.png`
- ✅ Ya configurado en `next.config.js`

---

## 🔧 Pasos de Deployment en Vercel

### 1. Conectar Repositorio
```bash
# En tu proyecto local
git init
git add .
git commit -m "Initial commit - Sapiens Labs"
git branch -M main
git remote add origin <tu-repo-github>
git push -u origin main
```

### 2. Importar en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Click en "Import Project"
3. Selecciona tu repositorio de GitHub
4. Vercel detectará automáticamente Next.js

### 3. Configurar Variables de Entorno
En Vercel Dashboard → Settings → Environment Variables:
- Agrega todas las variables del paso 1
- ✅ Asegúrate de marcar "Production", "Preview" y "Development"

### 4. Deploy
- Click en "Deploy"
- Vercel ejecutará:
  ```
  npm install
  prisma generate
  next build
  ```

---

## ✅ Checklist Post-Deployment

### Verificar Funcionalidad:
- [ ] Login funciona con `admin@sapienslabs.com`
- [ ] Sidebar carga correctamente
- [ ] Logo aparece (no "imagen no encontrada")
- [ ] Video de fondo se reproduce en login
- [ ] **Clientes:**
  - [ ] Crear nuevo cliente
  - [ ] Ver detalles de cliente
  - [ ] Agregar timeline/commits
  - [ ] Editar montos
- [ ] **Roadmaps:**
  - [ ] Crear tablero
  - [ ] Agregar listas
  - [ ] Agregar tareas con popup completo
  - [ ] Drag & drop funciona
  - [ ] Editar tareas
  - [ ] Crear/eliminar etiquetas
  - [ ] Imagen de tablero se muestra
- [ ] **Workers:**
  - [ ] Crear worker (humano/AI)
  - [ ] Editar información
  - [ ] Eliminar worker
- [ ] **AI Solutions:**
  - [ ] Crear solución individual
  - [ ] Crear paquete
  - [ ] Asignar soluciones a paquetes
  - [ ] Editar/eliminar soluciones
- [ ] Cerrar sesión redirige a login
- [ ] Rutas protegidas funcionan (sin sesión → /login)

---

## 🐛 Solución de Problemas Comunes

### Error: "Prisma Client did not initialize"
**Solución:**
```bash
# En Vercel, asegúrate que el buildCommand incluya:
prisma generate && next build
```

### Error: "Cannot find module '@prisma/client'"
**Solución:**
- Verificar que `postinstall: prisma generate` esté en `package.json`

### Video no carga
**Solución:**
- Renombrar `public/background-video.mp4.mp4` → `public/background-video.mp4`
- Verificar que el archivo no supere 50MB
- Considerar usar un CDN externo si es muy pesado

### Logo no aparece
**Solución:**
- Verificar que `next.config.js` incluya:
  ```javascript
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.imgur.com' }
    ]
  }
  ```

### Database connection failed
**Solución:**
- Verificar que `DATABASE_URL` y `DIRECT_URL` estén correctos
- En Supabase: Settings → Database → Connection String
- Usar la URL con `pgbouncer` para `DATABASE_URL`
- Usar la URL directa para `DIRECT_URL`

### NextAuth errors
**Solución:**
- Verificar `NEXTAUTH_SECRET` está configurado
- Verificar `NEXTAUTH_URL` apunta a tu dominio de Vercel
- Formato: `https://tu-proyecto.vercel.app`

---

## 🔒 Seguridad Post-Deployment

### IMPORTANTE - Cambiar Antes de Producción:

1. **Contraseña del Admin:**
   - NO usar `admin123`
   - Generar contraseña fuerte
   - Actualizar en base de datos con hash bcrypt

2. **NEXTAUTH_SECRET:**
   - Generar uno único: `openssl rand -base64 32`
   - NO reutilizar entre proyectos

3. **Database Credentials:**
   - Verificar que Supabase tenga Row Level Security (RLS) si es necesario
   - Revisar permisos de acceso

---

## 📊 Monitoreo

### Logs en Vercel:
- Deployment → View Function Logs
- Revisar errores de API routes
- Verificar tiempos de respuesta

### Base de Datos:
- Supabase Dashboard → Database → Logs
- Monitorear queries lentas
- Verificar conexiones activas

---

## 🎉 ¡Listo!

Tu aplicación estará disponible en:
```
https://tu-proyecto.vercel.app
```

### Credenciales de Acceso:
- **Email:** admin@sapienslabs.com
- **Password:** [La que configuraste]

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs en Vercel
2. Verifica las variables de entorno
3. Confirma que la base de datos esté accesible
4. Revisa la consola del navegador (F12)

---

**© 2025 Sapiens Laboratories. Todos los derechos reservados.**

