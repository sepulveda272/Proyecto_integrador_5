/**
 * SIFEX — admin.js
 * Vista: Gestión de Usuarios
 *
 * RESPONSABILIDADES (solo lógica — la estructura vive en el HTML):
 *  1. Datos simulados de usuarios en memoria
 *  2. Estado de la vista (tab activa, búsqueda)
 *  3. Renderizar filas de la tabla según filtros
 *  4. Cambio de tabs (Todos / Técnico / Productor / Funcionario ICA)
 *  5. Búsqueda en tiempo real por nombre o correo
 *  6. CRUD: Ver, Crear, Editar, Eliminar (simulado en memoria)
 *  7. Modales: abrir, cerrar, poblar datos
 *  8. Toasts de notificación
 *
 * CONVENCIÓN: todas las funciones privadas comienzan con minúscula.
 *             Las constantes de configuración van en MAYÚSCULAS.
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   1. DATOS SIMULADOS
   Fuente de verdad mientras no haya backend.
   Estructura de cada usuario:
   { id, nombre, correo, telefono, region, rol, estado }
══════════════════════════════════════════════════════════ */
const usuarios = [
  // Técnicos
  { id: 1,  nombre: 'Carlos Ramírez',   correo: 'c.ramirez@sifex.co',    telefono: '310 555 0101', region: 'Santander',       rol: 'tecnico',     estado: 'activo'   },
  { id: 2,  nombre: 'Luisa Mendoza',    correo: 'l.mendoza@sifex.co',    telefono: '315 555 0202', region: 'Boyacá',          rol: 'tecnico',     estado: 'activo'   },
  { id: 3,  nombre: 'Andrés Pinto',     correo: 'a.pinto@sifex.co',      telefono: '320 555 0303', region: 'Cundinamarca',    rol: 'tecnico',     estado: 'inactivo' },
  // Productores
  { id: 4,  nombre: 'María Torres',     correo: 'm.torres@correo.com',   telefono: '300 555 0404', region: 'Antioquia',       rol: 'productor',   estado: 'activo'   },
  { id: 5,  nombre: 'Jorge Salcedo',    correo: 'j.salcedo@correo.com',  telefono: '312 555 0505', region: 'Huila',           rol: 'productor',   estado: 'activo'   },
  { id: 6,  nombre: 'Patricia Gómez',   correo: 'p.gomez@correo.com',    telefono: '316 555 0606', region: 'Nariño',          rol: 'productor',   estado: 'inactivo' },
  { id: 7,  nombre: 'Ricardo Herrera',  correo: 'r.herrera@correo.com',  telefono: '318 555 0707', region: 'Tolima',          rol: 'productor',   estado: 'activo'   },
  // Funcionarios ICA
  { id: 8,  nombre: 'Sofía Castillo',   correo: 's.castillo@ica.gov.co', telefono: '301 555 0808', region: 'Bogotá D.C.',     rol: 'funcionario', estado: 'activo'   },
  { id: 9,  nombre: 'Miguel Vargas',    correo: 'm.vargas@ica.gov.co',   telefono: '305 555 0909', region: 'Valle del Cauca', rol: 'funcionario', estado: 'activo'   },
  { id: 10, nombre: 'Valentina Rueda',  correo: 'v.rueda@ica.gov.co',    telefono: '311 555 1010', region: 'Córdoba',         rol: 'funcionario', estado: 'inactivo' },
];


/* ══════════════════════════════════════════════════════════
   2. CONFIGURACIÓN Y ESTADO
══════════════════════════════════════════════════════════ */

/** Etiquetas legibles para cada valor de rol */
const ROL_LABELS = {
  tecnico:     'Técnico',
  productor:   'Productor',
  funcionario: 'Funcionario ICA',
};

/** Clase CSS del badge según rol */
const ROL_BADGE_CLASS = {
  tecnico:     'gu-badge-rol--tecnico',
  productor:   'gu-badge-rol--productor',
  funcionario: 'gu-badge-rol--funcionario',
};

/** Estado mutable de la vista */
const estado = {
  rolActivo:   'todos',  // tab seleccionada actualmente
  filtroBusq:  '',       // texto escrito en el buscador
  modalModo:   null,     // 'crear' | 'editar'
  usuarioEdit: null,     // referencia al usuario en edición
  usuarioElim: null,     // referencia al usuario a eliminar
  nextId:      11,       // ID autoincremental para nuevos usuarios
};

/** Timer del toast (para limpiar si se llama de nuevo antes de expirar) */
let _toastTimer = null;


