/**
 * adminCatalogo.js — SIFEX
 * ============================================================
 * Módulo de administración del Catálogo: Cultivos y Plagas.
 * Consume el Microservicio Catálogo en http://localhost:8000
 *
 * CAMBIOS RESPECTO A LA BASE:
 *  · cultivosDB y plagasDB ya no son hardcodeados —
 *    se cargan desde el microservicio al iniciar y se
 *    sincronizan tras cada operación CRUD.
 *  · guardarCultivo() y guardarPlaga() hacen POST/PUT al API.
 *  · confirmarEliminarCultivo() y confirmarEliminarPlaga()
 *    hacen DELETE al API.
 *  · Los campos de imagen soportan TANTO archivo local
 *    (base64 → se guarda así) COMO URL externa escrita
 *    directamente (campo de texto adicional).
 *  · El combobox de cultivos en el modal de plagas se alimenta
 *    desde cultivosDB cargado del API (misma estructura).
 *  · Se mantiene 100% de la estructura, helpers y UI base.
 * ============================================================
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONFIGURACIÓN
   ───────────────────────────────────────────────────────────── */
const API_CULTIVO = 'http://localhost:8000/cultivo';
const API_PLAGA   = 'http://localhost:8000/plaga';


/* ─────────────────────────────────────────────────────────────
   0. ESTADO GLOBAL
   ───────────────────────────────────────────────────────────── */

const catEstado = {
  imagenBase64: null,
  editandoId:   null,
};

const plagEstado = {
  imagenBase64:      null,
  editandoId:        null,
  editandoCultivoId: null,
};

let pestañaActiva   = 'cultivos';
let terminoBusqueda = '';

// Fuente de verdad — se pueblan desde el API
let cultivosDB = [];
let plagasDB   = [];


/* ─────────────────────────────────────────────────────────────
   1. UTILIDADES COMPARTIDAS  (sin cambios respecto a la base)
   ───────────────────────────────────────────────────────────── */

function mostrarToast(mensaje, tipo = 'exito') {
  const toast = document.getElementById('cat-toast');
  if (!toast) return;
  toast.textContent = mensaje;
  toast.className = `gu-toast gu-toast--${tipo}`;
  void toast.offsetWidth;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

function abrirOverlay(overlay) {
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('visible'));
  document.body.style.overflow = 'hidden';
}

function cerrarOverlay(overlay) {
  overlay.classList.remove('visible');
  document.body.style.overflow = '';
  overlay.addEventListener('transitionend', () => { overlay.hidden = true; }, { once: true });
}

function formatearBytes(bytes) {
  if (bytes < 1024)    return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function esImagenSubidaPorUsuario(imagen) {
  if (!imagen) return false;
  return !imagen.startsWith('data:image/svg');
}

function escapar(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function resetearImagen(prefijo, estado) {
  estado.imagenBase64 = null;
  const ids = ['file', 'filename', 'preview', 'preview-img', 'preview-name', 'preview-size'];
  const [fileInput, filename, preview, previewImg, previewName, previewSize] =
    ids.map(s => document.getElementById(`${prefijo}-f-imagen-${s}`));

  if (fileInput)   fileInput.value         = '';
  if (filename)    filename.textContent    = 'Ningún archivo seleccionado';
  if (previewImg)  previewImg.src          = '';
  if (previewName) previewName.textContent = '';
  if (previewSize) previewSize.textContent = '';
  if (preview)     preview.classList.remove('visible');

}

function mostrarPreview(prefijo, base64, nombre, tamanio) {
  const preview     = document.getElementById(`${prefijo}-f-imagen-preview`);
  const previewImg  = document.getElementById(`${prefijo}-f-imagen-preview-img`);
  const previewName = document.getElementById(`${prefijo}-f-imagen-preview-name`);
  const previewSize = document.getElementById(`${prefijo}-f-imagen-preview-size`);
  if (previewImg)  previewImg.src          = base64;
  if (previewName) previewName.textContent = nombre  || '';
  if (previewSize) previewSize.textContent = tamanio ? formatearBytes(tamanio) : '';
  if (preview)     preview.classList.add('visible');
}

function initImagen(prefijo, estado) {
  const fileInput = document.getElementById(`${prefijo}-f-imagen-file`);
  const filename  = document.getElementById(`${prefijo}-f-imagen-filename`);
  const removeBtn = document.getElementById(`${prefijo}-f-imagen-remove`);
  if (!fileInput) return;

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    resetearImagen(prefijo, estado);
    if (filename) filename.textContent = file.name;
    const reader = new FileReader();
    reader.onload = e => {
      estado.imagenBase64 = e.target.result;
      mostrarPreview(prefijo, e.target.result, file.name, file.size);
    };
    reader.readAsDataURL(file);
  });

  if (removeBtn) removeBtn.addEventListener('click', () => resetearImagen(prefijo, estado));
}

