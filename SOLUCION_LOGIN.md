# 🔐 Solución de Problemas de Login

## 📋 Verificación Rápida

### 1. Verificar Base de Datos (SQL)

Ejecuta el archivo `verify_user.sql` en Supabase SQL Editor para verificar:
- ✅ Si el usuario existe
- ✅ Si tiene contraseña
- ✅ Si el formato del hash es correcto

### 2. Verificar Conexión (Script)

Ejecuta localmente:
```bash
npm run verify-db
```

Este script verifica:
- ✅ Conexión a la base de datos
- ✅ Existencia del usuario admin
- ✅ Variables de entorno
- ✅ Formato del hash de contraseña

### 3. Crear/Actualizar Usuario Admin

#### Opción A: Usando SQL (en Supabase)

Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Crear o actualizar usuario admin
INSERT INTO "User" (id, name, email, password, "createdAt", "updatedAt")
VALUES (
    'admin-sapiens-2025',
    'Admin Sapiens',
    'admin@sapiens.com',
    '$2b$10$m0ue4ciZq3AfUHYkk2B6IOIQX2x.KYEtf6xVI.Opfrst6LIUISEd6',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
    password = '$2b$10$m0ue4ciZq3AfUHYkk2B6IOIQX2x.KYEtf6xVI.Opfrst6LIUISEd6',
    "updatedAt" = NOW();
```

#### Opción B: Usando Script (localmente)

```bash
npm run create-admin
```

### 4. Verificar Variables de Entorno en Vercel

Asegúrate de tener estas variables configuradas en Vercel:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="tu-secreto-aqui"
NEXTAUTH_URL="https://sapiens-boards.vercel.app"
```

**⚠️ IMPORTANTE:**
- `NEXTAUTH_URL` debe ser la URL de tu deployment en Vercel
- `NEXTAUTH_SECRET` debe ser un string aleatorio (genera con: `openssl rand -base64 32`)

### 5. Credenciales de Acceso

- **Email:** `admin@sapiens.com`
- **Password:** `admin123`

---

## 🐛 Problemas Comunes

### Error: "Usuario no encontrado"
**Solución:** Ejecuta el SQL de creación de usuario en Supabase

### Error: "Contraseña incorrecta"
**Solución:** 
1. Verifica que el hash en la BD sea correcto
2. Ejecuta el SQL de actualización de contraseña

### Error: "Configuration" o "NEXTAUTH_SECRET"
**Solución:** 
1. Verifica que `NEXTAUTH_SECRET` esté configurado en Vercel
2. Genera uno nuevo si es necesario: `openssl rand -base64 32`
3. Reinicia el deployment

### Error de conexión a base de datos
**Solución:**
1. Verifica `DATABASE_URL` en Vercel
2. Asegúrate de usar la URL con `pgbouncer` para `DATABASE_URL`
3. Usa la URL directa para `DIRECT_URL`

---

## 📝 Scripts Disponibles

```bash
# Verificar conexión y usuario
npm run verify-db

# Crear/verificar usuario admin
npm run create-admin

# Probar autenticación
npm run test-auth

# Generar nuevo hash de contraseña
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/generate-password-hash.ts
```

---

## 🔍 Debugging

### Logs en Vercel
1. Ve a tu proyecto en Vercel
2. Click en "Deployments"
3. Click en el deployment más reciente
4. Revisa los "Function Logs" para ver errores de autenticación

### Logs en el Navegador
1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Intenta hacer login
4. Revisa los logs que empiezan con `🔐`, `📋`, `❌`, etc.

### Logs del Servidor (local)
Si estás corriendo localmente, los logs aparecerán en la terminal con prefijo `[AUTH]`

---

## ✅ Checklist de Verificación

- [ ] Usuario existe en la base de datos
- [ ] Usuario tiene contraseña hasheada
- [ ] Hash tiene formato BCrypt correcto ($2b$...)
- [ ] `NEXTAUTH_SECRET` está configurado en Vercel
- [ ] `NEXTAUTH_URL` apunta a la URL correcta de Vercel
- [ ] `DATABASE_URL` está configurado correctamente
- [ ] Deployment en Vercel está actualizado
- [ ] No hay errores en los logs de Vercel











