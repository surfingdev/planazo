import Link from "next/link";
import { redirect } from "next/navigation";
import { accionVotar } from "../../../../actions";
import { grupoPorId, plan, votos } from "../../../../../lib/data";
import { miembroDelGrupo } from "../../../../../lib/session";
import { BadgeMarca } from "../../../../Marca";

const PUNTAJES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default async function Plan({ params }: PageProps<"/g/[grupo]/p/[id]">) {
  const { grupo: idGrupo, id } = await params;

  const grupo = await grupoPorId(idGrupo);
  if (!grupo) redirect("/login?error=grupo-no-existe");

  const yo = await miembroDelGrupo(grupo.id);
  if (!yo) redirect("/login?error=no-sos-miembro");

  const p = await plan(id);
  if (!p) redirect(`/g/${grupo.id}`);

  const lista = await votos(id);
  const miVoto = lista.find((v) => v.miembro_id === yo.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
      <Link
        href={`/g/${grupo.id}`}
        className="chip transition-transform hover:-translate-y-0.5"
      >
        ← {grupo.nombre}
      </Link>

      <h1 className="text-balance mt-6 text-4xl leading-tight font-black tracking-tight sm:text-5xl">
        {p.titulo}
      </h1>
      <p className="mt-3 text-lg font-medium text-suave">
        Lo armó <strong className="font-bold text-tinta">{p.armador}</strong>
      </p>

      <div className="mt-9 grid items-stretch gap-7 lg:grid-cols-3">
        {/* -------------------------------------------------------- el promedio */}
        <div className="panel relative flex items-center gap-6 overflow-hidden p-7 lg:col-span-1">
          <BadgeMarca
            size={52}
            className="absolute -right-3 -bottom-3 rotate-12 opacity-90"
          />
          <div className="text-7xl leading-none font-black tabular-nums text-fuego">
            {p.votos === 0 ? "—" : p.promedio.toFixed(1)}
          </div>
          <div className="text-sm leading-relaxed text-suave">
            {p.votos === 0 ? (
              <>Todavía no votó nadie. Sé el primero.</>
            ) : (
              <>
                promedio del grupo
                <br />
                sobre {p.votos} {p.votos === 1 ? "voto" : "votos"}
              </>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- votar */}
        <div className="lg:col-span-2">
          {miVoto ? (
            <div className="panel flex h-full items-center justify-center gap-4 p-7">
              <p className="text-lg text-suave">
                Le pusiste{" "}
                <span className="font-black text-tinta">un {miVoto.puntaje}</span>.{" "}
              </p>
              <span className="burbuja-lg">{miVoto.puntaje}</span>
            </div>
          ) : (
            <div className="panel flex h-full flex-col justify-center p-7">
              <h2 className="rotulo text-sm">Ponele un puntaje</h2>
              <form action={accionVotar} className="mt-5 grid grid-cols-5 gap-3">
                <input type="hidden" name="grupoId" value={grupo.id} />
                <input type="hidden" name="planId" value={p.id} />
                {PUNTAJES.map((n) => (
                  <button
                    key={n}
                    type="submit"
                    name="puntaje"
                    value={n}
                    className="boton-borde justify-center py-5 text-xl font-black"
                  >
                    {n}
                  </button>
                ))}
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------- quién votó */}
      {lista.length > 0 && (
        <section className="mt-11">
          <h2 className="rotulo text-sm">Quién votó</h2>
          <ul className="panel mt-4 divide-y-2 divide-tinta overflow-hidden">
            {lista.map((v) => (
              <li key={v.miembro_id} className="flex items-center justify-between px-6 py-4">
                <span className={v.miembro_id === yo.id ? "font-bold" : "text-suave"}>
                  {v.usuario}
                  {v.miembro_id === yo.id ? " (vos)" : ""}
                </span>
                <span className="burbuja">{v.puntaje}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