/**
 * Determina la imagen a guardar: prioriza archivo base64,
 * luego URL escrita manualmente, luego imagen existente al editar.
 */
function resolverImagen(prefijo, estado, existente) {
  if (estado.imagenBase64) return estado.imagenBase64;
  if (estado.editandoId !== null && existente) return existente;
  return null;
}

/**
 * Construye la URL completa de una imagen almacenada en el servidor.
 * Las rutas locales (/uploads/...) se combinan con el host de la API.
 */
function urlImagenCompleta(imagen) {
  if (!imagen) return imagen;
  if (imagen.startsWith('http') || imagen.startsWith('data:')) return imagen;
  // Ruta relativa del servidor → URL absoluta
  const base = API_CULTIVO.replace(/\/cultivo.*$/, '');
  return `${base}${imagen}`;
}


/* ─────────────────────────────────────────────────────────────
   2. CARGA DESDE EL API
   ───────────────────────────────────────────────────────────── */

async function cargarCultivos() {
  try {
    const res  = await fetch(API_CULTIVO);
    const data = await res.json();
    // Mapear campos del API al formato interno usado por la UI
    cultivosDB = (data.data || []).map(c => ({
      id:           c.Id_cultivo,
      nombreEspecie: c.Nombre_especie,
      variedad:      c.Variedad,
      imagen:        c.Imagen,
      descripcion:   c.Descripcion || '',
      plagas:        c.plagas || [],        // array de plagas relacionadas
    }));
  } catch (e) {
    mostrarToast('No se pudo conectar con el microservicio de catálogo.', 'error');
    cultivosDB = [];
  }
}

async function cargarPlagas() {
  try {
    const res  = await fetch(API_PLAGA);
    const data = await res.json();
    plagasDB = (data.data || []).map(p => ({
      id:               p.Id_plaga,
      nombreCientifico: p.Nombre_cientifico,
      nombreComun:      p.Nombre_comun,
      imagen:           p.Imagen,
      descripcion:      p.Descripcion || '',
      cultivoId:        p.cultivos && p.cultivos[0] ? p.cultivos[0].Id_cultivo : null,
      cultivos:         p.cultivos || [],  // todos los cultivos relacionados
    }));
  } catch (e) {
    mostrarToast('No se pudo cargar el listado de plagas.', 'error');
    plagasDB = [];
  }
}

async function recargarTodo() {
  await Promise.all([cargarCultivos(), cargarPlagas()]);
  actualizarBadges();
  pestañaActiva === 'cultivos' ? renderizarTablaCultivos() : renderizarTablaPlaygas();
  cargarCultivosEnCombo(null);
}


/* ─────────────────────────────────────────────────────────────
   3. MÓDULO: CULTIVOS
   ───────────────────────────────────────────────────────────── */

/* ── 3a. Renderizado de tabla ── */

function renderizarTablaCultivos() {
  const thead = document.getElementById('cat-thead');
  const tbody = document.getElementById('cat-tbody');
  const empty = document.getElementById('cat-empty');
  const badge = document.getElementById('cat-badge-cultivos');
  const info  = document.getElementById('cat-info-count');

  if (!thead || !tbody) return;
  if (badge) badge.textContent = cultivosDB.length;

  const termino   = terminoBusqueda.toLowerCase().trim();
  const filtrados = termino
    ? cultivosDB.filter(c =>
        c.nombreEspecie?.toLowerCase().includes(termino) ||
        c.variedad?.toLowerCase().includes(termino) ||
        c.descripcion?.toLowerCase().includes(termino)
      )
    : cultivosDB;

  thead.innerHTML = `
    <tr>
      <th style="width:52px">ID</th>
      <th>Nombre especie</th>
      <th>Variedad</th>
      <th>Plagas relacionadas</th>
      <th>Descripción</th>
      <th class="gu-th-acciones">Acciones</th>
    </tr>`;

  if (filtrados.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.hidden = false;
    if (info)  info.innerHTML = '<strong>0</strong> registros';
    return;
  }

  if (empty) empty.hidden = true;
  if (info)  info.innerHTML = `<strong>${filtrados.length}</strong> de ${cultivosDB.length} registros`;

  tbody.innerHTML = filtrados.map(c => `
    <tr>
      <td class="gl-td-id">${c.id}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          ${_renderThumb(c.imagen, c.nombreEspecie)}
          <span style="font-weight:600;color:var(--gu-n900)">${escapar(c.nombreEspecie)}</span>
        </div>
      </td>
      <td>${escapar(c.variedad)}</td>
      <td>${_renderPlagasBadges(c.plagas)}</td>
      <td style="color:var(--gu-n500);font-size:.85rem">${escapar(c.descripcion || '—')}</td>
      <td>
        <div class="gu-acciones">
          ${_btnEditar(`abrirModalEditarCultivo(${c.id})`, c.nombreEspecie)}
          ${_btnEliminar(`pedirConfirmarEliminarCultivo(${c.id}, '${escapar(c.nombreEspecie)}')`, c.nombreEspecie)}
        </div>
      </td>
    </tr>`).join('');
}

