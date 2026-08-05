import Link from "next/link";
import { redirect } from "next/navigation";
import { accionCrearPlan } from "../../../actions";
import { grupoPorId, miembros } from "../../../../lib/data";
import { miembroDelGrupo } from "../../../../lib/session";

export default async function NuevoPlan({
  params,
  searchParams,
}: PageProps<"/g/[grupo]/nuevo">) {
  const { grupo: id } = await params;
  const { error } = await searchParams;

  const grupo = await grupoPorId(id);
  if (!grupo) redirect("/login?error=grupo-no-existe");

  const yo = await miembroDelGrupo(grupo.id);
  if (!yo) redirect("/login?error=no-sos-miembro");

  const gente = await miembros(grupo.id);
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
      <Link
        href={`/g/${grupo.id}`}
        className="chip transition-transform hover:-translate-y-0.5"
      >
        ← {grupo.nombre}
      </Link>

      <h1 className="text-balance mt-6 text-5xl font-black tracking-tight">
        Cargar un plan
      </h1>
      <p className="mt-2 text-lg font-medium text-suave">
        Un plan que ya pasó. Después el grupo lo puntúa del 1 al 10.
      </p>

      {error === "faltan-datos" && (
        <p className="aviso mt-8">Completá los tres campos.</p>
      )}

      <form action={accionCrearPlan} className="panel mt-8 p-6 sm:p-9">
        <input type="hidden" name="grupoId" value={grupo.id} />

        <div>
          <label className="etiqueta" htmlFor="titulo">
            Qué fue el plan
          </label>
          <input
            id="titulo"
            name="titulo"
            className="campo !text-base py-3.5"
            placeholder="Asado en la terraza de Colo"
            autoComplete="off"
            spellCheck={false}
            required
          />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="armadorId">
              Quién lo armó
            </label>
            <select id="armadorId" name="armadorId" className="campo !text-base py-3.5" required defaultValue={yo.id}>
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
              className="campo !text-base py-3.5"
              defaultValue={hoy}
              required
            />
          </div>
        </div>

        <button className="boton mt-8" type="submit">
          Guardar el plan
        </button>
      </form>
    </main>
  );
}
