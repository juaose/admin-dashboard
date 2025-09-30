import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./app.css";
import { ThemeProvider } from "../components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BotMonitor",
  description:
    "Sistema de monitoreo y control de bots bancarios - BNCR y Popular",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ThemeProvider>
          <div className="app-layout">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