function _renderPlagasBadges(plagas) {
  if (!plagas || plagas.length === 0)
    return '<span style="color:var(--gu-n500);font-size:.8rem">Sin plagas</span>';
  return plagas.map(p =>
    `<span class="plag-badge-cultivo" style="background:#fce4ec;color:#c62828;margin:1px"
           title="${escapar(p.Nombre_cientifico || '')}">${escapar(p.Nombre_comun || p.nombreComun || '')}</span>`
  ).join('');
}


/* ── 3b. Modal cultivos ── */

function abrirModalNuevoCultivo() {
  catEstado.editandoId   = null;
  catEstado.imagenBase64 = null;
  document.getElementById('cat-modal-titulo').textContent = 'Nuevo cultivo';
  document.getElementById('cat-f-nombre-especie').value   = '';
  document.getElementById('cat-f-variedad').value         = '';
  document.getElementById('cat-f-descripcion').value      = '';
  resetearImagen('cat', catEstado);
  abrirOverlay(document.getElementById('cat-modal-form'));
  document.getElementById('cat-f-nombre-especie').focus();
}

function abrirModalEditarCultivo(id) {
  const cultivo = cultivosDB.find(c => c.id === id);
  if (!cultivo) return;
  catEstado.editandoId = id;
  document.getElementById('cat-modal-titulo').textContent = 'Editar cultivo';
  document.getElementById('cat-f-nombre-especie').value   = cultivo.nombreEspecie || '';
  document.getElementById('cat-f-variedad').value         = cultivo.variedad       || '';
  document.getElementById('cat-f-descripcion').value      = cultivo.descripcion    || '';
  resetearImagen('cat', catEstado);
  // Mostrar preview de la imagen existente
  const urlCompleta = urlImagenCompleta(cultivo.imagen);
  if (urlCompleta) {
    mostrarPreview('cat', urlCompleta, cultivo.nombreEspecie, null);
  }
  abrirOverlay(document.getElementById('cat-modal-form'));
  document.getElementById('cat-f-nombre-especie').focus();
}

function cerrarModalCultivo() {
  cerrarOverlay(document.getElementById('cat-modal-form'));
}

async function guardarCultivo() {
  const nombreEspecie = document.getElementById('cat-f-nombre-especie').value.trim();
  const variedad      = document.getElementById('cat-f-variedad').value.trim();
  const descripcion   = document.getElementById('cat-f-descripcion').value.trim();

  if (!nombreEspecie) {
    mostrarToast('El nombre de la especie es requerido.', 'error');
    document.getElementById('cat-f-nombre-especie').focus();
    return;
  }
  if (!variedad) {
    mostrarToast('La variedad es requerida.', 'error');
    document.getElementById('cat-f-variedad').focus();
    return;
  }

  // Al crear: imagen obligatoria. Al editar: se conserva si no se sube nueva.
  const esNuevo = catEstado.editandoId === null;
  if (esNuevo && !catEstado.imagenBase64) {
    mostrarToast('Debes seleccionar una imagen.', 'error');
    return;
  }

  const url    = esNuevo ? `${API_CULTIVO}/add` : `${API_CULTIVO}/${catEstado.editandoId}`;
  const method = esNuevo ? 'POST' : 'PUT';

  const formData = new FormData();
  formData.append('Nombre_especie', nombreEspecie);
  formData.append('Variedad',       variedad);
  formData.append('Descripcion',    descripcion);

  if (catEstado.imagenBase64) {
    const res2 = await fetch(catEstado.imagenBase64);
    const blob = await res2.blob();
    const ext  = blob.type.split('/')[1] || 'jpg';
    formData.append('Imagen', blob, `cultivo.${ext}`);
  }
  // Si no hay imagen nueva al editar, el backend conserva la existente

  const btn = document.getElementById('cat-form-guardar');
  btn.disabled = true;
  try {
    const res    = await fetch(url, { method, body: formData });
    const result = await res.json();
    if (result.status === 'Success') {
      mostrarToast(result.message, 'exito');
      cerrarModalCultivo();
      await recargarTodo();
    } else {
      mostrarToast(result.message || 'Error al guardar.', 'error');
    }
  } catch (e) {
    mostrarToast('No se pudo conectar con el servidor.', 'error');
  } finally {
    btn.disabled = false;
  }
}
let _cultivoAEliminarId = null;

