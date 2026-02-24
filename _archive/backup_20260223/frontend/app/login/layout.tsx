import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "ForexElite Pro - Sign In",
  description: "Sign in to your ForexElite Pro trading account",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0a12]">
        {children}
      </body>
    </html>
  );
}
