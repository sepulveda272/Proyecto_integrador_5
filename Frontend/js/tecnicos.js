// js/tecnicos.js
// Responsabilidad: comportamiento compartido entre todas las páginas (sidebar)
// y gestión del grid de técnicos (solo en páginas que contengan #techGrid).
//
// CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR:
//   - Se eliminaron filtrarInspecciones(), abrirVistaLotes() y volverACards():
//     esas funciones son exclusivas de inspeccion.html y fueron movidas a
//     inspecciones.js, que es el módulo correcto para contenerlas.
//   - Se eliminó el bloque de comentario "ELIMINADO: mostrarToast()" ya que
//     la aclaración queda documentada aquí y en inspecciones.js.
//   - Se mantiene todo el CRUD de técnicos intacto: editTecnicoById(),
//     deleteTecnicoById(), renderTecnicos(), saveToLocal(), loadFromLocal()
//     e init() son utilizadas internamente dentro de la IIFE y por los
//     event listeners de delegación sobre #techGrid.

// ── Toggle sidebar (compartido en todas las páginas) ──────────
document.addEventListener('DOMContentLoaded', () => {
    document
        .getElementById('toggleSidebar')
        ?.addEventListener('click', function () {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('hidden');
            this.textContent = sidebar.classList.contains('hidden')
                ? '→ Mostrar menú'
                : '← Ocultar menú';
        });
});