function pedirConfirmarEliminarCultivo(id, nombre) {
  _cultivoAEliminarId = id;
  const desc = document.getElementById('cat-confirm-desc');
  if (desc) desc.textContent = `Se eliminará "${nombre}". Esta acción no se puede deshacer.`;
  abrirOverlay(document.getElementById('cat-modal-confirm'));
}

async function confirmarEliminarCultivo() {
  if (_cultivoAEliminarId === null) return;
  try {
    const res    = await fetch(`${API_CULTIVO}/${_cultivoAEliminarId}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.status === 'Success') {
      mostrarToast(result.message, 'aviso');
      cerrarOverlay(document.getElementById('cat-modal-confirm'));
      _cultivoAEliminarId = null;
      await recargarTodo();
    } else {
      mostrarToast(result.message || 'Error al eliminar.', 'error');
    }
  } catch (e) {
    mostrarToast('No se pudo conectar con el servidor.', 'error');
  }
}


/* ─────────────────────────────────────────────────────────────
   4. MÓDULO: PLAGAS
   ───────────────────────────────────────────────────────────── */

/* ── 4a. Renderizado de tabla ── */

function resolverNombreCultivo(cultivoId) {
  if (cultivoId == null) return '—';
  const cultivo = cultivosDB.find(c => c.id === Number(cultivoId));
  return cultivo ? `${cultivo.nombreEspecie} — ${cultivo.variedad}` : '—';
}

function renderizarTablaPlaygas() {
  const thead = document.getElementById('cat-thead');
  const tbody = document.getElementById('cat-tbody');
  const empty = document.getElementById('cat-empty');
  const badge = document.getElementById('cat-badge-plagas');
  const info  = document.getElementById('cat-info-count');

  if (!thead || !tbody) return;
  if (badge) badge.textContent = plagasDB.length;

  const termino   = terminoBusqueda.toLowerCase().trim();
  const filtradas = termino
    ? plagasDB.filter(p =>
        p.nombreCientifico?.toLowerCase().includes(termino) ||
        p.nombreComun?.toLowerCase().includes(termino) ||
        p.descripcion?.toLowerCase().includes(termino) ||
        resolverNombreCultivo(p.cultivoId).toLowerCase().includes(termino)
      )
    : plagasDB;

  thead.innerHTML = `
    <tr>
      <th style="width:52px">ID</th>
      <th>Nombre científico</th>
      <th>Nombre común</th>
      <th>Cultivo asociado</th>
      <th>Descripción</th>
      <th class="gu-th-acciones">Acciones</th>
    </tr>`;

  if (filtradas.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.hidden = false;
    if (info)  info.innerHTML = '<strong>0</strong> registros';
    return;
  }

  if (empty) empty.hidden = true;
  if (info)  info.innerHTML = `<strong>${filtradas.length}</strong> de ${plagasDB.length} registros`;

  tbody.innerHTML = filtradas.map(p => {
    const nombreCultivo = resolverNombreCultivo(p.cultivoId);
    return `
    <tr>
      <td class="gl-td-id">${p.id}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          ${_renderThumb(p.imagen, p.nombreCientifico)}
          <span style="font-style:italic;color:var(--gu-n700)">${escapar(p.nombreCientifico)}</span>
        </div>
      </td>
      <td style="font-weight:600;color:var(--gu-n900)">${escapar(p.nombreComun)}</td>
      <td>
        ${nombreCultivo !== '—'
          ? `<span class="plag-badge-cultivo">${escapar(nombreCultivo)}</span>`
          : '<span style="color:var(--gu-n500)">—</span>'
        }
      </td>
      <td style="color:var(--gu-n500);font-size:.85rem">${escapar(p.descripcion || '—')}</td>
      <td>
        <div class="gu-acciones">
          ${_btnEditar(`abrirModalEditarPlaga(${p.id})`, p.nombreComun)}
          ${_btnEliminar(`pedirConfirmarEliminarPlaga(${p.id}, '${escapar(p.nombreComun)}')`, p.nombreComun)}
        </div>
      </td>
    </tr>`;
  }).join('');
}


/* ── 4b. Modal plagas ── */

function abrirModalNuevaPlaga() {
  plagEstado.editandoId        = null;
  plagEstado.editandoCultivoId = null;
  plagEstado.imagenBase64      = null;
  document.getElementById('plag-modal-titulo').textContent     = 'Nueva plaga';
  document.getElementById('plag-f-nombre-cientifico').value    = '';
  document.getElementById('plag-f-nombre-comun').value         = '';
  document.getElementById('plag-f-descripcion').value          = '';
  resetearCombo();
  cargarCultivosEnCombo(null);
  resetearImagen('plag', plagEstado);
  const errorCultivo = document.getElementById('plag-f-cultivo-error');
  if (errorCultivo) errorCultivo.hidden = true;
  abrirOverlay(document.getElementById('plag-modal-form'));
  document.getElementById('plag-f-nombre-cientifico').focus();
}

function abrirModalEditarPlaga(id) {
  const plaga = plagasDB.find(p => p.id === id);
  if (!plaga) return;
  plagEstado.editandoId        = id;
  plagEstado.editandoCultivoId = plaga.cultivoId || null;
  document.getElementById('plag-modal-titulo').textContent     = 'Editar plaga';
  document.getElementById('plag-f-nombre-cientifico').value    = plaga.nombreCientifico || '';
  document.getElementById('plag-f-nombre-comun').value         = plaga.nombreComun      || '';
  document.getElementById('plag-f-descripcion').value          = plaga.descripcion      || '';
  resetearCombo();
  cargarCultivosEnCombo(plaga.cultivoId || null);
  const errorCultivo = document.getElementById('plag-f-cultivo-error');
  if (errorCultivo) errorCultivo.hidden = true;
  resetearImagen('plag', plagEstado);
  // Mostrar preview de la imagen existente
  const urlCompleta = urlImagenCompleta(plaga.imagen);
  if (urlCompleta) {
    mostrarPreview('plag', urlCompleta, plaga.nombreCientifico, null);
  }
  abrirOverlay(document.getElementById('plag-modal-form'));
  document.getElementById('plag-f-nombre-cientifico').focus();
}

function cerrarModalPlaga() {
  cerrarOverlay(document.getElementById('plag-modal-form'));
}

async function guardarPlaga() {
  const nombreCientifico = document.getElementById('plag-f-nombre-cientifico').value.trim();
  const nombreComun      = document.getElementById('plag-f-nombre-comun').value.trim();
  const descripcion      = document.getElementById('plag-f-descripcion').value.trim();
  const inputHidCultivo  = document.getElementById('plag-f-cultivo');
  const cultivoId        = inputHidCultivo ? Number(inputHidCultivo.value) || null : null;

  if (!nombreCientifico) {
    mostrarToast('El nombre científico es requerido.', 'error');
    document.getElementById('plag-f-nombre-cientifico').focus();
    return;
  }
  if (!nombreComun) {
    mostrarToast('El nombre común es requerido.', 'error');
    document.getElementById('plag-f-nombre-comun').focus();
    return;
  }
  if (!validarCultivoDePlaga()) {
    mostrarToast('Debes seleccionar el cultivo asociado a esta plaga.', 'error');
    return;
  }

  // Al crear: imagen obligatoria. Al editar: se conserva si no se sube nueva.
  const esNuevo = plagEstado.editandoId === null;
  if (esNuevo && !plagEstado.imagenBase64) {
    mostrarToast('Debes seleccionar una imagen.', 'error');
    return;
  }

  const url    = esNuevo ? `${API_PLAGA}/add` : `${API_PLAGA}/${plagEstado.editandoId}`;
  const method = esNuevo ? 'POST' : 'PUT';

  const formData = new FormData();
  formData.append('Nombre_cientifico', nombreCientifico);
  formData.append('Nombre_comun',      nombreComun);
  formData.append('Descripcion',       descripcion);
  if (cultivoId) formData.append('Id_cultivos', JSON.stringify([cultivoId]));

  if (plagEstado.imagenBase64) {
    const res2 = await fetch(plagEstado.imagenBase64);
    const blob = await res2.blob();
    const ext  = blob.type.split('/')[1] || 'jpg';
    formData.append('Imagen', blob, `plaga.${ext}`);
  }
  // Si no hay imagen nueva al editar, el backend conserva la existente

  const btn = document.getElementById('plag-form-guardar');
  btn.disabled = true;
  try {
    const res    = await fetch(url, { method, body: formData });
    const result = await res.json();
    if (result.status === 'Success') {
      mostrarToast(result.message, 'exito');
      cerrarModalPlaga();
      await recargarTodo();
    } else {
      mostrarToast(result.message || 'Error al guardar.', 'error');
    }
  } catch (e) {
    mostrarToast('No se pudo conectar con el servidor.', 'error');
  } finally {
    btn.disabled = false;
  }
}
let _plagaAEliminarId = null;

function pedirConfirmarEliminarPlaga(id, nombre) {
  _plagaAEliminarId = id;
  const desc = document.getElementById('plag-confirm-desc');
  if (desc) desc.textContent = `Se eliminará "${nombre}". Esta acción no se puede deshacer.`;
  abrirOverlay(document.getElementById('plag-modal-confirm'));
}

async function confirmarEliminarPlaga() {
  if (_plagaAEliminarId === null) return;
  try {
    const res    = await fetch(`${API_PLAGA}/${_plagaAEliminarId}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.status === 'Success') {
      mostrarToast(result.message, 'aviso');
      cerrarOverlay(document.getElementById('plag-modal-confirm'));
      _plagaAEliminarId = null;
      await recargarTodo();
    } else {
      mostrarToast(result.message || 'Error al eliminar.', 'error');
    }
  } catch (e) {
    mostrarToast('No se pudo conectar con el servidor.', 'error');
  }
}


