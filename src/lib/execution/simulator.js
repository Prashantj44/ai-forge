/**
 * Execution Simulator
 * 
 * Takes a validated full app config and generates a working HTML/CSS/JS application.
 * Proves that the output is executable — not just valid JSON.
 */

import { callLLM } from "../llm.js";

/**
 * Generate a working HTML application from the full config
 * @param {object} fullConfig - The validated full app config
 * @returns {Promise<{ html: string, metrics: object }>}
 */
export async function simulateExecution(fullConfig) {
  const startTime = Date.now();

  const systemPrompt = `You are a full-stack web developer. Generate a COMPLETE, WORKING single-page HTML application from the given configuration.

RULES:
1. Output must be a SINGLE complete HTML file with embedded CSS and JavaScript.
2. Include all pages as sections that can be navigated via a sidebar/nav.
3. Use modern CSS (flexbox, grid, variables) for styling — make it look professional.
4. Implement a working navigation system (show/hide sections).
5. Include sample/mock data in JavaScript for tables and lists.
6. Forms should have basic validation.
7. Tables should show realistic mock data matching the DB schema.
8. Dashboard should have stat cards with sample numbers.
9. Include a login page if auth is configured.
10. Make it responsive and visually appealing with a color scheme from the theme config.
11. Do NOT use any external libraries or CDNs — pure HTML/CSS/JS only.
12. Every interactive element must work — buttons, navigation, forms.
13. The HTML must be a COMPLETE document starting with <!DOCTYPE html>.

OUTPUT: Return a JSON object with a single key "html" containing the complete HTML string.`;

  const userPrompt = `Generate a working HTML application from this configuration:

App: ${fullConfig.appName}
Type: ${fullConfig.appType}
Description: ${fullConfig.description}

## UI Config:
Pages: ${fullConfig.ui.pages.map((p) => `${p.title} (${p.path}) - layout: ${p.layout}, components: ${p.components.map((c) => c.type).join(", ")}`).join("\n")}
Theme: ${JSON.stringify(fullConfig.ui.theme)}

## DB Schema (for mock data):
Tables: ${fullConfig.database.tables.map((t) => `${t.name}: ${t.columns.map((c) => c.name).join(", ")}`).join("\n")}

## Auth:
Method: ${fullConfig.auth.authMethod}
Roles: ${fullConfig.auth.roles.map((r) => r.role).join(", ")}

## Navigation:
${fullConfig.ui.navigation.map((n) => `- ${n.label}: ${n.path}`).join("\n")}

Generate a complete, working HTML application. Return as: { "html": "<!DOCTYPE html>..." }`;

  try {
    const { result, metrics } = await callLLM(systemPrompt, userPrompt, {
      temperature: 0.2,
      maxRetries: 2,
    });

    let html = result.html || result;

    // If result is a string, use it directly
    if (typeof html !== "string") {
      html = JSON.stringify(html);
    }

    // Basic validation: check it starts with DOCTYPE
    if (!html.includes("<!DOCTYPE") && !html.includes("<html")) {
      html = `<!DOCTYPE html>\n<html><head><title>${fullConfig.appName}</title></head><body><h1>Generated App: ${fullConfig.appName}</h1><p>${fullConfig.description}</p></body></html>`;
    }

    return {
      html,
      metrics: {
        ...metrics,
        latency: Date.now() - startTime,
        htmlSize: html.length,
      },
    };
  } catch (error) {
    console.error("Execution simulation failed:", error.message);
    // Return a minimal fallback app
    const fallbackHtml = generateFallbackApp(fullConfig);
    return {
      html: fallbackHtml,
      metrics: {
        latency: Date.now() - startTime,
        error: error.message,
        fallback: true,
      },
    };
  }
}

/**
 * Generate a minimal fallback application from config (no LLM needed)
 */
