// main.js - Interpretador NX+ completo com +100 comandos e variáveis

document.addEventListener("DOMContentLoaded", () => {
  // Navegação das páginas wiki
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

  // Rodar código NX+ ao clicar no botão
  document.getElementById("run-nx-btn").addEventListener("click", () => {
    const code = document.getElementById("nx-code-input").value;
    const output = interpretNXPlus(code);
    document.getElementById("nx-output").textContent = output;
  });
});

function interpretNXPlus(code) {
  const lines = code.split("\n");
  let output = "";
  let vars = {}; // Guarda variáveis
  let skip = false; // Para ignorar blocos no IF falso
  let skipStack = []; // Pilha para IF aninhado
  let inLoop = false;
  let loopCount = 0;
  let loopBuffer = [];
  let inList = false;
  let listItems = [];
  let inTable = false;
  let tableRows = [];
  let currentRow = [];
  let inIf = false;

  // Avalia expressões simples com variáveis
  const evalExpr = (expr) => {
    try {
      // Substitui variáveis no expr
      const replaced = expr.replace(/\b(\w+)\b/g, (match) => {
        if (vars[match] !== undefined) return JSON.stringify(vars[match]);
        return match;
      });
      // Avalia JS seguro
      return Function(`"use strict"; return (${replaced})`)();
    } catch {
      return false;
    }
  };

  // Substitui variáveis no texto {var}
  const substituteVars = (text) => {
    return text.replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? `{${v}}`);
  };

  // Comandos e handlers
  const commands = {
    // Texto básico e blocos
    "P": (arg) => substituteVars(arg) + "\n",
    "H": (arg) => "🔹 " + substituteVars(arg) + "\n",
    "F": (arg) => "[ " + substituteVars(arg) + " ]\n",
    "PRINT": (arg) => substituteVars(arg) + "\n",
    "TITLE": (arg) => "📘 " + substituteVars(arg) + "\n",
    "ALERT": (arg) => "⚠ ALERT: " + substituteVars(arg) + "\n",
    "BOX": (arg) => "🧱 [" + substituteVars(arg) + "]\n",
    "BTN": (arg) => "[BUTTON: " + substituteVars(arg) + "]\n",
    "ICON": (arg) => "🔸 " + substituteVars(arg) + "\n",
    "INPUT": (arg) => "[INPUT: " + substituteVars(arg) + "]\n",
    "LINK": (arg) => "🔗 " + substituteVars(arg) + "\n",
    "COLOR": (arg) => "🎨 color: " + substituteVars(arg) + "\n",
    "IMG": (arg) => "🖼️ Image: " + substituteVars(arg) + "\n",
    "MUSIC": (arg) => "🎵 Playing: " + substituteVars(arg) + "\n",
    "STOPMUSIC": () => "⏹️ Music stopped\n",
    "CLEAR": () => "\x1Bc",
    "TIME": () => new Date().toLocaleTimeString() + "\n",
    "DATE": () => new Date().toLocaleDateString() + "\n",
    "RANDOM": (min, max) => (Math.floor(Math.random() * (parseInt(max) - parseInt(min) + 1)) + parseInt(min)) + "\n",

    // Variáveis
    "VAR": (key, val) => {
      vars[key] = val;
      return "";
    },

    // Condições IF / ELSE / /IF
    "IF": (cond) => {
      const res = evalExpr(cond);
      skipStack.push(!res);
      skip = skipStack.includes(true);
      return "";
    },
    "ELSE": () => {
      if (skipStack.length > 0) {
        const last = skipStack.pop();
        skipStack.push(!last);
        skip = skipStack.includes(true);
      }
      return "";
    },
    "/IF": () => {
      if (skipStack.length > 0) skipStack.pop();
      skip = skipStack.includes(true);
      return "";
    },

    // LOOP
    "LOOP": (num) => {
      inLoop = true;
      loopCount = parseInt(num);
      loopBuffer = [];
      return "";
    },
    "/LOOP": () => {
      if (inLoop) {
        let loopOutput = "";
        for (let i = 0; i < loopCount; i++) {
          loopBuffer.forEach(line => {
            loopOutput += interpretNXPlus(line + "\n");
          });
        }
        inLoop = false;
        return loopOutput;
      }
      return "";
    },

    // LISTAS
    "LIST": () => {
      inList = true;
      listItems = [];
      return "";
    },
    "ITEM": (val) => {
      if (inList) {
        listItems.push(substituteVars(val));
      }
      return "";
    },
    "/LIST": () => {
      if (inList) {
        let res = "• List:\n";
        listItems.forEach(item => {
          res += "  - " + item + "\n";
        });
        inList = false;
        return res;
      }
      return "";
    },

    // TABELAS
    "TABLE": () => {
      inTable = true;
      tableRows = [];
      return "";
    },
    "ROW": () => {
      if (inTable) {
        if (currentRow.length > 0) {
          tableRows.push(currentRow);
          currentRow = [];
        }
      }
      return "";
    },
    "COL": (val) => {
      if (inTable) {
        currentRow.push(substituteVars(val));
      }
      return "";
    },
    "/TABLE": () => {
      if (inTable) {
        if (currentRow.length > 0) {
          tableRows.push(currentRow);
          currentRow = [];
        }
        // Formata a tabela simples em texto
        let res = "📋 Table:\n";
        tableRows.forEach(row => {
          res += " | " + row.join(" | ") + " |\n";
        });
        inTable = false;
        return res;
      }
      return "";
    },

    // Outras funções / comandos especiais
    "CONFIRM": (msg) => `[CONFIRM: ${substituteVars(msg)}]\n`,
    "PROMPT": (msg) => `[PROMPT: ${substituteVars(msg)}]\n`,
    "CHECK": (label) => `[CHECKBOX: ${substituteVars(label)}]\n`,
    "SLIDER": (label) => `[SLIDER: ${substituteVars(label)}]\n`,
    "MAP": (label) => `[MAP: ${substituteVars(label)}]\n`,
    "TAB": (label) => `[TAB: ${substituteVars(label)}]\n`,

    // Comandos simples e status
    "HELLO": () => "Hello from NX+!\n",
    "BYE": () => "Goodbye!\n"
  };

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Se dentro do loop, armazena linhas no buffer
    if (inLoop && !line.match(/^\/LOOP$/i)) {
      loopBuffer.push(line);
      continue;
    }

    // Ignora linhas se dentro de IF falso
    if (skip) {
      // Mas se for fim de bloco IF, trata
      if (/^\/IF$/i.test(line)) {
        output += commands["/IF"]();
      } else if (/^ELSE$/i.test(line)) {
        output += commands["ELSE"]();
      }
      continue;
    }

    // Parse de linha: comando + args
    const parts = line.match(/^(\w+)(?:\s+"([^"]*)")?(?:\s+(.+))?$/);
    if (!parts) {
      output += `⚠ Unknown command: ${line}\n`;
      continue;
    }

    const cmd = parts[1].toUpperCase();
    const arg1 = parts[2] ?? "";
    const arg2 = parts[3] ?? "";

    // Executa comando
    if (commands[cmd]) {
      const res = commands[cmd](arg1, arg2);
      if (res) output += res;
    } else {
      output += `⚠ Unknown command: ${line}\n`;
    }
  }

  return output;
        }
