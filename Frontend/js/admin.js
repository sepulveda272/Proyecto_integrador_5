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
   1. ENDPOINTS Y DATOS REALES
   Los usuarios se cargan desde los tres microservicios:
     · Productores  → http://localhost:8003/productor
     · Técnicos     → http://localhost:9000/tecnico
     · Funcionarios → http://localhost:9000/funcionario

   Cada registro del backend se normaliza al shape:
   { id, nombre, identificacion, tipoId, celular,
     correo, rol, estado, _raw }
══════════════════════════════════════════════════════════ */

const API_PRODUCTORES  = 'http://localhost:8003/productor';
const API_TECNICOS     = 'http://localhost:9000/tecnico';
const API_FUNCIONARIOS = 'http://localhost:9000/funcionario';

/** Array mutable — fuente de verdad de la vista */
let usuarios = [];

/**
 * Normaliza un registro del backend al shape interno.
 * Soporta los tres roles con sus campos específicos.
 *
 * @param {Object} raw  - Objeto crudo del API
 * @param {string} rol  - 'productor' | 'tecnico' | 'funcionario'
 */
function normalizar(raw, rol) {
  // Nombre completo (todos los roles usan Primer/Segundo Nombre/Apellido)
  const partes = [
    raw.Primer_nombre, raw.Segundo_nombre,
    raw.Primer_apellido, raw.Segundo_apellido
  ].filter(Boolean);
  const nombre = partes.join(' ') || raw.Nombre || '—';

  // ID numérico interno según rol
  const idMap = {
    productor:   raw.Id_productor,
    tecnico:     raw.Id_tecnico,
    funcionario: raw.Id_funcionario,
  };

  return {
    id:             idMap[rol] ?? raw.id,
    nombre,
    identificacion: raw.Numero_identificacion ?? raw.Identificacion ?? '—',
    tipoId:         raw.Tipo_identificacion   ?? '—',
    celular:        raw.Celular               ?? raw.Telefono ?? '—',
    correo:         raw.Correo                ?? '—',
    rol,
    estado:         raw.Estado ?? 'Activo',
    _raw:           raw,   // referencia al objeto original (para edición futura)
  };
}

/**
 * Carga los usuarios de los tres endpoints en paralelo,
 * normaliza cada lista y actualiza el array global.
 */
async function cargarUsuarios() {
  try {
    const [resP, resT, resF] = await Promise.all([
      fetch(API_PRODUCTORES),
      fetch(API_TECNICOS),
      fetch(API_FUNCIONARIOS),
    ]);

    const [dataP, dataT, dataF] = await Promise.all([
      resP.json(), resT.json(), resF.json()
    ]);

    const productores  = (dataP.data ?? dataP ?? []).map(r => normalizar(r, 'productor'));
    const tecnicos     = (dataT.data ?? dataT ?? []).map(r => normalizar(r, 'tecnico'));
    const funcionarios = (dataF.data ?? dataF ?? []).map(r => normalizar(r, 'funcionario'));

    usuarios = [...productores, ...tecnicos, ...funcionarios];

    actualizarBadges();
    renderizarTabla();
  } catch (err) {
    console.error('[admin.js] Error cargando usuarios:', err);
    mostrarToast('No se pudieron cargar los usuarios del servidor.', 'aviso');
  }
}


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
  cargarUsuarios(); // carga real desde los tres endpoints
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

  /* ── Modal confirmación eliminar ────────────────────── */
  document.getElementById('gu-confirm-cancelar')
    ?.addEventListener('click', cerrarModalConfirm);
  document.getElementById('gu-modal-confirm')
    ?.addEventListener('click', e => {
      if (e.target === e.currentTarget) cerrarModalConfirm();
    });
  document.getElementById('gu-confirm-ok')
    ?.addEventListener('click', confirmarEliminar);

  /* ── Input de imagen: preview en tiempo real ───────── */
  document.getElementById('f-imagen-file')
    ?.addEventListener('change', manejarSeleccionImagen);

  /* ── Botón "Quitar imagen" ──────────────────────────── */
  document.getElementById('gu-img-remove')
    ?.addEventListener('click', quitarImagen);

  /* ── Teclado: Escape cierra cualquier modal abierto ─── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      cerrarModalForm();
      cerrarModalConfirm();
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
      || u.correo.toLowerCase().includes(q)
      || u.identificacion.toLowerCase().includes(q)
      || u.celular.toLowerCase().includes(q);
    return coincideRol && coincideBusq;
  });

  // 2. Mostrar estado vacío o filas
  if (filtrados.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
  } else {
    empty.hidden = true;
    tbody.innerHTML = filtrados.map((u, idx) => generarFila(u, idx)).join('');

    // 3. Delegación de eventos en el tbody — un solo listener para todas las filas.
    // Se usa data-index para identificar al usuario exacto sin depender de IDs
    // que pueden colisionar entre roles (técnico id=1, productor id=1, etc.).
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const u = filtrados[parseInt(btn.dataset.index, 10)];
      if (!u) return;

      if (btn.dataset.action === 'editar')   abrirEditar(u);
      if (btn.dataset.action === 'eliminar') abrirConfirmEliminar(u);
    }, { once: true }); // once: true → el listener se elimina solo al re-renderizar
  }

  // 4. Actualizar texto del contador
  const totalRol = estado.rolActivo === 'todos'
    ? usuarios.length
    : usuarios.filter(u => u.rol === estado.rolActivo).length;
  // Re-sync badges after each render (count may have changed)
  actualizarBadges();

  infoCount.innerHTML =
    `Mostrando <strong>${filtrados.length}</strong> de <strong>${totalRol}</strong> usuario${totalRol !== 1 ? 's' : ''}`;
}

/**
 * Genera el HTML de una fila <tr> para un usuario dado.
 * Solo filas — la estructura de la tabla vive en el HTML.
 * @param {Object} u - Objeto usuario
 * @returns {string} HTML de la fila
 */
