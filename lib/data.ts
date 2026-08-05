/**
 * Todas las consultas de Planazo viven aca.
 *
 * Ni una linea de SQL fuera de este archivo. Y el SQL de aca sirve igual para
 * SQLite y para Postgres, asi que publicar la app no obliga a reescribir nada.
 *
 * Dos detalles que hacen que sea portable:
 *
 *   1. Los marcadores son signos de pregunta. El adaptador de Postgres los
 *      traduce a $1, $2, $3.
 *   2. Los promedios y los conteos van con cast explicito, porque Postgres
 *      devuelve los promedios como texto y las cuentas como enteros grandes.
 */
import { ahora, db, normalizar, nuevoId } from "./db";

export type Grupo = { id: string; nombre: string; nombre_norm: string };
export type Miembro = { id: string; grupo_id: string; usuario: string };

export type PlanConPuntaje = {
  id: string;
  titulo: string;
  fecha: string;
  armador_id: string;
  armador: string;
  votos: number;
  promedio: number;
};

export type FilaPodio = {
  miembro_id: string;
  usuario: string;
  planes: number;
  votos: number;
  promedio: number;
};

/* ------------------------------------------------------------------ grupos */

export async function grupoPorNombre(nombre: string): Promise<Grupo | null> {
  const d = await db();
  const filas = await d.all<Grupo>(
    "select id, nombre, nombre_norm from grupos where nombre_norm = ?",
    [normalizar(nombre)],
  );
  return filas[0] ?? null;
}

export async function grupoPorId(id: string): Promise<Grupo | null> {
  const d = await db();
  const filas = await d.all<Grupo>(
    "select id, nombre, nombre_norm from grupos where id = ?",
    [id],
  );
  return filas[0] ?? null;
}

/**
 * Crea el grupo y mete a la primera persona adentro, en un solo paso.
 * Ese es todo el registro que tiene la app.
 */
export async function crearGrupo(
  nombreGrupo: string,
  usuario: string,
): Promise<{ grupo: Grupo; miembro: Miembro } | { error: "grupo-existe" }> {
  const norm = normalizar(nombreGrupo);
  if (await grupoPorNombre(norm)) return { error: "grupo-existe" };

  const d = await db();
  const grupo: Grupo = { id: nuevoId(), nombre: nombreGrupo.trim(), nombre_norm: norm };
  await d.run(
    "insert into grupos (id, nombre, nombre_norm, creado_en) values (?, ?, ?, ?)",
    [grupo.id, grupo.nombre, grupo.nombre_norm, ahora()],
  );

  const miembro = await agregarMiembro(grupo.id, usuario);
  if ("error" in miembro) {
    // No deberia pasar en un grupo recien creado, pero si pasa no dejamos
    // un grupo vacio dando vueltas.
    await d.run("delete from grupos where id = ?", [grupo.id]);
    return { error: "grupo-existe" };
  }
  return { grupo, miembro };
}

/* ---------------------------------------------------------------- miembros */

export async function miembros(grupoId: string): Promise<Miembro[]> {
  const d = await db();
  return d.all<Miembro>(
    "select id, grupo_id, usuario from miembros where grupo_id = ? order by creado_en asc",
    [grupoId],
  );
}

export async function miembroPorUsuario(
  grupoId: string,
  usuario: string,
): Promise<Miembro | null> {
  const d = await db();
  const filas = await d.all<Miembro>(
    "select id, grupo_id, usuario from miembros where grupo_id = ? and usuario_norm = ?",
    [grupoId, normalizar(usuario)],
  );
  return filas[0] ?? null;
}

export async function miembroPorId(id: string): Promise<Miembro | null> {
  const d = await db();
  const filas = await d.all<Miembro>(
    "select id, grupo_id, usuario from miembros where id = ?",
    [id],
  );
  return filas[0] ?? null;
}

/** Invitar a alguien es esto: le eliges el usuario y ya esta adentro. */
export async function agregarMiembro(
  grupoId: string,
  usuario: string,
): Promise<Miembro | { error: "usuario-existe" | "usuario-vacio" }> {
  const limpio = usuario.trim();
  if (!limpio || !normalizar(limpio)) return { error: "usuario-vacio" };
  if (await miembroPorUsuario(grupoId, limpio)) return { error: "usuario-existe" };

  const d = await db();
  const m: Miembro = { id: nuevoId(), grupo_id: grupoId, usuario: limpio };
  await d.run(
    `insert into miembros (id, grupo_id, usuario, usuario_norm, creado_en)
     values (?, ?, ?, ?, ?)`,
    [m.id, m.grupo_id, m.usuario, normalizar(limpio), ahora()],
  );
  return m;
}

