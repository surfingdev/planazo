import Link from "next/link";
import { redirect } from "next/navigation";
import { accionVotar } from "../../../../actions";
import { grupoPorNombre, plan, votos } from "../../../../../lib/data";
import { miembroDelGrupo } from "../../../../../lib/session";

const PUNTAJES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default async function Plan({ params }: PageProps<"/g/[grupo]/p/[id]">) {
  const { grupo: slug, id } = await params;

  const grupo = await grupoPorNombre(slug);
  if (!grupo) redirect("/?error=grupo-no-existe");

  const yo = await miembroDelGrupo(grupo.id);
  if (!yo) redirect("/?error=no-sos-miembro");

  const p = await plan(id);
  if (!p) redirect(`/g/${grupo.nombre_norm}`);

  const lista = await votos(id);
  const miVoto = lista.find((v) => v.miembro_id === yo.id);

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-10">
      <Link href={`/g/${grupo.nombre_norm}`} className="text-sm text-tenue hover:text-fuego">
        ← {grupo.nombre}
      </Link>

      <h1 className="mt-4 text-3xl leading-tight font-bold tracking-tight">{p.titulo}</h1>
      <p className="mt-2 text-suave">
        Lo armó <strong className="font-semibold text-tinta">{p.armador}</strong>
      </p>

      {/* -------------------------------------------------------- el promedio */}
      <div className="panel mt-7 flex items-center gap-5 p-6">
        <div>
          <p className="text-6xl leading-none font-bold tabular-nums text-fuego">
            {p.votos === 0 ? "—" : p.promedio.toFixed(1)}
          </p>
        </div>
        <div className="text-sm leading-relaxed text-tenue">
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
      {miVoto ? (
        <div className="mt-7">
          <p className="text-xs font-semibold tracking-widest text-tenue uppercase">Tu voto</p>
          <p className="panel mt-3 p-5 text-suave">
            Le pusiste{" "}
            <strong className="text-xl font-bold text-fuego">{miVoto.puntaje}</strong>. Un voto
            por persona, así que ya está.
          </p>
        </div>
      ) : (
        <div className="mt-7">
          <p className="text-xs font-semibold tracking-widest text-tenue uppercase">
            Ponele un puntaje
          </p>
          <form action={accionVotar} className="mt-3 grid grid-cols-5 gap-2">
            <input type="hidden" name="grupoNorm" value={grupo.nombre_norm} />
            <input type="hidden" name="planId" value={p.id} />
            {PUNTAJES.map((n) => (
              <button
                key={n}
                type="submit"
                name="puntaje"
                value={n}
                className="boton-borde justify-center py-4 text-lg font-bold"
              >
                {n}
              </button>
            ))}
          </form>
        </div>
      )}

      {/* ------------------------------------------------------- quién votó */}
      {lista.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold tracking-widest text-tenue uppercase">
            Quién votó
          </h2>
          <ul className="panel mt-3 divide-y divide-linea">
            {lista.map((v) => (
              <li key={v.miembro_id} className="flex items-center justify-between px-5 py-3">
                <span className={v.miembro_id === yo.id ? "font-semibold" : "text-suave"}>
                  {v.usuario}
                  {v.miembro_id === yo.id ? " (vos)" : ""}
                </span>
                <span className="text-lg font-bold tabular-nums text-fuego">{v.puntaje}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