function generarFila(u, idx) {
  // Iniciales del nombre (máx. 2 palabras)
  const iniciales = u.nombre
    .split(' ')
    .slice(0, 2)
    .map(p => p[0] || '')
    .join('')
    .toUpperCase();

  const rolLabel    = ROL_LABELS[u.rol]    || u.rol;
  const rolClass    = ROL_BADGE_CLASS[u.rol] || '';
  const estadoLabel = u.estado;

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

      <!-- Columna: número de identificación -->
      <td>${escHTML(u.identificacion)}</td>

      <!-- Columna: tipo de identificación -->
      <td>${escHTML(u.tipoId)}</td>

      <!-- Columna: celular -->
      <td>${escHTML(u.celular)}</td>

      <!-- Columna: correo -->
      <td>${escHTML(u.correo)}</td>

      <!-- Columna: badge de rol -->
      <td>
        <span class="gu-badge-rol ${rolClass}">${rolLabel}</span>
      </td>

      <!-- Columna: badge de estado -->
      <td>
        <span class="gu-badge-estado gu-badge-estado--${u.estado.toLowerCase()}">
          ${estadoLabel}
        </span>
      </td>

      <!-- Columna: acciones (Editar · Eliminar) -->
      <td>
        <div class="gu-acciones">

          <button
            class="gu-btn-accion gu-btn-accion--editar"
            data-action="editar"
            data-index="${idx}"
            title="Editar usuario"
            aria-label="Editar ${escHTML(u.nombre)}"
          >${SVG_ICONS.editar}</button>

          <button
            class="gu-btn-accion gu-btn-accion--eliminar"
            data-action="eliminar"
            data-index="${idx}"
            title="Eliminar usuario"
            aria-label="Eliminar ${escHTML(u.nombre)}"
          >${SVG_ICONS.eliminar}</button>

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
  document.getElementById('f-primer-nombre')?.focus();
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

  const raw = u._raw; // objeto original con todos los campos del backend

  document.getElementById('gu-modal-titulo').textContent = 'Editar usuario';

  // Identificación
  document.getElementById('f-numero-identificacion').value = raw.Numero_identificacion ?? '';
  document.getElementById('f-tipo-identificacion').value   = raw.Tipo_identificacion   ?? '';

  // Nombres
  document.getElementById('f-primer-nombre').value    = raw.Primer_nombre    ?? '';
  document.getElementById('f-segundo-nombre').value   = raw.Segundo_nombre   ?? '';
  document.getElementById('f-primer-apellido').value  = raw.Primer_apellido  ?? '';
  document.getElementById('f-segundo-apellido').value = raw.Segundo_apellido ?? '';

  // Contacto
  document.getElementById('f-celular').value = raw.Celular ?? '';
  document.getElementById('f-correo').value  = raw.Correo  ?? '';

  // Rol y estado
  document.getElementById('f-rol').value    = u.rol;
  document.getElementById('f-estado').value = u.estado;

  // Contraseña: en edición no se muestra — solo si el admin quiere cambiarla
  const rowPassword = document.getElementById('gu-row-password');
  const labelPass   = rowPassword?.querySelector('label');
  if (rowPassword) {
    // Quitar el asterisco de obligatorio en edición
    if (labelPass) labelPass.innerHTML = 'Nueva contraseña <small style="font-weight:400;color:var(--color-text-muted)">(dejar vacío para no cambiar)</small>';
    document.getElementById('f-password').value = '';
  }

  // Mostrar imagen actual si existe
  if (raw.Imagen) {
    const preview     = document.getElementById('gu-img-preview');
    const previewWrap = document.getElementById('gu-img-preview-wrap');
    const nameEl      = document.getElementById('gu-img-preview-name');
    const sizeEl      = document.getElementById('gu-img-preview-size');
    const filename    = document.getElementById('f-imagen-filename');
    const nombreImg   = raw.Imagen.split('/').pop();

    if (preview)     { preview.src = raw.Imagen; preview.onerror = () => { previewWrap.style.display = 'none'; }; }
    if (previewWrap) previewWrap.style.display = 'flex';
    if (nameEl)      nameEl.textContent   = nombreImg;
    if (sizeEl)      sizeEl.textContent   = 'Imagen actual';
    if (filename)    filename.textContent = nombreImg;
  }

  mostrarModal('gu-modal-form');
  document.getElementById('f-primer-nombre')?.focus();
}


