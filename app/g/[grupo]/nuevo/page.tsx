import Link from "next/link";
import { redirect } from "next/navigation";
import { accionCrearPlan } from "../../../actions";
import { grupoPorNombre, miembros } from "../../../../lib/data";
import { miembroDelGrupo } from "../../../../lib/session";

export default async function NuevoPlan({
  params,
  searchParams,
}: PageProps<"/g/[grupo]/nuevo">) {
  const { grupo: slug } = await params;
  const { error } = await searchParams;

  const grupo = await grupoPorNombre(slug);
  if (!grupo) redirect("/?error=grupo-no-existe");

  const yo = await miembroDelGrupo(grupo.id);
  if (!yo) redirect("/?error=no-sos-miembro");

  const gente = await miembros(grupo.id);
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-10">
      <Link href={`/g/${grupo.nombre_norm}`} className="text-sm text-tenue hover:text-fuego">
        ← {grupo.nombre}
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">Cargar un plan</h1>
      <p className="mt-2 text-suave">
        Un plan que ya pasó. Después el grupo lo puntúa del 1 al 10.
      </p>

      {error === "faltan-datos" && <p className="aviso mt-6">Completá los tres campos.</p>}

      <form action={accionCrearPlan} className="panel mt-7 space-y-5 p-5 sm:p-6">
        <input type="hidden" name="grupoNorm" value={grupo.nombre_norm} />

        <div>
          <label className="etiqueta" htmlFor="titulo">
            Qué fue el plan
          </label>
          <input
            id="titulo"
            name="titulo"
            className="campo"
            placeholder="Asado en la terraza de Colo"
            autoComplete="off"
            required
          />
        </div>

        <div>
          <label className="etiqueta" htmlFor="armadorId">
            Quién lo armó
          </label>
          <select id="armadorId" name="armadorId" className="campo" required defaultValue={yo.id}>
            {gente.map((m) => (
              <option key={m.id} value={m.id}>
                {m.usuario}
                {m.id === yo.id ? " (vos)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="etiqueta" htmlFor="fecha">
            Cuándo fue
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            className="campo"
            defaultValue={hoy}
            required
          />
        </div>

        <button className="boton" type="submit">
          Guardar el plan
        </button>
      </form>
    </main>
  );
}
