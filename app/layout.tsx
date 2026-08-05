import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planazo",
  description: "El ranking de planes de tu grupo de amigos.",
};

export const viewport: Viewport = {
  themeColor: "#fbf2e3",
};

// Tipografía del sistema a propósito: así la app abre igual sin internet.
// Si el aula tiene mal wifi, una fuente descargada es una pantalla en blanco.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