/* ══════════════════════════════════════════════════════════
   8. MANEJO DE IMAGEN DE PERFIL
   Muestra preview al seleccionar un archivo, valida
   tamaño/formato y permite quitar la selección.
══════════════════════════════════════════════════════════ */

const MAX_IMG_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Se dispara cuando el usuario elige un archivo en el input.
 * Valida formato y tamaño, luego muestra la preview.
 */
function manejarSeleccionImagen(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validar tipo MIME
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (!tiposPermitidos.includes(file.type)) {
    mostrarToast('Formato no válido. Use JPG, PNG o WEBP.', 'aviso');
    e.target.value = '';
    return;
  }

  // Validar tamaño
  if (file.size > MAX_IMG_BYTES) {
    mostrarToast('La imagen supera el tamaño máximo permitido de 2 MB.', 'aviso');
    e.target.value = '';
    return;
  }

  // Mostrar preview
  const reader = new FileReader();
  reader.onload = ev => {
    const preview     = document.getElementById('gu-img-preview');
    const previewWrap = document.getElementById('gu-img-preview-wrap');
    const nameEl      = document.getElementById('gu-img-preview-name');
    const sizeEl      = document.getElementById('gu-img-preview-size');
    const filename    = document.getElementById('f-imagen-filename');

    if (preview)     preview.src           = ev.target.result;
    if (previewWrap) previewWrap.style.display = 'flex';
    if (nameEl)      nameEl.textContent    = file.name;
    if (sizeEl)      sizeEl.textContent    = `${(file.size / 1024).toFixed(1)} KB`;
    if (filename)    filename.textContent  = file.name;
  };
  reader.readAsDataURL(file);
}

/** Limpia la selección de imagen y oculta la preview. */
function quitarImagen() {
  const imgInput = document.getElementById('f-imagen-file');
  if (imgInput) imgInput.value = '';

  const preview     = document.getElementById('gu-img-preview');
  const previewWrap = document.getElementById('gu-img-preview-wrap');
  const filename    = document.getElementById('f-imagen-filename');

  if (preview)     preview.src           = '';
  if (previewWrap) previewWrap.style.display = 'none';
  if (filename)    filename.textContent  = '';
}


/** Devuelve la URL del endpoint de creación según el rol. */
function _endpointCrear(rol) {
  if (rol === 'productor')   return 'http://localhost:8003/productor/add';
  if (rol === 'tecnico')     return 'http://localhost:9000/tecnico/add';
  if (rol === 'funcionario') return 'http://localhost:9000/funcionario/add';
  return null;
}

/** Devuelve la URL del endpoint de edición según el rol e ID. */
function _endpointEditar(rol, id) {
  if (rol === 'productor')   return `http://localhost:8003/productor/${id}`;
  if (rol === 'tecnico')     return `http://localhost:9000/tecnico/${id}`;
  if (rol === 'funcionario') return `http://localhost:9000/funcionario/${id}`;
  return null;
}