// ── Grid de técnicos (solo en páginas que tengan #techGrid) ───
// Todo el bloque está encapsulado en una IIFE para evitar contaminar
// el scope global con variables de estado internas (tecnicos, etc.).
(() => {
    const BASE = window.location.pathname.includes('/PROYECTOINTEGRADOR/')
        ? '/PROYECTOINTEGRADOR'
        : '';

    const techGrid  = document.getElementById('techGrid');
    const techEmpty = document.getElementById('techEmpty');

    // Guard: si la página no tiene el grid de técnicos, no se ejecuta nada más.
    if (!techGrid) return;

    const TECH_URL = `${BASE}/data/tecnicos.json`;
    const LS_KEY   = 'tecnicosData';

    let tecnicos = [];

    // ── Helpers ───────────────────────────────────────────────

    /** Devuelve '—' para valores nulos, undefined o cadena vacía. */
    function safeText(v) {
        return v === undefined || v === null || v === '' ? '—' : String(v);
    }

    /** Verifica si una cadena es una URL HTTP/HTTPS completa. */
    function isHttp(url) {
        return /^https?:\/\//i.test(url);
    }

    /**
     * Resuelve la ruta de una foto de técnico.
     * Acepta URLs absolutas, rutas relativas al proyecto y data URIs.
     * Devuelve un placeholder genérico si la ruta está vacía.
     */
    function resolveAssetPath(path) {
        const fallback = 'https://thumbs.dreamstime.com/b/hombre-gris-del-placeholder-de-la-foto-persona-gen%C3%A9rica-silueta-en-un-fondo-blanco-144511705.jpg';
        if (!path) return fallback;
        if (isHttp(path) || path.startsWith('data:')) return path;
        if (path.startsWith('/')) return path;
        const clean = path.replace(/^\.?\//, '');
        return `${BASE}/${clean}`;
    }

    /** Genera un ID único para técnicos que no traen uno desde el JSON. */
    function makeId() {
        return `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }

    /**
     * Garantiza que cada técnico tenga la propiedad __id.
     * Prioridad: id → __id → numero_identificacion → ID generado.
     */
    function ensureIds(list) {
        return list.map(t => {
            const id = t.id || t.__id || t.numero_identificacion || makeId();
            return { ...t, __id: String(id) };
        });
    }

    // ── Persistencia en localStorage ──────────────────────────

    /** Guarda el arreglo actual de técnicos en localStorage. */
    function saveToLocal() {
        localStorage.setItem(LS_KEY, JSON.stringify({ tecnicos }));
    }

    /**
     * Carga técnicos desde localStorage.
     * Devuelve el arreglo si existe, o null si no hay datos previos.
     */
    function loadFromLocal() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed.tecnicos) ? parsed.tecnicos : null;
        } catch {
            return null;
        }
    }

    // ── Renderizado ───────────────────────────────────────────

    /**
     * Renderiza la lista de técnicos en el grid (#techGrid).
     * Si la lista está vacía, muestra el mensaje de #techEmpty.
     */
    function renderTecnicos(list) {
        techGrid.innerHTML = '';

        if (!list || !list.length) {
            if (techEmpty) {
                techEmpty.style.display  = 'block';
                techEmpty.textContent    = 'No hay técnicos para mostrar.';
            }
            return;
        }

        if (techEmpty) techEmpty.style.display = 'none';

        techGrid.innerHTML = list.map(t => {
            const idCard   = t.__id;
            const nombre   = safeText(t.nombre);
            const tipoId   = safeText(t.tipo_identificacion);
            const numeroId = safeText(t.numero_identificacion);
            const celular  = safeText(t.celular);
            const correo   = safeText(t.correo);
            const direccion= safeText(t.direccion);
            const foto     = resolveAssetPath(t.foto);
            const mailLink = correo  !== '—' ? `mailto:${correo}`                    : '#';
            const telLink  = celular !== '—' ? `tel:${celular.replace(/\s+/g, '')}` : '#';

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
                    <button type="button" class="tech-btn edit"   data-action="edit"   data-id="${idCard}">Actualizar</button>
                    <button type="button" class="tech-btn delete" data-action="delete" data-id="${idCard}">Eliminar</button>
                  </div>
                </div>
              </article>
            `;
        }).join('');
    }

    // ── CRUD de técnicos ──────────────────────────────────────

    /**
     * Abre prompts secuenciales para editar un técnico por su __id.
     * Si el usuario cancela cualquier prompt, la operación se aborta.
     * Uso: delegado desde el event listener de #techGrid (data-action="edit").
     */
    function editTecnicoById(id) {
        const idx = tecnicos.findIndex(t => t.__id === id);
        if (idx === -1) return;
        const t = tecnicos[idx];

        const nombre              = prompt('Nombre:', t.nombre ?? '');              if (nombre === null) return;
        const tipo_identificacion = prompt('Tipo de identificación:', t.tipo_identificacion ?? ''); if (tipo_identificacion === null) return;
        const numero_identificacion = prompt('Número de identificación:', t.numero_identificacion ?? ''); if (numero_identificacion === null) return;
        const celular             = prompt('Celular:', t.celular ?? '');            if (celular === null) return;
        const correo              = prompt('Correo:', t.correo ?? '');              if (correo === null) return;
        const direccion           = prompt('Dirección:', t.direccion ?? '');        if (direccion === null) return;
        const foto                = prompt('Ruta de foto (ej: img/tecnicos/juan.jpg) o deja vacío:', t.foto ?? ''); if (foto === null) return;

        tecnicos[idx] = {
            ...t,
            nombre:               nombre.trim(),
            tipo_identificacion:  tipo_identificacion.trim(),
            numero_identificacion:numero_identificacion.trim(),
            celular:              celular.trim(),
            correo:               correo.trim(),
            direccion:            direccion.trim(),
            foto:                 foto.trim(),
        };

        saveToLocal();
        renderTecnicos(tecnicos);
    }

    /**
     * Solicita confirmación y elimina un técnico por su __id.
     * Uso: delegado desde el event listener de #techGrid (data-action="delete").
     */
    function deleteTecnicoById(id) {
        const t = tecnicos.find(x => x.__id === id);
        if (!t) return;
        const ok = confirm(`¿Seguro que quieres eliminar a "${t.nombre ?? 'este técnico'}"?`);
        if (!ok) return;
        tecnicos = tecnicos.filter(x => x.__id !== id);
        saveToLocal();
        renderTecnicos(tecnicos);
    }

    // Delegación de eventos: un solo listener maneja todos los botones del grid
    techGrid.addEventListener('click', e => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'edit')   editTecnicoById(id);
        if (action === 'delete') deleteTecnicoById(id);
    });

    // ── Inicialización ────────────────────────────────────────

    /**
     * Carga los técnicos: primero intenta localStorage (datos editados por el
     * usuario), y si no hay nada guardado, hace fetch al JSON del servidor.
     */
    async function init() {
        const local = loadFromLocal();
        if (local) {
            tecnicos = ensureIds(local);
            saveToLocal();
            renderTecnicos(tecnicos);
            return;
        }

        try {
            const res = await fetch(TECH_URL, { cache: 'no-store' });
            if (!res.ok) throw new Error('No se pudo cargar data/tecnicos.json');
            const data = await res.json();
            const list = Array.isArray(data.tecnicos) ? data.tecnicos : [];
            tecnicos   = ensureIds(list);
            saveToLocal();
            renderTecnicos(tecnicos);
        } catch (err) {
            console.error(err);
            techGrid.innerHTML = '';
            if (techEmpty) {
                techEmpty.style.display = 'block';
                techEmpty.textContent   = err.message || 'Error cargando técnicos.';
            }
        }
    }

    init();
})();