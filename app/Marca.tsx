/**
 * La marca de Planazo, dibujada con SVG suelto acá para que no dependa de
 * ninguna imagen ni de internet: un cohete retro adentro de un sello solar.
 *
 * - BadgeMarca: el sello solo (favicon, cabeceras, stickers).
 * - Logotipo: sello + palabra "PLANAZO" para el home y las cabeceras.
 */

const RAYOS = Array.from(
  { length: 12 },
  (_, i) => (i * 30 * Math.PI) / 180,
);

function rayos() {
  const r = 47;
  return RAYOS.map((a) => ({
    x1: 50,
    y1: 50,
    x2: 50 + r * Math.cos(a),
    y2: 50 + r * Math.sin(a),
  }));
}

export function BadgeMarca({
  size = 64,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {rayos().map((r, i) => (
        <line
          key={i}
          x1={r.x1}
          y1={r.y1}
          x2={r.x2}
          y2={r.y2}
          stroke="var(--color-tinta)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      ))}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="var(--color-amarillo)"
        stroke="var(--color-tinta)"
        strokeWidth="6"
      />
      {/* estrellita decorativa */}
      <path
        d="M78 22 l1.8 3.6 3.8.8 -2.6 3 .4 3.9 -3.4-1.6 -3.4 1.6 .4-3.9 -2.6-3 3.8-.8 Z"
        fill="var(--color-blanco)"
        stroke="var(--color-tinta)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* llama */}
      <path
        d="M44 68 L50 81 L56 68 Z"
        fill="var(--color-fuego)"
        stroke="var(--color-tinta)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* aletas */}
      <path
        d="M36 51 L22 63 L36 63 Z"
        fill="var(--color-rosa)"
        stroke="var(--color-tinta)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M64 51 L78 63 L64 63 Z"
        fill="var(--color-rosa)"
        stroke="var(--color-tinta)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* cuerpo */}
      <path
        d="M36 42 C36 28 43 23 50 23 C57 23 64 28 64 42 L64 58 C64 66 57 70 50 70 C43 70 36 66 36 58 Z"
        fill="var(--color-verde)"
        stroke="var(--color-tinta)"
        strokeWidth="5"
      />
      {/* ventanita */}
      <circle
        cx="50"
        cy="39"
        r="7"
        fill="var(--color-agua)"
        stroke="var(--color-tinta)"
        strokeWidth="4"
      />
      <circle cx="48" cy="37" r="2.2" fill="var(--color-blanco)" />
    </svg>
  );
}

export function Logotipo({
  size = 72,
  compacto = false,
  className = "",
}: {
  size?: number;
  compacto?: boolean;
  className?: string;
}) {
  return (
    <span
      className={
        (compacto ? "inline-flex items-center gap-2.5 " : "inline-flex items-center gap-3 ") +
        className
      }
    >
      <BadgeMarca size={size} className="shrink-0" />
      <span
        className={
          "palabra uppercase leading-none font-black tracking-tight text-tinta " +
          (compacto ? "text-2xl" : "text-6xl sm:text-7xl")
        }
      >
        Plan<span className="text-fuego">azo</span>
      </span>
    </span>
  );
}