/** Devuelve la URL del endpoint de desactivación según el rol e ID. */
function _endpointEliminar(rol, id) {
  if (rol === 'productor')   return `http://localhost:8003/productor/delete/${id}`;
  if (rol === 'tecnico')     return `http://localhost:9000/tecnico/delete/${id}`;
  if (rol === 'funcionario') return `http://localhost:9000/funcionario/delete/${id}`;
  return null;
}

async function guardarUsuario() {
  // ── Leer campos del formulario (estructura real del HTML) ──
  const primerNombre   = document.getElementById('f-primer-nombre')?.value.trim()   || '';
  const segundoNombre  = document.getElementById('f-segundo-nombre')?.value.trim()  || '';
  const primerApellido = document.getElementById('f-primer-apellido')?.value.trim() || '';
  const segundoApellido= document.getElementById('f-segundo-apellido')?.value.trim()|| '';
  const celular        = document.getElementById('f-celular')?.value.trim()          || '';
  const correo         = document.getElementById('f-correo')?.value.trim()           || '';
  const rol            = document.getElementById('f-rol')?.value                     || '';
  const password       = document.getElementById('f-password')?.value               || '';

  // Identificación — campo extra que puede existir en el form
  const numeroId = document.getElementById('f-numero-identificacion')?.value.trim() || '';
  const tipoId   = document.getElementById('f-tipo-identificacion')?.value   || '';

  // ── Validaciones ──────────────────────────────────────────
  if (!primerNombre || !primerApellido || !correo || !rol) {
    mostrarToast('Complete los campos obligatorios (*).', 'aviso');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    mostrarToast('Ingrese un correo electrónico válido.', 'aviso');
    return;
  }
  if (estado.modalModo === 'crear' && !password) {
    mostrarToast('La contraseña es obligatoria al crear un usuario.', 'aviso');
    return;
  }

  if (estado.modalModo === 'crear') {
    // ── POST al endpoint correspondiente ──────────────────
    const url = _endpointCrear(rol);
    if (!url) {
      mostrarToast('Rol no reconocido.', 'aviso');
      return;
    }

    // ── Construir FormData para enviar imagen + campos de texto ──
    // El backend debe recibir multipart/form-data.
    // El campo "Imagen" llegará como archivo; el servidor lo guarda
    // en disco y almacena la ruta resultante en la BD (varchar 255).
    const formData = new FormData();
    formData.append('Numero_identificacion', numeroId);
    formData.append('Tipo_identificacion',   tipoId);
    formData.append('Primer_nombre',         primerNombre);
    formData.append('Segundo_nombre',        segundoNombre);
    formData.append('Primer_apellido',       primerApellido);
    formData.append('Segundo_apellido',      segundoApellido);
    formData.append('Celular',               celular);
    formData.append('Correo',                correo);
    formData.append('Password',              password);

    // Adjuntar archivo de imagen si el usuario seleccionó uno
    const imgInput = document.getElementById('f-imagen-file');
    const imgFile  = imgInput?.files?.[0];
    if (imgFile) {
      // El backend debe tener un middleware como multer (Node.js)
      // que procese el campo "Imagen" y devuelva la ruta guardada.
      formData.append('Imagen', imgFile, imgFile.name);
    }
    // Si no hay imagen, el backend usará su imagen por defecto o
    // dejará el campo vacío — ajusta según tu lógica de negocio.

    // Deshabilitar botón mientras se procesa
    const btnGuardar = document.getElementById('gu-form-guardar');
    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = 'Guardando…'; }

    try {
      // IMPORTANTE: NO pongas 'Content-Type' manualmente.
      // El navegador lo establece solo con el boundary correcto
      // cuando el body es un FormData.
      const res  = await fetch(url, {
        method: 'POST',
        body:   formData,
      });
      const data = await res.json();

      if (!res.ok) {
        // 413 → imagen demasiado grande (rechazada por multer en el backend)
        // Para cualquier otro error usamos data.message del servidor
        mostrarToast(data.message || 'Error al crear el usuario.', 'aviso');

        // Si el error fue por la imagen, limpiar el input para que el
        // usuario pueda elegir otra sin necesidad de cerrar el formulario
        if (res.status === 413 || res.status === 400) quitarImagen();
        return;
      }

      const nombreCompleto = `${primerNombre} ${primerApellido}`;
      mostrarToast(`Usuario <strong>${escHTML(nombreCompleto)}</strong> creado exitosamente.`, 'exito');
      cerrarModalForm();
      cambiarTab(rol);        // ir a la tab del rol recién creado
      await cargarUsuarios(); // refrescar la tabla desde el servidor

    } catch (err) {
      console.error('[guardarUsuario]', err);
      mostrarToast('No se pudo conectar con el servidor.', 'aviso');
    } finally {
      if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = 'Guardar'; }
    }

  } else {
    // ── PUT al endpoint correspondiente ───────────────────
    const u   = estado.usuarioEdit;
    const url = _endpointEditar(u.rol, u.id);
    if (!url) { mostrarToast('Rol no reconocido.', 'aviso'); return; }

    const formData = new FormData();
    formData.append('Numero_identificacion', numeroId);
    formData.append('Tipo_identificacion',   tipoId);
    formData.append('Primer_nombre',         primerNombre);
    formData.append('Segundo_nombre',        segundoNombre);
    formData.append('Primer_apellido',       primerApellido);
    formData.append('Segundo_apellido',      segundoApellido);
    formData.append('Celular',               celular);
    formData.append('Correo',                correo);
    formData.append('Estado',                document.getElementById('f-estado')?.value ?? 'Activo');
    if (password) formData.append('Password', password);

    // Solo adjuntar imagen si el usuario seleccionó una nueva
    const imgInput = document.getElementById('f-imagen-file');
    const imgFile  = imgInput?.files?.[0];
    if (imgFile) formData.append('Imagen', imgFile, imgFile.name);

    const btnGuardar = document.getElementById('gu-form-guardar');
    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = 'Guardando…'; }

    try {
      const res  = await fetch(url, { method: 'PUT', body: formData });
      const data = await res.json();

      if (!res.ok) {
        mostrarToast(data.message || 'Error al actualizar el usuario.', 'aviso');
        if (res.status === 413 || res.status === 400) quitarImagen();
        return;
      }

      const nombreCompleto = `${primerNombre} ${primerApellido}`;
      mostrarToast(`Usuario <strong>${escHTML(nombreCompleto)}</strong> actualizado correctamente.`, 'exito');
      cerrarModalForm();
      await cargarUsuarios();

    } catch (err) {
      console.error('[guardarUsuario - editar]', err);
      mostrarToast('No se pudo conectar con el servidor.', 'aviso');
    } finally {
      if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = 'Guardar'; }
    }
  }
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

