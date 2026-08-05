import Link from "next/link";
import { redirect } from "next/navigation";
import { accionInvitar, accionSalir } from "../../actions";
import { grupoPorId, miembros, planes, podio } from "../../../lib/data";
import { miembroDelGrupo } from "../../../lib/session";
import { Logotipo } from "../../Marca";
import { Sugerencias } from "./Sugerencias";

const ERRORES: Record<string, string> = {
  "usuario-existe": "Ese usuario ya está en el grupo. Elegí otro.",
  "usuario-vacio": "El usuario no puede estar vacío.",
};

const PODIO = {
  oro: { fill: "#ffd23d", fondo: "bg-[#ffd23d]" },
  plata: { fill: "#d8dee7", fondo: "bg-[#d8dee7]" },
  bronce: { fill: "#e8a269", fondo: "bg-[#e8a269]" },
} as const;

function Corona({ metal }: { metal: keyof typeof PODIO }) {
  return (
    <svg
      viewBox="0 0 100 54"
      className="h-10 w-16"
      aria-hidden="true"
    >
      <path
        d="M12 40 L24 14 L38 28 L50 10 L62 28 L76 14 L88 40 Z"
        fill={PODIO[metal].fill}
        stroke="var(--color-tinta)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M12 40 L88 40 L88 50 L12 50 Z"
        fill={PODIO[metal].fill}
        stroke="var(--color-tinta)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
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

export default async function Grupo({ params, searchParams }: PageProps<"/g/[grupo]">) {
  const { grupo: id } = await params;
  const { error, invitado } = await searchParams;

  const grupo = await grupoPorId(id);
  if (!grupo) redirect("/login?error=grupo-no-existe");

  const yo = await miembroDelGrupo(grupo.id);
  if (!yo) redirect("/login?error=no-sos-miembro");

  const [lista, tabla, gente] = await Promise.all([
    planes(grupo.id),
    podio(grupo.id),
    miembros(grupo.id),
  ]);

  const finalistas = tabla.slice(0, 3);
  const resto = tabla.slice(3);
  const metales = ["oro", "plata", "bronce"] as const;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="Volver al inicio de Planazo">
          <Logotipo compacto size={40} />
        </Link>
        <form action={accionSalir}>
          <button className="boton-borde px-5 py-2.5 text-sm" type="submit">
            Salir
          </button>
        </form>
      </header>

      <div className="mt-10">
        <span className="chip bg-fuego">grupo</span>
        <h1 className="text-balance mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          {grupo.nombre}
        </h1>
        <p className="mt-3 text-base text-suave">
          Sos <strong className="font-bold text-tinta">{yo.usuario}</strong> ·{" "}
          {gente.length} {gente.length === 1 ? "persona" : "personas"} ·{" "}
          {lista.length} {lista.length === 1 ? "plan" : "planes"}
        </p>
      </div>

      {typeof error === "string" && ERRORES[error] && (
        <p className="aviso mt-8">{ERRORES[error]}</p>
      )}

      {typeof invitado === "string" && invitado && (
        <p className="aviso mt-8">
          Listo, agregaste a <strong className="font-black">{invitado}</strong>. Decile que
          entre a Planazo con el grupo{" "}
          <strong className="font-black">{grupo.nombre}</strong> y el usuario{" "}
          <strong className="font-black">{invitado}</strong>.
        </p>
      )}

      {/* ------------------------------------------------ podio de armadores */}
      <section className="mt-14">
        <div className="flex items-end justify-between gap-3">
          <h2 className="rotulo text-sm">Podio de armadores</h2>
          <span className="sello">ranking vivo</span>
        </div>

        {tabla.length === 0 ? (
          <p className="panel mt-5 p-7 text-sm text-suave">
            Todavía no hay planes cargados. El podio aparece cuando alguien arme el primero.
          </p>
        ) : (
          <>
            <ol className="mt-5 grid gap-6 md:grid-cols-3">
              {finalistas.map((fila, i) => {
                const metal = metales[i];
                return (
                  <li
                    key={fila.miembro_id}
                    className={
                      "panel relative flex flex-col items-center gap-2 overflow-hidden px-6 py-9 " +
                      (i === 0
                        ? "md:-translate-y-2 md:shadow-[9px_9px_0_var(--color-tinta)]"
                        : "")
                    }
                  >
                    <span className={"chip " + PODIO[metal].fondo} aria-hidden="true">
                      puesto #{i + 1}
                    </span>
                    <Corona metal={metal} />
                    <p className="mt-1 max-w-full truncate text-2xl font-black">
                      {fila.usuario}
                    </p>
                    <p className="text-sm text-suave">
                      {fila.planes} {fila.planes === 1 ? "plan" : "planes"} ·{" "}
                      {fila.votos} {fila.votos === 1 ? "voto" : "votos"}
                    </p>
                    <span className="burbuja-lg mt-3">
                      {fila.votos === 0 ? "—" : fila.promedio.toFixed(1)}
                    </span>
                  </li>
                );
              })}
            </ol>

            {resto.length > 0 && (
              <ol className="panel mt-6 divide-y-2 divide-tinta overflow-hidden">
                {resto.map((fila, i) => (
                  <li
                    key={fila.miembro_id}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <span className="chip w-8 justify-center py-1">{i + 4}</span>
                    <span className="min-w-0 flex-1 truncate text-lg font-bold">
                      {fila.usuario}
                    </span>
                    <span className="text-sm whitespace-nowrap text-suave">
                      {fila.planes} {fila.planes === 1 ? "plan" : "planes"}
                    </span>
                    <span className="burbuja">
                      {fila.votos === 0 ? "—" : fila.promedio.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}

        <aside className="mt-3 text-xs text-tenue">
          El promedio se calcula cada vez que abrís esta pantalla. No hay ninguna tabla de
          podio guardada.
        </aside>
      </section>

      {/* ---------------------------------- dos columnas anchas y balanceadas */}
      <div className="mt-14 grid items-start gap-8 lg:grid-cols-12">
        {/* ---------------------------------------------------- la lista de planes */}
        <section className="lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="rotulo text-sm">Los planes</h2>
            <Link
              href={`/g/${grupo.id}/nuevo`}
              className="chip bg-verde px-4 py-2 text-sm transition-transform hover:-translate-y-0.5"
            >
              + Cargar un plan
            </Link>
          </div>

          {lista.length === 0 ? (
            <p className="panel mt-5 p-7 text-sm text-suave">
              Acá van los planes que ya pasaron. Cargá el primero y que el grupo lo puntúe.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {lista.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/g/${grupo.id}/p/${p.id}`}
                    className="panel flex items-center gap-5 px-6 py-5 transition-all hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--color-tinta)]"
                  >
                    <span className="chip bg-agua shrink-0">{fechaCortaSinAnio(p.fecha)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-bold">{p.titulo}</p>
                      <p className="mt-1 text-sm text-suave">
                        lo armó {p.armador} ·{" "}
                        {p.votos === 0
                          ? "sin votos"
                          : `${p.votos} ${p.votos === 1 ? "voto" : "votos"}`}
                      </p>
                    </div>
                    <span className="burbuja">
                      {p.votos === 0 ? "—" : p.promedio.toFixed(1)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ----------------------------------------------- el próximo plan (IA) */}
        <div className="flex flex-col gap-8 lg:col-span-5">
          <Sugerencias grupoId={grupo.id} hayPlanes={lista.length > 0} />
        </div>
      </div>

      {/* -------------------------------------------------------- invitar, ancho */}
      <section className="panel mt-14 p-6 sm:p-9">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Invitar a alguien</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-suave">
              Le elegís el usuario y ya queda adentro. Después esa persona entra con el
              nombre del grupo y ese usuario. No hay mail ni invitación que aceptar.
            </p>
          </div>
          <span className="sello shrink-0 rotate-1">sin mail · sin aceptar</span>
        </div>

        <form action={accionInvitar} className="mt-7 flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="grupoId" value={grupo.id} />
          <input
            name="usuario"
            className="campo flex-1 !text-base py-3.5"
            placeholder="Bri"
            autoComplete="off"
            spellCheck={false}
            required
          />
          <button className="boton px-10 sm:w-auto" type="submit">
            Agregar
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-tenue">Ya están adentro:</span>
          {gente.map((m) => (
            <span key={m.id} className={m.id === yo.id ? "chip bg-amarillo px-3 py-1.5" : "chip px-3 py-1.5"}>
              {m.usuario}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}

/** Versión corta sin el año: "9 de agosto" directamente (ya no usa el año). */
function fechaCortaSinAnio(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  if (!m || !d) return iso;
  const meses = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  return `${d} ${meses[m - 1]}`;
}