/* ------------------------------------------------------------------ planes */

export async function planes(grupoId: string): Promise<PlanConPuntaje[]> {
  const d = await db();
  const filas = await d.all<PlanConPuntaje>(
    `select p.id, p.titulo, p.fecha, p.armador_id,
            m.usuario as armador,
            cast(count(v.id) as int) as votos,
            cast(coalesce(avg(v.puntaje), 0) as float) as promedio
       from planes p
       join miembros m on m.id = p.armador_id
       left join votos v on v.plan_id = p.id
      where p.grupo_id = ?
      group by p.id, p.titulo, p.fecha, p.armador_id, p.creado_en, m.usuario
      order by p.fecha desc, p.creado_en desc`,
    [grupoId],
  );
  return filas.map(numerico);
}

export async function plan(planId: string): Promise<PlanConPuntaje | null> {
  const d = await db();
  const filas = await d.all<PlanConPuntaje & { grupo_id: string }>(
    `select p.id, p.titulo, p.fecha, p.armador_id, p.grupo_id,
            m.usuario as armador,
            cast(count(v.id) as int) as votos,
            cast(coalesce(avg(v.puntaje), 0) as float) as promedio
       from planes p
       join miembros m on m.id = p.armador_id
       left join votos v on v.plan_id = p.id
      where p.id = ?
      group by p.id, p.titulo, p.fecha, p.armador_id, p.grupo_id, m.usuario`,
    [planId],
  );
  return filas[0] ? numerico(filas[0]) : null;
}

export async function planGrupoId(planId: string): Promise<string | null> {
  const d = await db();
  const filas = await d.all<{ grupo_id: string }>(
    "select grupo_id from planes where id = ?",
    [planId],
  );
  return filas[0]?.grupo_id ?? null;
}

export async function crearPlan(
  grupoId: string,
  armadorId: string,
  titulo: string,
  fecha: string,
): Promise<string> {
  const d = await db();
  const id = nuevoId();
  await d.run(
    `insert into planes (id, grupo_id, armador_id, titulo, fecha, creado_en)
     values (?, ?, ?, ?, ?, ?)`,
    [id, grupoId, armadorId, titulo.trim(), fecha, ahora()],
  );
  return id;
}

/* ------------------------------------------------------------------- votos */

export type Voto = { usuario: string; puntaje: number; miembro_id: string };

export async function votos(planId: string): Promise<Voto[]> {
  const d = await db();
  const filas = await d.all<Voto>(
    `select m.usuario, m.id as miembro_id, cast(v.puntaje as int) as puntaje
       from votos v
       join miembros m on m.id = v.miembro_id
      where v.plan_id = ?
      order by v.puntaje desc`,
    [planId],
  );
  return filas.map((v) => ({ ...v, puntaje: Number(v.puntaje) }));
}

export async function votar(
  planId: string,
  miembroId: string,
  puntaje: number,
): Promise<void> {
  const p = Math.min(10, Math.max(1, Math.round(puntaje)));
  const d = await db();
  // Si ya voto, no se sobreescribe. Un voto por persona por plan.
  await d.run(
    `insert into votos (id, plan_id, miembro_id, puntaje, creado_en)
     values (?, ?, ?, ?, ?)
     on conflict (plan_id, miembro_id) do nothing`,
    [nuevoId(), planId, miembroId, p, ahora()],
  );
}

/* ------------------------------------------------------------------- podio */

/**
 * El podio de armadores.
 *
 * No hay tabla de podio y no hay promedio guardado en ningun lado: se calcula
 * cada vez que se pide. Si entra un voto nuevo, el podio ya esta al dia.
 */
export async function podio(grupoId: string): Promise<FilaPodio[]> {
  const d = await db();
  const filas = await d.all<FilaPodio>(
    `select m.id as miembro_id,
            m.usuario,
            cast(count(distinct p.id) as int) as planes,
            cast(count(v.id) as int) as votos,
            cast(coalesce(avg(v.puntaje), 0) as float) as promedio
       from miembros m
       join planes p on p.armador_id = m.id
       left join votos v on v.plan_id = p.id
      where m.grupo_id = ?
      group by m.id, m.usuario
      order by promedio desc, planes desc`,
    [grupoId],
  );
  return filas.map((f) => ({
    ...f,
    planes: Number(f.planes),
    votos: Number(f.votos),
    promedio: Number(f.promedio),
  }));
}

/** Postgres devuelve los promedios como texto. Aca se normaliza a numero. */
function numerico<T extends { votos: number; promedio: number }>(f: T): T {
  return { ...f, votos: Number(f.votos), promedio: Number(f.promedio) };
}
