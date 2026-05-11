/* =============================================================
   SIFEX — gestionLugares.js
   Vista: Gestión de Lugares
   Responsabilidades:
     · Manejo de filtros (Predios / Lugares de producción)
     · Renderizado dinámico de encabezados y filas de la tabla
     · Visibilidad del botón de acción según filtro activo
     · Búsqueda en tiempo real
     · Operaciones CRUD: ver detalle, editar, eliminar
     · Notificaciones tipo toast
   ============================================================= */

'use strict';

/* ── DATOS DE EJEMPLO ────────────────────────────────────────
   En producción estos arrays se reemplazarían por llamadas
   al API del backend.
──────────────────────────────────────────────────────────── */

/** @type {Array<Object>} Lista de predios registrados */
const PREDIOS = [
  {
    id: 1,
    nombre: 'La Esperanza',
    municipio: 'Bucaramanga',
    departamento: 'Santander',
    area: 12.5,
    propietario: 'Carlos Ramírez',
    estado: 'activo',
  },
  {
    id: 2,
    nombre: 'El Porvenir',
    municipio: 'Floridablanca',
    departamento: 'Santander',
    area: 8.3,
    propietario: 'Ana María Torres',
    estado: 'activo',
  },
  {
    id: 3,
    nombre: 'Villa Alegre',
    municipio: 'Girón',
    departamento: 'Santander',
    area: 20.0,
    propietario: 'Luis Herrera',
    estado: 'inactivo',
  },
  {
    id: 4,
    nombre: 'Santa Inés',
    municipio: 'Barrancabermeja',
    departamento: 'Santander',
    area: 45.2,
    propietario: 'Patricia Mendoza',
    estado: 'activo',
  },
];

/** @type {Array<Object>} Lista de lugares de producción registrados */
const LUGARES_PRODUCCION = [
  {
    id: 1,
    nombre: 'Galpón Norte',
    tipo: 'Avícola',
    predio: 'La Esperanza',
    municipio: 'Bucaramanga',
    capacidad: 5000,
    estado: 'activo',
  },
  {
    id: 2,
    nombre: 'Establo Sur',
    tipo: 'Bovino',
    predio: 'El Porvenir',
    municipio: 'Floridablanca',
    capacidad: 120,
    estado: 'activo',
  },
  {
    id: 3,
    nombre: 'Invernadero 1',
    tipo: 'Hortícola',
    predio: 'Villa Alegre',
    municipio: 'Girón',
    capacidad: 800,
    estado: 'inactivo',
  },
  {
    id: 4,
    nombre: 'Piscina Trucha A',
    tipo: 'Acuícola',
    predio: 'Santa Inés',
    municipio: 'Barrancabermeja',
    capacidad: 2000,
    estado: 'activo',
  },
  {
    id: 5,
    nombre: 'Galpón Ponedoras',
    tipo: 'Avícola',
    predio: 'La Esperanza',
    municipio: 'Bucaramanga',
    capacidad: 8000,
    estado: 'activo',
  },
];


/* ── ESTADO INTERNO ──────────────────────────────────────────
   Centraliza el estado de la vista para que todas las
   funciones accedan a la misma fuente de verdad.
──────────────────────────────────────────────────────────── */
const estado = {
  /** Filtro activo: 'predios' | 'lugares' */
  filtroActivo: 'predios',

  /** Término de búsqueda actual */
  busqueda: '',

  /** ID del registro seleccionado para editar o eliminar */
  idSeleccionado: null,
};


