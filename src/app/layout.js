import "./globals.css";

export const metadata = {
  title: "AI Forge — Software Generation Compiler",
  description: "Transform natural language into production-ready application configurations. A multi-stage AI pipeline that generates validated UI, API, Database, and Auth schemas from simple descriptions.",
  keywords: "AI, software generation, code generator, no-code, application builder",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-grid" />
        <div className="bg-gradient-overlay" />
        {children}
      </body>
    </html>
  );
}
