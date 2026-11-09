import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "NIKITA CYBER AI", template: "%s · NIKITA CYBER AI" },
  description: "Personal AI-assisted security research and application analysis workstation.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
