import Link from "next/link";
import { redirect } from "next/navigation";
import { accionInvitar, accionSalir } from "../../actions";
import { grupoPorNombre, miembros, planes, podio } from "../../../lib/data";
import { miembroDelGrupo } from "../../../lib/session";
import { Sugerencias } from "./Sugerencias";

const ERRORES: Record<string, string> = {
  "usuario-existe": "Ese usuario ya está en el grupo. Elegí otro.",
  "usuario-vacio": "El usuario no puede estar vacío.",
};

const MEDALLAS = ["🥇", "🥈", "🥉"];

export default async function Grupo({ params, searchParams }: PageProps<"/g/[grupo]">) {
  const { grupo: slug } = await params;
  const { error, invitado } = await searchParams;

  const grupo = await grupoPorNombre(slug);
  if (!grupo) redirect("/?error=grupo-no-existe");

  const yo = await miembroDelGrupo(grupo.id);
  if (!yo) redirect("/?error=no-sos-miembro");

  const [lista, tabla, gente] = await Promise.all([
    planes(grupo.id),
    podio(grupo.id),
    miembros(grupo.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-xs font-semibold tracking-widest text-tenue uppercase">
            Planazo
          </Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{grupo.nombre}</h1>
          <p className="mt-1 text-sm text-tenue">
            Sos <strong className="font-semibold text-suave">{yo.usuario}</strong> ·{" "}
            {gente.length} {gente.length === 1 ? "persona" : "personas"}
          </p>
        </div>
        <form action={accionSalir}>
          <button className="text-sm text-tenue hover:text-fuego" type="submit">
            Salir
          </button>
        </form>
      </header>

      {typeof error === "string" && ERRORES[error] && (
        <p className="aviso mt-6">{ERRORES[error]}</p>
      )}

      {typeof invitado === "string" && invitado && (
        <p className="aviso mt-6">
          Listo, agregaste a <strong className="text-tinta">{invitado}</strong>. Decile que
          entre a Planazo con el grupo{" "}
          <strong className="text-tinta">{grupo.nombre}</strong> y el usuario{" "}
          <strong className="text-tinta">{invitado}</strong>.
        </p>
      )}

      {/* ------------------------------------------------ podio de armadores */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold tracking-widest text-tenue uppercase">
          Podio de armadores
        </h2>
        {tabla.length === 0 ? (
          <p className="panel mt-3 p-5 text-sm text-tenue">
            Todavía no hay planes cargados. El podio aparece cuando alguien arme el primero.
          </p>
        ) : (
          <ol className="panel mt-3 divide-y divide-linea">
            {tabla.map((fila, i) => (
              <li key={fila.miembro_id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="w-6 text-center text-lg">
                  {MEDALLAS[i] ?? <span className="text-sm text-tenue">{i + 1}</span>}
                </span>
                <span className="flex-1 font-semibold">{fila.usuario}</span>
                <span className="text-xs text-tenue">
                  {fila.planes} {fila.planes === 1 ? "plan" : "planes"}
                </span>
                <span className="w-14 text-right text-lg font-bold tabular-nums text-fuego">
                  {fila.votos === 0 ? "—" : fila.promedio.toFixed(1)}
                </span>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-2 text-xs text-tenue">
          El promedio se calcula cada vez que abrís esta pantalla. No hay ninguna tabla de
          podio guardada.
        </p>
      </section>

      {/* ------------------------------------------------------ la función de IA */}
      <Sugerencias grupoNorm={grupo.nombre_norm} hayPlanes={lista.length > 0} />

      {/* -------------------------------------------------------------- planes */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold tracking-widest text-tenue uppercase">
            Los planes
          </h2>
          <Link href={`/g/${grupo.nombre_norm}/nuevo`} className="text-sm font-semibold text-fuego">
            Cargar un plan
          </Link>
        </div>

        {lista.length === 0 ? (
          <p className="panel mt-3 p-5 text-sm text-tenue">
            Acá van los planes que ya pasaron. Cargá el primero y que el grupo lo puntúe.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {lista.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/g/${grupo.nombre_norm}/p/${p.id}`}
                  className="panel flex items-center gap-4 px-5 py-4 hover:border-fuego"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.titulo}</p>
                    <p className="mt-0.5 text-xs text-tenue">
                      lo armó {p.armador} · {fechaCorta(p.fecha)} ·{" "}
                      {p.votos === 0
                        ? "sin votos"
                        : `${p.votos} ${p.votos === 1 ? "voto" : "votos"}`}
                    </p>
                  </div>
                  <span className="text-2xl font-bold tabular-nums text-fuego">
                    {p.votos === 0 ? "—" : p.promedio.toFixed(1)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------------- invitar */}
      <section className="panel mt-8 p-5">
        <h2 className="text-lg font-semibold">Invitar a alguien</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-tenue">
          Le elegís el usuario y ya queda adentro. Después esa persona entra con el nombre del
          grupo y ese usuario. No hay mail ni invitación que aceptar.
        </p>
        <form action={accionInvitar} className="mt-4 flex gap-2.5">
          <input type="hidden" name="grupoNorm" value={grupo.nombre_norm} />
          <input
            name="usuario"
            className="campo"
            placeholder="Pepito"
            autoComplete="off"
            required
          />
          <button className="boton w-auto shrink-0 px-5" type="submit">
            Agregar
          </button>
        </form>
        <p className="mt-3.5 text-xs leading-relaxed text-tenue">
          Ya están adentro: {gente.map((m) => m.usuario).join(", ")}
        </p>
      </section>
    </main>
  );
}

/** "2026-08-09" se lee mejor como "9 de agosto". */
function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  if (!a || !m || !d) return iso;
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${d} de ${meses[m - 1]}`;
}