/* ══════════════════════════════════════════════════════════
   3. INICIALIZACIÓN
   Se ejecuta cuando el DOM está listo.
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  asignarEventos();
  actualizarBadges();
  renderizarTabla();
});


/* ══════════════════════════════════════════════════════════
   4. EVENTOS GLOBALES
   Un único lugar donde se conectan todos los listeners.
   Los eventos de botones de fila se asignan en renderizarTabla().
══════════════════════════════════════════════════════════ */
function asignarEventos() {

  /* ── Tabs de filtro por rol ─────────────────────────── */
  document.querySelectorAll('.gu-tab').forEach(btn => {
    btn.addEventListener('click', () => cambiarTab(btn.dataset.rol));
  });

  /* ── Búsqueda en tiempo real ────────────────────────── */
  document.getElementById('gu-busqueda')
    ?.addEventListener('input', e => {
      estado.filtroBusq = e.target.value;
      renderizarTabla();
    });

  /* ── Botón "Nuevo usuario" ──────────────────────────── */
  document.getElementById('gu-btn-nuevo')
    ?.addEventListener('click', abrirCrear);

  /* ── Modal formulario: cerrar ───────────────────────── */
  document.getElementById('gu-modal-close')
    ?.addEventListener('click', cerrarModalForm);
  document.getElementById('gu-form-cancelar')
    ?.addEventListener('click', cerrarModalForm);
  // Clic en el overlay fuera del modal también lo cierra
  document.getElementById('gu-modal-form')
    ?.addEventListener('click', e => {
      if (e.target === e.currentTarget) cerrarModalForm();
    });

  /* ── Modal formulario: guardar ──────────────────────── */
  document.getElementById('gu-form-guardar')
    ?.addEventListener('click', guardarUsuario);

  /* ── Modal "Ver detalle": cerrar ────────────────────── */
  document.getElementById('gu-ver-close')
    ?.addEventListener('click', cerrarModalVer);
  document.getElementById('gu-ver-cancelar')
    ?.addEventListener('click', cerrarModalVer);
  document.getElementById('gu-modal-ver')
    ?.addEventListener('click', e => {
      if (e.target === e.currentTarget) cerrarModalVer();
    });

  /* ── Modal confirmación eliminar ────────────────────── */
  document.getElementById('gu-confirm-cancelar')
    ?.addEventListener('click', cerrarModalConfirm);
  document.getElementById('gu-modal-confirm')
    ?.addEventListener('click', e => {
      if (e.target === e.currentTarget) cerrarModalConfirm();
    });
  document.getElementById('gu-confirm-ok')
    ?.addEventListener('click', confirmarEliminar);

  /* ── Teclado: Escape cierra cualquier modal abierto ─── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      cerrarModalForm();
      cerrarModalConfirm();
      cerrarModalVer();
    }
  });
}


/* ══════════════════════════════════════════════════════════
   5. RENDERIZAR TABLA
   Filtra los usuarios según tab activa y búsqueda,
   genera el HTML de las filas y actualiza el contador.
══════════════════════════════════════════════════════════ */
function renderizarTabla() {
  const tbody     = document.getElementById('gu-tbody');
  const empty     = document.getElementById('gu-empty');
  const infoCount = document.getElementById('gu-info-count');
  if (!tbody) return;

  // 1. Aplicar filtros
  const filtrados = usuarios.filter(u => {
    const coincideRol  = estado.rolActivo === 'todos' || u.rol === estado.rolActivo;
    const q            = estado.filtroBusq.toLowerCase().trim();
    const coincideBusq = !q
      || u.nombre.toLowerCase().includes(q)
      || u.correo.toLowerCase().includes(q);
    return coincideRol && coincideBusq;
  });

  // 2. Mostrar estado vacío o filas
  if (filtrados.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
  } else {
    empty.hidden = true;
    tbody.innerHTML = filtrados.map(generarFila).join('');

    // 3. Asignar eventos a los botones de acción de cada fila
    filtrados.forEach(u => {
      document.getElementById(`btn-ver-${u.id}`)
        ?.addEventListener('click', () => abrirVer(u));
      document.getElementById(`btn-editar-${u.id}`)
        ?.addEventListener('click', () => abrirEditar(u));
      document.getElementById(`btn-eliminar-${u.id}`)
        ?.addEventListener('click', () => abrirConfirmEliminar(u));
    });
  }

  // 4. Actualizar texto del contador
  const totalRol = estado.rolActivo === 'todos'
    ? usuarios.length
    : usuarios.filter(u => u.rol === estado.rolActivo).length;

  infoCount.innerHTML =
    `Mostrando <strong>${filtrados.length}</strong> de <strong>${totalRol}</strong> usuario${totalRol !== 1 ? 's' : ''}`;
}

/**
 * Genera el HTML de una fila <tr> para un usuario dado.
 * Solo filas — la estructura de la tabla vive en el HTML.
 * @param {Object} u - Objeto usuario
 * @returns {string} HTML de la fila
 */
function generarFila(u) {
  // Iniciales del nombre (máx. 2 palabras)
  const iniciales = u.nombre
    .split(' ')
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase();

  const rolLabel = ROL_LABELS[u.rol] || u.rol;
  const rolClass = ROL_BADGE_CLASS[u.rol] || '';
  const estadoLabel = u.estado.charAt(0).toUpperCase() + u.estado.slice(1);

  return `
    <tr>
      <!-- Columna: avatar + nombre + correo -->
      <td>
        <div class="gu-cell-usuario">
          <span class="gu-avatar" aria-hidden="true">${iniciales}</span>
          <div>
            <div class="gu-cell-usuario__nombre">${escHTML(u.nombre)}</div>
            <div class="gu-cell-usuario__email">${escHTML(u.correo)}</div>
          </div>
        </div>
      </td>

      <!-- Columna: teléfono -->
      <td>${escHTML(u.telefono || '—')}</td>

      <!-- Columna: región -->
      <td>${escHTML(u.region || '—')}</td>

      <!-- Columna: badge de rol -->
      <td>
        <span class="gu-badge-rol ${rolClass}">${rolLabel}</span>
      </td>

      <!-- Columna: badge de estado -->
      <td>
        <span class="gu-badge-estado gu-badge-estado--${u.estado}">
          ${estadoLabel}
        </span>
      </td>

      <!-- Columna: acciones (Ver · Editar · Eliminar) -->
      <td>
        <div class="gu-acciones">

          <!-- Ver detalle -->
          <button
            class="gu-btn-accion gu-btn-accion--ver"
            id="btn-ver-${u.id}"
            title="Ver detalle"
            aria-label="Ver detalle de ${escHTML(u.nombre)}"
          >
            ${SVG_ICONS.ver}
          </button>

          <!-- Editar -->
          <button
            class="gu-btn-accion gu-btn-accion--editar"
            id="btn-editar-${u.id}"
            title="Editar usuario"
            aria-label="Editar ${escHTML(u.nombre)}"
          >
            ${SVG_ICONS.editar}
          </button>

          <!-- Eliminar -->
          <button
            class="gu-btn-accion gu-btn-accion--eliminar"
            id="btn-eliminar-${u.id}"
            title="Eliminar usuario"
            aria-label="Eliminar ${escHTML(u.nombre)}"
          >
            ${SVG_ICONS.eliminar}
          </button>

        </div>
      </td>
    </tr>`;
}


/* ══════════════════════════════════════════════════════════
   6. BADGES DE LAS TABS
   Actualiza los contadores numéricos de cada pestaña.
══════════════════════════════════════════════════════════ */
function actualizarBadges() {
  // Tab "Todos"
  const badgeTodos = document.getElementById('badge-todos');
  if (badgeTodos) badgeTodos.textContent = usuarios.length;

  // Tabs por rol
  ['tecnico', 'productor', 'funcionario'].forEach(rol => {
    const badge = document.getElementById(`badge-${rol}`);
    if (badge) badge.textContent = usuarios.filter(u => u.rol === rol).length;
  });
}


/* ══════════════════════════════════════════════════════════
   7. CAMBIO DE TAB
══════════════════════════════════════════════════════════ */
/**
 * Cambia la tab activa y refresca la tabla.
 * @param {string} nuevoRol - 'todos' | 'tecnico' | 'productor' | 'funcionario'
 */
function cambiarTab(nuevoRol) {
  estado.rolActivo  = nuevoRol;
  estado.filtroBusq = '';

  // Limpiar el campo de búsqueda visualmente
  const busqInput = document.getElementById('gu-busqueda');
  if (busqInput) busqInput.value = '';

  // Actualizar clases y atributos aria de cada tab
  document.querySelectorAll('.gu-tab').forEach(btn => {
    const esActiva = btn.dataset.rol === nuevoRol;
    btn.classList.toggle('activa', esActiva);
    btn.setAttribute('aria-selected', String(esActiva));
  });

  renderizarTabla();
}


/* ══════════════════════════════════════════════════════════
   8. ACCIÓN: VER DETALLE
══════════════════════════════════════════════════════════ */
/**
 * Abre el modal de solo lectura con los datos del usuario.
 * @param {Object} u - Usuario a mostrar
 */
function abrirVer(u) {
  const contenido = document.getElementById('gu-ver-contenido');
  if (!contenido) return;

  // Generar el grid de etiqueta/valor
  contenido.innerHTML = `
    <span class="gu-ver-label">Nombre</span>
    <span class="gu-ver-valor">${escHTML(u.nombre)}</span>

    <span class="gu-ver-label">Correo</span>
    <span class="gu-ver-valor">${escHTML(u.correo)}</span>

    <hr class="gu-ver-divider" />

    <span class="gu-ver-label">Teléfono</span>
    <span class="gu-ver-valor">${escHTML(u.telefono || '—')}</span>

    <span class="gu-ver-label">Región</span>
    <span class="gu-ver-valor">${escHTML(u.region || '—')}</span>

    <hr class="gu-ver-divider" />

    <span class="gu-ver-label">Rol</span>
    <span class="gu-ver-valor">
      <span class="gu-badge-rol ${ROL_BADGE_CLASS[u.rol] || ''}">
        ${ROL_LABELS[u.rol] || u.rol}
      </span>
    </span>

    <span class="gu-ver-label">Estado</span>
    <span class="gu-ver-valor">
      <span class="gu-badge-estado gu-badge-estado--${u.estado}">
        ${u.estado.charAt(0).toUpperCase() + u.estado.slice(1)}
      </span>
    </span>
  `;

  mostrarModal('gu-modal-ver');
}

function cerrarModalVer() {
  ocultarModal('gu-modal-ver');
}


/* ══════════════════════════════════════════════════════════
   9. ACCIÓN: CREAR USUARIO
══════════════════════════════════════════════════════════ */
function abrirCrear() {
  estado.modalModo   = 'crear';
  estado.usuarioEdit = null;

  document.getElementById('gu-modal-titulo').textContent = 'Nuevo usuario';
  limpiarFormulario();
  // Pre-seleccionar el rol de la tab activa (si no es "todos")
  if (estado.rolActivo !== 'todos') {
    document.getElementById('f-rol').value = estado.rolActivo;
  }

  mostrarModal('gu-modal-form');
  document.getElementById('f-nombre')?.focus();
}


/* ══════════════════════════════════════════════════════════
   10. ACCIÓN: EDITAR USUARIO
══════════════════════════════════════════════════════════ */
/**
 * Abre el modal de formulario prellenado con los datos del usuario.
 * @param {Object} u - Usuario a editar
 */
function abrirEditar(u) {
  estado.modalModo   = 'editar';
  estado.usuarioEdit = u;

  document.getElementById('gu-modal-titulo').textContent = 'Editar usuario';
  document.getElementById('f-nombre').value   = u.nombre;
  document.getElementById('f-correo').value   = u.correo;
  document.getElementById('f-telefono').value = u.telefono || '';
  document.getElementById('f-region').value   = u.region   || '';
  document.getElementById('f-rol').value      = u.rol;
  document.getElementById('f-estado').value   = u.estado;

  mostrarModal('gu-modal-form');
  document.getElementById('f-nombre')?.focus();
}


/* ══════════════════════════════════════════════════════════
   11. ACCIÓN: GUARDAR (crear o actualizar)
══════════════════════════════════════════════════════════ */
function guardarUsuario() {
  // Leer valores del formulario
  const nombre   = document.getElementById('f-nombre').value.trim();
  const correo   = document.getElementById('f-correo').value.trim();
  const telefono = document.getElementById('f-telefono').value.trim();
  const region   = document.getElementById('f-region').value.trim();
  const rol      = document.getElementById('f-rol').value;
  const estadoV  = document.getElementById('f-estado').value;

  // Validaciones mínimas
  if (!nombre || !correo || !rol) {
    mostrarToast('Complete los campos obligatorios (*).', 'aviso');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    mostrarToast('Ingrese un correo electrónico válido.', 'aviso');
    return;
  }

  if (estado.modalModo === 'crear') {
    // Agregar nuevo usuario al arreglo
    usuarios.push({
      id: estado.nextId++,
      nombre, correo, telefono, region, rol, estado: estadoV,
    });
    mostrarToast(`Usuario <strong>${escHTML(nombre)}</strong> creado exitosamente.`, 'exito');
    cambiarTab(rol); // navegar a la tab del rol recién creado

  } else {
    // Actualizar el objeto en memoria
    Object.assign(estado.usuarioEdit, {
      nombre, correo, telefono, region, rol, estado: estadoV,
    });
    mostrarToast(`Usuario <strong>${escHTML(nombre)}</strong> actualizado.`, 'exito');
    // Si cambió de rol, navegar a la tab correspondiente
    if (rol !== estado.rolActivo && estado.rolActivo !== 'todos') {
      cambiarTab(rol);
    } else {
      renderizarTabla();
    }
  }

  actualizarBadges();
  cerrarModalForm();
}


/* ══════════════════════════════════════════════════════════
   12. ACCIÓN: ELIMINAR USUARIO
══════════════════════════════════════════════════════════ */
/**
 * Abre el modal de confirmación indicando qué usuario se eliminará.
 * @param {Object} u - Usuario a eliminar
 */
function abrirConfirmEliminar(u) {
  estado.usuarioElim = u;
  document.getElementById('gu-confirm-desc').textContent =
    `¿Seguro que desea eliminar a "${u.nombre}"? Esta acción no se puede deshacer.`;
  mostrarModal('gu-modal-confirm');
}

/** Ejecuta la eliminación tras confirmar en el modal. */
function confirmarEliminar() {
  if (!estado.usuarioElim) return;

  const idx = usuarios.findIndex(u => u.id === estado.usuarioElim.id);
  if (idx !== -1) usuarios.splice(idx, 1);

  mostrarToast(
    `Usuario <strong>${escHTML(estado.usuarioElim.nombre)}</strong> eliminado.`,
    'error'
  );

  estado.usuarioElim = null;
  actualizarBadges();
  renderizarTabla();
  cerrarModalConfirm();
}


/* ══════════════════════════════════════════════════════════
   13. HELPERS DE MODAL
══════════════════════════════════════════════════════════ */

/** Muestra un modal por su ID (agrega clase 'visible' y bloquea scroll). */
function mostrarModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.hidden = false;
  // Forzar reflow para que la transición CSS funcione
  void overlay.offsetHeight;
  overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

/** Oculta un modal por su ID. */
function ocultarModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('visible');
  document.body.style.overflow = '';
  // Esperar a que termine la transición para aplicar hidden
  overlay.addEventListener('transitionend', () => {
    overlay.hidden = true;
  }, { once: true });
}