/* ── 4d. Combobox de cultivo con búsqueda (sin cambios de lógica) ── */

function cargarCultivosEnCombo(cultivoIdSeleccionado = null, filtro = '') {
  const lista    = document.getElementById('plag-f-cultivo-list');
  const inputVis = document.getElementById('plag-f-cultivo-input');
  const inputHid = document.getElementById('plag-f-cultivo');
  if (!lista) return;

  const termino   = filtro.toLowerCase().trim();
  const filtrados = termino
    ? cultivosDB.filter(c =>
        c.nombreEspecie.toLowerCase().includes(termino) ||
        c.variedad.toLowerCase().includes(termino)
      )
    : cultivosDB;

  lista.innerHTML = '';

  if (filtrados.length === 0) {
    lista.innerHTML = '<div class="plag-combo__empty">Sin resultados para esta búsqueda.</div>';
    return;
  }

  filtrados.forEach(c => {
    const texto  = `${c.nombreEspecie} — ${c.variedad}`;
    const opcion = document.createElement('div');
    opcion.className   = 'plag-combo__option';
    opcion.textContent = texto;
    opcion.dataset.id  = c.id;
    opcion.setAttribute('role', 'option');
    if (cultivoIdSeleccionado !== null && Number(c.id) === Number(cultivoIdSeleccionado)) {
      opcion.classList.add('activa');
    }
    opcion.addEventListener('mousedown', e => {
      e.preventDefault();
      seleccionarCultivoCombo(c.id, texto);
    });
    lista.appendChild(opcion);
  });

  if (cultivoIdSeleccionado !== null && !filtro) {
    const cultivo = cultivosDB.find(c => Number(c.id) === Number(cultivoIdSeleccionado));
    if (cultivo && inputVis) inputVis.value = `${cultivo.nombreEspecie} — ${cultivo.variedad}`;
    if (inputHid) inputHid.value = cultivoIdSeleccionado;
  }
}

