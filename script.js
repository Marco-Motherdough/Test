const form = document.getElementById("signin-form");
const passwordInput = document.getElementById("password");
const toggleBtn = document.getElementById("toggle-visibility");

toggleBtn.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  toggleBtn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const submitBtn = form.querySelector(".btn-primary");
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = "<span>Signing in…</span>";
  submitBtn.disabled = true;
  setTimeout(() => {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }, 1200);
});

document.querySelectorAll(".orb").forEach((orb) => {
  orb.addEventListener("click", () => {
    if (orb.classList.contains("popped")) return;
    orb.classList.add("popped");
    setTimeout(() => orb.classList.remove("popped"), 900);
  });
});
