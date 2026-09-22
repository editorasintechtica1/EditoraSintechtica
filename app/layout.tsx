import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Editora Sintechtica | Livros e submissão editorial",
  description: "Conheça os livros da Editora Sintechtica e envie sua proposta de publicação para avaliação editorial.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
