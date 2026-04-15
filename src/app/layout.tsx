import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Choyxona POS",
  description: "Restaurant / Choyxona boshqaruv tizimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" data-scroll-behavior="smooth">
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}