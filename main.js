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

  function interpretNXPlus(code) {
    const lines = code.split("\n");
    let output = "";
    lines.forEach(line => {
      line = line.trim();
      if (line.startsWith("P")) {
        output += line.replace(/^P\s*"(.+?)"\s*\/P$/i, "$1") + "\n";
      } else if (line.startsWith("H")) {
        output += line.replace(/^H\s*"(.+?)"\s*\/H$/i, "🔹 $1") + "\n";
      } else if (line.startsWith("F")) {
        output += "[ " + line.replace(/^F\s*"(.+?)"\s*\/F$/i, "$1") + " ]\n";
      } else {
        output += "⚠ Unknown command: " + line + "\n";
      }
    });
    return output;
  }
});
