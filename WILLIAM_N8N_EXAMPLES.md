# 🔧 Ejemplo de Integración n8n - Alfred API

Este documento contiene ejemplos prácticos de workflows en n8n para usar la API de Alfred.

## 📋 Workflow 1: Crear Cliente desde WhatsApp

### Estructura del Workflow:
```
WhatsApp Trigger → Function (Procesar mensaje) → HTTP Request → WhatsApp Response
```

### 1. WhatsApp Trigger Node
- Configura tu conexión de WhatsApp
- Recibe mensajes del usuario

### 2. Function Node (Procesar mensaje)

```javascript
// Extraer información del mensaje
const message = $input.item.json.message.text;
const parts = message.split(' ');

// Detectar comando: "crear cliente [nombre] [monto]"
if (parts[0] === 'crear' && parts[1] === 'cliente') {
  const name = parts.slice(2, -1).join(' '); // Todo excepto el último
  const amount = parseFloat(parts[parts.length - 1]);
  
  return {
    action: 'create',
    resource: 'clients',
    data: {
      name: name,
      totalAmount: amount || 0,
      phase: 'PLANIFICACIÓN'
    }
  };
}

// Si no es un comando válido, devolver error
return {
  error: 'Comando no reconocido. Usa: crear cliente [nombre] [monto]'
};
```

### 3. HTTP Request Node

**Configuración:**
- **Method:** `POST`
- **URL:** `https://tu-dominio.vercel.app/api/alfred`
- **Headers:**
  - `x-api-key`: `{{ $env.ALFRED_API_KEY }}`
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "action": "{{ $json.action }}",
  "resource": "{{ $json.resource }}",
  "data": {{ JSON.stringify($json.data) }}
}
```

### 4. WhatsApp Response Node
- Envía confirmación al usuario basada en la respuesta de la API

---

## 📋 Workflow 2: Listar Clientes

### Function Node:
```javascript
// Comando: "listar clientes"
const message = $input.item.json.message.text;

if (message.toLowerCase().includes('listar clientes')) {
  return {
    action: 'list',
    resource: 'clients'
  };
}

return { error: 'Comando no reconocido' };
```

### HTTP Request Node:
Misma configuración que el ejemplo anterior.

### Function Node (Formatear respuesta):
```javascript
const clients = $input.item.json.data.data;

if (clients.length === 0) {
  return {
    message: 'No hay clientes registrados.'
  };
}

let response = '📋 Clientes:\n\n';
clients.forEach((client, index) => {
  response += `${index + 1}. ${client.name}\n`;
  response += `   Fase: ${client.phase}\n`;
  response += `   Monto: $${client.totalAmount}\n`;
  response += `   Pagado: $${client.paidAmount}\n\n`;
});

return { message: response };
```

---

## 📋 Workflow 3: Crear Tarea en Tablero

### Function Node:
```javascript
// Comando: "crear tarea [título] en [tablero]"
const message = $input.item.json.message.text;
const match = message.match(/crear tarea (.+?) en (.+)/i);

if (match) {
  const taskTitle = match[1];
  const boardName = match[2];
  
  return {
    action: 'create',
    resource: 'tasks',
    data: {
      title: taskTitle,
      listId: '{{ $json.listId }}', // Necesitas obtener esto primero
      status: 'pending'
    },
    boardName: boardName
  };
}

return { error: 'Formato: crear tarea [título] en [tablero]' };
```

### HTTP Request Node 1 (Obtener tablero):
```json
{
  "action": "list",
  "resource": "boards"
}
```

### Function Node (Buscar lista):
```javascript
const boards = $input.item.json.data.data;
const boardName = $json.boardName.toLowerCase();

const board = boards.find(b => 
  b.title.toLowerCase().includes(boardName)
);

if (!board || !board.lists || board.lists.length === 0) {
  return { error: 'Tablero no encontrado o sin listas' };
}

// Usar la primera lista o buscar una específica
return {
  listId: board.lists[0].id,
  taskTitle: $json.taskTitle
};
```

### HTTP Request Node 2 (Crear tarea):
```json
{
  "action": "create",
  "resource": "tasks",
  "data": {
    "title": "{{ $json.taskTitle }}",
    "listId": "{{ $json.listId }}",
    "status": "pending"
  }
}
```

---

## 📋 Workflow 4: Actualizar Fase de Cliente

### Function Node:
```javascript
// Comando: "actualizar [cliente] a fase [fase]"
const message = $input.item.json.message.text;
const match = message.match(/actualizar (.+?) a fase (.+)/i);

