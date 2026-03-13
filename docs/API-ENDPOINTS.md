# API Sapiens Boards – Endpoints

Todos los endpoints aceptan **sesión** (cookie) o **API Key** (header `x-api-key` o `Authorization: Bearer <key>`). No rompen el frontend actual.

## Estructura estándar

- `GET /api/{recurso}` — listar
- `GET /api/{recurso}/:id` — obtener uno
- `POST /api/{recurso}` — crear
- `PUT` o `PATCH /api/{recurso}/:id` — actualizar
- `DELETE /api/{recurso}/:id` — eliminar (donde aplique)

---

## Recursos

### Clients (clientes)
- `GET /api/clients` — listar clientes
- `GET /api/clients/:id` — un cliente
- `POST /api/clients` — crear cliente
- `PATCH /api/clients/:id` — actualizar
- `DELETE /api/clients/:id` — eliminar
- `POST /api/clients/:id/timelines` — crear entrada en timeline

### Workers
- `GET /api/workers` — listar workers
- `GET /api/workers/:id` — un worker
- `POST /api/workers` — crear
- `PATCH /api/workers/:id` — actualizar
- `DELETE /api/workers/:id` — eliminar
- `GET /api/workers/:id/payments` — listar pagos
- `POST /api/workers/:id/payments` — registrar pago

### Bitácoras
- `GET /api/bitacoras` — listar bitácoras
- `GET /api/bitacoras/:id` — una bitácora
- `POST /api/bitacoras` — crear
- `PATCH /api/bitacoras/:id` — actualizar
- `DELETE /api/bitacoras/:id` — eliminar
- `POST /api/bitacoras/:id/log-impact` — registrar impacto (mensaje libre)

### Stats (estadísticas)
- `GET /api/stats` — estadísticas agregadas (clientes, workers, bitácoras, gastos, roadmaps, tareas, soluciones). Respuesta: `{ success: true, data: { ... } }`

### Solutions (soluciones AI)
- `GET /api/ai-solutions` — listar (también `GET /api/solutions`)
- `GET /api/ai-solutions/:id` — una solución (también `GET /api/solutions/:id`)
- `POST /api/ai-solutions` — crear (también `POST /api/solutions`)
- `PATCH /api/ai-solutions/:id` — actualizar
- `DELETE /api/ai-solutions/:id` — eliminar
- `POST /api/ai-solutions/reorder` — reordenar

### Expenses (gastos de empresa)
- `GET /api/company-expenses` — listar (también `GET /api/expenses`)
- `GET /api/company-expenses/:id` — un gasto (también `GET /api/expenses/:id`)
- `POST /api/company-expenses` — crear
- `PATCH /api/company-expenses/:id` — actualizar
- `DELETE /api/company-expenses/:id` — eliminar

### Roadmaps (tableros / boards)
- `GET /api/boards` — listar (también `GET /api/roadmaps`)
- `GET /api/boards/:id` — un tablero (también `GET /api/roadmaps/:id`)
- `POST /api/boards` — crear
- `PATCH /api/boards/:id` — actualizar
- `DELETE /api/boards/:id` — eliminar
- `POST /api/boards/reorder` — reordenar (también `POST /api/roadmaps/reorder`)

### Tasks (tareas)
- `GET /api/tasks` — listar tareas (de todos los tableros del usuario)
- `GET /api/tasks/:id` — una tarea
- `POST /api/tasks` — crear (requiere `title`, `listId`)
- `PATCH /api/tasks/:id` — actualizar
- `DELETE /api/tasks/:id` — eliminar

### API Keys (solo admin)
- `GET /api/admin/api-keys` — listar keys (también `GET /api/api-keys`)
- `POST /api/admin/api-keys/create` — crear key (body: `{ name }`). La key solo se devuelve al crearla.
- `PATCH /api/admin/api-keys/:id` — desactivar/activar (body: `{ isActive }`)
- `DELETE /api/admin/api-keys/:id` — eliminar

---

## Integración Alfred (un solo endpoint)

- `POST /api/alfred` — acciones genéricas (create, read, update, delete, list) sobre recursos. Acepta la misma API Key del panel. Body: `{ action, resource, data?, id?, userId?, userEmail? }`.

---

## Respuestas

- Éxito: JSON con los datos (o `{ success: true, data: ... }` en `/api/stats`).
- Error: `{ error: "mensaje" }` con código HTTP 4xx/5xx.
- No se devuelve HTML en estos endpoints.
