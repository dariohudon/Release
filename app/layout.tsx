import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./radar.css";

export const metadata: Metadata = {
  title: "Model Radar",
  description:
    "The AI frontier at a glance — closed flagships, open-weight leaders, and what's coming. release.brightening.ca",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E1424",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
