# 🤖 API de Alfred - Integración con n8n

Esta documentación explica cómo usar la API de Alfred para conectar tu sistema interno con n8n y WhatsApp.

## 📋 Configuración Inicial

### 1. Variables de Entorno

Agrega la siguiente variable en tu archivo `.env`:

```env
ALFRED_API_KEY=tu-api-key-secreta-aqui
```

**Generar una API Key segura:**
```bash
openssl rand -base64 32
```

### 2. Base URL

La URL base de la API es:
- **Desarrollo:** `http://localhost:3000`
- **Producción:** `https://tu-dominio.vercel.app`

## 🔐 Autenticación

Todas las peticiones requieren autenticación mediante API Key. Puedes enviarla de dos formas:

### Opción 1: Header `x-api-key`
```
x-api-key: tu-api-key-secreta-aqui
```

### Opción 2: Header `Authorization` Bearer
```
Authorization: Bearer tu-api-key-secreta-aqui
```

## 📡 Formato de Request

Todas las peticiones son **POST** al endpoint `/api/alfred` con el siguiente formato:

```json
{
  "action": "create|read|update|delete|list",
  "resource": "clients|boards|tasks|lists|workers|ai-solutions|tags|timelines",
  "data": { ... },
  "id": "id-del-recurso",
  "userId": "opcional-id-usuario",
  "userEmail": "opcional-email-usuario"
}
```

### Parámetros

- **action** (requerido): La acción a realizar
  - `create`: Crear un nuevo recurso
  - `read`: Leer un recurso específico
  - `update`: Actualizar un recurso existente
  - `delete`: Eliminar un recurso
  - `list`: Listar todos los recursos

- **resource** (requerido): El tipo de recurso
  - `clients` o `client`
  - `boards` o `board`
  - `tasks` o `task`
  - `lists` o `list`
  - `workers` o `worker`
  - `ai-solutions` o `solution` o `solutions`
  - `tags` o `tag`
  - `timelines` o `timeline`

- **data** (requerido para create/update): Los datos del recurso
- **id** (requerido para read/update/delete): El ID del recurso
- **userId** (opcional): ID del usuario. Si no se proporciona, se usa el primero disponible
- **userEmail** (opcional): Email del usuario. Alternativa a userId

## 📚 Ejemplos de Uso

### 1. Crear un Cliente

```json
{
  "action": "create",
  "resource": "clients",
  "data": {
    "name": "Nuevo Cliente",
    "description": "Descripción del cliente",
    "phase": "PLANIFICACIÓN",
    "totalAmount": 50000,
    "paidAmount": 0
  }
}
```

**Fases válidas:** `PLANIFICACIÓN`, `DESARROLLO`, `PRUEBAS`, `DESPLIEGUE`, `COMPLETADO`

### 2. Crear un Tablero (Board)

```json
{
  "action": "create",
  "resource": "boards",
  "data": {
    "title": "Nuevo Proyecto",
    "description": "Descripción del tablero",
    "image": "https://ejemplo.com/imagen.jpg"
  }
}
```

### 3. Crear una Lista

```json
{
  "action": "create",
  "resource": "lists",
  "data": {
    "title": "En Progreso",
    "boardId": "id-del-tablero",
    "order": 1
  }
}
```

### 4. Crear una Tarea

```json
{
  "action": "create",
  "resource": "tasks",
  "data": {
    "title": "Nueva Tarea",
    "description": "Descripción de la tarea",
    "listId": "id-de-la-lista",
    "status": "pending",
    "dueDate": "2025-12-31T23:59:59Z",
    "tagIds": ["id-tag-1", "id-tag-2"]
  }
}
```

**Estados válidos:** `pending`, `in-progress`, `completed`

### 5. Crear un Worker (Empleado)

```json
{
  "action": "create",
  "resource": "workers",
  "data": {
    "name": "Juan Pérez",
    "type": "HUMAN",
    "responsibilities": "Desarrollador Frontend",
    "status": "EMPLOYEE",
    "salary": 50000,
    "paymentType": "FIXED",
    "startDate": "2025-01-01T00:00:00Z",
    "paymentDate": 1
  }
}
```

**Tipos:** `HUMAN` o `AI`  
**Estados:** `FOUNDER`, `EARLY_EMPLOYEE`, `EMPLOYEE`, `CONTRACTOR`  
**Tipos de pago:** `FIXED`, `PERCENTAGE`, `HYBRID`

### 6. Crear una Solución AI

```json
{
  "action": "create",
  "resource": "ai-solutions",
  "data": {
    "name": "Asistente Virtual",
    "description": "Descripción de la solución",
    "category": "VENTAS",
    "type": "INDIVIDUAL",
    "price": 999.99,
    "features": "{\"feature1\": \"valor1\"}",
    "isActive": true
  }
}
```

**Categorías:** `VENTAS`, `PROJECT_MANAGEMENT`, `ADMINISTRATIVA`, `OTRA`  
**Tipos:** `INDIVIDUAL` o `BUNDLE`

### 7. Crear una Etiqueta

