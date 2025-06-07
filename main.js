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
