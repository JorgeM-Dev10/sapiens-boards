# API Sapiens Boards – Endpoints

Todos los endpoints aceptan **sesión** (cookie) o **API Key** (header `x-api-key` o `Authorization: Bearer <key>`). Las peticiones con API Key se registran en `api_logs`. No rompen el frontend actual.

## Query params (listados)

En los GET que devuelven listas se puede usar:

- `?limit=` — máximo de registros (default 100, máx 500)
- `?offset=` o `?page=` — paginación
- `?sort=` — campo para ordenar (ej: `createdAt`, `title`)
- `?order=` — `asc` o `desc`

Si se usan `limit` o `page`, la respuesta es: `{ success: true, data: [], total, page, limit, meta: { resource, count, total, time } }`. Si no se envían, se devuelve el array directo (comportamiento anterior).

Filtros por recurso (ejemplos):

- `GET /api/clients?name=...`
- `GET /api/tasks?boardId=...`
- `GET /api/expenses?month=YYYY-MM`

---

## Estructura estándar

- `GET /api/{recurso}` — listar
- `GET /api/{recurso}/:id` — obtener uno
- `POST /api/{recurso}` — crear
- `PUT` o `PATCH /api/{recurso}/:id` — actualizar
- `DELETE /api/{recurso}/:id` — eliminar (donde aplique)

---

## Recursos

### Clients (clientes)
- `GET /api/clients` — listar (filtro: `?name=`, paginación: `?limit=&page=`)
- `GET /api/clients/:id` — un cliente
- `GET /api/clients/:id/expenses` — gastos de la cuenta del cliente
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
- `GET /api/company-expenses` — listar (filtro: `?month=YYYY-MM`, paginación) (también `GET /api/expenses`)
- `GET /api/company-expenses/:id` — un gasto (también `GET /api/expenses/:id`)
- `POST /api/company-expenses` — crear
- `PATCH /api/company-expenses/:id` — actualizar
- `DELETE /api/company-expenses/:id` — eliminar

### Roadmaps (tableros / boards)
- `GET /api/boards` — listar (también `GET /api/roadmaps`)
- `GET /api/boards/:id` — un tablero (también `GET /api/roadmaps/:id`)
- `GET /api/boards/:id/tasks` — tareas del tablero (relación)
- `POST /api/boards` — crear
- `PATCH /api/boards/:id` — actualizar
- `DELETE /api/boards/:id` — eliminar
- `POST /api/boards/reorder` — reordenar (también `POST /api/roadmaps/reorder`)

### Tasks (tareas)
- `GET /api/tasks` — listar (filtro: `?boardId=`, paginación: `?limit=&page=&sort=&order=`)
- `GET /api/tasks/:id` — una tarea
- `POST /api/tasks` — crear (requiere `title`, `listId`)
- `PATCH /api/tasks/:id` — actualizar
- `DELETE /api/tasks/:id` — eliminar

### Health, reciente y actividad
- `GET /api/health` — comprobar que la API está activa. No requiere auth. `{ success: true, status: "ok", time }`.
- `GET /api/recent` — últimos 10 registros de clients, tasks, expenses, bitacoras, boards. `{ success: true, data: { clients, tasks, expenses, bitacoras, boards } }`.
- `GET /api/activity` — actividad reciente combinada (por createdAt). `{ success: true, data: [ { type, resource, id, createdAt, title? }, ... ] }`.

### Búsqueda y resumen
- `GET /api/search?q=...` — búsqueda global en clients, tasks, boards, solutions, bitacoras. Respuesta: `{ success: true, clients, tasks, boards, solutions, bitacoras, meta }`.
- `GET /api/summary` — resumen en una llamada (clientes, workers, gastos, ingresos, tareas, boards, bitácoras, solutions). `{ success: true, data: { ... }, meta }`.
- `GET /api/meta` — recursos, endpoints, actions y versión de API (para IA). `{ success: true, data: { version, resources, endpoints, actions, queryParams }, meta }`.

### API Keys (solo admin)
- `GET /api/admin/api-keys` — listar keys (también `GET /api/api-keys`)
- `POST /api/admin/api-keys/create` — crear key (body: `{ name }`). La key solo se devuelve al crearla.
- `PATCH /api/admin/api-keys/:id` — desactivar/activar (body: `{ isActive }`)
- `DELETE /api/admin/api-keys/:id` — eliminar

---

## Integración Alfred y batch

- `POST /api/alfred` — una acción sobre un recurso. Body: `{ action, resource, id?, data?, filters?, limit?, sort?, userId?, userEmail?, source? }`.

**Actions:** `create` | `read` | `update` | `delete` | `list` | `stats` | `summary` | `search`

**Resources:** `clients`, `workers`, `bitacoras`, `tasks`, `boards`, `roadmaps`, `expenses`, `solutions`, `stats`

- `list` acepta `limit` y `sort`. `stats` y `summary` devuelven resumen numérico. `search` usa `filters.q` o `q`.

- `POST /api/batch` — varias acciones en una request. Body: `{ actions: [ { action, resource, id?, data?, filters? }, ... ] }`. Máximo 20 acciones. Respuesta: `{ success: true, results: [ { success, data? } | { success: false, error }, ... ] }`.

---

## Logs de API

Cada petición con **API Key** se registra en `api_logs`: apiKey (prefix), endpoint, method, resource, action, statusCode (opcional), body (truncado si es grande), createdAt.

---

## Respuestas

- Éxito: JSON con los datos. Con paginación: `{ success: true, data, total, page, limit, meta }`. Sin paginación: array u objeto como antes.
- Nuevos endpoints (search, summary, meta, stats) incluyen `meta: { resource, count, time }`.
- Error: `{ error: "mensaje" }` con código HTTP 4xx/5xx.
- No se devuelve HTML en estos endpoints.