function cerrarModalForm() {
  ocultarModal('gu-modal-form');
  limpiarFormulario();
}

function cerrarModalConfirm() {
  ocultarModal('gu-modal-confirm');
}

/** Reinicia todos los campos del formulario a sus valores por defecto. */
function limpiarFormulario() {
  ['f-nombre', 'f-correo', 'f-telefono', 'f-region'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('f-rol').value    = '';
  document.getElementById('f-estado').value = 'activo';
}


/* ══════════════════════════════════════════════════════════
   14. TOAST DE NOTIFICACIÓN
══════════════════════════════════════════════════════════ */
/**
 * Muestra una notificación no intrusiva en la esquina inferior derecha.
 * @param {string} mensaje - Texto (puede contener HTML básico como <strong>).
 * @param {'exito'|'error'|'aviso'} tipo - Variante visual del toast.
 */
function mostrarToast(mensaje, tipo = 'exito') {
  const toast = document.getElementById('gu-toast');
  if (!toast) return;

  const icono = tipo === 'exito' ? '✅' : tipo === 'error' ? '🗑️' : '⚠️';
  toast.innerHTML = `<span aria-hidden="true">${icono}</span> <span>${mensaje}</span>`;
  toast.className = `gu-toast gu-toast--${tipo} visible`;

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('visible'), 3800);
}


/* ══════════════════════════════════════════════════════════
   15. ICONOS SVG INLINE
   Centralizados aquí para no dispersarlos en el HTML
   (son iconos dinámicos de las filas de la tabla).
══════════════════════════════════════════════════════════ */
const SVG_ICONS = {

  ver: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"
          aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>`,

  editar: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
             <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
             <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
           </svg>`,

  eliminar: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
               <polyline points="3 6 5 6 21 6"/>
               <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
               <path d="M10 11v6"/><path d="M14 11v6"/>
               <path d="M9 6V4h6v2"/>
             </svg>`,
};


/* ══════════════════════════════════════════════════════════
   16. UTILIDADES
══════════════════════════════════════════════════════════ */

/**
 * Escapa caracteres especiales HTML para prevenir XSS.
 * @param {string} str - Texto a escapar.
 * @returns {string}
 */
function escHTML(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}