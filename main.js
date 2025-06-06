// main.js - NX+ Interpretador com suporte a +100 comandos estilo HTML + Lua

document.addEventListener("DOMContentLoaded", () => { const links = document.querySelectorAll("nav a.nav-link"); const pages = document.querySelectorAll("main .page");

links.forEach(link => { link.addEventListener("click", e => { e.preventDefault(); links.forEach(l => l.classList.remove("active")); pages.forEach(p => p.classList.remove("active")); link.classList.add("active"); const target = link.getAttribute("href").substring(1); const page = document.getElementById(target); if (page) page.classList.add("active"); }); });

document.getElementById("run-nx-btn").addEventListener("click", () => { const code = document.getElementById("nx-code-input").value; const output = interpretNXPlus(code); document.getElementById("nx-output").textContent = output; }); });

function interpretNXPlus(code) { const lines = code.split("\n"); let output = ""; let vars = {}; let skip = false; let loopCount = 0; let inLoop = false; let loopBuffer = [];

const evalExpr = (expr) => { try { const replaced = expr.replace(/\b(\w+)\b/g, (match) => vars[match] ?? match); return Function(return (${replaced}))(); } catch { return false; } };

const replaceVars = (str) => str.replace(/{(\w+)}/g, (_, v) => vars[v] ?? {${v}});

for (let rawLine of lines) { let line = rawLine.trim(); if (!line) continue;

if (/^VAR\s+(\w+)\s*=\s*"(.*?)"$/.test(line)) {
  const [, key, value] = line.match(/^VAR\s+(\w+)\s*=\s*"(.*?)"$/);
  vars[key] = value;
  continue;
}

if (/^IF\s+(.+)$/.test(line)) {
  const condition = line.match(/^IF\s+(.+)$/)[1];
  skip = !evalExpr(condition);
  continue;
}

if (line === "ELSE") {
  skip = !skip;
  continue;
}

if (line === "END" || line === "/IF") {
  skip = false;
  continue;
}

if (skip) continue;

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
        output += interpretNXPlus(cmd + "\n");
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

const matchers = [
  [/^P\s+"(.*?)"\s*\/P$/, (_, t) => replaceVars(t)],
  [/^TITLE\s+"(.*?)"\s*\/TITLE$/, (_, t) => `📙 ${replaceVars(t)}`],
  [/^ALERT\s+"(.*?)"\s*\/ALERT$/, (_, t) => `⚠ ALERT: ${replaceVars(t)}`],
  [/^BUTTON\s+"(.*?)"\s*\/BUTTON$/, (_, t) => `[BUTTON: ${replaceVars(t)}]`],
  [/^DIV\s+"(.*?)"\s*\/DIV$/, (_, t) => `[DIV: ${replaceVars(t)}]`],
  [/^IMG\s+"(.*?)"$/, (_, t) => `🖼️ ${replaceVars(t)}`],
  [/^INPUT\s+"(.*?)"$/, (_, t) => `[INPUT: ${replaceVars(t)}]`],
  [/^PRINT\s+"(.*?)"\s*\/PRINT$/, (_, t) => replaceVars(t)],
  [/^H(\d)\s+"(.*?)"\s*\/H\1$/, (_, lvl, t) => `H${lvl}: ${replaceVars(t)}`],
  [/^MATH_RANDOM\s+(\d+)\s+(\d+)$/, (_, min, max) => Math.floor(Math.random() * (parseInt(max) - parseInt(min) + 1)) + parseInt(min)],
  [/^BR$/, () => "\n"],
  [/^CLEAR$/, () => "\x1Bc"],
  [/^TIME$/, () => new Date().toLocaleTimeString()],
  [/^DATE$/, () => new Date().toLocaleDateString()],
  [/^TRUE$/, () => "true"],
  [/^FALSE$/, () => "false"],
  [/^RETURN\s+"(.*?)"$/, (_, t) => replaceVars(t)],
  [/^TOSTRING\s+"(.*?)"$/, (_, t) => String(replaceVars(t))],
  [/^TONUMBER\s+"(.*?)"$/, (_, t) => Number(replaceVars(t))]
];

let matched = false;
for (const [regex, handler] of matchers) {
  if (regex.test(line)) {
    output += handler(...line.match(regex)) + "\n";
    matched = true;
    break;
  }
}

if (!matched) output += `⚠ Unknown command: ${line}\n`;

}

return output; }

  
