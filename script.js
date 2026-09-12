const form = document.getElementById("signin-form");
const passwordInput = document.getElementById("password");
const toggleBtn = document.getElementById("toggle-visibility");
const orbs = document.querySelectorAll(".orb");
const matrixScreen = document.getElementById("matrix-screen");
const matrixInner = document.getElementById("matrix-inner");
const matrixCanvas = document.getElementById("matrix-canvas");
const matrixForm = document.getElementById("matrix-form");
const crackOverlay = document.getElementById("crack-overlay");
const transitionVeil = document.getElementById("transition-veil");
const notesScreen = document.getElementById("notes-screen");
const notesClock = document.getElementById("notes-clock");
const notesArea = document.getElementById("notes-area");
const notesCount = document.getElementById("notes-count");

toggleBtn.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  toggleBtn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
});

function popOrb(orb, respawn) {
  if (orb.classList.contains("popped")) return;
  orb.classList.add("popped");
  if (respawn) {
    setTimeout(() => orb.classList.remove("popped"), 900);
  }
}

orbs.forEach((orb) => {
  orb.addEventListener("click", () => popOrb(orb, true));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const submitBtn = form.querySelector(".btn-primary");
  submitBtn.innerHTML = "<span>Signing in…</span>";
  submitBtn.disabled = true;

  orbs.forEach((orb, i) => {
    setTimeout(() => popOrb(orb, false), i * 120);
  });

  setTimeout(() => {
    document.body.classList.add("leaving");
  }, orbs.length * 120 + 500);

  setTimeout(() => {
    matrixScreen.hidden = false;
    startMatrixRain();
  }, orbs.length * 120 + 1100);
});

matrixForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const btn = matrixForm.querySelector(".matrix-btn");
  btn.textContent = "ACCESS GRANTED";
  btn.disabled = true;

  matrixInner.classList.add("shaking");
  crackOverlay.classList.add("show");

  setTimeout(() => {
    transitionVeil.classList.add("show");
  }, 250);

  setTimeout(() => {
    matrixScreen.hidden = true;
    matrixInner.classList.remove("shaking");
    crackOverlay.classList.remove("show");
    notesScreen.hidden = false;
    startNotesClock();
  }, 650);

  setTimeout(() => {
    transitionVeil.classList.remove("show");
  }, 750);
});

function startNotesClock() {
  function tick() {
    notesClock.textContent = new Date().toLocaleTimeString("en-GB", { hour12: false });
  }
  tick();
  setInterval(tick, 1000);
}

notesArea.addEventListener("input", () => {
  const len = notesArea.value.length;
  notesCount.textContent = `${len} CHARACTER${len === 1 ? "" : "S"}`;
});

let matrixAnimationId = null;

function startMatrixRain() {
  if (matrixAnimationId) return;

  const ctx = matrixCanvas.getContext("2d");
  const chars = "アイウエオカキクケコサシスセソ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const fontSize = 16;
  let columns = 0;
  let drops = [];

  function resize() {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    columns = Math.floor(matrixCanvas.width / fontSize);
    drops = Array.from({ length: columns }, () => Math.floor((Math.random() * matrixCanvas.height) / fontSize));
  }

  resize();
  window.addEventListener("resize", resize);

  function draw() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    ctx.fillStyle = "#00ff41";
    ctx.font = `${fontSize}px monospace`;

    drops.forEach((y, i) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      ctx.fillText(char, x, y * fontSize);

      if (y * fontSize > matrixCanvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      } else {
        drops[i] = y + 1;
      }
    });

    matrixAnimationId = requestAnimationFrame(draw);
  }

  draw();
}
