const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");
const btn = document.getElementById("btnLogin");

function showMessage(text) {
  msg.textContent = text;
  msg.classList.remove("d-none");
}

function hideMessage() {
  msg.classList.add("d-none");
  msg.textContent = "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessage();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  btn.disabled = true;
  btn.textContent = "Validando...";

  try {
    // Ajusta la ruta si tu JSON está en otro lugar
    const res = await fetch("/data/usuarios.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo leer el archivo de usuarios.");

    const data = await res.json();
    const usuarios = data.usuarios || [];

    const user = usuarios.find(
      (u) => (u.email || "").toLowerCase() === email && u.password === password
    );

    if (!user) {
      showMessage("Correo o contraseña incorrectos.");
      return;
    }

    // Guardar “sesión” simple (opcional)
    localStorage.setItem("authUser", JSON.stringify({
      email: user.email,
      nombre: user.nombre
    }));

    // ✅ Redirigir a la página principal
    window.location.href = "../tecnicoOf/GestionarTec.html";

  } catch (err) {
    showMessage(err.message || "Ocurrió un error al iniciar sesión.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Iniciar Sesión";
  }
});