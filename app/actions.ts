"use server";

/**
 * Todo lo que ESCRIBE en la base pasa por acá.
 *
 * Son funciones que corren en el servidor y se llaman directo desde un
 * formulario, sin escribir una sola llamada de red a mano. Cuando falla algo,
 * volvemos a la misma pantalla con el error en la dirección, así no hace falta
 * ningún manejo de estado del lado del navegador.
 *
 * Los formularios del grupo mandan el id del grupo (grupoId), nunca su nombre:
 * así la dirección /g/<id> no delata el nombre del grupo. Aunque el id se
 * conozca, acá adentro siempre se vuelve a chequear que el que manda el
 * formulario sea parte de ese grupo.
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  agregarMiembro,
  crearGrupo,
  crearPlan,
  grupoPorId,
  grupoPorNombre,
  miembroPorUsuario,
  planGrupoId,
  planes,
  votar,
} from "./../lib/data";
import { cerrarSesion, guardarSesion, miembroDelGrupo, sesion } from "./../lib/session";
import { sugerirPlanes, type Resultado } from "./../lib/ai";

function texto(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}

/* ------------------------------------------- entrar, registrarse y salir */

export async function accionCrearGrupo(fd: FormData) {
  const usuario = texto(fd, "usuario");
  const grupo = texto(fd, "grupo");
  if (!usuario || !grupo) redirect("/login?error=faltan-datos");

  const r = await crearGrupo(grupo, usuario);
  if ("error" in r) redirect("/login?error=grupo-existe");

  await guardarSesion(r.miembro.id);
  redirect(`/g/${r.grupo.id}`);
}

export async function accionEntrar(fd: FormData) {
  const usuario = texto(fd, "usuario");
  const nombreGrupo = texto(fd, "grupo");
  if (!usuario || !nombreGrupo) redirect("/login?error=faltan-datos");

  const grupo = await grupoPorNombre(nombreGrupo);
  if (!grupo) redirect("/login?error=grupo-no-existe");

  const miembro = await miembroPorUsuario(grupo.id, usuario);
  if (!miembro) redirect("/login?error=no-sos-miembro");

  await guardarSesion(miembro.id);
  redirect(`/g/${grupo.id}`);
}

export async function accionSalir() {
  await cerrarSesion();
  redirect("/login");
}

/* ------------------------------------------------------------------ invitar */

export async function accionInvitar(fd: FormData) {
  const grupoId = texto(fd, "grupoId");
  const usuario = texto(fd, "usuario");

  const grupo = await grupoPorId(grupoId);
  if (!grupo) redirect("/login");
  if (!(await miembroDelGrupo(grupo.id))) redirect("/login");

  const r = await agregarMiembro(grupo.id, usuario);
  if ("error" in r) redirect(`/g/${grupo.id}?error=${r.error}`);

  revalidatePath(`/g/${grupo.id}`);
  redirect(`/g/${grupo.id}?invitado=${encodeURIComponent(r.usuario)}`);
}

/* -------------------------------------------------------------- planes y votos */

export async function accionCrearPlan(fd: FormData) {
  const grupoId = texto(fd, "grupoId");
  const titulo = texto(fd, "titulo");
  const armadorId = texto(fd, "armadorId");
  const fecha = texto(fd, "fecha");

  const grupo = await grupoPorId(grupoId);
  if (!grupo) redirect("/login");
  if (!(await miembroDelGrupo(grupo.id))) redirect("/login");

  if (!titulo || !armadorId || !fecha) {
    redirect(`/g/${grupo.id}/nuevo?error=faltan-datos`);
  }

  const id = await crearPlan(grupo.id, armadorId, titulo, fecha);
  revalidatePath(`/g/${grupo.id}`);
  redirect(`/g/${grupo.id}/p/${id}`);
}

export async function accionVotar(fd: FormData) {
  const grupoId = texto(fd, "grupoId");
  const planId = texto(fd, "planId");
  const puntaje = Number(texto(fd, "puntaje"));

  const grupo = await grupoPorId(grupoId);
  if (!grupo) redirect("/login");

  const yo = await miembroDelGrupo(grupo.id);
  if (!yo) redirect("/login");

  // El plan tiene que ser de verdad de este grupo, por más largo que sea el id.
  if ((await planGrupoId(planId)) !== grupo.id) redirect("/login");

  await votar(planId, yo.id, puntaje);
  revalidatePath(`/g/${grupo.id}`);
  revalidatePath(`/g/${grupo.id}/p/${planId}`);
  redirect(`/g/${grupo.id}/p/${planId}`);
}

/* ---------------------------------------------------------------------- IA */

/**
 * La única acción que devuelve datos en vez de redirigir, porque la pantalla
 * muestra las sugerencias sin recargar. La llave del modelo nunca sale de acá.
 */
export async function accionSugerir(
  _anterior: Resultado | null,
  fd: FormData,
): Promise<Resultado> {
  const grupoId = texto(fd, "grupoId");
  const grupo = await grupoPorId(grupoId);
  if (!grupo) return { ok: false, motivo: "falló", detalle: "No encontré el grupo." };

  const yo = await sesion();
  if (!yo || yo.grupo_id !== grupo.id) {
    return { ok: false, motivo: "falló", detalle: "No sos parte de este grupo." };
  }

  const historial = (await planes(grupo.id)).map((p) => ({
    titulo: p.titulo,
    armador: p.armador,
    promedio: p.promedio,
    votos: p.votos,
  }));

  return sugerirPlanes(grupo.nombre, historial);
}