if (match) {
  const clientName = match[1];
  const phase = match[2].toUpperCase();
  
  const validPhases = ['PLANIFICACIÓN', 'DESARROLLO', 'PRUEBAS', 'DESPLIEGUE', 'COMPLETADO'];
  
  if (!validPhases.includes(phase)) {
    return { error: `Fase inválida. Usa: ${validPhases.join(', ')}` };
  }
  
  return {
    action: 'update',
    resource: 'clients',
    clientName: clientName,
    phase: phase
  };
}

return { error: 'Formato: actualizar [cliente] a fase [fase]' };
```

### HTTP Request Node 1 (Buscar cliente):
```json
{
  "action": "list",
  "resource": "clients"
}
```

### Function Node (Encontrar cliente):
```javascript
const clients = $input.item.json.data.data;
const clientName = $json.clientName.toLowerCase();

const client = clients.find(c => 
  c.name.toLowerCase().includes(clientName)
);

if (!client) {
  return { error: 'Cliente no encontrado' };
}

return {
  action: 'update',
  resource: 'clients',
  id: client.id,
  data: {
    phase: $json.phase
  }
};
```

### HTTP Request Node 2 (Actualizar):
```json
{
  "action": "{{ $json.action }}",
  "resource": "{{ $json.resource }}",
  "id": "{{ $json.id }}",
  "data": {{ JSON.stringify($json.data) }}
}
```

---

## 📋 Workflow 5: Eliminar Recurso

### Function Node:
```javascript
// Comando: "eliminar [recurso] [nombre/id]"
const message = $input.item.json.message.text;
const match = message.match(/eliminar (\w+) (.+)/i);

if (match) {
  const resource = match[1].toLowerCase();
  const identifier = match[2];
  
  const validResources = ['cliente', 'client', 'tablero', 'board', 'tarea', 'task'];
  
  if (!validResources.includes(resource)) {
    return { error: 'Recurso no válido' };
  }
  
  // Mapear nombres a recursos
  const resourceMap = {
    'cliente': 'clients',
    'client': 'clients',
    'tablero': 'boards',
    'board': 'boards',
    'tarea': 'tasks',
    'task': 'tasks'
  };
  
  return {
    action: 'delete',
    resource: resourceMap[resource],
    identifier: identifier
  };
}

return { error: 'Formato: eliminar [recurso] [nombre/id]' };
```

### HTTP Request Node 1 (Buscar recurso):
Dependiendo del recurso, primero necesitas listarlo y encontrar el ID.

### HTTP Request Node 2 (Eliminar):
```json
{
  "action": "delete",
  "resource": "{{ $json.resource }}",
  "id": "{{ $json.id }}"
}
```

---

## 🔧 Configuración de Variables de Entorno en n8n

1. Ve a **Settings** → **Credentials**
2. Crea una nueva credencial tipo **Generic Credential Type**
3. Nombre: `Alfred API Key`
4. Agrega el campo `apiKey` con tu valor de `ALFRED_API_KEY`

O usa variables de entorno:
1. Ve a **Settings** → **Environment Variables**
2. Agrega `ALFRED_API_KEY` con tu valor

Luego usa en los nodos: `{{ $env.ALFRED_API_KEY }}`

---

## 🎯 Comandos Sugeridos para WhatsApp

Aquí tienes una lista de comandos que puedes implementar:

### Clientes
- `crear cliente [nombre] [monto]` - Crear nuevo cliente
- `listar clientes` - Ver todos los clientes
- `cliente [nombre]` - Ver detalles de un cliente
- `actualizar [cliente] a fase [fase]` - Cambiar fase
- `pago [cliente] [monto]` - Registrar pago

### Tareas
- `crear tarea [título] en [tablero]` - Crear tarea
- `listar tareas` - Ver todas las tareas
- `tarea [id]` - Ver detalles de tarea
- `completar tarea [id]` - Marcar como completada

### Tableros
- `crear tablero [nombre]` - Crear nuevo tablero
- `listar tableros` - Ver todos los tableros

### Workers
- `crear worker [nombre] [tipo]` - Crear empleado
- `listar workers` - Ver todos los empleados

---

## ⚠️ Notas Importantes

1. **Manejo de Errores:** Siempre agrega nodos de manejo de errores después de cada HTTP Request
2. **Validación:** Valida los datos antes de enviarlos a la API
3. **Seguridad:** Nunca expongas tu API key en los logs de n8n
4. **Rate Limiting:** Considera agregar delays entre requests si haces múltiples llamadas

---

**¡Listo para usar!** 🚀

