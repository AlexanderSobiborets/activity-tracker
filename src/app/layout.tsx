import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Чат Активу — Трекер",
  description: "Відмітка виконання активу",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
