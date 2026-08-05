/**
 * La funcion de inteligencia artificial: "sugerime el proximo plan".
 *
 * Todo esto corre en el SERVIDOR. La llave nunca llega al navegador, porque si
 * llegara cualquiera podria leerla y gastar tu plata.
 *
 * Funciona con dos proveedores, el que tengas configurado:
 *
 *   OPENROUTER_API_KEY  ->  OpenRouter, una llave para muchos modelos
 *   ANTHROPIC_API_KEY   ->  Anthropic directo
 *
 * Si no hay ninguna, la app no se rompe: avisa que falta la llave y sigue
 * andando. Eso importa cuando estas mostrando esto delante de gente.
 */

export type Sugerencia = { titulo: string; porque: string };

export type Historial = {
  titulo: string;
  armador: string;
  promedio: number;
  votos: number;
}[];

export type Resultado =
  | { ok: true; sugerencias: Sugerencia[] }
  | { ok: false; motivo: "sin-llave" | "sin-planes" | "falló"; detalle?: string };

const MODELO_OPENROUTER = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";
const MODELO_ANTHROPIC = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

function armarPrompt(grupo: string, historial: Historial): string {
  const lista = historial
    .map(
      (p) =>
        `- "${p.titulo}" lo armó ${p.armador} y sacó ${p.promedio.toFixed(1)} de 10 ` +
        `con ${p.votos} ${p.votos === 1 ? "voto" : "votos"}`,
    )
    .join("\n");

  return `Sos parte de un grupo de amigos que se llama "${grupo}".

Estos son los planes que hicieron, con el puntaje que les puso el grupo del 1 al 10:

${lista}

Proponé 3 planes nuevos para este grupo. Mirá qué tipo de plan sacó mejor puntaje
y qué tipo sacó peor, y usá eso para decidir.

Reglas:
- Planes concretos y hacibles, no categorías vagas.
- Nada de presupuestos ni de lugares inventados con nombre propio.
- Escribí en español rioplatense, informal.
- El campo "porque" tiene que mencionar algo puntual del historial de arriba.

Respondé SOLO con un array JSON, sin texto alrededor y sin bloque de código:
[{"titulo": "...", "porque": "..."}, {"titulo": "...", "porque": "..."}, {"titulo": "...", "porque": "..."}]`;
}

/** Saca el array JSON aunque el modelo lo haya envuelto en texto o en backticks. */
function extraerJson(texto: string): Sugerencia[] | null {
  const desde = texto.indexOf("[");
  const hasta = texto.lastIndexOf("]");
  if (desde === -1 || hasta <= desde) return null;
  try {
    const datos = JSON.parse(texto.slice(desde, hasta + 1));
    if (!Array.isArray(datos)) return null;
    return datos
      .filter((s) => s && typeof s.titulo === "string")
      .slice(0, 3)
      .map((s) => ({
        titulo: String(s.titulo).slice(0, 120),
        porque: String(s.porque ?? "").slice(0, 300),
      }));
  } catch {
    return null;
  }
}

async function pedirAOpenRouter(llave: string, prompt: string): Promise<string> {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${llave}`,
      "Content-Type": "application/json",
      "X-Title": "Planazo",
    },
    body: JSON.stringify({
      model: MODELO_OPENROUTER,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    }),
  });
  if (!r.ok) throw new Error(`OpenRouter respondió ${r.status}: ${await r.text()}`);
  const datos = await r.json();
  return datos?.choices?.[0]?.message?.content ?? "";
}

async function pedirAAnthropic(llave: string, prompt: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": llave,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODELO_ANTHROPIC,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw new Error(`Anthropic respondió ${r.status}: ${await r.text()}`);
  const datos = await r.json();
  return datos?.content?.[0]?.text ?? "";
}

export async function sugerirPlanes(
  grupo: string,
  historial: Historial,
): Promise<Resultado> {
  if (historial.length === 0) return { ok: false, motivo: "sin-planes" };

  const openrouter = process.env.OPENROUTER_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;
  if (!openrouter && !anthropic) return { ok: false, motivo: "sin-llave" };

  try {
    const prompt = armarPrompt(grupo, historial);
    const texto = openrouter
      ? await pedirAOpenRouter(openrouter, prompt)
      : await pedirAAnthropic(anthropic!, prompt);

    const sugerencias = extraerJson(texto);
    if (!sugerencias || sugerencias.length === 0) {
      return { ok: false, motivo: "falló", detalle: "El modelo no devolvió un JSON usable." };
    }
    return { ok: true, sugerencias };
  } catch (e) {
    return { ok: false, motivo: "falló", detalle: e instanceof Error ? e.message : String(e) };
  }
}