/* ── REFERENCIAS AL DOM ──────────────────────────────────────
   Se capturan una sola vez al cargar el módulo para evitar
   búsquedas repetidas en cada renderizado.
──────────────────────────────────────────────────────────── */
const DOM = {
  // Tabs y badges
  tabPredios:    document.getElementById('gl-tab-predios'),
  tabLugares:    document.getElementById('gl-tab-lugares'),
  badgePredios:  document.getElementById('gl-badge-predios'),
  badgeLugares:  document.getElementById('gl-badge-lugares'),

  // Botón de acción principal
  btnNuevo: document.getElementById('gl-btn-nuevo'),

  // Barra de herramientas
  busqueda:  document.getElementById('gl-busqueda'),
  infoCount: document.getElementById('gl-info-count'),

  // Tabla
  thead: document.getElementById('gl-thead'),
  tbody: document.getElementById('gl-tbody'),
  empty: document.getElementById('gl-empty'),

  // Modal "Ver detalle"
  modalVer:       document.getElementById('gl-modal-ver'),
  verTitulo:      document.getElementById('gl-ver-titulo'),
  verContenido:   document.getElementById('gl-ver-contenido'),
  verClose:       document.getElementById('gl-ver-close'),
  verCancelar:    document.getElementById('gl-ver-cancelar'),

  // Modal "Crear / Editar predio"
  modalForm:      document.getElementById('gl-modal-form'),
  modalTitulo:    document.getElementById('gl-modal-titulo'),
  modalClose:     document.getElementById('gl-modal-close'),
  formCancelar:   document.getElementById('gl-form-cancelar'),
  formGuardar:    document.getElementById('gl-form-guardar'),
  fNombre:        document.getElementById('gl-f-nombre'),
  fMunicipio:     document.getElementById('gl-f-municipio'),
  fDepartamento:  document.getElementById('gl-f-departamento'),
  fArea:          document.getElementById('gl-f-area'),
  fPropietario:   document.getElementById('gl-f-propietario'),
  fEstado:        document.getElementById('gl-f-estado'),

  // Modal "Confirmar eliminación"
  modalConfirm:   document.getElementById('gl-modal-confirm'),
  confirmTitulo:  document.getElementById('gl-confirm-titulo'),
  confirmDesc:    document.getElementById('gl-confirm-desc'),
  confirmCancelar:document.getElementById('gl-confirm-cancelar'),
  confirmOk:      document.getElementById('gl-confirm-ok'),

  // Toast
  toast: document.getElementById('gl-toast'),
};


/* ═══════════════════════════════════════════════════════════
   MÓDULO: FILTROS Y TABS
   ═══════════════════════════════════════════════════════════ */

/**
 * Actualiza los badges numéricos de las pestañas con los
 * totales reales de cada dataset.
 */
function actualizarBadges() {
  DOM.badgePredios.textContent  = PREDIOS.length;
  DOM.badgeLugares.textContent  = LUGARES_PRODUCCION.length;
}

/**
 * Cambia el filtro activo, actualiza estilos de las tabs,
 * controla la visibilidad del botón y re-renderiza la tabla.
 *
 * @param {'predios'|'lugares'} filtro - Nuevo filtro a activar
 */
