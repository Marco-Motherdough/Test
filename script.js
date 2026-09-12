const form = document.getElementById("signin-form");
const passwordInput = document.getElementById("password");
const toggleBtn = document.getElementById("toggle-visibility");
const orbs = document.querySelectorAll(".orb");
const matrixScreen = document.getElementById("matrix-screen");
const matrixInner = document.getElementById("matrix-inner");
const matrixCanvas = document.getElementById("matrix-canvas");
const matrixForm = document.getElementById("matrix-form");
const crackOverlay = document.getElementById("crack-overlay");
const shatterShards = document.getElementById("shatter-shards");
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

function buildShatterShards(centerX, centerY) {
  shatterShards.innerHTML = "";
  shatterShards.classList.remove("fly");

  const count = 11;
  const step = 360 / count;

  for (let i = 0; i < count; i++) {
    const a0 = i * step + (Math.random() * 10 - 5);
    const a1 = (i + 1) * step + (Math.random() * 10 - 5);
    const mid = (a0 + a1) / 2;
    const outerR = 150;
    const jagR = 55 + Math.random() * 25;

    const toPoint = (angleDeg, radius) => {
      const rad = (angleDeg * Math.PI) / 180;
      return [centerX + Math.cos(rad) * radius, centerY + Math.sin(rad) * radius];
    };

    const [x0, y0] = toPoint(a0, outerR);
    const [xm, ym] = toPoint(mid, jagR);
    const [x1, y1] = toPoint(a1, outerR);

    const shard = document.createElement("div");
    shard.className = "shard";
    shard.style.clipPath = `polygon(${centerX}% ${centerY}%, ${x0}% ${y0}%, ${xm}% ${ym}%, ${x1}% ${y1}%)`;

    const flyRad = (mid * Math.PI) / 180;
    const dist = 35 + Math.random() * 40;
    shard.style.setProperty("--dx", `${(Math.cos(flyRad) * dist).toFixed(1)}vw`);
    shard.style.setProperty("--dy", `${(Math.sin(flyRad) * dist).toFixed(1)}vh`);
    shard.style.setProperty("--rot", `${(Math.random() * 150 - 75).toFixed(0)}deg`);
    shard.style.transitionDelay = `${Math.floor(Math.random() * 90)}ms`;

    shatterShards.appendChild(shard);
  }

  shatterShards.hidden = false;
  void shatterShards.offsetWidth;
  requestAnimationFrame(() => shatterShards.classList.add("fly"));
}

matrixForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const btn = matrixForm.querySelector(".matrix-btn");
  btn.textContent = "ACCESS GRANTED";
  btn.disabled = true;

  // Stop the rain loop and freeze the background bubbles so the crack/
  // shatter sequence isn't fighting other animations for the main thread
  // on slower devices.
  stopMatrixRain();
  document.body.classList.add("frozen");

  matrixInner.classList.add("shaking");
  crackOverlay.classList.add("show");

  setTimeout(() => {
    buildShatterShards(50, 48);
  }, 300);

  setTimeout(() => {
    transitionVeil.classList.add("show");
  }, 500);

  // The screen swap has to happen once the veil is actually opaque, not
  // just after a guessed delay -- on a loaded main thread the earlier
  // timers can land late, and swapping before the veil finishes covers
  // the screen would flash the cut. transitionend gives the real signal.
  function onVeilCovered(e) {
    if (e.propertyName !== "opacity" || !transitionVeil.classList.contains("show")) return;
    transitionVeil.removeEventListener("transitionend", onVeilCovered);

    matrixScreen.hidden = true;
    matrixInner.classList.remove("shaking");
    crackOverlay.classList.remove("show");
    shatterShards.hidden = true;
    shatterShards.classList.remove("fly");
    shatterShards.innerHTML = "";
    notesScreen.hidden = false;
    startNotesClock();

    setTimeout(() => transitionVeil.classList.remove("show"), 120);
  }
  transitionVeil.addEventListener("transitionend", onVeilCovered);
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

function stopMatrixRain() {
  if (matrixAnimationId) {
    cancelAnimationFrame(matrixAnimationId);
    matrixAnimationId = null;
  }
}
