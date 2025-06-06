document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("run-nx-btn");
  runBtn.addEventListener("click", executarNXPlus);
});

function executarNXPlus() {
  const input = document.getElementById("nx-code-input").value;
  const output = document.getElementById("nx-output");
  output.textContent = ""; // Limpa a saída

  const linhas = input.split("\n");
  const variaveis = {};
  let dentroDeIF = false;
  let podeExecutar = true;
  let dentroDeLIST = false;

  for (let linha of linhas) {
    linha = linha.trim();

    if (linha.startsWith("SET ")) {
      const match = linha.match(/SET (\w+) = "(.*)"/);
      if (match) variaveis[match[1]] = match[2];
    }

    else if (linha.startsWith("P ")) {
      const match = linha.match(/P "(.*)"/);
      if (match && podeExecutar) {
        const texto = substituirVariaveis(match[1], variaveis);
        output.textContent += texto + "\n";
      }
    }

    else if (linha.startsWith("H ")) {
      const match = linha.match(/H "(.*)"/);
      if (match && podeExecutar) {
        output.textContent += "# " + substituirVariaveis(match[1], variaveis) + "\n";
      }
    }

    else if (linha.startsWith("BTN ")) {
      const match = linha.match(/BTN "(.*)"/);
      if (match && podeExecutar) {
        output.textContent += "[Botão: " + substituirVariaveis(match[1], variaveis) + "]\n";
      }
    }

    else if (linha.startsWith("IMG ")) {
      const match = linha.match(/IMG "(.*)"/);
      if (match && podeExecutar) {
        output.textContent += "[Imagem: " + substituirVariaveis(match[1], variaveis) + "]\n";
      }
    }

    else if (linha === "LIST") {
      dentroDeLIST = true;
      output.textContent += "• Lista:\n";
    }

    else if (linha === "/LIST") {
      dentroDeLIST = false;
    }

    else if (linha.startsWith("ITEM ") && dentroDeLIST && podeExecutar) {
      const match = linha.match(/ITEM "(.*)"/);
      if (match) {
        output.textContent += "  - " + substituirVariaveis(match[1], variaveis) + "\n";
      }
    }

    else if (linha.startsWith("IF ")) {
      const match = linha.match(/IF (\w+) == "(.*)"/);
      if (match) {
        const valor = variaveis[match[1]];
        podeExecutar = valor === match[2];
        dentroDeIF = true;
      }
    }

    else if (linha === "/IF") {
      dentroDeIF = false;
      podeExecutar = true;
    }
  }
}

function substituirVariaveis(texto, variaveis) {
  return texto.replace(/\{(\w+)\}/g, (_, chave) => variaveis[chave] || "");
             }
