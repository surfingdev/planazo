/**
 * Adaptador SQLite. Es el que corre en tu computadora.
 *
 * Usa el modulo sqlite que viene DENTRO de Node, asi que no hay que instalar
 * nada ni compilar nada. La base entera es un archivo: data/planazo.db.
 * Si borras ese archivo, arrancas de cero.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { ESQUEMA, type Adapter, type Row } from "./db";

const ARCHIVO = process.env.SQLITE_PATH || join(process.cwd(), "data", "planazo.db");

/**
 * node:sqlite devuelve objetos sin prototipo, y React no los puede serializar
 * para mandarlos del servidor al navegador. Los copiamos a objetos normales.
 */
function limpiar<T>(filas: unknown[]): T[] {
  return filas.map((f) => ({ ...(f as object) })) as T[];
}

export function adapterSqlite(): Adapter {
  mkdirSync(dirname(ARCHIVO), { recursive: true });
  const base = new DatabaseSync(ARCHIVO);
  base.exec("pragma journal_mode = WAL");
  base.exec("pragma foreign_keys = ON");

  return {
    async all<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
      return limpiar<T>(base.prepare(sql).all(...(params as never[])));
    },

    async run(sql: string, params: unknown[] = []): Promise<void> {
      base.prepare(sql).run(...(params as never[]));
    },

    async migrate(): Promise<void> {
      for (const ddl of ESQUEMA) base.exec(ddl);
    },
  };
}
