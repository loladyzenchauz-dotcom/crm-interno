import type { Metadata } from "next";
// Misma tipografía que usa Emi Labs en su sitio (Inter), autohospedada vía
// @fontsource para no depender de Google Fonts en el build.
import "@fontsource-variable/inter";
import "./globals.css";
import SideNav from "@/components/SideNav";

export const metadata: Metadata = {
  title: "CRM Interno",
  description: "CRM personal de prospección BDR",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex font-sans">
        <SideNav />
        <div className="flex min-h-full flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
