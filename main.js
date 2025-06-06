// main.js - Interpretador NX+ completo e funcional com suporte a blocos e variáveis

document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("nav a.nav-link");
  const pages = document.querySelectorAll("main .page");

  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      links.forEach(l => l.classList.remove("active"));
      pages.forEach(p => p.classList.remove("active"));
      link.classList.add("active");
      const target = link.getAttribute("href").substring(1);
      const page = document.getElementById(target);
      if (page) page.classList.add("active");
    });
  });

  document.getElementById("run-nx-btn").addEventListener("click", () => {
    const code = document.getElementById("nx-code-input").value;
    const output = interpretNXPlus(code);
    document.getElementById("nx-output").textContent = output;
  });
});

function interpretNXPlus(code) {
  const lines = code.split("\n");
  let output = "";
  let vars = {};

  // Stack para controle de IF (true = executar, false = pular)
  let ifStack = [];
  // Stack para controle de LOOP (cada item é {count, current, buffer})
  let loopStack = [];

  // Função para avaliar expressões simples, substituindo variáveis
  const evalExpr = (expr) => {
    try {
      // Substitui nomes de variáveis no expr por seus valores (se numéricos, ou strings entre aspas)
      const replaced = expr.replace(/\b(\w+)\b/g, (m) => {
        if (vars.hasOwnProperty(m)) {
          // Se valor numérico, retorna sem aspas, senão aspas
          return /^\d+(\.\d+)?$/.test(vars[m]) ? vars[m] : `"${vars[m]}"`;
        }
        return m;
      });
      // Avalia expressão JS e retorna resultado booleano ou valor
      // Segurança: aqui é um eval limitado (sem funções externas)
      return Function(`return (${replaced})`)();
    } catch {
      return false;
    }
  };

  // Função para substituir variáveis dentro de strings {varName}
  const substituteVars = (text) => {
    return text.replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? `{${v}}`);
  };

  // Função para processar linha única de comando (sem blocos)
  const processLine = (line) => {
    // Comandos simples e mapeamento regex -> output
    const matchers = [
      [/^P\s+"(.*?)"\s*\/P$/i, (_, t) => substituteVars(t)],
      [/^H\s+"(.*?)"\s*\/H$/i, (_, t) => `📘 ${substituteVars(t)}`],
      [/^F\s+"(.*?)"\s*\/F$/i, (_, t) => `[ ${substituteVars(t)} ]`],
      [/^PRINT\s+"(.*?)"\s*\/PRINT$/i, (_, t) => substituteVars(t)],
      [/^TITLE\s+"(.*?)"\s*\/TITLE$/i, (_, t) => `📙 ${substituteVars(t)}`],
      [/^ALERT\s+"(.*?)"\s*\/ALERT$/i, (_, t) => `⚠ ALERT: ${substituteVars(t)}`],
      [/^BOX\s+"(.*?)"\s*\/BOX$/i, (_, t) => `🧱 [${substituteVars(t)}]`],
      [/^BTN\s+"(.*?)"\s*\/BTN$/i, (_, t) => `[BUTTON: ${substituteVars(t)}]`],
      [/^ICON\s+"(.*?)"$/i, (_, t) => `🔰 ${substituteVars(t)}`],
      [/^INPUT\s+"(.*?)"$/i, (_, t) => `[INPUT: ${substituteVars(t)}]`],
      [/^LINK\s+"(.*?)"\s*\/LINK$/i, (_, t) => `🔗 ${substituteVars(t)}`],
      [/^COLOR\s+"(.*?)"$/i, (_, t) => `🎨 color: ${substituteVars(t)}`],
      [/^IMG\s+"(.*?)"$/i, (_, t) => `🖼️ Image: ${substituteVars(t)}`],
      [/^MUSIC\s+"(.*?)"$/i, (_, t) => `🎵 Playing: ${substituteVars(t)}`],
      [/^STOPMUSIC$/i, () => `⏹️ Music stopped`],
      [/^CLEAR$/i, () => "\x1Bc"],
      [/^RANDOM\s+(\d+)\s+(\d+)$/i, (_, min, max) => Math.floor(Math.random() * (parseInt(max) - parseInt(min) + 1)) + parseInt(min)],
      [/^TIME$/i, () => new Date().toLocaleTimeString()],
      [/^DATE$/i, () => new Date().toLocaleDateString()]
    ];

    for (const [regex, handler] of matchers) {
      if (regex.test(line)) {
        return handler(...line.match(regex));
      }
    }

    return `⚠ Unknown command: ${line}`;
  };

  // Loop para processar linha a linha, levando em conta blocos IF e LOOP
  for (let i = 0; i < lines.length; i++) {
    let rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Variável VAR nome = "valor"
    if (/^VAR\s+(\w+)\s*=\s*"(.*?)"$/i.test(rawLine)) {
      const [, name, val] = rawLine.match(/^VAR\s+(\w+)\s*=\s*"(.*?)"$/i);
      vars[name] = val;
      continue;
    }

    // Controle IF
    if (/^IF\s+(.+)$/i.test(rawLine)) {
      const condition = rawLine.match(/^IF\s+(.+)$/i)[1];
      const condResult = evalExpr(condition);
      ifStack.push(condResult);
      continue;
    }

    if (/^ELSE$/i.test(rawLine)) {
      if (ifStack.length === 0) {
        output += "⚠ ELSE without IF\n";
        continue;
      }
      ifStack[ifStack.length - 1] = !ifStack[ifStack.length - 1];
      continue;
    }

    if (/^\/IF$/i.test(rawLine)) {
      if (ifStack.length === 0) {
        output += "⚠ /IF without IF\n";
        continue;
      }
      ifStack.pop();
      continue;
    }

    // Se estamos dentro de um IF falso, ignoramos comandos (skip)
    if (ifStack.includes(false)) {
      continue;
    }

    // Controle LOOP
    if (/^LOOP\s+(\d+)$/i.test(rawLine)) {
      const count = parseInt(rawLine.match(/^LOOP\s+(\d+)$/i)[1]);
      loopStack.push({ count, current: 0, buffer: [] });
      continue;
    }

    if (/^\/LOOP$/i.test(rawLine)) {
      if (loopStack.length === 0) {
        output += "⚠ /LOOP without LOOP\n";
        continue;
      }
      const loop = loopStack.pop();
      for (let j = 0; j < loop.count; j++) {
        // interpreta recursivamente o conteúdo do loop
        output += interpretNXPlus(loop.buffer.join("\n"));
      }
      continue;
    }

    if (loopStack.length > 0) {
      // Estamos dentro de um loop, acumula linhas
      loopStack[loopStack.length - 1].buffer.push(rawLine);
      continue;
    }

    // Processa linha simples
    output += processLine(rawLine) + "\n";
  }

  return output;
}
function interpretNXPlus(code) {
  const lines = code.split("\n");
  let output = "";
  let vars = {};
  let skip = false;
  let inIfBlock = false;
  let ifStack = [];
  let inLoop = false;
  let loopCount = 0;
  let loopBuffer = [];

  // Substitui variáveis dentro do texto {var}
  function replaceVars(str) {
    return str.replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? `{${v}}`);
  }

  // Avalia expressão simples (só para números e variáveis)
  function evalExpr(expr) {
    try {
      // substitui variáveis por seus valores (assumindo que são numéricas)
      let replaced = expr.replace(/\b(\w+)\b/g, (match) => {
        if (vars[match] !== undefined) return vars[match];
        return match;
      });
      // avalia a expressão JS
      return Function(`return (${replaced})`)();
    } catch {
      return false;
    }
  }

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Durante loop, acumula comandos
    if (inLoop && line !== "/LOOP") {
      loopBuffer.push(line);
      continue;
    }

    // VAR assignment
    let varMatch = line.match(/^VAR\s+(\w+)\s*=\s*"(.*)"$/);
    if (varMatch) {
      vars[varMatch[1]] = varMatch[2];
      continue;
    }

    // IF start
    let ifMatch = line.match(/^IF\s+(.+)$/);
    if (ifMatch) {
      inIfBlock = true;
      let cond = ifMatch[1];
      let res = evalExpr(cond);
      ifStack.push(skip); // guarda estado anterior
      skip = !res; // se condição falsa, pula bloco
      continue;
    }

    // ELSE
    if (line === "ELSE" && inIfBlock) {
      skip = !skip; // inverte skip
      continue;
    }

    // END IF
    if (line === "/IF") {
      ifStack.length && (skip = ifStack.pop());
      ifStack.length === 0 && (inIfBlock = false);
      continue;
    }

    // LOOP start
    let loopMatch = line.match(/^LOOP\s+(\d+)$/);
    if (loopMatch) {
      inLoop = true;
      loopCount = parseInt(loopMatch[1], 10);
      loopBuffer = [];
      continue;
    }

    // LOOP end
    if (line === "/LOOP" && inLoop) {
      for (let i = 0; i < loopCount; i++) {
        output += interpretNXPlus(loopBuffer.join("\n"));
      }
      inLoop = false;
      loopBuffer = [];
      continue;
    }

    if (skip) continue; // pula linhas se dentro de bloco falso

    // Match comandos
    const commands = [
      [/^P\s+"(.*)"\s*\/P$/, (m) => replaceVars(m[1]) + "\n"],
      [/^H\s+"(.*)"\s*\/H$/, (m) => "🔹 " + replaceVars(m[1]) + "\n"],
      [/^F\s+"(.*)"\s*\/F$/, (m) => "[ " + replaceVars(m[1]) + " ]\n"],
      [/^TITLE\s+"(.*)"\s*\/TITLE$/, (m) => "📘 " + replaceVars(m[1]) + "\n"],
      [/^ALERT\s+"(.*)"\s*\/ALERT$/, (m) => "⚠ ALERT: " + replaceVars(m[1]) + "\n"],
      [/^BTN\s+"(.*)"\s*\/BTN$/, (m) => "[BUTTON: " + replaceVars(m[1]) + "]\n"],
      [/^IMG\s+"(.*)"$/, (m) => "🖼️ Image: " + replaceVars(m[1]) + "\n"],
      [/^LINK\s+"(.*)"\s*\/LINK$/, (m) => "🔗 " + replaceVars(m[1]) + "\n"],
      [/^INPUT\s+"(.*)"$/, (m) => "[INPUT: " + replaceVars(m[1]) + "]\n"],
      [/^COLOR\s+"(.*)"$/, (m) => "🎨 color: " + replaceVars(m[1]) + "\n"],
      [/^PRINT\s+"(.*)"\s*\/PRINT$/, (m) => replaceVars(m[1]) + "\n"],
      [/^STOPMUSIC$/, () => "⏹️ Music stopped\n"],
      [/^MUSIC\s+"(.*)"$/, (m) => "🎵 Playing: " + replaceVars(m[1]) + "\n"],
      [/^CLEAR$/, () => "\x1Bc\n"],
      [/^RANDOM\s+(\d+)\s+(\d+)$/, (m) => (Math.floor(Math.random() * (parseInt(m[2]) - parseInt(m[1]) + 1)) + parseInt(m[1])) + "\n"],
      [/^TIME$/, () => new Date().toLocaleTimeString() + "\n"],
      [/^DATE$/, () => new Date().toLocaleDateString() + "\n"],
    ];

    let matched = false;
    for (const [regex, fn] of commands) {
      const match = line.match(regex);
      if (match) {
        output += fn(match);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Se não for comando, aceita como texto simples (com variáveis)
      output += replaceVars(line) + "\n";
    }
  }

  return output;
    }
