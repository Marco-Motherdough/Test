/* ---------------------------------------------------------------------
   Sound engine

   There are no audio assets in this project, so every sound is
   synthesized at runtime with the Web Audio API (oscillators + short
   filtered noise bursts) instead of shipping external files. The
   AudioContext is created lazily on first use, which also satisfies
   browsers' autoplay policies since every call here happens inside a
   real user-gesture event handler (click/input/submit).
--------------------------------------------------------------------- */

const soundToggle = document.getElementById("sound-toggle");
const soundIconOn = soundToggle.querySelector(".sound-icon-on");
const soundIconOff = soundToggle.querySelector(".sound-icon-off");

let audioCtx = null;
let masterGain = null;
let muted = false;

function ensureAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : 0.35;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

soundToggle.addEventListener("click", () => {
  muted = !muted;
  ensureAudio();
  masterGain.gain.value = muted ? 0 : 0.35;
  soundToggle.setAttribute("aria-pressed", String(muted));
  soundToggle.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
  soundIconOn.hidden = muted;
  soundIconOff.hidden = !muted;
});

function playTone({ freq = 440, startFreq, endFreq, type = "sine", duration = 0.15, attack = 0.004, gain = 0.5 }) {
  if (muted) return;
  const ctx = ensureAudio();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = type;
  if (startFreq && endFreq) {
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), now + duration);
  } else {
    osc.frequency.setValueAtTime(freq, now);
  }

  env.gain.setValueAtTime(0.0001, now);
  env.gain.linearRampToValueAtTime(gain, now + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(env).connect(masterGain);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playNoiseBurst({ duration = 0.12, filterType = "bandpass", freq = 1200, freqTo, q = 1, gain = 0.4 }) {
  if (muted) return;
  const ctx = ensureAudio();
  const now = ctx.currentTime;

  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, now);
  if (freqTo) filter.frequency.exponentialRampToValueAtTime(freqTo, now + duration);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, now);
  env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter).connect(env).connect(masterGain);
  noise.start(now);
  noise.stop(now + duration + 0.02);
}

const sfx = {
  click() {
    playTone({ freq: 720, type: "triangle", duration: 0.05, gain: 0.22 });
  },
  toggle() {
    playTone({ startFreq: 480, endFreq: 760, type: "square", duration: 0.07, gain: 0.16 });
  },
  pop() {
    playTone({ startFreq: 900, endFreq: 180, type: "sine", duration: 0.14, gain: 0.32 });
    playNoiseBurst({ duration: 0.05, filterType: "bandpass", freq: 2200, gain: 0.15 });
  },
  whoosh() {
    playNoiseBurst({ duration: 0.4, filterType: "bandpass", freq: 300, freqTo: 2600, q: 0.7, gain: 0.22 });
  },
  key() {
    playNoiseBurst({ duration: 0.018, filterType: "highpass", freq: 2800, gain: 0.14 });
  },
  activate() {
    playTone({ freq: 220, type: "sawtooth", duration: 0.22, gain: 0.2 });
    setTimeout(() => playTone({ freq: 440, type: "sawtooth", duration: 0.18, gain: 0.16 }), 90);
  },
  crack() {
    playNoiseBurst({ duration: 0.16, filterType: "bandpass", freq: 2200, freqTo: 500, q: 0.8, gain: 0.4 });
    const shardCount = 6;
    for (let i = 0; i < shardCount; i++) {
      setTimeout(() => {
        playTone({
          freq: 1800 + Math.random() * 2200,
          type: "sine",
          duration: 0.08 + Math.random() * 0.05,
          gain: 0.1,
        });
      }, Math.random() * 350);
    }
  },
  success() {
    [523, 659, 784].forEach((freq, i) => {
      setTimeout(() => playTone({ freq, type: "triangle", duration: 0.14, gain: 0.18 }), i * 80);
    });
  },
};

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
  sfx.toggle();
});

document.querySelectorAll(".btn-social").forEach((btn) => {
  btn.addEventListener("click", () => sfx.click());
});

document.querySelectorAll(".link-muted, .link-accent").forEach((link) => {
  link.addEventListener("click", () => sfx.click());
});

document.querySelectorAll(".checkbox input").forEach((checkbox) => {
  checkbox.addEventListener("change", () => sfx.toggle());
});

function popOrb(orb, respawn) {
  if (orb.classList.contains("popped")) return;
  orb.classList.add("popped");
  sfx.pop();
  if (respawn) {
    setTimeout(() => orb.classList.remove("popped"), 900);
  }
}

orbs.forEach((orb) => {
  orb.addEventListener("click", () => popOrb(orb, true));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sfx.whoosh();
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

document.querySelectorAll("#matrix-user, #matrix-key").forEach((input) => {
  input.addEventListener("input", () => sfx.key());
});

matrixForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sfx.activate();
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
  sfx.crack();

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
    sfx.success();

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
  sfx.key();
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
