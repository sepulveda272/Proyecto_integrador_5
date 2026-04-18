const auth = localStorage.getItem("authUser");

// Si no hay sesión, devolver al login
if (!auth) {
  window.location.href = "../login/login.html"; // ajusta si tu login tiene otro nombre
} else {
  const user = JSON.parse(auth);

  // Mostrar nombre en el topbar
  const userNameEl = document.getElementById("userName");
  if (userNameEl) userNameEl.textContent = user.nombre || user.email;
}

// Cerrar sesión
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("authUser");
    window.location.href = "../login/login.html"; // ajusta si tu login tiene otro nombre
  });
}