// js/tecnicos.js

// ── Toggle sidebar (todas las páginas) ────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("toggleSidebar")
    ?.addEventListener("click", function () {
      const sidebar = document.querySelector(".sidebar");
      sidebar.classList.toggle("hidden");
      this.textContent = sidebar.classList.contains("hidden")
        ? "→ Mostrar menú"
        : "← Ocultar menú";
    });
});

// ── Grid de técnicos (solo en páginas que tengan #techGrid) ───
(() => {
  const BASE = window.location.pathname.includes("/PROYECTOINTEGRADOR/")
    ? "/PROYECTOINTEGRADOR"
    : "";

  const techGrid = document.getElementById("techGrid");
  const techEmpty = document.getElementById("techEmpty");

  if (!techGrid) return;

  const TECH_URL = `${BASE}/data/tecnicos.json`;
  const LS_KEY = "tecnicosData";

  let tecnicos = [];

  function safeText(v) {
    return v === undefined || v === null || v === "" ? "—" : String(v);
  }

  function isHttp(url) {
    return /^https?:\/\//i.test(url);
  }

  function resolveAssetPath(path) {
    const fallback = `https://thumbs.dreamstime.com/b/hombre-gris-del-placeholder-de-la-foto-persona-gen%C3%A9rica-silueta-en-un-fondo-blanco-144511705.jpg`;
    if (!path) return fallback;
    if (isHttp(path) || path.startsWith("data:")) return path;
    if (path.startsWith("/")) return path;
    const clean = path.replace(/^\.?\//, "");
    return `${BASE}/${clean}`;
  }

  function makeId() {
    return `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function ensureIds(list) {
    return list.map((t) => {
      const id = t.id || t.__id || t.numero_identificacion || makeId();
      return { ...t, __id: String(id) };
    });
  }

  function saveToLocal() {
    localStorage.setItem(LS_KEY, JSON.stringify({ tecnicos }));
  }

  function loadFromLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.tecnicos)) return parsed.tecnicos;
      return null;
    } catch {
      return null;
    }
  }

  function renderTecnicos(list) {
    techGrid.innerHTML = "";

    if (!list || !list.length) {
      if (techEmpty) {
        techEmpty.style.display = "block";
        techEmpty.textContent = "No hay técnicos para mostrar.";
      }
      return;
    } else {
      if (techEmpty) techEmpty.style.display = "none";
    }

    techGrid.innerHTML = list
      .map((t) => {
        const idCard = t.__id;
        const nombre = safeText(t.nombre);
        const tipoId = safeText(t.tipo_identificacion);
        const numeroId = safeText(t.numero_identificacion);
        const celular = safeText(t.celular);
        const correo = safeText(t.correo);
        const direccion = safeText(t.direccion);
        const foto = resolveAssetPath(t.foto);
        const mailLink = correo !== "—" ? `mailto:${correo}` : "#";
        const telLink = celular !== "—" ? `tel:${celular.replace(/\s+/g, "")}` : "#";

        return `
          <article class="tech-card">
            <div class="tech-photo">
              <img src="${foto}" alt="Foto de ${nombre}"
                   onerror="this.src='${BASE}/img/user-placeholder.png'">
            </div>
            <div class="tech-info">
              <div class="tech-name">${nombre}</div>
              <div class="tech-row"><span class="label">Tipo ID:</span><span class="value">${tipoId}</span></div>
              <div class="tech-row"><span class="label">N° ID:</span><span class="value">${numeroId}</span></div>
              <div class="tech-row"><span class="label">Celular:</span><a class="value" href="${telLink}">${celular}</a></div>
              <div class="tech-row"><span class="label">Correo:</span><a class="value" href="${mailLink}">${correo}</a></div>
              <div class="tech-row"><span class="label">Dirección:</span><span class="value">${direccion}</span></div>
              <div class="tech-actions">
                <button type="button" class="tech-btn edit" data-action="edit" data-id="${idCard}">Actualizar</button>
                <button type="button" class="tech-btn delete" data-action="delete" data-id="${idCard}">Eliminar</button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function editTecnicoById(id) {
    const idx = tecnicos.findIndex((t) => t.__id === id);
    if (idx === -1) return;
    const t = tecnicos[idx];

    const nombre = prompt("Nombre:", t.nombre ?? "");
    if (nombre === null) return;
    const tipo_identificacion = prompt("Tipo de identificación:", t.tipo_identificacion ?? "");
    if (tipo_identificacion === null) return;
    const numero_identificacion = prompt("Número de identificación:", t.numero_identificacion ?? "");
    if (numero_identificacion === null) return;
    const celular = prompt("Celular:", t.celular ?? "");
    if (celular === null) return;
    const correo = prompt("Correo:", t.correo ?? "");
    if (correo === null) return;
    const direccion = prompt("Dirección:", t.direccion ?? "");
    if (direccion === null) return;
    const foto = prompt("Ruta de foto (ej: img/tecnicos/juan.jpg) o deja vacío:", t.foto ?? "");
    if (foto === null) return;

    tecnicos[idx] = {
      ...t,
      nombre: nombre.trim(),
      tipo_identificacion: tipo_identificacion.trim(),
      numero_identificacion: numero_identificacion.trim(),
      celular: celular.trim(),
      correo: correo.trim(),
      direccion: direccion.trim(),
      foto: foto.trim(),
    };

    saveToLocal();
    renderTecnicos(tecnicos);
  }

  function deleteTecnicoById(id) {
    const t = tecnicos.find((x) => x.__id === id);
    if (!t) return;
    const ok = confirm(`¿Seguro que quieres eliminar a "${t.nombre ?? "este técnico"}"?`);
    if (!ok) return;
    tecnicos = tecnicos.filter((x) => x.__id !== id);
    saveToLocal();
    renderTecnicos(tecnicos);
  }

  techGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === "edit") editTecnicoById(id);
    if (action === "delete") deleteTecnicoById(id);
  });

  async function init() {
    const local = loadFromLocal();
    if (local) {
      tecnicos = ensureIds(local);
      saveToLocal();
      renderTecnicos(tecnicos);
      return;
    }

    try {
      const res = await fetch(TECH_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar data/tecnicos.json");
      const data = await res.json();
      const list = Array.isArray(data.tecnicos) ? data.tecnicos : [];
      tecnicos = ensureIds(list);
      saveToLocal();
      renderTecnicos(tecnicos);
    } catch (err) {
      console.error(err);
      techGrid.innerHTML = "";
      if (techEmpty) {
        techEmpty.style.display = "block";
        techEmpty.textContent = err.message || "Error cargando técnicos.";
      }
    }
  }

  init();
})();

// ── Filtros de inspección ──────────────────────────────────────
function filtrarInspecciones(estado, btn) {
  document.querySelectorAll(".filtro").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  document.querySelectorAll("#seccion-cards .card").forEach((card) => {
    if (estado === "todos" || card.dataset.estado === estado) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
}

// ── Navegación de lotes ────────────────────────────────────────
function abrirVistaLotes(nombre, ubicacion) {
  document.getElementById("seccion-cards").style.display = "none";
  document.querySelector(".header").style.display = "none";

  const secLotes = document.getElementById("seccion-lotes");
  secLotes.style.display = "block";
  document.getElementById("lotes-titulo").textContent = "Lotes — " + nombre;
  document.getElementById("lotes-sub").textContent = ubicacion + " · Inspección en curso";
}

function volverACards() {
  document.getElementById("seccion-lotes").style.display = "none";
  document.getElementById("seccion-cards").style.display = "grid";
  document.querySelector(".header").style.display = "flex";
}

/*
 * ELIMINADO: mostrarToast() — ya está definida en inspecciones.js,
 * que se carga antes que este archivo en todas las páginas que la necesitan.
 */