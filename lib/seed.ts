/**
 * Datos de ejemplo, solo si la base está vacía.
 *
 * Existe para que la app se pueda mostrar apenas arranca, con un podio que ya
 * tiene números. Si querés empezar de cero, borrá data/planazo.db y listo.
 */
import { ahora, normalizar, nuevoId, type Adapter } from "./db";

const GRUPO = "Soldados";
const GENTE = ["Ivo", "Colo", "Tuti", "Feli"];

/** [título, quién lo armó, cuándo, puntajes en el orden de GENTE] */
const PLANES: [string, string, string, (number | null)[]][] = [
  ["Asado en la terraza de Colo", "Colo", "2026-07-11", [9, null, 10, 9]],
  ["Bici por el Tigre", "Ivo", "2026-07-19", [8, 7, 6, 8]],
  ["Escape room del centro", "Tuti", "2026-07-26", [6, 5, 7, 4]],
  ["Cancha y choripán", "Colo", "2026-08-01", [10, null, 9, 10]],
  ["Cine un martes a las 3", "Feli", "2026-08-02", [3, 4, 2, 6]],
];

/** Marca de tiempo con un segundo de separacion, para que el orden sea estable. */
function conOrden(i: number): string {
  return new Date(Date.now() + i * 1000).toISOString();
}

export async function sembrarSiVacio(d: Adapter): Promise<void> {
  const hay = await d.all<{ n: number }>("select count(*) as n from grupos");
  if (Number(hay[0]?.n ?? 0) > 0) return;

  const grupoId = nuevoId();
  await d.run(
    "insert into grupos (id, nombre, nombre_norm, creado_en) values (?, ?, ?, ?)",
    [grupoId, GRUPO, normalizar(GRUPO), ahora()],
  );

  // Los miembros se listan por fecha de alta. Si todos entran en el mismo
  // milisegundo el orden queda indefinido, asi que los separo a mano.
  const ids = new Map<string, string>();
  for (let i = 0; i < GENTE.length; i++) {
    const usuario = GENTE[i];
    const id = nuevoId();
    ids.set(usuario, id);
    await d.run(
      `insert into miembros (id, grupo_id, usuario, usuario_norm, creado_en)
       values (?, ?, ?, ?, ?)`,
      [id, grupoId, usuario, normalizar(usuario), conOrden(i)],
    );
  }

  for (const [titulo, armador, fecha, puntajes] of PLANES) {
    const planId = nuevoId();
    await d.run(
      `insert into planes (id, grupo_id, armador_id, titulo, fecha, creado_en)
       values (?, ?, ?, ?, ?, ?)`,
      [planId, grupoId, ids.get(armador)!, titulo, fecha, ahora()],
    );

    for (let i = 0; i < puntajes.length; i++) {
      const puntaje = puntajes[i];
      if (puntaje === null) continue; // alguien que no votó, para que se vea real
      await d.run(
        `insert into votos (id, plan_id, miembro_id, puntaje, creado_en)
         values (?, ?, ?, ?, ?)`,
        [nuevoId(), planId, ids.get(GENTE[i])!, puntaje, ahora()],
      );
    }
  }
}
