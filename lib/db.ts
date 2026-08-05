/**
 * Capa generica de base de datos.
 *
 * Toda la app habla SOLO con este archivo. Nadie mas sabe si abajo hay
 * SQLite o Postgres, y por eso cambiar de una a la otra es cambiar una
 * variable de entorno y nada mas.
 *
 *   sin DATABASE_URL  ->  SQLite en data/planazo.db  (local, cero cuentas)
 *   con DATABASE_URL  ->  Postgres                   (Vercel, Neon, Supabase)
 *
 * El SQL se escribe siempre con signos de pregunta como marcadores:
 *
 *   sql`select * from grupos where id = ?`  con params [id]
 *
 * El adaptador de Postgres los traduce a $1, $2, $3 solo. Asi las consultas
 * de lib/data.ts sirven igual para las dos bases.
 */

export type Row = Record<string, unknown>;

export interface Adapter {
  all<T = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  run(sql: string, params?: unknown[]): Promise<void>;
  /** Corre el DDL de arranque. Cada adaptador lo adapta a su dialecto. */
  migrate(): Promise<void>;
}

/**
 * El esquema. Cuatro tablas y nada mas.
 *
 * Los ids son texto generados por la app (no autoincrement) justamente para
 * que este DDL sea valido igual en SQLite y en Postgres, sin dos versiones.
 */
export const ESQUEMA = [
  `create table if not exists grupos (
     id          text primary key,
     nombre      text not null,
     nombre_norm text not null unique,
     creado_en   text not null
   )`,
  `create table if not exists miembros (
     id        text primary key,
     grupo_id  text not null,
     usuario   text not null,
     usuario_norm text not null,
     creado_en text not null
   )`,
  `create unique index if not exists miembros_unicos
     on miembros (grupo_id, usuario_norm)`,
  `create table if not exists planes (
     id         text primary key,
     grupo_id   text not null,
     armador_id text not null,
     titulo     text not null,
     fecha      text not null,
     creado_en  text not null
   )`,
  `create table if not exists votos (
     id         text primary key,
     plan_id    text not null,
     miembro_id text not null,
     puntaje    integer not null,
     creado_en  text not null
   )`,
  `create unique index if not exists votos_unicos
     on votos (plan_id, miembro_id)`,
];

/** Postgres o SQLite, segun el entorno. Se decide una sola vez. */
async function crearAdapter(): Promise<Adapter> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const { adapterPostgres } = await import("./db-postgres");
    return adapterPostgres(url);
  }
  const { adapterSqlite } = await import("./db-sqlite");
  return adapterSqlite();
}

// Se cachea en globalThis para que el hot reload de desarrollo no abra
// una conexion nueva en cada cambio de archivo.
const cache = globalThis as unknown as { _planazoDb?: Promise<Adapter> };

export function db(): Promise<Adapter> {
  if (!cache._planazoDb) {
    cache._planazoDb = (async () => {
      const a = await crearAdapter();
      await a.migrate();
      // Import dinamico para no armar un ciclo entre este archivo y seed.ts
      const { sembrarSiVacio } = await import("./seed");
      await sembrarSiVacio(a);
      return a;
    })();
  }
  return cache._planazoDb;
}

/** Id corto, legible y suficiente para esto. */
export function nuevoId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

/** Para comparar nombres sin que moleste la mayuscula ni el acento. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // saca los acentos que NFD dejo separados
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, ""); // deja solo lo que sirve dentro de una URL
}

export function ahora(): string {
  return new Date().toISOString();
}
