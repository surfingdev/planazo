"use client";

/**
 * El único componente de la app que corre en el navegador.
 *
 * Está separado porque necesita mostrar "pensando..." mientras espera al
 * modelo. Todo lo demás de Planazo se dibuja en el servidor y no necesita nada
 * de esto.
 *
 * Ojo con lo importante: acá NO hay ninguna llave. El navegador le pide al
 * servidor, y el servidor le pregunta al modelo.
 */

import { useActionState } from "react";
import { accionSugerir } from "../../actions";

export function Sugerencias({
  grupoNorm,
  hayPlanes,
}: {
  grupoNorm: string;
  hayPlanes: boolean;
}) {
  const [estado, enviar, pendiente] = useActionState(accionSugerir, null);

  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold tracking-widest text-tenue uppercase">
        El próximo plan
      </h2>

      <form action={enviar} className="mt-3">
        <input type="hidden" name="grupoNorm" value={grupoNorm} />
        <button className="boton" type="submit" disabled={pendiente || !hayPlanes}>
          {pendiente ? "Pensando..." : "Sugerime el próximo plan"}
        </button>
      </form>

      {!hayPlanes && (
        <p className="mt-2 text-xs text-tenue">
          Cargá al menos un plan primero. La sugerencia se arma mirando qué puntuó alto el
          grupo.
        </p>
      )}

      {estado?.ok && (
        <ul className="mt-3 space-y-2.5">
          {estado.sugerencias.map((s, i) => (
            <li key={i} className="panel p-5">
              <p className="font-semibold">{s.titulo}</p>
              {s.porque && (
                <p className="mt-1.5 text-sm leading-relaxed text-suave">{s.porque}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {estado && !estado.ok && (
        <p className="aviso mt-3">
          {estado.motivo === "sin-llave" && (
            <>
              Falta configurar la llave del modelo. Poné{" "}
              <code className="font-mono text-tinta">OPENROUTER_API_KEY</code> en el archivo{" "}
              <code className="font-mono text-tinta">.env.local</code> y reiniciá la app.
            </>
          )}
          {estado.motivo === "sin-planes" &&
            "Todavía no hay planes para mirar. Cargá uno y volvé a probar."}
          {estado.motivo === "falló" && (
            <>No salió. {estado.detalle}</>
          )}
        </p>
      )}
    </section>
  );
}
