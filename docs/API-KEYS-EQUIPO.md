# API Keys en Sapiens Boards – Guía para el equipo

## Qué hicimos

En Sapiens Boards añadimos un sistema de **API Keys** para que servicios externos (por ejemplo un agente de IA en WhatsApp u otra integración) puedan llamar al backend de forma segura, sin depender del login de un usuario en el navegador.

Así, el agente o cualquier cliente externo puede usar una clave generada desde el panel y enviarla en cada petición. El backend acepta esa clave como **alternativa al login**: si hay sesión de usuario se usa la sesión; si no hay sesión pero viene una API Key válida, se usa esa y la petición se permite.

---

## Cómo funciona por detrás

1. **Dónde se guardan las keys**  
   En la base de datos hay una tabla `api_keys`. Cada fila tiene un nombre, un **hash** de la clave (nunca la clave en texto claro), si está activa o no, y a qué usuario pertenece. La clave solo se muestra **una vez** cuando se crea; después solo se ve un prefijo tipo `sk_sapiens_abc12345…` en el listado.

2. **Cómo se valida una petición**  
   En las rutas que están protegidas, el backend hace lo siguiente:
   - Primero comprueba si hay **sesión** (usuario logueado en la web). Si la hay, usa ese usuario y sigue.
   - Si no hay sesión, mira el header **`x-api-key`** (o `Authorization: Bearer <key>`).
   - Con ese valor busca en la tabla `api_keys` (por hash).  
     - Si la key **no existe** → responde **401**.  
     - Si existe pero está **desactivada** (`isActive = false`) → responde **403**.  
     - Si existe y está **activa** → permite la petición y usa el usuario dueño de esa key para filtrar datos (clientes, workers, bitácoras, etc.), igual que si hubiera hecho login.

3. **Qué endpoints aceptan API Key**  
   La API Key funciona como alternativa al login en:
   - `/api/clients` (y sus subrutas)
   - `/api/workers` (y sus subrutas)
   - `/api/bitacoras` (y sus subrutas)
   - `/api/boards` (roadmaps; y sus subrutas)
   - `/api/ai-solutions` (solutions; y sus subrutas)
   - `/api/company-expenses` (expenses; y sus subrutas)

   El login normal sigue funcionando igual; no se ha roto la autenticación actual.

---

## Cómo usar las API Keys (quien crea la key)

1. Entrar a Sapiens Boards con un usuario que tenga permiso (admin o el que corresponda según vuestra configuración).
2. En el menú lateral, ir a **API Keys**.
3. Pulsar **Crear API Key**, poner un nombre (por ejemplo “Agente WhatsApp”) y crear.
4. **Copiar la key en ese momento**: solo se muestra una vez. Si no la guardáis, habría que crear otra nueva.
5. Opcionalmente podéis **Desactivar** una key (deja de funcionar pero no se borra) o **Eliminar** (se borra de la base de datos).

---

## Cómo llamar a la API con una key (quien integra el agente o servicio)

En cada petición HTTP al backend hay que enviar la API Key en uno de estos dos sitios:

- **Header recomendado:**  
  `x-api-key: sk_sapiens_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

- **Alternativa:**  
  `Authorization: Bearer sk_sapiens_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

El resto de la petición es igual que si el usuario estuviera logueado: mismos endpoints, mismos cuerpos y respuestas. La key identifica al “usuario” dueño de esa key y el backend filtra los datos (clientes, workers, etc.) por ese usuario.

Si la key no se envía, está mal o está desactivada, el backend responderá 401 o 403 según el caso.

---

## Seguridad (resumen para el equipo)

- Las keys **no se guardan en claro** en la base de datos; solo un hash. No se pueden “leer” desde la DB.
- En el panel **nunca** se muestra la key completa después de crearla; solo un prefijo para reconocerla.
- Cada key está asociada a un usuario; las peticiones con esa key solo ven los datos de ese usuario.
- Si una key se compromete o deja de usarse, se puede **Desactivar** o **Eliminar** desde el panel.

Conviene tratar las API Keys como secretos: no subirlas a repositorios, no pegarlas en canales públicos ni en capturas. Quien las use (por ejemplo el equipo del agente de WhatsApp) debe guardarlas en variables de entorno o en un gestor de secretos.

---

## Resumen en una frase

**Generamos API Keys desde el panel de Sapiens Boards, las entregamos al equipo o servicio que integra (p. ej. el agente de IA), y ellos en cada petición envían la key en el header `x-api-key`; el backend la acepta como alternativa al login y no rompe la autenticación actual.**
