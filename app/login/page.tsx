import type { CSSProperties } from "react";
import { accionCrearGrupo, accionEntrar } from "../actions";
import { BadgeMarca, Logotipo } from "../Marca";

const ERRORES: Record<string, string> = {
  "faltan-datos": "Completá los dos campos y probá de nuevo.",
  "grupo-existe": "Ya hay un grupo con ese nombre. Elegí otro.",
  "grupo-no-existe": "No encontré ese grupo. Mirá cómo se escribe.",
  "no-sos-miembro":
    "Ese grupo existe, pero tu usuario no está anotado. Pedile a alguien de adentro que te agregue.",
};

function Estrella({ className, rot = 0 }: { className?: string; rot?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      style={{ "--rot": `${rot}deg` } as CSSProperties}
      aria-hidden="true"
    >
      <path
        d="M20 2 L25 15 L40 20 L25 25 L20 38 L15 25 L0 20 L15 15 Z"
        fill="var(--color-amarillo)"
        stroke="var(--color-tinta)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-12 sm:px-8 sm:py-16">
      {/* decoraciones que flotan sobre el hero */}
      <Estrella className="flotar absolute -top-2 right-10 hidden w-10 sm:block" rot={12} />
      <Estrella className="flotar absolute top-28 -left-3 hidden w-7 sm:block" rot={-10} />

      <header className="relative flex flex-col items-center text-center">
        <Logotipo size={88} className="justify-center" />
        <p className="sello mt-6 rotate-2">el ranking de planes de tu grupo</p>
        <p className="mt-3 max-w-lg text-lg leading-snug text-suave">
          Alguien arma un plan, el grupo lo puntúa del 1 al 10, y al final hay un podio de
          armadores.
        </p>
      </header>

      {typeof error === "string" && ERRORES[error] && (
        <p className="aviso mx-auto mt-8 max-w-xl text-center">{ERRORES[error]}</p>
      )}

      {/* Las dos formas de arrancar, una al lado de la otra. Crear un grupo es
          lo mismo que registrarse: no hay un paso aparte. */}
      <div className="mt-12 grid items-start gap-8 lg:grid-cols-2">
        <section className="panel relative flex flex-col p-7 sm:p-8">
          <BadgeMarca size={56} className="absolute -top-7 right-5 -rotate-12" />
          <h2 className="text-2xl font-black tracking-tight">Armar un grupo</h2>
          <p className="mt-2 text-sm leading-relaxed text-suave">
            Elegís el nombre del grupo y tu usuario. A los demás los invitás desde adentro.
          </p>
          <form action={accionCrearGrupo} className="mt-6 flex flex-1 flex-col gap-4">
            <div>
              <label className="etiqueta" htmlFor="grupo-nuevo">
                Nombre del grupo
              </label>
              <input
                id="grupo-nuevo"
                name="grupo"
                className="campo !text-base py-3.5"
                placeholder="Soldados"
                autoComplete="off"
                spellCheck={false}
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
                className="campo !text-base py-3.5"
                placeholder="Ivo"
                autoComplete="off"
                spellCheck={false}
                required
              />
            </div>
            <button className="boton mt-auto" type="submit">
              Crear el grupo
            </button>
          </form>
        </section>

        {/* Entrar: tu usuario y el nombre del grupo. Sin contraseña. */}
        <section className="panel flex flex-col p-7 sm:p-8">
          <h2 className="text-2xl font-black tracking-tight">Entrar a un grupo</h2>
          <p className="mt-2 text-sm leading-relaxed text-suave">
            Alguien del grupo te tiene que haber agregado antes con tu usuario.
          </p>
          <form action={accionEntrar} className="mt-6 flex flex-1 flex-col gap-4">
            <div>
              <label className="etiqueta" htmlFor="grupo-entrar">
                Nombre del grupo
              </label>
              <input
                id="grupo-entrar"
                name="grupo"
                className="campo !text-base py-3.5"
                placeholder="Soldados"
                autoComplete="off"
                spellCheck={false}
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
                className="campo !text-base py-3.5"
                placeholder="Pepito"
                autoComplete="off"
                spellCheck={false}
                required
              />
            </div>
            <button className="boton-borde mt-auto w-full py-3.5" type="submit">
              Entrar
            </button>
          </form>
        </section>
      </div>

      <p className="sello mx-auto mt-10 max-w-max rotate-[-1.5deg]">
        sin mail · sin contraseña · sin verificación
      </p>
    </main>
  );
}
