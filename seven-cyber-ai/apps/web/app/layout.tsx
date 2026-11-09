import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SEVEN CYBER AI", template: "%s · SEVEN CYBER AI" },
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
