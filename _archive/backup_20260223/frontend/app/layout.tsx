import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ForexElite Pro",
  description: "Professional forex trading platform with advanced tools and automation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
