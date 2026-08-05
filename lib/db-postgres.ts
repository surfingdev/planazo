/**
 * Adaptador Postgres. Es el que corre cuando la app esta publicada.
 *
 * Se activa solo: si existe la variable de entorno DATABASE_URL (o
 * POSTGRES_URL), la app usa este archivo en vez del de SQLite. No hay que
 * cambiar ninguna consulta.
 *
 * Sirve con Neon, con Vercel Postgres y con Supabase, porque los tres hablan
 * Postgres. En Vercel alcanza con crear la base y pegar la direccion.
 */
import { neon } from "@neondatabase/serverless";
import { ESQUEMA, type Adapter, type Row } from "./db";

/**
 * Traduce los marcadores de posicion de SQLite a los de Postgres:
 *
 *   select * from planes where grupo_id = ? and titulo = ?
 *   select * from planes where grupo_id = $1 and titulo = $2
 *
 * Nuestras consultas no tienen signos de pregunta dentro de textos, asi que
 * reemplazar de a uno alcanza y se entiende de un vistazo.
 */
function aPostgres(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

export function adapterPostgres(url: string): Adapter {
  const sql = neon(url);

  async function ejecutar(texto: string, params: unknown[]): Promise<Row[]> {
    const r = await sql.query(aPostgres(texto), params as never[]);
    // Segun la version, el driver devuelve las filas sueltas o dentro de .rows
    return (Array.isArray(r) ? r : ((r as { rows?: Row[] }).rows ?? [])) as Row[];
  }

  return {
    async all<T = Row>(texto: string, params: unknown[] = []): Promise<T[]> {
      return (await ejecutar(texto, params)) as T[];
    },

    async run(texto: string, params: unknown[] = []): Promise<void> {
      await ejecutar(texto, params);
    },

    async migrate(): Promise<void> {
      for (const ddl of ESQUEMA) await ejecutar(ddl, []);
    },
  };
}