function seleccionarCultivoCombo(id, texto) {
  const combo    = document.getElementById('plag-cultivo-combo');
  const inputVis = document.getElementById('plag-f-cultivo-input');
  const inputHid = document.getElementById('plag-f-cultivo');
  const error    = document.getElementById('plag-f-cultivo-error');
  if (inputVis) { inputVis.value = texto; inputVis.classList.remove('error'); }
  if (inputHid) inputHid.value = id;
  if (error)    error.hidden = true;
  if (combo)    combo.classList.remove('open');
  if (inputVis) inputVis.setAttribute('aria-expanded', 'false');
}

function resetearCombo() {
  const combo    = document.getElementById('plag-cultivo-combo');
  const inputVis = document.getElementById('plag-f-cultivo-input');
  const inputHid = document.getElementById('plag-f-cultivo');
  const error    = document.getElementById('plag-f-cultivo-error');
  if (inputVis) { inputVis.value = ''; inputVis.classList.remove('error'); inputVis.setAttribute('aria-expanded', 'false'); }
  if (inputHid) inputHid.value = '';
  if (error)    error.hidden = true;
  if (combo)    combo.classList.remove('open');
}

function validarCultivoDePlaga() {
  const inputHid = document.getElementById('plag-f-cultivo');
  const error    = document.getElementById('plag-f-cultivo-error');
  const inputVis = document.getElementById('plag-f-cultivo-input');
  if (!inputHid) return true;
  const valido = inputHid.value !== '';
  if (error) error.hidden = valido;
  if (!valido && inputVis) { inputVis.classList.add('error'); inputVis.focus(); }
  return valido;
}

