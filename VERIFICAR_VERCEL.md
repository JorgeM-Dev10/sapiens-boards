# 🔍 Verificación de Variables de Entorno en Vercel

## ⚠️ PROBLEMA COMÚN: Login no funciona en producción

Si la base de datos está correcta (como confirmaste), el problema está en las **variables de entorno en Vercel**.

---

## ✅ Checklist de Variables en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y verifica:

### 1. **NEXTAUTH_SECRET** (CRÍTICO)
```
✅ Debe estar configurado
✅ Debe ser un string aleatorio de al menos 32 caracteres
✅ Genera uno nuevo si no lo tienes: openssl rand -base64 32
```

**Ejemplo:**
```
NEXTAUTH_SECRET=tu-secreto-aqui-de-al-menos-32-caracteres
```

### 2. **NEXTAUTH_URL** (CRÍTICO)
```
✅ Debe estar configurado
✅ Debe ser la URL completa de tu deployment
✅ Debe empezar con https://
✅ NO debe terminar con /
```

**Ejemplo correcto:**
```
NEXTAUTH_URL=https://sapiens-boards.vercel.app
```

**Ejemplos incorrectos:**
```
❌ NEXTAUTH_URL=sapiens-boards.vercel.app (falta https://)
❌ NEXTAUTH_URL=https://sapiens-boards.vercel.app/ (tiene / al final)
❌ NEXTAUTH_URL=http://localhost:3000 (solo para desarrollo)
```

### 3. **DATABASE_URL** (CRÍTICO)
```
✅ Debe estar configurado
✅ Debe ser la URL de conexión de Supabase
✅ Debe incluir ?pgbouncer=true&connection_limit=1
```

**Ejemplo:**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true&connection_limit=1
```

### 4. **DIRECT_URL** (Recomendado para Supabase)
```
✅ Recomendado para migraciones de Prisma
✅ Debe ser la URL directa (sin pgbouncer)
```

**Ejemplo:**
```
DIRECT_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

### 5. **TZ** (Opcional pero recomendado)
```
TZ=America/Mexico_City
```

---

## 🔧 Cómo Configurar en Vercel

### Paso 1: Ir a Variables de Entorno
1. Ve a tu proyecto en Vercel
2. Click en **Settings**
3. Click en **Environment Variables** (en el menú lateral)

### Paso 2: Agregar/Verificar Variables

Para cada variable:
1. **Name:** El nombre de la variable (ej: `NEXTAUTH_SECRET`)
2. **Value:** El valor de la variable
3. **Environment:** Selecciona:
   - ✅ **Production** (para producción)
   - ✅ **Preview** (para previews)
   - ✅ **Development** (opcional, para desarrollo local)

### Paso 3: Reiniciar Deployment

**IMPORTANTE:** Después de agregar/modificar variables:
1. Ve a **Deployments**
2. Click en los **3 puntos** del deployment más reciente
3. Click en **Redeploy**
4. O haz un nuevo commit y push (Vercel redeployará automáticamente)

---

## 🧪 Cómo Verificar que Están Configuradas

### Opción 1: Desde Vercel Dashboard
1. Ve a Settings → Environment Variables
2. Verifica que todas las variables estén listadas
3. Verifica que estén habilitadas para **Production**

### Opción 2: Desde los Logs
1. Ve a Deployments → Click en el deployment más reciente
2. Click en **Function Logs**
3. Busca mensajes que empiecen con `⚠️ ADVERTENCIA`
4. Si ves advertencias sobre `NEXTAUTH_SECRET` o `NEXTAUTH_URL`, no están configuradas

### Opción 3: Agregar Logging Temporal

Puedo agregar un endpoint temporal que muestre las variables (sin mostrar valores sensibles) para debugging.

---

## 🐛 Problemas Comunes

### ❌ "Configuration" error al hacer login
**Causa:** `NEXTAUTH_SECRET` no está configurado o es inválido
**Solución:** 
1. Genera un nuevo secreto: `openssl rand -base64 32`
2. Agrégalo en Vercel como `NEXTAUTH_SECRET`
3. Redeploy

### ❌ Redirect loop o no redirige después del login
**Causa:** `NEXTAUTH_URL` está mal configurado
**Solución:**
1. Verifica que sea `https://sapiens-boards.vercel.app` (sin `/` al final)
2. Verifica que esté habilitado para Production
3. Redeploy

### ❌ "Database connection failed"
**Causa:** `DATABASE_URL` incorrecto o Supabase no accesible
**Solución:**
1. Verifica la URL en Supabase Dashboard → Settings → Database
2. Copia la Connection String
3. Agrega `?pgbouncer=true&connection_limit=1` al final
4. Actualiza en Vercel

---

## 📝 Resumen de Variables Requeridas

```env
# CRÍTICAS (sin estas, el login NO funcionará)
NEXTAUTH_SECRET=tu-secreto-generado
NEXTAUTH_URL=https://sapiens-boards.vercel.app
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=1

# RECOMENDADAS
DIRECT_URL=postgresql://...
TZ=America/Mexico_City
```

---

## ✅ Después de Configurar

1. ✅ Verifica todas las variables en Vercel
2. ✅ Haz un redeploy (o nuevo commit)
3. ✅ Espera a que el deployment termine
4. ✅ Prueba el login con:
   - Email: `admin@sapiens.com`
   - Password: `admin123`
5. ✅ Revisa los logs si sigue fallando

---

## 🔍 Debugging Avanzado

Si después de verificar todo sigue sin funcionar:

1. **Revisa los Function Logs en Vercel:**
   - Deployments → Deployment más reciente → Function Logs
   - Busca errores que empiecen con `[AUTH]` o `❌`

2. **Revisa la consola del navegador:**
   - F12 → Console
   - Intenta hacer login
   - Busca errores de red o JavaScript

3. **Verifica que el endpoint de auth esté accesible:**
   - Intenta acceder a: `https://sapiens-boards.vercel.app/api/auth/signin`
   - Debería mostrar la página de login de NextAuth

---

¿Necesitas ayuda con algún paso específico?











