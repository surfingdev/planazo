<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Planazo: decisiones de diseño

Para instalar y correr el proyecto, ver [README.md](README.md). Este archivo explica **por qué** está
hecho así, para que el próximo que lo toque no deshaga una decisión pensando que fue un descuido.

Es un proyecto de clase. El objetivo de cada decisión es que se pueda **explicar en voz alta a gente
que nunca programó**, y recién después que sea correcto. Cuando las dos cosas chocaron, ganó la
primera.

## Lo que hay que saber antes de cambiar algo

1. **El SQL vive solo en `lib/data.ts`.** Ni una consulta fuera de ahí, ni en las páginas ni en las
   acciones. Si necesitás un dato nuevo, se agrega una función ahí.
2. **La misma consulta corre en SQLite y en Postgres.** No hay dos versiones de nada. Ver abajo cómo
   se logra, porque es fácil romperlo sin darse cuenta.
3. **Ninguna llave de API sale del servidor.** `lib/ai.ts` solo se importa desde `app/actions.ts`.

## Stack

| Pieza | Elección | Por qué |
| --- | --- | --- |
| Framework | Next.js 16, App Router | Cliente y servidor en un solo proyecto, y deploy a Vercel con un comando |
| Base local | `node:sqlite` | Viene **dentro** de Node: cero dependencias, cero cuentas, cero compilación |
| Base publicada | Postgres vía `@neondatabase/serverless` | Habla HTTP, que es lo que conviene en funciones serverless |
| Estilos | Tailwind 4 | Los colores están en `@theme` dentro de `app/globals.css`, en un solo lugar |
| Tipografía | La del sistema | Una fuente descargada es una pantalla en blanco si el aula tiene mal wifi |

Node 24 o superior es un requisito real, no una preferencia: `node:sqlite` necesita esa versión para
funcionar sin flags.

## Cómo una sola consulta sirve para las dos bases

Es la decisión central del proyecto y la razón por la que publicarlo no obliga a reescribir nada.

`lib/db.ts` expone una interfaz mínima (`all`, `run`, `migrate`) y elige el adaptador al arrancar:

```
sin DATABASE_URL  ->  lib/db-sqlite.ts    (data/planazo.db)
con DATABASE_URL  ->  lib/db-postgres.ts  (Neon, Vercel Postgres, Supabase)
```

Tres detalles hacen que el SQL sea portable. **Si tocás alguno, se rompe en producción y no en
local, que es la peor forma de romper algo:**

1. **Los marcadores se escriben con `?`.** El adaptador de Postgres los traduce a `$1, $2, $3`. Si
   escribís `$1` a mano, SQLite no lo entiende.
2. **Los ids son texto que genera la app** (`nuevoId()`), no `autoincrement` ni `serial`. Por eso el
   DDL de `ESQUEMA` es válido igual en las dos bases y no hay que leer el id que devuelve un insert.
3. **Los promedios y los conteos van con `cast` explícito.** Postgres devuelve `avg()` como texto y
   `count()` como entero grande; SQLite devuelve números. El `cast` en el SQL más un `Number()` en
   `lib/data.ts` dejan las dos iguales.

El esquema se crea solo en el primer arranque (`migrate()`), así que no hay migraciones que correr a
mano ni en local ni al publicar.

## Entrar sin contraseña

No hay contraseñas, ni mails, ni registro, ni verificación. Entrás con **el nombre del grupo y tu
usuario**.

Es a propósito y por dos razones. La primera es pedagógica: el login con contraseña es el pozo donde
muere la primera app de cualquiera, y no hacía falta para lo que la clase quería mostrar. La segunda
es que el dato que protege no vale el costo: son planes entre amigos.

Cómo funciona invitar, que es la parte que suele confundir:

1. Alguien arma el grupo poniendo el nombre del grupo y su propio usuario. Ese es todo el registro.
2. Desde adentro, esa persona **le elige el usuario** a cada amigo. Queda adentro en ese momento.
3. El amigo entra con el nombre del grupo y el usuario que le eligieron. No hay invitación que
   aceptar ni link que abrir.

La sesión es una cookie con el id del miembro (`lib/session.ts`). `miembroDelGrupo()` verifica además
que ese miembro pertenezca al grupo de la URL: sin eso, cualquiera escribiría la dirección de otro
grupo y vería planes de gente que no conoce.

## El podio no se guarda

No hay tabla de podio y no hay promedio guardado en ninguna fila. Se calcula en cada consulta, con un
`group by` sobre `votos`.

Es la decisión que más se enseña en la clase: **lo que pasó se guarda, lo que se calcula no.** Un
promedio guardado queda viejo en el momento en que entra un voto nuevo, y ahí aparecen los bugs que
nadie encuentra.

## Un solo componente en el navegador

Todo se dibuja en el servidor. La única excepción es `app/g/[grupo]/Sugerencias.tsx`, que necesita
mostrar "Pensando..." mientras espera al modelo.

Las escrituras son Server Actions en `app/actions.ts`. Cuando algo falla, la acción redirige a la
misma pantalla con el error en la dirección (`?error=...`) y la página lo traduce a una frase. No hay
manejo de estado en el navegador para los formularios, y eso fue elegido sobre `useActionState` para
que el código se pueda leer en voz alta sin explicar hooks.

## La función de IA

`lib/ai.ts` acepta dos proveedores y usa el que esté configurado: `OPENROUTER_API_KEY` o
`ANTHROPIC_API_KEY`. Los dos, y no uno, porque la app se muestra en vivo y conviene tener por dónde
salir si un proveedor está caído.

**Cuando no hay ninguna llave, la app no se rompe.** Devuelve `{ ok: false, motivo: "sin-llave" }` y
la pantalla explica qué falta. Eso importa cuando estás proyectando delante de treinta personas.

El modelo se configura con `OPENROUTER_MODEL` / `ANTHROPIC_MODEL` porque los nombres de modelo
cambian seguido y no queremos que eso sea un cambio de código.

La respuesta se parsea a mano con `extraerJson()`, que busca el primer `[` y el último `]`. Los
modelos a veces envuelven el JSON en texto o en backticks aunque se les pida que no, y un
`JSON.parse()` pelado falla ahí.

## La base local no se sube al repo

`data/*.db` está en `.gitignore`. Como `lib/seed.ts` la vuelve a crear y sembrar cuando está vacía,
subirla solo traería conflictos y datos viejos. Para empezar de cero: `rm -rf data`.

El grupo de ejemplo es **Soldados** con `Ivo`, `Colo`, `Tuti` y `Feli`, y cinco planes ya puntuados,
para que el podio tenga números apenas abrís la app.

## No hay tests

Decisión explícita del autor. Es material de clase, no software de producción. Si vas a agregar algo
grande, lo que se usa para verificar es `npx tsc --noEmit` y `npm run build`.