function initCultivoCombo() {
  const combo    = document.getElementById('plag-cultivo-combo');
  const inputVis = document.getElementById('plag-f-cultivo-input');
  if (!combo || !inputVis) return;

  inputVis.addEventListener('focus', () => {
    cargarCultivosEnCombo(document.getElementById('plag-f-cultivo')?.value || null, inputVis.value);
    combo.classList.add('open');
    inputVis.setAttribute('aria-expanded', 'true');
  });

  inputVis.addEventListener('input', () => {
    const inputHid = document.getElementById('plag-f-cultivo');
    if (inputHid) inputHid.value = '';
    cargarCultivosEnCombo(null, inputVis.value);
    combo.classList.add('open');
    inputVis.setAttribute('aria-expanded', 'true');
    inputVis.classList.remove('error');
  });

  inputVis.addEventListener('blur', () => {
    setTimeout(() => {
      combo.classList.remove('open');
      inputVis.setAttribute('aria-expanded', 'false');
      const inputHid = document.getElementById('plag-f-cultivo');
      if (inputHid && !inputHid.value) inputVis.value = '';
    }, 150);
  });

  inputVis.addEventListener('keydown', e => {
    const lista    = document.getElementById('plag-f-cultivo-list');
    const opciones = lista ? [...lista.querySelectorAll('.plag-combo__option')] : [];
    const activa   = lista?.querySelector('.plag-combo__option.activa');
    let idx        = opciones.indexOf(activa);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = Math.min(idx + 1, opciones.length - 1);
      opciones.forEach((o, i) => o.classList.toggle('activa', i === idx));
      opciones[idx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
      opciones.forEach((o, i) => o.classList.toggle('activa', i === idx));
      opciones[idx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activa) seleccionarCultivoCombo(activa.dataset.id, activa.textContent);
    }
  });

  document.addEventListener('click', e => {
    if (!combo.contains(e.target)) {
      combo.classList.remove('open');
      inputVis.setAttribute('aria-expanded', 'false');
    }
  });
}


/* ── Visor de imagen ampliada (sin cambios) ── */

function verImagenZoom(src) {
  if (!src) return;
  const overlay = document.getElementById('cat-zoom-overlay');
  const img     = document.getElementById('cat-zoom-img');
  if (!overlay || !img) return;
  img.src = src;
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('visible'));
  document.body.style.overflow = 'hidden';
}

function cerrarZoom() {
  const overlay = document.getElementById('cat-zoom-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  document.body.style.overflow = '';
  overlay.addEventListener('transitionend', () => { overlay.hidden = true; }, { once: true });
}


/* ─────────────────────────────────────────────────────────────
   Helpers de renderizado (sin cambios respecto a la base)
   ───────────────────────────────────────────────────────────── */

function _renderThumb(imagen, nombre) {
  const inicial = (nombre || '?')[0].toUpperCase();
  // Convertir rutas relativas del servidor a URL absoluta
  const src = urlImagenCompleta(imagen);
  if (src) {
    return `<button class="cat-img-thumb" onclick="verImagenZoom('${escapar(src)}')"
                    title="Ver imagen ampliada" aria-label="Ver imagen de ${escapar(nombre)}">
              <img src="${escapar(src)}" alt="${escapar(nombre)}"
                   onerror="this.parentElement.innerHTML='<div class=cat-img-thumb__fallback>${inicial}</div>'">
            </button>`;
  }
  return `<span class="cat-img-thumb__fallback"
               style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e5e7eb;font-size:.85rem;font-weight:700;color:#6b7280">${inicial}</span>`;
}

function _btnEditar(onclick, nombre) {
  return `<button class="gu-btn-accion gu-btn-accion--editar" title="Editar"
                  onclick="${onclick}" aria-label="Editar ${escapar(nombre)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>`;
}

function _btnEliminar(onclick, nombre) {
  return `<button class="gu-btn-accion gu-btn-accion--eliminar" title="Eliminar"
                  onclick="${onclick}" aria-label="Eliminar ${escapar(nombre)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>`;
}


/* ─────────────────────────────────────────────────────────────
   5. PESTAÑAS Y BUSCADOR (sin cambios)
   ───────────────────────────────────────────────────────────── */

function actualizarBadges() {
  const badgeCultivos = document.getElementById('cat-badge-cultivos');
  const badgePlagas   = document.getElementById('cat-badge-plagas');
  if (badgeCultivos) badgeCultivos.textContent = cultivosDB.length;
  if (badgePlagas)   badgePlagas.textContent   = plagasDB.length;
}

function cambiarPestaña(filtro) {
  pestañaActiva   = filtro;
  terminoBusqueda = '';
  document.querySelectorAll('.gu-tab').forEach(tab => {
    const esActiva = tab.dataset.filtro === filtro;
    tab.classList.toggle('activa', esActiva);
    tab.setAttribute('aria-selected', esActiva);
  });
  const busqueda = document.getElementById('cat-busqueda');
  if (busqueda) busqueda.value = '';
  const btnNuevo = document.getElementById('cat-btn-nuevo');
  if (btnNuevo) {
    btnNuevo.textContent = filtro === 'cultivos' ? '+ Agregar cultivo' : '+ Nueva plaga';
    btnNuevo.setAttribute('aria-label', filtro === 'cultivos' ? 'Agregar cultivo' : 'Nueva plaga');
  }
  filtro === 'cultivos' ? renderizarTablaCultivos() : renderizarTablaPlaygas();
}

function filtrarTabla(termino) {
  terminoBusqueda = termino;
  pestañaActiva === 'cultivos' ? renderizarTablaCultivos() : renderizarTablaPlaygas();
}


/* ─────────────────────────────────────────────────────────────
   6. SIDEBAR (sin cambios)
   ───────────────────────────────────────────────────────────── */

function initSidebar() {
  const btn = document.getElementById('toggleSidebar');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.querySelector('.layout')?.classList.toggle('sidebar-hidden');
    btn.textContent = btn.textContent.includes('Ocultar') ? '→ Mostrar menú' : '← Ocultar menú';
  });
}


