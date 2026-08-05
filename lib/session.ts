/**
 * "Sesion" es una palabra grande para lo que hace este archivo.
 *
 * No hay contrasenas, no hay mails y no hay registro. Cuando entras, se guarda
 * el id de tu miembro en una cookie y listo. Es a proposito: para una app de
 * planes entre amigos, pedir contrasena es la forma mas rapida de que nadie
 * la use.
 */
import { cookies } from "next/headers";
import { miembroPorId, type Miembro } from "./data";

const COOKIE = "planazo";
const UN_ANIO = 60 * 60 * 24 * 365;

export async function guardarSesion(miembroId: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, miembroId, {
    path: "/",
    maxAge: UN_ANIO,
    sameSite: "lax",
    httpOnly: true,
  });
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** Quien esta usando la app ahora, o null si nadie entro todavia. */
export async function sesion(): Promise<Miembro | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  return miembroPorId(id);
}

/**
 * Devuelve tu miembro solo si pertenece a este grupo.
 *
 * Sin esto, cualquiera podria escribir la direccion de otro grupo y ver los
 * planes de gente que no conoce. Es poca seguridad, pero es la que corresponde.
 */
export async function miembroDelGrupo(grupoId: string): Promise<Miembro | null> {
  const m = await sesion();
  return m && m.grupo_id === grupoId ? m : null;
}
