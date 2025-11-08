# 📡 Documentación de Endpoints - API para n8n (Alfred)

Esta documentación contiene todos los endpoints disponibles para conectar tu agente de n8n llamado "Alfred" con la plataforma.

---

## 🔐 Autenticación

**IMPORTANTE**: Todas las peticiones requieren autenticación mediante API Key.

### Opción 1: Header `x-api-key`
```
x-api-key: tu-api-key-secreta-aqui
```

### Opción 2: Header `Authorization` Bearer
```
Authorization: Bearer tu-api-key-secreta-aqui
```

### Configuración
Agrega la variable `ALFRED_API_KEY` en tu archivo `.env`:
```env
ALFRED_API_KEY=tu-api-key-secreta-aqui
```

---

## 🌐 URL Base

- **Desarrollo:** `http://localhost:3000`
- **Producción:** `https://tu-dominio.vercel.app`

---

## 📋 Endpoint Principal: API de Alfred

**Este es el endpoint recomendado para n8n** ya que maneja todas las operaciones CRUD de forma unificada.

### Endpoint
```
POST /api/alfred
```

### Formato del Request
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

---

## 📚 Recursos Disponibles

### 1. **CLIENTS** (Clientes)

#### Crear Cliente
```json
POST /api/alfred
{
  "action": "create",
  "resource": "clients",
  "data": {
    "name": "Nombre del Cliente",              // REQUERIDO
    "description": "Descripción opcional",      // Opcional
    "icon": "emoji o icono",                   // Opcional
    "phase": "PLANIFICACIÓN",                  // Opcional (default: "PLANIFICACIÓN")
    "totalAmount": 10000.00,                   // REQUERIDO (número)
    "paidAmount": 0                            // Opcional (número, default: 0)
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Leer Cliente
```json
POST /api/alfred
{
  "action": "read",
  "resource": "clients",
  "id": "id-del-cliente",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Actualizar Cliente
```json
POST /api/alfred
{
  "action": "update",
  "resource": "clients",
  "id": "id-del-cliente",
  "data": {
    "name": "Nuevo nombre",                    // Opcional
    "description": "Nueva descripción",        // Opcional
    "icon": "nuevo-icono",                     // Opcional
    "phase": "DESARROLLO",                     // Opcional
    "totalAmount": 15000.00,                   // Opcional
    "paidAmount": 5000.00                      // Opcional
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Eliminar Cliente
```json
POST /api/alfred
{
  "action": "delete",
  "resource": "clients",
  "id": "id-del-cliente",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Listar Clientes
```json
POST /api/alfred
{
  "action": "list",
  "resource": "clients",
  "userId": "opcional" o "userEmail": "opcional"
}
```

---

### 2. **BOARDS** (Tableros)

#### Crear Tablero
```json
POST /api/alfred
{
  "action": "create",
  "resource": "boards",
  "data": {
    "title": "Nombre del Tablero",            // REQUERIDO
    "description": "Descripción opcional",    // Opcional
    "image": "url-de-imagen"                  // Opcional
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Leer Tablero
```json
POST /api/alfred
{
  "action": "read",
  "resource": "boards",
  "id": "id-del-tablero",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Actualizar Tablero
```json
POST /api/alfred
{
  "action": "update",
  "resource": "boards",
  "id": "id-del-tablero",
  "data": {
    "title": "Nuevo título",                  // Opcional
    "description": "Nueva descripción",      // Opcional
    "image": "nueva-url-imagen"               // Opcional
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Eliminar Tablero
```json
POST /api/alfred
{
  "action": "delete",
  "resource": "boards",
  "id": "id-del-tablero",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Listar Tableros
```json
POST /api/alfred
{
  "action": "list",
  "resource": "boards",
  "userId": "opcional" o "userEmail": "opcional"
}
```

---

### 3. **LISTS** (Listas)

#### Crear Lista
```json
POST /api/alfred
{
  "action": "create",
  "resource": "lists",
  "data": {
    "title": "Nombre de la Lista",           // REQUERIDO
    "boardId": "id-del-tablero",             // REQUERIDO
    "order": 0                                // Opcional (se calcula automáticamente si no se proporciona)
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Leer Lista
```json
POST /api/alfred
{
  "action": "read",
  "resource": "lists",
  "id": "id-de-la-lista",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Actualizar Lista
```json
POST /api/alfred
{
  "action": "update",
  "resource": "lists",
  "id": "id-de-la-lista",
  "data": {
    "title": "Nuevo título",                 // Opcional
    "order": 1,                               // Opcional
    "boardId": "nuevo-board-id"               // Opcional
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Eliminar Lista
```json
POST /api/alfred
{
  "action": "delete",
  "resource": "lists",
  "id": "id-de-la-lista",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Listar Listas
```json
POST /api/alfred
{
  "action": "list",
  "resource": "lists",
  "userId": "opcional" o "userEmail": "opcional"
}
```

---

### 4. **TASKS** (Tareas)

#### Crear Tarea
```json
POST /api/alfred
{
  "action": "create",
  "resource": "tasks",
  "data": {
    "title": "Nombre de la Tarea",           // REQUERIDO
    "description": "Descripción opcional",   // Opcional
    "image": "url-de-imagen",                // Opcional
    "listId": "id-de-la-lista",             // REQUERIDO
    "order": 0,                              // Opcional (se calcula automáticamente)
    "status": "pending",                     // Opcional (default: "pending")
    "assignedTo": "id-del-worker",          // Opcional
    "dueDate": "2024-12-31T23:59:59Z",      // Opcional (formato ISO 8601)
    "tagIds": ["id-tag-1", "id-tag-2"]      // Opcional (array de IDs de tags)
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Leer Tarea
```json
POST /api/alfred
{
  "action": "read",
  "resource": "tasks",
  "id": "id-de-la-tarea",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Actualizar Tarea
```json
POST /api/alfred
{
  "action": "update",
  "resource": "tasks",
  "id": "id-de-la-tarea",
  "data": {
    "title": "Nuevo título",                 // Opcional
    "description": "Nueva descripción",      // Opcional
    "image": "nueva-url-imagen",             // Opcional
    "status": "completed",                   // Opcional
    "listId": "nuevo-list-id",               // Opcional
    "order": 1,                              // Opcional
    "assignedTo": "nuevo-worker-id",         // Opcional
    "dueDate": "2024-12-31T23:59:59Z",      // Opcional (formato ISO 8601)
    "tagIds": ["id-tag-1", "id-tag-2"]      // Opcional (array de IDs de tags)
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Eliminar Tarea
```json
POST /api/alfred
{
  "action": "delete",
  "resource": "tasks",
  "id": "id-de-la-tarea",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Listar Tareas
```json
POST /api/alfred
{
  "action": "list",
  "resource": "tasks",
  "userId": "opcional" o "userEmail": "opcional"
}
```

---

### 5. **WORKERS** (Empleados/Trabajadores)

#### Crear Empleado
```json
POST /api/alfred
{
  "action": "create",
  "resource": "workers",
  "data": {
    "name": "Nombre del Empleado",           // REQUERIDO
    "type": "DESARROLLADOR",                 // REQUERIDO
    "responsibilities": "Descripción de responsabilidades", // REQUERIDO
    "status": "ACTIVE",                      // REQUERIDO
    "salary": 5000.00,                       // Opcional (default: 0)
    "paymentType": "FIXED",                  // Opcional (default: "FIXED") - "FIXED" o "PERCENTAGE"
    "percentage": 10.5,                      // Opcional (solo si paymentType es "PERCENTAGE")
    "startDate": "2024-01-01T00:00:00Z",    // Opcional (default: fecha actual)
    "paymentDate": "2024-01-05"              // Opcional
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Leer Empleado
```json
POST /api/alfred
{
  "action": "read",
  "resource": "workers",
  "id": "id-del-empleado",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Actualizar Empleado
```json
POST /api/alfred
{
  "action": "update",
  "resource": "workers",
  "id": "id-del-empleado",
  "data": {
    "name": "Nuevo nombre",                  // Opcional
    "type": "DISEÑADOR",                     // Opcional
    "responsibilities": "Nuevas responsabilidades", // Opcional
    "status": "INACTIVE",                    // Opcional
    "salary": 6000.00,                       // Opcional
    "paymentType": "PERCENTAGE",             // Opcional
    "percentage": 15.0,                      // Opcional
    "startDate": "2024-01-01T00:00:00Z",    // Opcional
    "paymentDate": "2024-01-10"             // Opcional
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Eliminar Empleado
```json
POST /api/alfred
{
  "action": "delete",
  "resource": "workers",
  "id": "id-del-empleado",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Listar Empleados
```json
POST /api/alfred
{
  "action": "list",
  "resource": "workers",
  "userId": "opcional" o "userEmail": "opcional"
}
```

---

### 6. **AI-SOLUTIONS** (Soluciones IA)

#### Crear Solución IA
```json
POST /api/alfred
{
  "action": "create",
  "resource": "ai-solutions",
  "data": {
    "name": "Nombre de la Solución",         // REQUERIDO
    "description": "Descripción opcional",  // Opcional
    "category": "CATEGORIA",                 // REQUERIDO
    "type": "INDIVIDUAL",                    // Opcional (default: "INDIVIDUAL") - "INDIVIDUAL" o "BUNDLE"
    "price": 99.99,                          // Opcional
    "features": "Características en texto",  // Opcional
    "icon": "emoji o icono",                  // Opcional
    "isActive": true                         // Opcional (default: true)
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Leer Solución IA
```json
POST /api/alfred
{
  "action": "read",
  "resource": "ai-solutions",
  "id": "id-de-la-solucion",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Actualizar Solución IA
```json
POST /api/alfred
{
  "action": "update",
  "resource": "ai-solutions",
  "id": "id-de-la-solucion",
  "data": {
    "name": "Nuevo nombre",                  // Opcional
    "description": "Nueva descripción",     // Opcional
    "category": "NUEVA_CATEGORIA",          // Opcional
    "type": "BUNDLE",                        // Opcional
    "price": 149.99,                         // Opcional
    "features": "Nuevas características",   // Opcional
    "icon": "nuevo-icono",                   // Opcional
    "isActive": false                        // Opcional
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Eliminar Solución IA
```json
POST /api/alfred
{
  "action": "delete",
  "resource": "ai-solutions",
  "id": "id-de-la-solucion",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Listar Soluciones IA
```json
POST /api/alfred
{
  "action": "list",
  "resource": "ai-solutions",
  "userId": "opcional" o "userEmail": "opcional"
}
```

---

### 7. **TAGS** (Etiquetas)

#### Crear Etiqueta
```json
POST /api/alfred
{
  "action": "create",
  "resource": "tags",
  "data": {
    "name": "Nombre de la Etiqueta",         // REQUERIDO
    "color": "#FF0000"                       // REQUERIDO (código hexadecimal de color)
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Leer Etiqueta
```json
POST /api/alfred
{
  "action": "read",
  "resource": "tags",
  "id": "id-de-la-etiqueta",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Actualizar Etiqueta
```json
POST /api/alfred
{
  "action": "update",
  "resource": "tags",
  "id": "id-de-la-etiqueta",
  "data": {
    "name": "Nuevo nombre",                  // Opcional
    "color": "#00FF00"                       // Opcional
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Eliminar Etiqueta
```json
POST /api/alfred
{
  "action": "delete",
  "resource": "tags",
  "id": "id-de-la-etiqueta",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Listar Etiquetas
```json
POST /api/alfred
{
  "action": "list",
  "resource": "tags",
  "userId": "opcional" o "userEmail": "opcional"
}
```

---

### 8. **TIMELINES** (Líneas de Tiempo de Clientes)

#### Crear Timeline
```json
POST /api/alfred
{
  "action": "create",
  "resource": "timelines",
  "data": {
    "title": "Título del Timeline",          // REQUERIDO
    "description": "Descripción opcional",  // Opcional
    "type": "UPDATE",                        // Opcional (default: "UPDATE") - "UPDATE" o "PAYMENT"
    "amount": 1000.00,                       // Opcional (requerido si type es "PAYMENT")
    "clientId": "id-del-cliente"            // REQUERIDO
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

**Nota**: Si `type` es `"PAYMENT"` y se proporciona `amount`, el sistema actualizará automáticamente el campo `paidAmount` del cliente.

#### Leer Timeline
```json
POST /api/alfred
{
  "action": "read",
  "resource": "timelines",
  "id": "id-del-timeline",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Actualizar Timeline
```json
POST /api/alfred
{
  "action": "update",
  "resource": "timelines",
  "id": "id-del-timeline",
  "data": {
    "title": "Nuevo título",                 // Opcional
    "description": "Nueva descripción",     // Opcional
    "type": "PAYMENT",                       // Opcional
    "amount": 1500.00                        // Opcional
  },
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Eliminar Timeline
```json
POST /api/alfred
{
  "action": "delete",
  "resource": "timelines",
  "id": "id-del-timeline",
  "userId": "opcional" o "userEmail": "opcional"
}
```

#### Listar Timelines
```json
POST /api/alfred
{
  "action": "list",
  "resource": "timelines",
  "userId": "opcional" o "userEmail": "opcional"
}
```

---

## 📝 Notas Importantes

### Alias de Recursos
Los siguientes recursos aceptan múltiples nombres (sinónimos):
- `clients` o `client`
- `boards` o `board`
- `tasks` o `task`
- `lists` o `list`
- `workers` o `worker`
- `ai-solutions`, `ai-solution`, `solution` o `solutions`
- `tags` o `tag`
- `timelines` o `timeline`

### Respuestas

#### Respuesta Exitosa
```json
{
  "success": true,
  "data": { ... }
}
```

#### Respuesta de Error
```json
{
  "error": "Mensaje de error descriptivo"
}
```

### Códigos de Estado HTTP

- `200` - Éxito
- `400` - Error de validación (campos faltantes o inválidos)
- `401` - No autorizado (API key inválida o faltante)
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

---

## 🔧 Ejemplo de Configuración en n8n

### Configuración del Nodo HTTP Request

1. **Method**: `POST`
2. **URL**: `https://tu-dominio.vercel.app/api/alfred`
3. **Authentication**: 
   - Type: `Header Auth`
   - Name: `x-api-key`
   - Value: `tu-api-key-secreta-aqui`
4. **Body**: 
   - Content Type: `JSON`
   - JSON Body:
   ```json
   {
     "action": "list",
     "resource": "clients"
   }
   ```

---

## 📋 Resumen de Acciones por Recurso

| Recurso | CREATE | READ | UPDATE | DELETE | LIST |
|---------|--------|------|--------|--------|------|
| clients | ✅ | ✅ | ✅ | ✅ | ✅ |
| boards | ✅ | ✅ | ✅ | ✅ | ✅ |
| lists | ✅ | ✅ | ✅ | ✅ | ✅ |
| tasks | ✅ | ✅ | ✅ | ✅ | ✅ |
| workers | ✅ | ✅ | ✅ | ✅ | ✅ |
| ai-solutions | ✅ | ✅ | ✅ | ✅ | ✅ |
| tags | ✅ | ✅ | ✅ | ✅ | ✅ |
| timelines | ✅ | ✅ | ✅ | ✅ | ✅ |

---

**¡Listo!** Ahora puedes conectar tu agente de n8n "Alfred" con todas las funciones de la plataforma usando el endpoint `/api/alfred` con autenticación por API Key.



