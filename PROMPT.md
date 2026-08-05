# PROMPT.md — Replicar Planazo

Este archivo es un **prompt listo para copiar y pegar** en un agente de IA de
programación (Claude, opencode, etc.) para construir la versión propia de
Planazo desde cero. Está pensado para la **primera etapa**: una app que
funcione **solo local**, con SQLite en un archivo, sin deploy, sin base externa
y sin verificación de mail.

---

## Prompt

```
Sos un desarrollador full-stack. Vas a construir desde cero, en un proyecto
nuevo, una app web completa llamada "Planazo", que funciona 100% local con una
base de datos SQLite en un archivo. Es un proyecto de clase, así que la app
tiene que abrir sin internet (fuentes del sistema, nada descargado) y sin pedir
ninguna cuenta ni contraseña.

Trabajá por etapas y al final de cada una mostrame qué quedó andando.

========================================================================
## EL PRODUCTO
========================================================================

Planazo es "el ranking de planes de tu grupo de amigos". La idea:

- Un grupo de amigos arma un grupo. Cualquiera puede entrar si conoce el
  nombre del grupo y su usuario.
- Cada integrante arma "planes" que ya pasaron (ej: "Asado en la terraza").
- El resto del grupo vota cada plan del 1 al 10, una sola vez por persona.
- Con esos votos se arma un **podio de armadores**: el promedio de puntaje
  de los planes que armó cada persona, ordenado de mayor a menor.
- Bonus (opcional, segunda etapa): un botón que sugiere el próximo plan
  usando IA, mirando qué tipo de plan puntuó bien el grupo.

Toda la UI y los textos van en español rioplatense, informal, tirando a
divertido. Nada corporativo.

========================================================================
## TECNOLOGÍAS Y ENTORNO
========================================================================

- Node.js 24 o superior. La app usa el módulo `node:sqlite` que viene
  DENTRO de Node (no hace falta instalar ninguna librería de base de datos).
- Next.js con App Router + React + TypeScript + Tailwind CSS (v4).
- **Toda** la escritura en la base se hace con Server Actions (funciones que
  corren en el servidor y se llaman directo desde los formularios). Nada de
  fetch a mano.
- SQLite en un archivo `data/planazo.db`. Las tablas se crean solas al
  arrancar (migración en el primer arranque) y no hace falta instalar nada.
- No hay contraseñas, ni mails, ni verificación, ni servicios externos.
  La "sesión" es una cookie httpOnly que guarda el id del usuario.
- Tipografías del sistema a propósito (la app abre sin internet).
- Si el template de Next.js avisa que su versión tiene breaking changes,
  leé la documentación que trae dentro de `node_modules/next/dist/docs/`
  antes de escribir código nuevo.

========================================================================
## QUÉ TIENE QUE SABER HACER (ETAPA LOCAL)
========================================================================

### 1. Pantalla de entrada (/login)
- "Armar un grupo": nombre del grupo + tu usuario. Crea el grupo y te deja
  adentro. Es el único "registro" que existe.
- "Entrar a un grupo": nombre del grupo + tu usuario. Solo funciona si esa
  persona ya fue agregada al grupo por alguien de adentro.
- Errores claros en la misma pantalla (grupo no existe, usuario no está
  anotado, ya existe un grupo con ese nombre, campos vacíos).

### 2. Sesión
- Al entrar o armar un grupo se guarda una cookie httpOnly (un año).
- Una ruta `/` actúa de puerta: sin sesión redirige a `/login`; con sesión,
  redirige a la vista del grupo del usuario.
- Un botón "Salir" borra la cookie y vuelve a `/login`.

### 3. Vista del grupo (/g/<id>)
- La URL del grupo usa un **id corto ofuscado** (aleatorio), NUNCA el nombre.
  Así el nombre del grupo no aparece en la barra de dirección.
- Se muestra el nombre del grupo, quién sos y cuánta gente hay.
- Podio de armadores: ranking en vivo. Se calcula a cada visita, no se
  guarda en ninguna tabla.
- Lista de planes ya cargados, con su promedio.
- Invitar a alguien: elegís el usuario de la persona y ya queda adentro.
  Se listan los que ya están en el grupo.

### 4. Cargar un plan (/g/<id>/nuevo)
- Título del plan, quién lo armó (select con los miembros del grupo) y cuándo
  fue (fecha).

### 5. Detalle de un plan (/g/<id>/p/<planId>)
- El promedio del plan y cuántos votos tiene.
- Si todavía no votaste: botones del 1 al 10 para votar (un voto por persona,
  no se puede cambiar).
- Si ya votaste: mostrá tu voto.
- Lista de quién votó y con qué puntaje.

### 6. Datos de ejemplo (seed)
- Si la base está vacía, sembrala en el primer arranque con un grupo de
  ejemplo, 6 personas y 5 o 6 planes ya votados, para que el podio se vea
  con números apenas abre la app.
- Documentá en un README cómo se borra la base para volver a sembrar.

========================================================================
## ARQUITECTURA SUGERIDA
========================================================================

- Un solo módulo de base de datos genérico (`lib/db.ts`) que expone `all()`
  y `run()` y crea el esquema (4 tablas: grupos, miembros, planes, votos).
  Todo el SQL de la app vive en `lib/data.ts` (consultas y escrituras).
- Un módulo de sesión (`lib/session.ts`) que lee y escribe la cookie.
- Un archivo de Server Actions (`app/actions.ts`) que concentra TODO lo que
  escribe en la base, con validaciones del lado del servidor: el que manda
  un formulario tiene que ser miembro del grupo al que apunta, y los ids de
  grupo se validan contra la base (no confiar en lo que viene del HTML).
- Cada pantalla es una página del App Router. Un solo componente cliente
  como mucho (el que muestra "pensando…" de la IA).

========================================================================
## DISEÑO (importante, es un proyecto de clase y se mira)
========================================================================

- Estética indie "candy arcade retro": fondo crema, bordes negros gordos,
  sombras duras (estilo neo-brutalismo), colores de feria bien saturados
  (rojo coral, turquesa, verde menta, amarillo, rosa, violeta).
- Un **logo** dibujado en SVG suelto dentro del código (un cohete retro
  dentro de un sello solar con rayos), que se reutiliza en cabeceras y como
  favicon. Nada de imágenes descargadas.
- Cards sólidas sobre un fondo con puntitos (el patrón de fondo nunca se ve
  a través de las cards: tiene que quedar detrás de todo).
- Respetar accesibilidad: labels en todos los inputs, estados de foco
  visibles, `aria-live` donde hay carga asíncrona, y `prefers-reduced-motion`
  desactivando las animaciones.

========================================================================
## CRITERIOS DE ACEPTACIÓN (al final, verificá cada uno)
========================================================================

- [ ] `npm install && npm run dev` y la app abre en localhost sin configurar
      nada y sin internet (además del primer build).
- [ ] Crear un grupo me deja adentro y me manda a su vista.
- [ ] Entrar con un grupo que existe y un usuario agregado funciona; con un
      usuario no agregado, da un error claro.
- [ ] La URL del grupo es `/g/<id>` con un id ilegible, nunca el nombre.
- [ ] Sin sesión, `/` me manda a `/login`.
- [ ] Puedo cargar un plan, votarlo del 1 al 10 una sola vez, y ver mi voto.
- [ ] El podio ordena por promedio y se actualiza solo al votar.
- [ ] Puedo invitar a alguien y esa persona entra después con su usuario.
- [ ] "Salir" me vuelve a `/login` y no me deja ver el grupo.
- [ ] La base es SQLite en `data/planazo.db` (no hay ningún otro sistema de
      base de datos involucrado).
- [ ] El seed puebla la app apenas abre, y borrar la carpeta `data/` la
      vuelve a sembrar.
- [ ] Todos los textos están en español rioplatense y la app se ve cuidada
      (diseño candy arcade, logo propio, sin emojis).

========================================================================
## FUERA DE ALCANCE (NO hacer en esta etapa)
========================================================================

- Nada de deploy, hosting, Docker, Vercel, CI ni variables de entorno de
  producción.
- Nada de base externa (Postgres, Neon, Supabase). SOLO SQLite local.
- Nada de mails, contraseñas, OAuth ni verificación.
- Nada de editar ni borrar planes (se carga y se vota).
```

---

## Notas para dar la clase

- El módulo `node:sqlite` de Node 24 evita instalar librerías: el alumno
  arranca con `npm install` y ya tiene base de datos.
- La arquitectura en 4 archivos (db genérico, datos, sesión, actions) es el
  corazón didáctico: les muestra que el SQL está aislado y que toda escritura
  pasa por validación del servidor.
- El `PROMPT.md` describe la **primera etapa**. Si querés una segunda, el
  punto de entrada natural es el botón de sugerencias con IA (mencionado como
  bonus), que agrega una key de OpenRouter y un solo componente cliente.