/** Ejecuta la desactivación (Estado → Inactivo) tras confirmar en el modal. */
async function confirmarEliminar() {
  if (!estado.usuarioElim) return;

  const u   = estado.usuarioElim;
  const url = _endpointEliminar(u.rol, u.id);

  if (!url) {
    mostrarToast('Rol no reconocido.', 'aviso');
    cerrarModalConfirm();
    return;
  }

  // Deshabilitar botón mientras se procesa
  const btnOk = document.getElementById('gu-confirm-ok');
  if (btnOk) { btnOk.disabled = true; btnOk.textContent = 'Desactivando…'; }

  try {
    const res  = await fetch(url, { method: 'PUT' });
    const data = await res.json();

    if (!res.ok) {
      mostrarToast(data.message || 'No se pudo desactivar el usuario.', 'aviso');
      return;
    }

    mostrarToast(
      `Usuario <strong>${escHTML(u.nombre)}</strong> marcado como Inactivo.`,
      'error'
    );
    cerrarModalConfirm();
    await cargarUsuarios(); // refrescar tabla desde el servidor

  } catch (err) {
    console.error('[confirmarEliminar]', err);
    mostrarToast('No se pudo conectar con el servidor.', 'aviso');
  } finally {
    if (btnOk) { btnOk.disabled = false; btnOk.textContent = 'Sí, desactivar'; }
    estado.usuarioElim = null;
  }
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
  const campos = [
    'f-primer-nombre', 'f-segundo-nombre',
    'f-primer-apellido', 'f-segundo-apellido',
    'f-celular', 'f-correo', 'f-password',
    'f-numero-identificacion', 'f-tipo-identificacion',
  ];
  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const rol    = document.getElementById('f-rol');
  const estado = document.getElementById('f-estado');
  if (rol)    rol.value    = '';
  if (estado) estado.value = 'Activo';

  // Limpiar preview de imagen si existe
  const preview = document.getElementById('gu-img-preview-wrap');
  if (preview) preview.style.display = 'none';
  const filename = document.getElementById('f-imagen-filename');
  if (filename) filename.textContent = '';
  const imgInput = document.getElementById('f-imagen-file');
  if (imgInput) imgInput.value = '';
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