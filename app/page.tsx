import Link from "next/link";
import { accionCrearGrupo, accionEntrar } from "./actions";
import { sesion } from "../lib/session";
import { grupoPorId } from "../lib/data";

const ERRORES: Record<string, string> = {
  "faltan-datos": "Completá los dos campos y probá de nuevo.",
  "grupo-existe": "Ya hay un grupo con ese nombre. Elegí otro.",
  "grupo-no-existe": "No encontré ese grupo. Mirá cómo se escribe.",
  "no-sos-miembro":
    "Ese grupo existe, pero tu usuario no está anotado. Pedile a alguien de adentro que te agregue.",
};

export default async function Home({ searchParams }: PageProps<"/">) {
  const { error } = await searchParams;
  const yo = await sesion();
  const miGrupo = yo ? await grupoPorId(yo.grupo_id) : null;

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-12 sm:py-16">
      <header>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Plan<span className="text-fuego">azo</span>
        </h1>
        <p className="mt-4 text-lg leading-snug text-suave">
          El ranking de planes de tu grupo de amigos. Alguien arma un plan, el grupo lo
          puntúa del 1 al 10, y al final hay un podio de armadores.
        </p>
      </header>

      {miGrupo && yo && (
        <Link
          href={`/g/${miGrupo.nombre_norm}`}
          className="panel mt-8 flex items-center justify-between gap-3 px-5 py-4 hover:border-fuego"
        >
          <span className="text-suave">
            Seguís adentro de{" "}
            <strong className="font-semibold text-tinta">{miGrupo.nombre}</strong> como{" "}
            <strong className="font-semibold text-tinta">{yo.usuario}</strong>
          </span>
          <span className="text-fuego">→</span>
        </Link>
      )}

      {typeof error === "string" && ERRORES[error] && (
        <p className="aviso mt-8">{ERRORES[error]}</p>
      )}

      {/* Crear un grupo es lo mismo que registrarse. No hay un paso aparte. */}
      <section className="panel mt-8 p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Armar un grupo nuevo</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-tenue">
          Elegís el nombre del grupo y tu usuario. A los demás los invitás desde adentro.
        </p>
        <form action={accionCrearGrupo} className="mt-5 space-y-4">
          <div>
            <label className="etiqueta" htmlFor="grupo-nuevo">
              Nombre del grupo
            </label>
            <input
              id="grupo-nuevo"
              name="grupo"
              className="campo"
              placeholder="Soldados"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="usuario-nuevo">
              Tu usuario
            </label>
            <input
              id="usuario-nuevo"
              name="usuario"
              className="campo"
              placeholder="Ivo"
              autoComplete="off"
              required
            />
          </div>
          <button className="boton" type="submit">
            Crear el grupo
          </button>
        </form>
      </section>

      {/* Entrar: tu usuario y el nombre del grupo. Sin contraseña. */}
      <section className="panel mt-5 p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Entrar a un grupo</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-tenue">
          Alguien del grupo te tiene que haber agregado antes con tu usuario.
        </p>
        <form action={accionEntrar} className="mt-5 space-y-4">
          <div>
            <label className="etiqueta" htmlFor="grupo-entrar">
              Nombre del grupo
            </label>
            <input
              id="grupo-entrar"
              name="grupo"
              className="campo"
              placeholder="Soldados"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="usuario-entrar">
              Tu usuario
            </label>
            <input
              id="usuario-entrar"
              name="usuario"
              className="campo"
              placeholder="Pepito"
              autoComplete="off"
              required
            />
          </div>
          <button className="boton-borde w-full" type="submit">
            Entrar
          </button>
        </form>
      </section>

      <p className="mt-8 text-center text-xs leading-relaxed text-tenue">
        Sin mail, sin contraseña y sin verificación. Es una app de planes con amigos, no un
        banco.
      </p>
    </main>
  );
}
