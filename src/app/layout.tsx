import type { Metadata } from "next";
// Misma tipografía que usa Emi Labs en su sitio (Inter), autohospedada vía
// @fontsource para no depender de Google Fonts en el build.
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Interno",
  description: "CRM personal de prospección BDR",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
