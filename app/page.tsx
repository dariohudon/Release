export default function Home() {
  const info = [
    { label: "Project", value: "release" },
    { label: "Domain", value: "release.brightening.ca" },
    { label: "Port", value: "3033" },
    { label: "PM2 Process", value: "release" },
    { label: "Health URL", value: "http://localhost:3033/api/health" },
    { label: "Foundation Status", value: "Complete — ready for feature development" },
  ];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: "#fff" }}>
        release
      </h1>
      <p style={{ color: "#888", marginBottom: 48 }}>
        release.brightening.ca — app foundation
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {info.map(({ label, value }) => (
            <tr key={label} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "14px 0", color: "#888", width: 180, fontSize: 14 }}>
                {label}
              </td>
              <td style={{ padding: "14px 0", fontFamily: "monospace", fontSize: 14 }}>
                {label === "Health URL" ? (
                  <a href="/api/health" style={{ color: "#60a5fa", textDecoration: "none" }}>
                    {value}
                  </a>
                ) : (
                  value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 48, padding: "20px 24px", background: "#1a1a1a", borderRadius: 8, border: "1px solid #222" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#888" }}>
          Start dev server: <code style={{ color: "#a3e635" }}>npm run dev</code>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          PM2: <code style={{ color: "#a3e635" }}>pm2 start ecosystem.config.js</code>
        </p>
      </div>
    </main>
  );
}