```json
{
  "action": "create",
  "resource": "tags",
  "data": {
    "name": "Urgente",
    "color": "#FF0000"
  }
}
```

### 8. Leer un Recurso

```json
{
  "action": "read",
  "resource": "clients",
  "id": "id-del-cliente"
}
```

### 9. Actualizar un Recurso

```json
{
  "action": "update",
  "resource": "clients",
  "id": "id-del-cliente",
  "data": {
    "phase": "DESARROLLO",
    "paidAmount": 10000
  }
}
```

### 10. Eliminar un Recurso

```json
{
  "action": "delete",
  "resource": "clients",
  "id": "id-del-cliente"
}
```

### 11. Listar Recursos

```json
{
  "action": "list",
  "resource": "clients"
}
```

### 12. Crear Timeline Entry

```json
{
  "action": "create",
  "resource": "timelines",
  "data": {
    "title": "Pago recibido",
    "description": "Pago parcial del proyecto",
    "type": "PAYMENT",
    "amount": 10000,
    "clientId": "id-del-cliente"
  }
}
```

**Tipos:** `UPDATE`, `PAYMENT`, `MILESTONE`

## 🔧 Configuración en n8n

### Paso 1: Crear un Workflow en n8n

1. Abre n8n y crea un nuevo workflow
2. Agrega un nodo **HTTP Request**

### Paso 2: Configurar el Nodo HTTP Request

**Configuración básica:**
- **Method:** `POST`
- **URL:** `https://tu-dominio.vercel.app/api/alfred` (o `http://localhost:3000/api/alfred` en desarrollo)
- **Authentication:** `Generic Credential Type`
- **Credential Name:** `Alfred API Key`
- **Send Headers:** Sí
- **Header Name:** `x-api-key`
- **Header Value:** `{{ $env.ALFRED_API_KEY }}`

**O usar Authorization Bearer:**
- **Authentication:** `Generic Credential Type`
- **Header Name:** `Authorization`
- **Header Value:** `Bearer {{ $env.ALFRED_API_KEY }}`

**Body:**
- **Body Content Type:** `JSON`
- **JSON Body:** Configura según el ejemplo que necesites

### Paso 3: Ejemplo de Body JSON en n8n

```json
{
  "action": "{{ $json.action }}",
  "resource": "{{ $json.resource }}",
  "data": {{ $json.data }},
  "id": "{{ $json.id }}"
}
```

O directamente con valores:

```json
{
  "action": "create",
  "resource": "clients",
  "data": {
    "name": "Cliente desde WhatsApp",
    "totalAmount": 10000
  }
}
```

## 📱 Integración con WhatsApp (Alfred)

### Ejemplo: Crear Cliente desde WhatsApp

En n8n, configura un workflow que:
1. Reciba el mensaje de WhatsApp
2. Extraiga los datos (usando expresiones o nodos de procesamiento)
3. Llame a la API de Alfred
4. Responda al usuario

**Ejemplo de Body dinámico desde WhatsApp:**

```json
{
  "action": "create",
  "resource": "clients",
  "data": {
    "name": "{{ $json.message.text }}",
    "totalAmount": {{ $json.amount || 0 }}
  }
}
```

## 🎯 Casos de Uso Comunes

### 1. "Crear cliente [nombre] con monto [cantidad]"

```json
{
  "action": "create",
  "resource": "clients",
  "data": {
    "name": "{{ $json.nombre }}",
    "totalAmount": {{ $json.cantidad }}
  }
}
```

### 2. "Agregar tarea [título] a [tablero]"

Primero necesitas obtener el ID del tablero y la lista, luego:

```json
{
  "action": "create",
  "resource": "tasks",
  "data": {
    "title": "{{ $json.titulo }}",
    "listId": "{{ $json.listaId }}"
  }
}
```

### 3. "Actualizar fase de [cliente] a [fase]"

```json
{
  "action": "update",
  "resource": "clients",
  "id": "{{ $json.clienteId }}",
  "data": {
    "phase": "{{ $json.fase }}"
  }
}
```

### 4. "Listar todos los clientes"

```json
{
  "action": "list",
  "resource": "clients"
}
```

## ⚠️ Errores Comunes

### Error 401: API key inválida
- Verifica que `ALFRED_API_KEY` esté configurada en `.env`
- Verifica que el header `x-api-key` o `Authorization` sea correcto

### Error 400: Campos requeridos faltantes
- Revisa que todos los campos requeridos estén presentes en `data`
- Verifica que `action` y `resource` estén correctos

### Error 404: Recurso no encontrado
- Verifica que el `id` sea correcto
- Asegúrate de que el recurso pertenezca al usuario correcto

## 🔒 Seguridad

- **NUNCA** expongas tu API key en código público
- Usa variables de entorno en n8n
- En producción, considera agregar rate limiting
- Considera usar HTTPS en producción

## 📞 Soporte

Para problemas o preguntas sobre la API de Alfred, revisa:
1. Los logs del servidor
2. La consola de n8n
3. Las respuestas de error de la API

---

**Desarrollado para Sapiens Laboratories** 🤖

