import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Release Radar",
  description: "Episode radar — release.brightening.ca",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#f9fafb", color: "#111827" }}>
        {children}
      </body>
    </html>
  );
}
