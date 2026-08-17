import fs from "fs";

const html = fs.readFileSync("updatedui.html", "utf8");
const match = html.match(/<style>([\s\S]*?)<\/style>/);
let css = match[1];

css = css.replace(/\/\* Reset \*\/[\s\S]*?::selection \{[^}]+\}/, "");

function scopeSelectors(selector) {
  return selector
    .split(",")
    .map((s) => {
      s = s.trim();
      if (!s || s.startsWith(".landing-page-wrapper")) return s;
      if (s === "html" || s === "body" || s === "*") return ".landing-page-wrapper";
      return ".landing-page-wrapper " + s;
    })
    .join(", ");
}

const lines = css.split("\n");
const out = [];

for (const line of lines) {
  let l = line;
  if (l.trim().startsWith(":root")) {
    l = l.replace(":root", ".landing-page-wrapper");
  }
  if (l.match(/^@media/)) {
    out.push(l);
    continue;
  }
  if (l.includes("{") && !l.trim().startsWith("@") && !l.trim().startsWith("/*")) {
    const idx = l.indexOf("{");
    const sel = l.slice(0, idx).trim();
    const rest = l.slice(idx);
    if (sel) out.push(scopeSelectors(sel) + " " + rest);
    else out.push(l);
  } else {
    out.push(l);
  }
}

const header = `/* TinySteps landing — ported from updatedui.html */
html { scroll-behavior: smooth; }

.landing-page-wrapper * { margin: 0; padding: 0; box-sizing: border-box; }

`;

const wrapperProps = `
.landing-page-wrapper {
  font-family: var(--font-body);
  font-weight: 500;
  background: var(--cream);
  color: var(--ink);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  position: relative;
  width: 100%;
  min-height: 100vh;
}
`;

let result = header + out.join("\n");
const marker = "}\n\n/* ============================================================\n   TYPOGRAPHY";
const firstClose = result.indexOf(marker);
if (firstClose > -1) {
  result = result.slice(0, firstClose + 1) + wrapperProps + result.slice(firstClose + 1);
}

result += `

/* Mobile nav drawer */
.landing-page-wrapper .mobile-menu-overlay {
  position: fixed; inset: 0; z-index: 150;
  background: rgba(43, 33, 28, 0.4);
  opacity: 0; pointer-events: none;
  transition: opacity 0.3s ease;
}
.landing-page-wrapper .mobile-menu-overlay.open {
  opacity: 1; pointer-events: auto;
}
.landing-page-wrapper .mobile-menu-drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: min(320px, 88vw);
  background: var(--paper);
  border-left: 2.5px solid var(--ink);
  padding: 28px 24px;
  display: flex; flex-direction: column; gap: 8px;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  box-shadow: -8px 0 24px rgba(43, 33, 28, 0.12);
}
.landing-page-wrapper .mobile-menu-overlay.open .mobile-menu-drawer {
  transform: translateX(0);
}
.landing-page-wrapper .mobile-menu-links a {
  display: block;
  padding: 14px 0;
  font-weight: 700;
  color: var(--ink-soft);
  border-bottom: 2px solid var(--line);
}
.landing-page-wrapper .mobile-menu-links a:hover { color: var(--tomato); }
`;

result = result.replace(
  "--font-display: 'Fredoka', system-ui, sans-serif;",
  "--font-display: var(--font-fredoka), 'Fredoka', system-ui, sans-serif;"
);
result = result.replace(
  "--font-body: 'Nunito', system-ui, -apple-system, sans-serif;",
  "--font-body: var(--font-nunito), 'Nunito', system-ui, -apple-system, sans-serif;"
);

fs.writeFileSync("app/landing.css", result);
console.log("Done", result.split("\n").length, "lines");
