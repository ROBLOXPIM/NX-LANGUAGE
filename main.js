// Simple navigation for NX+ wiki pages
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("nav a.nav-link");
  const pages = document.querySelectorAll("main .page");

  // Navegação das páginas
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

  // Botão Run para interpretar NX+
  document.getElementById("run-nx-btn").addEventListener("click", () => {
    const code = document.getElementById("nx-code-input").value;
    const output = interpretNXPlus(code);
    document.getElementById("nx-output").textContent = output;
  });
});

// Função interpretadora da linguagem NX+
function interpretNXPlus(code) {
  const lines = code.split("\n");
  let output = "";
  let vars = {};
  let insideIf = false;
  let executeBlock = true;
  let insideList = false;

  for (let rawLine of lines) {
    let line = rawLine.trim();

    // SET command: SET var = "value"
    if (line.startsWith("SET ")) {
      const match = line.match(/^SET (\w+)\s*=\s*"([^"]*)"$/);
      if (match) {
        vars[match[1]] = match[2];
      } else {
        output += "⚠ Invalid SET command: " + line + "\n";
      }
    }
    // IF block start: IF var == "value"
    else if (line.startsWith("IF ")) {
      const match = line.match(/^IF (\w+)\s*==\s*"([^"]*)"$/);
      if (match) {
        insideIf = true;
        executeBlock = (vars[match[1]] === match[2]);
      } else {
        output += "⚠ Invalid IF syntax: " + line + "\n";
        insideIf = true;
        executeBlock = false;
      }
    }
    // IF block end
    else if (line === "/IF") {
      insideIf = false;
      executeBlock = true;
    }
    // LIST start
    else if (line === "LIST") {
      insideList = true;
      if (executeBlock) output += "• Lista:\n";
    }
    // LIST end
    else if (line === "/LIST") {
      insideList = false;
    }
    // LIST item
    else if (line.startsWith("ITEM ") && insideList) {
      const match = line.match(/^ITEM\s*"([^"]*)"$/);
      if (match && executeBlock) {
        output += "  - " + substituteVars(match[1], vars) + "\n";
      } else if (!match) {
        output += "⚠ Invalid ITEM syntax: " + line + "\n";
      }
    }
    // Paragraph block
    else if (line.startsWith("P ") && line.endsWith("/P")) {
      if (executeBlock) {
        const match = line.match(/^P\s*"([^"]*)"\s*\/P$/);
        if (match) {
          output += substituteVars(match[1], vars) + "\n";
        } else {
          output += "⚠ Invalid P syntax: " + line + "\n";
        }
      }
    }
    // Header block
    else if (line.startsWith("H ") && line.endsWith("/H")) {
      if (executeBlock) {
        const match = line.match(/^H\s*"([^"]*)"\s*\/H$/);
        if (match) {
          output += "🔹 " + substituteVars(match[1], vars) + "\n";
        } else {
          output += "⚠ Invalid H syntax: " + line + "\n";
        }
      }
    }
    // Generic container F
    else if (line.startsWith("F ") && line.endsWith("/F")) {
      if (executeBlock) {
        const match = line.match(/^F\s*"([^"]*)"\s*\/F$/);
        if (match) {
          output += "[ " + substituteVars(match[1], vars) + " ]\n";
        } else {
          output += "⚠ Invalid F syntax: " + line + "\n";
        }
      }
    }
    // Button
    else if (line.startsWith("BTN ") && line.endsWith("/BTN")) {
      if (executeBlock) {
        const match = line.match(/^BTN\s*"([^"]*)"\s*\/BTN$/);
        if (match) {
          output += "[Botão: " + substituteVars(match[1], vars) + "]\n";
        } else {
          output += "⚠ Invalid BTN syntax: " + line + "\n";
        }
      }
    }
    // Image (self-closing)
    else if (line.startsWith("IMG ")) {
      if (executeBlock) {
        const match = line.match(/^IMG\s*"([^"]*)"$/);
        if (match) {
          output += "[Imagem: " + substituteVars(match[1], vars) + "]\n";
        } else {
          output += "⚠ Invalid IMG syntax: " + line + "\n";
        }
      }
    }
    // Empty line or comment
    else if (line === "" || line.startsWith("//")) {
      // ignore blank lines or comments
    }
    // Unknown command
    else {
      output += "⚠ Unknown command: " + line + "\n";
    }
  }

  return output;
}

// Substitui variáveis do tipo {var} no texto
function substituteVars(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] || "");
    }