/* ─────────────────────────────────────────────────────────────
   7. INIT
   ───────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {

  initSidebar();
  initImagen('cat', catEstado);
  initImagen('plag', plagEstado);
  initCultivoCombo();

  /* Pestañas */
  document.querySelectorAll('.gu-tab').forEach(tab => {
    tab.addEventListener('click', () => cambiarPestaña(tab.dataset.filtro));
  });

  /* Buscador */
  document.getElementById('cat-busqueda')
    ?.addEventListener('input', e => filtrarTabla(e.target.value));

  /* Botón agregar */
  document.getElementById('cat-btn-nuevo')
    ?.addEventListener('click', () =>
      pestañaActiva === 'cultivos' ? abrirModalNuevoCultivo() : abrirModalNuevaPlaga()
    );

  /* Modal cultivos */
  document.getElementById('cat-modal-close')?.addEventListener('click', cerrarModalCultivo);
  document.getElementById('cat-form-cancelar')?.addEventListener('click', cerrarModalCultivo);
  document.getElementById('cat-form-guardar')?.addEventListener('click', guardarCultivo);
  document.getElementById('cat-modal-form')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) cerrarModalCultivo();
  });

  /* Confirmar eliminar cultivo */
  document.getElementById('cat-confirm-cancelar')
    ?.addEventListener('click', () => cerrarOverlay(document.getElementById('cat-modal-confirm')));
  document.getElementById('cat-confirm-ok')?.addEventListener('click', confirmarEliminarCultivo);

  /* Modal plagas */
  document.getElementById('plag-modal-close')?.addEventListener('click', cerrarModalPlaga);
  document.getElementById('plag-form-cancelar')?.addEventListener('click', cerrarModalPlaga);
  document.getElementById('plag-form-guardar')?.addEventListener('click', guardarPlaga);
  document.getElementById('plag-modal-form')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) cerrarModalPlaga();
  });

  /* Confirmar eliminar plaga */
  document.getElementById('plag-confirm-cancelar')
    ?.addEventListener('click', () => cerrarOverlay(document.getElementById('plag-modal-confirm')));
  document.getElementById('plag-confirm-ok')?.addEventListener('click', confirmarEliminarPlaga);

  /* Visor zoom */
  const zoomOverlay = document.getElementById('cat-zoom-overlay');
  if (zoomOverlay) {
    zoomOverlay.addEventListener('click', e => {
      if (e.target === zoomOverlay || e.target.closest('.cat-zoom-close')) cerrarZoom();
    });
  }

  /* Escape global */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (zoomOverlay && !zoomOverlay.hidden) { cerrarZoom(); return; }
    const catModal  = document.getElementById('cat-modal-form');
    const plagModal = document.getElementById('plag-modal-form');
    if (catModal  && !catModal.hidden)  cerrarModalCultivo();
    if (plagModal && !plagModal.hidden) cerrarModalPlaga();
    const catConfirm  = document.getElementById('cat-modal-confirm');
    const plagConfirm = document.getElementById('plag-modal-confirm');
    if (catConfirm  && !catConfirm.hidden)  cerrarOverlay(catConfirm);
    if (plagConfirm && !plagConfirm.hidden) cerrarOverlay(plagConfirm);
  });

  /* Carga inicial desde el API */
  await recargarTodo();
  cambiarPestaña('cultivos');
});