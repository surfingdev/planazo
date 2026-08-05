import { redirect } from "next/navigation";
import { sesion } from "../lib/session";
import { grupoPorId } from "../lib/data";

/**
 * El home es una puerta: sin sesión te manda a /login; con sesión te lleva
 * directo a la vista de tu grupo. La URL del grupo usa el id (ofuscado), no el
 * nombre, así no se delata en la dirección.
 */
export default async function Home() {
  const yo = await sesion();
  if (!yo) redirect("/login");

  const grupo = await grupoPorId(yo.grupo_id);
  if (!grupo) redirect("/login");

  redirect(`/g/${grupo.id}`);
}
