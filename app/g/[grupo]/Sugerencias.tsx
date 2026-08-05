"use client";

/**
 * El único componente de la app que corre en el navegador.
 *
 * Está separado porque necesita mostrar "Pensando…" mientras espera al
 * modelo. Todo lo demás de Planazo se dibuja en el servidor y no necesita nada
 * de esto.
 *
 * Ojo con lo importante: acá NO hay ninguna llave. El navegador le pide al
 * servidor, y el servidor le pregunta al modelo.
 */

import { useActionState } from "react";
import { accionSugerir } from "../../actions";

export function Sugerencias({
  grupoId,
  hayPlanes,
}: {
  grupoId: string;
  hayPlanes: boolean;
}) {
  const [estado, enviar, pendiente] = useActionState(accionSugerir, null);

  return (
    <section className="panel flex flex-col gap-5 p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="rotulo text-sm">El próximo plan</h2>
        {pendiente && (
          <span className="chip bg-agua">
            <svg viewBox="0 0 40 40" className="rebotar h-3.5 w-3.5" aria-hidden="true">
              <path
                d="M20 2 L25 15 L40 20 L25 25 L20 38 L15 25 L0 20 L15 15 Z"
                fill="var(--color-tinta)"
                stroke="var(--color-tinta)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            despegando…
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-suave">
        Una idea nueva mirando qué tipo de plan le gusta al grupo.
      </p>

      <form action={enviar}>
        <input type="hidden" name="grupoId" value={grupoId} />
        <button className="boton" type="submit" disabled={pendiente || !hayPlanes}>
          {pendiente ? "Pensando…" : "Sugerime el próximo plan"}
        </button>
      </form>

      {!hayPlanes && (
        <p className="text-xs text-tenue">
          Cargá al menos un plan primero. La sugerencia se arma mirando qué puntuó alto el
          grupo.
        </p>
      )}

      <div aria-live="polite" aria-atomic="true">
        {estado?.ok && (
          <ol className="space-y-4">
            {estado.sugerencias.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="chip h-8 w-8 shrink-0 justify-center bg-fuego">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-bold leading-snug">{s.titulo}</p>
                  {s.porque && (
                    <p className="mt-1 text-sm leading-relaxed text-suave">{s.porque}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        {estado && !estado.ok && (
          <p className="aviso">
            {estado.motivo === "sin-llave" && (
              <>
                Falta configurar la llave del modelo. Poné{" "}
                <code className="font-mono font-bold">OPENROUTER_API_KEY</code> en el
                archivo <code className="font-mono font-bold">.env.local</code> y reiniciá
                la app.
              </>
            )}
            {estado.motivo === "sin-planes" &&
              "Todavía no hay planes para mirar. Cargá uno y volvé a probar."}
            {estado.motivo === "falló" && <>No salió. {estado.detalle}</>}
          </p>
        )}
      </div>
    </section>
  );
}
