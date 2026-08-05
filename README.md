# Planazo

El ranking de planes de tu grupo de amigos. Alguien arma un plan, el grupo lo puntúa del 1 al 10,
y al final hay un podio de armadores.

Se construyó como proyecto de clase para mostrar que una app completa (cliente, servidor, base de
datos y una función de IA adentro) se puede armar hablando en español con un agente.

---

## Correrlo local

Necesitás **Node 24 o superior**. La app usa el módulo `node:sqlite` que viene dentro de Node, y
recién desde esa versión funciona sin flags.

```bash
npm install
```

```bash
npm run dev
```

Abrí <http://localhost:3000> y listo. **No hace falta configurar ninguna base de datos ni crear
ninguna cuenta.**

La primera vez que la app consulta algo, crea el archivo `data/planazo.db` y lo llena con un grupo
de ejemplo llamado **Soldados**, con cuatro personas y cinco planes ya puntuados. Para entrar a ese
grupo, en la pantalla de inicio usá:

| Campo | Valor |
| --- | --- |
| Nombre del grupo | `Soldados` |
| Tu usuario | `Ivo`, `Colo`, `Tuti` o `Feli` |

### Empezar de cero

**Primero pará el servidor** (`Ctrl+C`) y después borrá la carpeta de la base. En el próximo
arranque se vuelve a crear con los datos de ejemplo:

```bash
rm -rf data && npm run dev
```

Si la borrás con el servidor prendido, la app queda apuntando a un archivo que ya no existe y las
consultas fallan hasta que reinicies.

---

## La función de IA

El botón **Sugerime el próximo plan** le manda al modelo el historial de planes con sus puntajes y
le pide 3 ideas nuevas, mirando qué tipo de plan puntuó alto el grupo.

Todo lo demás de la app funciona sin configurar nada. Para que ande este botón hace falta una
llave. Copiá el archivo de ejemplo y completá **una** de las dos opciones:

```bash
cp .env.example .env.local
```

- **OpenRouter** (recomendado): sacá la llave en <https://openrouter.ai/keys> y ponela en
  `OPENROUTER_API_KEY`. Una sola llave te sirve para muchos modelos, y podés cambiar de modelo con
  `OPENROUTER_MODEL` sin tocar el código.
- **Anthropic directo**: sacá la llave en <https://console.anthropic.com> y ponela en
  `ANTHROPIC_API_KEY`.

Reiniciá `npm run dev` después de editar `.env.local`.

Si no hay ninguna llave, el botón no rompe nada: avisa que falta configurarla y el resto de la app
sigue andando igual.

> La llave vive **solo en el servidor**. Nunca se manda al navegador. Si estuviera en el código que
> llega al navegador, cualquiera podría leerla y gastar tu plata.

---

## Publicarlo en Vercel

La app está preparada para deployar desde la terminal, sin pasar por GitHub.

```bash
npm i -g vercel
```

```bash
vercel
```

Ese comando crea el proyecto y te devuelve una dirección. Después queda una sola cosa por hacer.

**Hace falta un Postgres.** En Vercel el disco es de solo lectura, así que SQLite no sirve una vez
publicado: los datos se perderían en cada arranque. Creá una base Postgres (Neon, Vercel Postgres o
Supabase, las tres andan) y cargá su dirección:

```bash
vercel env add DATABASE_URL production
```

```bash
vercel env add OPENROUTER_API_KEY production
```

```bash
vercel --prod
```

No hay que cambiar ni una línea de código ni ninguna consulta. Con `DATABASE_URL` puesta la app usa
Postgres sola, y crea las tablas en el primer arranque. Sin esa variable, usa SQLite. Por qué
funciona así está en [AGENTS.md](AGENTS.md).

---

## Cómo está organizado

```
app/
  page.tsx                     entrar o armar un grupo
  actions.ts                   todo lo que escribe en la base
  g/[grupo]/page.tsx           el grupo: podio, planes, invitar, IA
  g/[grupo]/Sugerencias.tsx    el único componente que corre en el navegador
  g/[grupo]/nuevo/page.tsx     cargar un plan
  g/[grupo]/p/[id]/page.tsx    un plan: votar del 1 al 10
lib/
  db.ts                        capa genérica y el esquema de las 4 tablas
  db-sqlite.ts                 adaptador local
  db-postgres.ts               adaptador de producción
  data.ts                      todas las consultas de la app
  session.ts                   quién sos, en una cookie
  ai.ts                        la llamada al modelo
  seed.ts                      los datos de ejemplo
data/planazo.db                la base local (no se sube al repo)
```

## Las cuatro tablas

```
grupos     nombre, nombre normalizado para la URL
miembros   a qué grupo pertenece, usuario
planes     de qué grupo, quién lo armó, título, fecha
votos      de qué plan, quién votó, puntaje del 1 al 10
```

El podio **no es una tabla**. Es una cuenta sobre `votos`: promedio de puntaje agrupado por quién
armó el plan. Si entra un voto nuevo, el podio ya está al día y nadie recalcula nada.

## Qué no tiene, a propósito

- **Contraseñas.** Entrás con el nombre del grupo y tu usuario. Cualquiera que sepa los dos, entra.
- **Mails ni invitaciones que aceptar.** Invitar es elegirle el usuario a alguien.
- **Editar ni borrar planes.** Se carga y se vota.
- **Tests.** Es un proyecto de clase.

Las razones de cada una están en [AGENTS.md](AGENTS.md).
