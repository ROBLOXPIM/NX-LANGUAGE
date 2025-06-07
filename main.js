// main.js - NX+ completo (interpretador + UI interativa)

document.addEventListener("DOMContentLoaded", () => { const links = document.querySelectorAll("nav a.nav-link"); const pages = document.querySelectorAll("main .page");

links.forEach(link => { link.addEventListener("click", e => { e.preventDefault(); links.forEach(l => l.classList.remove("active")); pages.forEach(p => p.classList.remove("active")); link.classList.add("active")); const target = link.getAttribute("href").substring(1); const page = document.getElementById(target); if (page) page.classList.add("active"); }); });

document.getElementById("run-nx-btn").addEventListener("click", () => { const code = document.getElementById("nx-code-input").value; const outputText = interpretNXPlus(code); const outputElement = document.getElementById("nx-output"); outputElement.innerHTML = outputText.text; renderUI(outputText.ui); }); });

function interpretNXPlus(code) { const lines = code.split("\n"); let output = ""; let vars = {}; let skip = false; let loopCount = 0; let inLoop = false; let loopBuffer = []; let uiMode = false; let uiElements = [];

const evalExpr = (expr) => { try { const replaced = expr.replace(/\b(\w+)\b/g, (match) => vars[match] ?? match); return Function(return (${replaced}))(); } catch { return false; } };

for (let rawLine of lines) { let line = rawLine.trim(); if (!line) continue;

// Start UI Mode
if (line === "NX+ UI Create") {
  uiMode = true;
  continue;
}

// Variables
if (/^VAR\s+(\w+)\s*=\s*"(.*?)"$/.test(line)) {
  const [, key, value] = line.match(/^VAR\s+(\w+)\s*=\s*"(.*?)"$/);
  vars[key] = value;
  continue;
}

// IF block
if (/^IF\s+(.+)$/.test(line)) {
  const condition = line.match(/^IF\s+(.+)$/)[1];
  skip = !evalExpr(condition);
  continue;
}
if (line === "ELSE") {
  skip = !skip;
  continue;
}
if (line === "/IF" || line === "END") {
  skip = false;
  continue;
}
if (skip) continue;

// Loop block
if (/^LOOP\s+(\d+)$/.test(line)) {
  loopCount = parseInt(line.match(/^LOOP\s+(\d+)$/)[1]);
  inLoop = true;
  loopBuffer = [];
  continue;
}
if (line === "/LOOP") {
  if (inLoop) {
    for (let i = 0; i < loopCount; i++) {
      loopBuffer.forEach(cmd => {
        const result = interpretNXPlus(cmd + "\n");
        output += result.text;
      });
    }
    inLoop = false;
    loopBuffer = [];
  }
  continue;
}
if (inLoop) {
  loopBuffer.push(line);
  continue;
}

// Substituição de variáveis
line = line.replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? `{${v}}`);

// Matchers
const matchers = [
  [/^TITLE\s+"(.*?)"\s*\/TITLE$/, (_, t) => `<h1>📘 ${t}</h1>`],
  [/^P\s+"(.*?)"\s*\/P$/, (_, t) => `<p>${t}</p>`],
  [/^H2\s+"(.*?)"\s*\/H2$/, (_, t) => `<h2>${t}</h2>`],
  [/^ALERT\s+"(.*?)"\s*\/ALERT$/, (_, t) => `⚠ ALERT: ${t}`],
  [/^BR$/, () => `<br>`],
  [/^UL$/, () => `<ul>`],
  [/^\/UL$/, () => `</ul>`],
  [/^LI\s+"(.*?)"\s*\/LI$/, (_, t) => `<li>${t}</li>`],
  [/^DATE$/, () => new Date().toLocaleDateString()],
  [/^TIME$/, () => new Date().toLocaleTimeString()],
  [/^DIV$/, () => `<div>`],
  [/^\/DIV$/, () => `</div>`]
];

let matched = false;
for (const [regex, handler] of matchers) {
  if (regex.test(line)) {
    const result = handler(...line.match(regex));
    if (uiMode) uiElements.push(result);
    else output += result + "\n";
    matched = true;
    break;
  }
}

if (!matched) output += `⚠ Unknown command: ${line}\n`;

}

return { text: output, ui: uiElements }; }

function renderUI(uiElements) { const uiRoot = document.getElementById("ui-root"); if (!uiRoot) return; uiRoot.innerHTML = ""; uiElements.forEach(el => { const wrapper = document.createElement("div"); wrapper.innerHTML = el; uiRoot.appendChild(wrapper); }); }

                       