function cambiarFiltro(filtro) {
  estado.filtroActivo = filtro;
  estado.busqueda     = '';
  DOM.busqueda.value  = '';

  // ── Actualizar estado ARIA y clase activa de las tabs ──
  [DOM.tabPredios, DOM.tabLugares].forEach(tab => {
    const esActiva = tab.dataset.filtro === filtro;
    tab.classList.toggle('activa', esActiva);
    tab.setAttribute('aria-selected', String(esActiva));
  });

  // ── Visibilidad del botón de acción ───────────────────
  // Requerimiento: solo visible en la pestaña "Predios"
  if (filtro === 'predios') {
    DOM.btnNuevo.hidden = false;
    DOM.btnNuevo.textContent = '';          // Limpiar antes de reconstruir
    DOM.btnNuevo.insertAdjacentHTML('afterbegin',
      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
         <line x1="12" y1="5" x2="12" y2="19"/>
         <line x1="5" y1="12" x2="19" y2="12"/>
       </svg>
       Agregar predio`
    );
  } else {
    DOM.btnNuevo.hidden = true;
  }

  renderizarTabla();
}


/* ═══════════════════════════════════════════════════════════
   MÓDULO: RENDERIZADO DE TABLA
   ═══════════════════════════════════════════════════════════ */

/**
 * Devuelve los datos filtrados por búsqueda según el filtro activo.
 *
 * @returns {Array<Object>} Registros que coinciden con la búsqueda
 */
function obtenerDatosFiltrados() {
  const fuente = estado.filtroActivo === 'predios'
    ? PREDIOS
    : LUGARES_PRODUCCION;

  const termino = estado.busqueda.toLowerCase().trim();
  if (!termino) return fuente;

  return fuente.filter(item =>
    Object.values(item).some(valor =>
      String(valor).toLowerCase().includes(termino)
    )
  );
}

/**
 * Construye el HTML del badge de estado reutilizando
 * las mismas clases de admin.css (gu-badge).
 *
 * @param {'activo'|'inactivo'} estado - Estado del registro
 * @returns {string} HTML del badge
 */
function badgeEstado(estado) {
  const esActivo = estado === 'activo';
  // Reutiliza las clases gu-badge-estado existentes en admin.css
  return `<span class="gu-badge-estado ${esActivo ? 'gu-badge-estado--activo' : 'gu-badge-estado--inactivo'}">
            ${esActivo ? 'Activo' : 'Inactivo'}
          </span>`;
}

/**
 * Construye los botones de acción de cada fila (Ver, Editar, Eliminar).
 * Para "Lugares de producción" se omite el botón Eliminar ya que
 * el flujo de negocio solo permite edición y visualización.
 *
 * @param {number} id - ID del registro
 * @param {boolean} mostrarEliminar - Si se muestra el botón eliminar
 * @returns {string} HTML de los botones
 */
function botonesAccion(id, mostrarEliminar) {
  const eliminar = mostrarEliminar
    ? `<button class="gu-btn-accion gu-btn-accion--eliminar"
               data-id="${id}" data-accion="eliminar"
               title="Eliminar" aria-label="Eliminar registro ${id}">
         <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
           <polyline points="3 6 5 6 21 6"/>
           <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
           <path d="M10 11v6"/><path d="M14 11v6"/>
           <path d="M9 6V4h6v2"/>
         </svg>
       </button>`
    : '';

  return `
    <div class="gu-acciones">
      <button class="gu-btn-accion gu-btn-accion--ver"
              data-id="${id}" data-accion="ver"
              title="Ver detalle" aria-label="Ver detalle del registro ${id}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
      <button class="gu-btn-accion gu-btn-accion--editar"
              data-id="${id}" data-accion="editar"
              title="Editar" aria-label="Editar registro ${id}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      ${eliminar}
    </div>
  `;
}

/**
 * Renderiza encabezados y filas de la tabla según el filtro activo.
 * Actualiza también el contador de la toolbar y el estado vacío.
 */
function renderizarTabla() {
  const datos = obtenerDatosFiltrados();
  const esPredios = estado.filtroActivo === 'predios';

  // ── Encabezados según filtro activo ───────────────────
  const encabezados = esPredios
    ? ['Nombre', 'Municipio', 'Departamento', 'Área (ha)', 'Propietario', 'Estado', 'Acciones']
    : ['Nombre', 'Tipo', 'Predio asociado', 'Municipio', 'Capacidad', 'Estado', 'Acciones'];

  DOM.thead.innerHTML = `
    <tr>
      ${encabezados.map((h, i) =>
        `<th scope="col" ${i === encabezados.length - 1 ? 'class="gu-th-acciones"' : ''}>${h}</th>`
      ).join('')}
    </tr>
  `;

  // ── Filas de datos ─────────────────────────────────────
  if (datos.length === 0) {
    DOM.tbody.innerHTML = '';
    DOM.empty.hidden    = false;
    DOM.infoCount.innerHTML = 'Sin resultados';
    return;
  }

  DOM.empty.hidden = true;
  DOM.infoCount.innerHTML =
    `Mostrando <strong>${datos.length}</strong> de <strong>${
      esPredios ? PREDIOS.length : LUGARES_PRODUCCION.length
    }</strong> registros`;

  DOM.tbody.innerHTML = datos.map(item => {
    const celdas = esPredios
      ? `
        <td>${item.nombre}</td>
        <td>${item.municipio}</td>
        <td>${item.departamento}</td>
        <td>${item.area} ha</td>
        <td>${item.propietario}</td>
        <td>${badgeEstado(item.estado)}</td>
      `
      : `
        <td>${item.nombre}</td>
        <td>${item.tipo}</td>
        <td>${item.predio}</td>
        <td>${item.municipio}</td>
        <td class="gl-td-numero">${item.capacidad.toLocaleString('es-CO')}</td>
        <td>${badgeEstado(item.estado)}</td>
      `;

    // En "Lugares de producción" no se permite eliminar
    return `
      <tr>
        ${celdas}
        <td class="gu-th-acciones">${botonesAccion(item.id, esPredios)}</td>
      </tr>
    `;
  }).join('');
}


/* ═══════════════════════════════════════════════════════════
   MÓDULO: BÚSQUEDA
   ═══════════════════════════════════════════════════════════ */

/**
 * Escucha cambios en el input de búsqueda y re-renderiza
 * la tabla con el término actualizado.
 */
DOM.busqueda.addEventListener('input', () => {
  estado.busqueda = DOM.busqueda.value;
  renderizarTabla();
});


/* ═══════════════════════════════════════════════════════════
   MÓDULO: MODAL "VER DETALLE"
   ═══════════════════════════════════════════════════════════ */

/**
 * Abre el modal de detalle y rellena el grid con los
 * datos del registro seleccionado.
 *
 * @param {number} id - ID del registro a visualizar
 */
function abrirModalVer(id) {
  const esPredios = estado.filtroActivo === 'predios';
  const fuente    = esPredios ? PREDIOS : LUGARES_PRODUCCION;
  const registro  = fuente.find(r => r.id === id);
  if (!registro) return;

  DOM.verTitulo.textContent = esPredios
    ? `Detalle del predio: ${registro.nombre}`
    : `Detalle: ${registro.nombre}`;

  // Construye las filas del grid label/valor
  const campos = esPredios
    ? [
        ['Nombre',        registro.nombre],
        ['Municipio',     registro.municipio],
        ['Departamento',  registro.departamento],
        ['Área',          `${registro.area} ha`],
        ['Propietario',   registro.propietario],
        ['Estado',        registro.estado === 'activo' ? 'Activo' : 'Inactivo'],
      ]
    : [
        ['Nombre',          registro.nombre],
        ['Tipo',            registro.tipo],
        ['Predio asociado', registro.predio],
        ['Municipio',       registro.municipio],
        ['Capacidad',       registro.capacidad.toLocaleString('es-CO')],
        ['Estado',          registro.estado === 'activo' ? 'Activo' : 'Inactivo'],
      ];

  DOM.verContenido.innerHTML = campos.map(([label, valor]) => `
    <span class="gu-ver-label">${label}</span>
    <span class="gu-ver-valor">${valor}</span>
  `).join('');

  abrirModal(DOM.modalVer);
}


/* ═══════════════════════════════════════════════════════════
   MÓDULO: MODAL "CREAR / EDITAR PREDIO"
   ═══════════════════════════════════════════════════════════ */

/**
 * Limpia el formulario del modal de predio.
 */
function limpiarFormulario() {
  DOM.fNombre.value       = '';
  DOM.fMunicipio.value    = '';
  DOM.fDepartamento.value = '';
  DOM.fArea.value         = '';
  DOM.fPropietario.value  = '';
  DOM.fEstado.value       = 'activo';
}

/**
 * Abre el modal en modo "Nuevo predio".
 */
function abrirModalNuevo() {
  estado.idSeleccionado   = null;
  DOM.modalTitulo.textContent = 'Nuevo predio';
  limpiarFormulario();
  abrirModal(DOM.modalForm);
}

/**
 * Abre el modal en modo "Editar predio" precargando los datos.
 *
 * @param {number} id - ID del predio a editar
 */
function abrirModalEditar(id) {
  const registro = PREDIOS.find(r => r.id === id);
  if (!registro) return;

  estado.idSeleccionado       = id;
  DOM.modalTitulo.textContent = `Editar predio: ${registro.nombre}`;
  DOM.fNombre.value           = registro.nombre;
  DOM.fMunicipio.value        = registro.municipio;
  DOM.fDepartamento.value     = registro.departamento;
  DOM.fArea.value             = registro.area;
  DOM.fPropietario.value      = registro.propietario;
  DOM.fEstado.value           = registro.estado;

  abrirModal(DOM.modalForm);
}

/**
 * Valida y guarda el predio (crear o actualizar).
 * En producción aquí iría la llamada al API.
 */
function guardarPredio() {
  const nombre      = DOM.fNombre.value.trim();
  const municipio   = DOM.fMunicipio.value.trim();
  const propietario = DOM.fPropietario.value.trim();

  // Validación básica de campos requeridos
  if (!nombre || !municipio || !propietario) {
    mostrarToast('Complete los campos obligatorios.', 'aviso');
    return;
  }

  const datos = {
    nombre,
    municipio,
    departamento: DOM.fDepartamento.value.trim(),
    area:         parseFloat(DOM.fArea.value) || 0,
    propietario,
    estado:       DOM.fEstado.value,
  };

  if (estado.idSeleccionado === null) {
    // ── Crear nuevo predio ─────────────────────────────
    const nuevoId = PREDIOS.length
      ? Math.max(...PREDIOS.map(p => p.id)) + 1
      : 1;
    PREDIOS.push({ id: nuevoId, ...datos });
    mostrarToast(`Predio "${nombre}" creado correctamente.`, 'exito');
  } else {
    // ── Actualizar predio existente ────────────────────
    const idx = PREDIOS.findIndex(p => p.id === estado.idSeleccionado);
    if (idx !== -1) {
      PREDIOS[idx] = { id: estado.idSeleccionado, ...datos };
    }
    mostrarToast(`Predio "${nombre}" actualizado.`, 'exito');
  }

  actualizarBadges();
  renderizarTabla();
  cerrarModal(DOM.modalForm);
}


/* ═══════════════════════════════════════════════════════════
   MÓDULO: MODAL "CONFIRMAR ELIMINACIÓN"
   ═══════════════════════════════════════════════════════════ */

/**
 * Abre el modal de confirmación para eliminar un predio.
 *
 * @param {number} id - ID del predio a eliminar
 */
function abrirModalEliminar(id) {
  const registro = PREDIOS.find(r => r.id === id);
  if (!registro) return;

  estado.idSeleccionado       = id;
  DOM.confirmDesc.textContent =
    `¿Estás seguro de que deseas eliminar el predio "${registro.nombre}"? Esta acción no se puede deshacer.`;

  abrirModal(DOM.modalConfirm);
}

/**
 * Elimina el predio seleccionado del array en memoria.
 * En producción aquí iría la llamada DELETE al API.
 */
function confirmarEliminacion() {
  const idx = PREDIOS.findIndex(p => p.id === estado.idSeleccionado);
  if (idx !== -1) {
    const nombre = PREDIOS[idx].nombre;
    PREDIOS.splice(idx, 1);
    mostrarToast(`Predio "${nombre}" eliminado.`, 'error');
  }

  actualizarBadges();
  renderizarTabla();
  cerrarModal(DOM.modalConfirm);
  estado.idSeleccionado = null;
}


/* ═══════════════════════════════════════════════════════════
   MÓDULO: UTILIDADES DE MODALES
   ═══════════════════════════════════════════════════════════ */

/**
 * Muestra un modal quitando el atributo hidden y
 * añadiendo la clase visible para la animación CSS.
 *
 * @param {HTMLElement} overlay - Elemento overlay del modal
 */
function abrirModal(overlay) {
  overlay.hidden = false;
  // Doble RAF para garantizar que la transición CSS se dispare
  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add('visible'));
  });
}

/**
 * Oculta un modal eliminando la clase visible y
 * esperando a que termine la transición para ocultar el DOM.
 *
 * @param {HTMLElement} overlay - Elemento overlay del modal
 */
function cerrarModal(overlay) {
  overlay.classList.remove('visible');
  overlay.addEventListener('transitionend', () => {
    overlay.hidden = true;
  }, { once: true });
}


/* ═══════════════════════════════════════════════════════════
   MÓDULO: TOAST DE NOTIFICACIONES
   ═══════════════════════════════════════════════════════════ */

/** @type {number|null} Temporizador del toast actual */
let toastTimer = null;

/**
 * Muestra una notificación tipo toast durante 3 segundos.
 *
 * @param {string} mensaje - Texto a mostrar
 * @param {'exito'|'error'|'aviso'} tipo - Variante de color
 */
function mostrarToast(mensaje, tipo = 'exito') {
  if (toastTimer) clearTimeout(toastTimer);

  DOM.toast.textContent = mensaje;
  DOM.toast.className   = `gu-toast gu-toast--${tipo}`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => DOM.toast.classList.add('visible'));
  });

  toastTimer = setTimeout(() => {
    DOM.toast.classList.remove('visible');
  }, 3000);
}


/* ═══════════════════════════════════════════════════════════
   MÓDULO: DELEGACIÓN DE EVENTOS EN LA TABLA
   ═══════════════════════════════════════════════════════════ */

/**
 * Escucha clics en el tbody usando event delegation.
 * Detecta el atributo data-accion del botón pulsado y
 * despacha la acción correspondiente.
 */
DOM.tbody.addEventListener('click', e => {
  /** @type {HTMLButtonElement|null} */
  const boton  = e.target.closest('[data-accion]');
  if (!boton) return;

  const id     = parseInt(boton.dataset.id, 10);
  const accion = boton.dataset.accion;

  switch (accion) {
    case 'ver':
      abrirModalVer(id);
      break;
    case 'editar':
      // La edición solo aplica a predios en el flujo actual
      if (estado.filtroActivo === 'predios') {
        abrirModalEditar(id);
      } else {
        mostrarToast('La edición de lugares de producción no está disponible aún.', 'aviso');
      }
      break;
    case 'eliminar':
      abrirModalEliminar(id);
      break;
  }
});


/* ═══════════════════════════════════════════════════════════
   MÓDULO: LISTENERS DE TABS Y BOTÓN DE ACCIÓN
   ═══════════════════════════════════════════════════════════ */

// Cambio de pestaña: Predios
DOM.tabPredios.addEventListener('click', () => cambiarFiltro('predios'));

// Cambio de pestaña: Lugares de producción
DOM.tabLugares.addEventListener('click', () => cambiarFiltro('lugares'));

// Botón "Agregar predio" (solo visible en filtro Predios)
DOM.btnNuevo.addEventListener('click', abrirModalNuevo);


/* ═══════════════════════════════════════════════════════════
   MÓDULO: LISTENERS DE MODALES
   ═══════════════════════════════════════════════════════════ */

// Modal "Ver detalle"
DOM.verClose.addEventListener('click',    () => cerrarModal(DOM.modalVer));
DOM.verCancelar.addEventListener('click', () => cerrarModal(DOM.modalVer));

// Modal "Crear / Editar predio"
DOM.modalClose.addEventListener('click',   () => cerrarModal(DOM.modalForm));
DOM.formCancelar.addEventListener('click', () => cerrarModal(DOM.modalForm));
DOM.formGuardar.addEventListener('click',  guardarPredio);

// Modal "Confirmar eliminación"
DOM.confirmCancelar.addEventListener('click', () => cerrarModal(DOM.modalConfirm));
DOM.confirmOk.addEventListener('click',       confirmarEliminacion);

// Cerrar modales al hacer clic en el overlay (fuera del modal)
[DOM.modalVer, DOM.modalForm, DOM.modalConfirm].forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) cerrarModal(overlay);
  });
});

// Cerrar modales con la tecla Escape
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  [DOM.modalVer, DOM.modalForm, DOM.modalConfirm].forEach(overlay => {
    if (!overlay.hidden) cerrarModal(overlay);
  });
});


/* ═══════════════════════════════════════════════════════════
   INICIALIZACIÓN
   ═══════════════════════════════════════════════════════════ */

/**
 * Punto de entrada: inicializa badges y renderiza la tabla
 * con el filtro por defecto ("Predios").
 */
(function init() {
  actualizarBadges();
  cambiarFiltro('predios');
})();