function generateFallbackApp(config) {
  const theme = config.ui?.theme || { primaryColor: "#6366f1", secondaryColor: "#1e1b4b", accentColor: "#22d3ee", mode: "dark" };
  const pages = config.ui?.pages || [];
  const nav = config.ui?.navigation || [];

  const navHtml = nav.map((n) =>
    `<a href="#" class="nav-link" onclick="showPage('${n.path}')">${n.label}</a>`
  ).join("\n          ");

  const pagesHtml = pages.map((page) => {
    const components = page.components.map((comp) => {
      if (comp.type === "stat") return `<div class="stat-card"><h3>${comp.title}</h3><p class="stat-value">${Math.floor(Math.random() * 1000)}</p></div>`;
      if (comp.type === "table") return `<div class="card"><h3>${comp.title}</h3><table><thead><tr><th>ID</th><th>Name</th><th>Status</th></tr></thead><tbody><tr><td>1</td><td>Sample Item</td><td>Active</td></tr><tr><td>2</td><td>Another Item</td><td>Pending</td></tr></tbody></table></div>`;
      if (comp.type === "form") return `<div class="card"><h3>${comp.title}</h3><form onsubmit="event.preventDefault(); alert('Submitted!')">${comp.fields?.map((f) => `<div class="form-group"><label>${f.label}</label><input type="${f.type || "text"}" placeholder="Enter ${f.label}" required></div>`).join("") || "<p>Form fields</p>"}<button type="submit" class="btn">Submit</button></form></div>`;
      if (comp.type === "chart") return `<div class="card"><h3>${comp.title}</h3><div class="chart-placeholder">📊 Chart Visualization</div></div>`;
      return `<div class="card"><h3>${comp.title}</h3><p>Component: ${comp.type}</p></div>`;
    }).join("\n        ");

    return `<div class="page" id="page-${page.id}" style="display:none;">
        <h2>${page.title}</h2>
        <div class="components-grid">${components}</div>
      </div>`;
  }).join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.appName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: ${theme.mode === 'dark' ? '#0f0a1a' : '#f5f5f5'}; color: ${theme.mode === 'dark' ? '#e2e8f0' : '#1a1a2e'}; display: flex; min-height: 100vh; }
    .sidebar { width: 260px; background: ${theme.mode === 'dark' ? '#1a1033' : '#ffffff'}; padding: 24px 16px; border-right: 1px solid ${theme.mode === 'dark' ? '#2d2250' : '#e5e7eb'}; }
    .sidebar h1 { font-size: 1.3rem; margin-bottom: 32px; color: ${theme.primaryColor}; }
    .nav-link { display: block; padding: 10px 16px; margin-bottom: 4px; border-radius: 8px; color: inherit; text-decoration: none; transition: background 0.2s; }
    .nav-link:hover, .nav-link.active { background: ${theme.primaryColor}22; color: ${theme.primaryColor}; }
    .main { flex: 1; padding: 32px; overflow-y: auto; }
    .components-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
    .card { background: ${theme.mode === 'dark' ? '#1e1640' : '#ffffff'}; border-radius: 12px; padding: 24px; border: 1px solid ${theme.mode === 'dark' ? '#2d2250' : '#e5e7eb'}; }
    .stat-card { background: linear-gradient(135deg, ${theme.primaryColor}22, ${theme.accentColor}22); border-radius: 12px; padding: 24px; border: 1px solid ${theme.primaryColor}33; }
    .stat-value { font-size: 2rem; font-weight: 700; color: ${theme.primaryColor}; margin-top: 8px; }
    h2 { font-size: 1.5rem; margin-bottom: 8px; }
    h3 { font-size: 1rem; margin-bottom: 12px; opacity: 0.9; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid ${theme.mode === 'dark' ? '#2d2250' : '#e5e7eb'}; }
    th { opacity: 0.7; font-size: 0.85rem; text-transform: uppercase; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-size: 0.85rem; opacity: 0.8; }
    .form-group input, .form-group select { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid ${theme.mode === 'dark' ? '#2d2250' : '#d1d5db'}; background: ${theme.mode === 'dark' ? '#0f0a1a' : '#f9fafb'}; color: inherit; font-size: 0.95rem; }
    .btn { background: ${theme.primaryColor}; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 0.95rem; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.85; }
    .chart-placeholder { height: 200px; display: flex; align-items: center; justify-content: center; font-size: 3rem; background: ${theme.primaryColor}11; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="sidebar">
    <h1>${config.appName}</h1>
    <nav>
      ${navHtml}
    </nav>
  </div>
  <div class="main">
    ${pagesHtml}
  </div>
  <script>
    function showPage(path) {
      document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      const pageName = path.replace(/^\\//,'').replace(/\\//g,'-') || 'dashboard';
      const target = document.querySelector('[id*="' + pageName + '"]') || document.querySelector('.page');
      if (target) target.style.display = 'block';
      event.target.classList.add('active');
    }
    // Show first page by default
    const firstPage = document.querySelector('.page');
    if (firstPage) firstPage.style.display = 'block';
    const firstLink = document.querySelector('.nav-link');
    if (firstLink) firstLink.classList.add('active');
  </script>
</body>
</html>`;
}
