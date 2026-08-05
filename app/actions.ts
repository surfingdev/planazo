"use server";

/**
 * Todo lo que ESCRIBE en la base pasa por acá.
 *
 * Son funciones que corren en el servidor y se llaman directo desde un
 * formulario, sin escribir una sola llamada de red a mano. Cuando falla algo,
 * volvemos a la misma pantalla con el error en la dirección, así no hace falta
 * ningún manejo de estado del lado del navegador.
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  agregarMiembro,
  crearGrupo,
  crearPlan,
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

/* ------------------------------------------------------- entrar y registrarse */

export async function accionCrearGrupo(fd: FormData) {
  const usuario = texto(fd, "usuario");
  const grupo = texto(fd, "grupo");
  if (!usuario || !grupo) redirect("/?error=faltan-datos");

  const r = await crearGrupo(grupo, usuario);
  if ("error" in r) redirect("/?error=grupo-existe");

  await guardarSesion(r.miembro.id);
  redirect(`/g/${r.grupo.nombre_norm}`);
}

export async function accionEntrar(fd: FormData) {
  const usuario = texto(fd, "usuario");
  const nombreGrupo = texto(fd, "grupo");
  if (!usuario || !nombreGrupo) redirect("/?error=faltan-datos");

  const grupo = await grupoPorNombre(nombreGrupo);
  if (!grupo) redirect("/?error=grupo-no-existe");

  const miembro = await miembroPorUsuario(grupo.id, usuario);
  if (!miembro) redirect(`/?error=no-sos-miembro&grupo=${grupo.nombre_norm}`);

  await guardarSesion(miembro.id);
  redirect(`/g/${grupo.nombre_norm}`);
}

export async function accionSalir() {
  await cerrarSesion();
  redirect("/");
}

/* ------------------------------------------------------------------ invitar */

export async function accionInvitar(fd: FormData) {
  const grupoNorm = texto(fd, "grupoNorm");
  const usuario = texto(fd, "usuario");

  const grupo = await grupoPorNombre(grupoNorm);
  if (!grupo) redirect("/");
  if (!(await miembroDelGrupo(grupo.id))) redirect("/");

  const r = await agregarMiembro(grupo.id, usuario);
  if ("error" in r) redirect(`/g/${grupoNorm}?error=${r.error}`);

  revalidatePath(`/g/${grupoNorm}`);
  redirect(`/g/${grupoNorm}?invitado=${encodeURIComponent(r.usuario)}`);
}

/* -------------------------------------------------------------- planes y votos */

export async function accionCrearPlan(fd: FormData) {
  const grupoNorm = texto(fd, "grupoNorm");
  const titulo = texto(fd, "titulo");
  const armadorId = texto(fd, "armadorId");
  const fecha = texto(fd, "fecha");

  const grupo = await grupoPorNombre(grupoNorm);
  if (!grupo) redirect("/");
  if (!(await miembroDelGrupo(grupo.id))) redirect("/");

  if (!titulo || !armadorId || !fecha) {
    redirect(`/g/${grupoNorm}/nuevo?error=faltan-datos`);
  }

  const id = await crearPlan(grupo.id, armadorId, titulo, fecha);
  revalidatePath(`/g/${grupoNorm}`);
  redirect(`/g/${grupoNorm}/p/${id}`);
}

export async function accionVotar(fd: FormData) {
  const grupoNorm = texto(fd, "grupoNorm");
  const planId = texto(fd, "planId");
  const puntaje = Number(texto(fd, "puntaje"));

  const grupoDelPlan = await planGrupoId(planId);
  if (!grupoDelPlan) redirect("/");

  const yo = await miembroDelGrupo(grupoDelPlan);
  if (!yo) redirect("/");

  await votar(planId, yo.id, puntaje);
  revalidatePath(`/g/${grupoNorm}`);
  revalidatePath(`/g/${grupoNorm}/p/${planId}`);
  redirect(`/g/${grupoNorm}/p/${planId}`);
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
  const grupoNorm = texto(fd, "grupoNorm");
  const grupo = await grupoPorNombre(grupoNorm);
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
