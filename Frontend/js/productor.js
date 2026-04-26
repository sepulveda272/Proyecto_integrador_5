/**
 * productor.js — SIFEX · Módulo Productor
 * ─────────────────────────────────────────────────────────────────────────────
 * Cubre todas las páginas del rol Productor:
 *   - lugarProducción.html : tabla, formulario creación, lotes, edición, modal detalle
 *   - citas.html           : modal solicitar cita, filtros de tarjetas
 *   - inicio.html          : sin lógica activa (usa #toast)
 *   - perfil.html          : sin lógica activa (usa #toast)
 *
 * Organización:
 *   1.  Estado global y catálogos
 *   2.  Navegación entre vistas
 *   3.  Vista de edición — Predios
 *   4.  Vista de edición — Lotes
 *   5.  Vista de edición — Guardar
 *   6.  Formulario de creación (lugar + predios)
 *   7.  Tabla de lugares
 *   8.  Vista de lotes — agregar lotes a un lugar
 *   9.  Modal de detalle (tabs · accordion · paginación)
 *   10. Toast
 *   11. Modal solicitar cita
 *   12. Filtros de tarjetas de citas
 * ─────────────────────────────────────────────────────────────────────────────
 */


// ═══════════════════════════════════════════════════════════════════════════════
// 1. ESTADO GLOBAL Y CATÁLOGOS
// ═══════════════════════════════════════════════════════════════════════════════

let rowCount      = 1;    // Contador incremental de filas en la tabla
let activeLugarId = null; // Id del lugar activo en la vista de lotes

/**
 * lugaresData — almacén principal de datos por lugar.
 * Estructura: { [lugarId]: { nombre, predios[], lotes[] } }
 *   predios[]: [{ codigo }]
 *   lotes[]:   [{ area, areaSiembra, estadoFenologico, cultivo, fechaSiembra }]
 */
const lugaresData = {
    1: {
        nombre:  'San Cristobal',
        predios: [{ codigo: 'PRD-001' }],
        lotes:   [],
    }
};

const ESTADOS_FENOLOGICOS = ['Germinación', 'Plántula', 'Vegetativo', 'Floración', 'Fructificación', 'Maduración'];
const CULTIVOS            = ['Café', 'Maíz', 'Frijol', 'Papa', 'Cacao', 'Aguacate', 'Plátano', 'Arroz', 'Yuca', 'Tomate'];
// ELIMINADO: ESTADOS_PREDIO — constante declarada pero nunca referenciada en ningún HTML ni función.


// ═══════════════════════════════════════════════════════════════════════════════
// 2. NAVEGACIÓN — tabla / form / lotes / edit
// ═══════════════════════════════════════════════════════════════════════════════

/** Activa la vista indicada y desactiva las demás. */
function showView(id) {
    ['view-table', 'view-form', 'view-lotes', 'view-edit'].forEach(v => {
        const el = document.getElementById(v);
        if (el) el.classList.toggle('active', v === id);
    });
}

function goToForm()  { showView('view-form');  resetForm(); }
function goToTable() { showView('view-table'); }

/** Navega a la vista de lotes para el lugar indicado. */
function goToLotes(lugarId, lugarNombre) {
    activeLugarId = lugarId;
    document.getElementById('lotes-lugar-nombre').textContent = lugarNombre;
    document.getElementById('l-area-total').value             = '';
    document.getElementById('l-num-lotes').value              = '';
    document.getElementById('lotes-container').innerHTML      = '';
    document.getElementById('btn-guardar-lotes').disabled     = true;
    showView('view-lotes');
}

/** Carga los datos del lugar en la vista de edición. */
function goToEdit(lugarId) {
    const lugar = lugaresData[lugarId];
    if (!lugar) { showToast('⚠ No se encontraron datos para este lugar.'); return; }
    document.getElementById('edit-lugar-id').value                = lugarId;
    document.getElementById('edit-lugar-nombre-titulo').textContent = lugar.nombre;
    renderPrediosEdit(lugarId);
    renderLotesEdit(lugarId);
    showView('view-edit');
}


// ═══════════════════════════════════════════════════════════════════════════════
// 3. VISTA DE EDICIÓN — Predios
// ═══════════════════════════════════════════════════════════════════════════════

/** Renderiza la lista editable de predios en #edit-predios-container. */
function renderPrediosEdit(lugarId) {
    const lugar     = lugaresData[lugarId];
    const container = document.getElementById('edit-predios-container');
    if (!container || !lugar) return;

    const filasHTML = lugar.predios.length === 0
        ? '<p class="edit-empty-msg">Sin predios registrados.</p>'
        : `<div class="predios-edit-list">
            ${lugar.predios.map((p, idx) => `
                <div class="predio-edit-row" id="predio-edit-row-${idx}">
                    <span class="predio-edit-label">Predio ${idx + 1}</span>
                    <span class="predio-edit-code">${p.codigo || p.nombre || '—'}</span>
                    <button class="btn-del-predio" title="Eliminar predio"
                            onclick="eliminarPredioEdit(${lugarId}, ${idx})">🗑</button>
                </div>
            `).join('')}
           </div>`;

    container.innerHTML = filasHTML + `
        <div class="predio-add-row">
            <input id="edit-nuevo-predio-code" class="form-input"
                   type="text" placeholder="Código del nuevo predio (Ej. PRD-002)">
            <button class="btn-agregar" onclick="agregarPredioEdit(${lugarId})">+ Agregar predio</button>
        </div>`;
}

function eliminarPredioEdit(lugarId, idx) {
    const lugar = lugaresData[lugarId];
    if (!lugar) return;
    lugar.predios.splice(idx, 1);
    renderPrediosEdit(lugarId);
    showToast('🗑 Predio eliminado.');
}

function agregarPredioEdit(lugarId) {
    const input  = document.getElementById('edit-nuevo-predio-code');
    const codigo = input ? input.value.trim() : '';
    if (!codigo) { showToast('⚠ Ingresa el código del predio.'); return; }
    const lugar = lugaresData[lugarId];
    if (!lugar) return;
    lugar.predios.push({ codigo });
    renderPrediosEdit(lugarId);
    showToast(`✔ Predio "${codigo}" agregado.`);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 4. VISTA DE EDICIÓN — Lotes (accordion)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Renderiza tarjetas accordion de lotes en #edit-lotes-container.
 * Campos editables: área de siembra, cultivo, estado fenológico, área total.
 * Campo solo lectura: fecha de siembra.
 */
function renderLotesEdit(lugarId) {
    const lugar     = lugaresData[lugarId];
    const container = document.getElementById('edit-lotes-container');
    if (!container || !lugar) return;

    const { lotes } = lugar;

    if (lotes.length === 0) {
        container.innerHTML = '<p class="edit-empty-msg">Sin lotes registrados. Usa el botón 🌾 para agregar lotes.</p>';
        return;
    }

    container.innerHTML = lotes.map((lote, idx) => {
        const cultivoOptions = CULTIVOS.map(c =>
            `<option value="${c}"${lote.cultivo === c ? ' selected' : ''}>${c}</option>`
        ).join('');

        const estadoOptions = ESTADOS_FENOLOGICOS.map(e =>
            `<option value="${e}"${lote.estadoFenologico === e ? ' selected' : ''}>${e}</option>`
        ).join('');

        return `
        <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px;">
            <div class="lote-edit-card" id="lote-edit-card-${idx}" style="flex:1; margin-bottom:0;">
                <div class="lote-edit-header" onclick="toggleLoteEdit(${idx})">
                    <span>🌾 Lote ${idx + 1}</span>
                    <span class="lote-edit-chevron">▼</span>
                </div>
                <div class="lote-edit-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Área de siembra (ha)</label>
                            <input class="form-input lote-edit-field" type="number" min="0.01" step="0.01"
                                   id="edit-lote-siembra-${idx}" value="${lote.areaSiembra || ''}" placeholder="Ej. 1.5">
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                Fecha de siembra
                                <span class="label-hint">(solo lectura)</span>
                            </label>
                            <input class="form-input readonly" type="date"
                                   id="edit-lote-fecha-${idx}" value="${lote.fechaSiembra || ''}" readonly>
                        </div>
                    </div>
                    <div class="form-row" style="margin-top:8px;">
                        <div class="form-group">
                            <label class="form-label">Cultivo</label>
                            <select class="form-select lote-edit-field" id="edit-lote-cultivo-${idx}">
                                <option value="">Seleccionar...</option>
                                ${cultivoOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Estado fenológico</label>
                            <select class="form-select lote-edit-field" id="edit-lote-estado-${idx}">
                                <option value="">Seleccionar...</option>
                                ${estadoOptions}
                            </select>
                        </div>
                    </div>
                    <div class="form-row" style="margin-top:8px;">
                        <div class="form-group">
                            <label class="form-label">Área total lote (ha)</label>
                            <input class="form-input lote-edit-field" type="number" min="0.01" step="0.01"
                                   id="edit-lote-area-${idx}" value="${lote.area || ''}" placeholder="Ej. 2.0">
                        </div>
                    </div>
                    <p class="lote-edit-note">
                        * Fecha de siembra es de solo lectura. Los demás campos pueden modificarse.
                    </p>
                </div>
            </div>
            <button class="btn-del-predio" title="Eliminar lote ${idx + 1}"
                    style="margin-top:6px; flex-shrink:0;"
                    onclick="eliminarLoteEdit(${lugarId}, ${idx})">🗑</button>
        </div>`;
    }).join('');
}

/** Expande o colapsa una tarjeta de lote en la vista de edición. */
function toggleLoteEdit(idx) {
    const card = document.getElementById(`lote-edit-card-${idx}`);
    if (card) card.classList.toggle('open');
}

/** Pide confirmación y elimina el lote indicado del lugar en edición. */
function eliminarLoteEdit(lugarId, idx) {
    const lugar = lugaresData[lugarId];
    if (!lugar) return;
    const numLote = idx + 1;
    if (!confirm(`¿Eliminar Lote ${numLote} del lugar "${lugar.nombre}"?\n\nEsta acción no se puede deshacer.`)) return;
    lugar.lotes.splice(idx, 1);
    renderLotesEdit(lugarId);
    showToast(`🗑 Lote ${numLote} eliminado correctamente.`);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 5. VISTA DE EDICIÓN — Guardar cambios
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Persiste en lugaresData los cambios de la vista de edición.
 * Actualiza por lote: areaSiembra, cultivo, estadoFenologico, area.
 * fechaSiembra NO se modifica (campo readonly).
 */
function guardarEdicion() {
    const lugarId = parseInt(document.getElementById('edit-lugar-id').value);
    const lugar   = lugaresData[lugarId];
    if (!lugar) return;

    lugar.lotes.forEach((lote, idx) => {
        const siembraEl = document.getElementById(`edit-lote-siembra-${idx}`);
        const cultivoEl = document.getElementById(`edit-lote-cultivo-${idx}`);
        const estadoEl  = document.getElementById(`edit-lote-estado-${idx}`);
        const areaEl    = document.getElementById(`edit-lote-area-${idx}`);

        if (siembraEl) lote.areaSiembra      = parseFloat(siembraEl.value) || lote.areaSiembra;
        if (cultivoEl) lote.cultivo           = cultivoEl.value;
        if (estadoEl  && estadoEl.value)  lote.estadoFenologico = estadoEl.value;
        if (areaEl    && areaEl.value)    lote.area             = parseFloat(areaEl.value);
    });

    goToTable();
    showToast(`✔ Lugar "${lugar.nombre}" actualizado correctamente.`);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 6. FORMULARIO DE CREACIÓN — Lugar + predios
// ═══════════════════════════════════════════════════════════════════════════════

function resetForm() {
    const nombre = document.getElementById('f-nombre');
    const num    = document.getElementById('f-num-predios');
    if (nombre) nombre.value = '';
    if (num)    num.value    = '';
    document.getElementById('predios-container').innerHTML = '';
    updateAceptarBtn();
}

function onBasicChange() { updateAceptarBtn(); }

/** Renderiza un input de código por cada predio solicitado (máx. 20). */
function onPrediosChange() {
    const val       = parseInt(document.getElementById('f-num-predios').value) || 0;
    const container = document.getElementById('predios-container');
    container.innerHTML = '';

    if (val > 0 && val <= 20) {
        for (let i = 1; i <= val; i++) {
            const div = document.createElement('div');
            div.className = 'predio-item';
            div.innerHTML = `
                <span class="predio-label">Predio ${i}</span>
                <input class="form-input predio-code" type="text"
                       placeholder="Código del predio ${i}"
                       oninput="updateAceptarBtn()"
                       style="flex:1;">`;
            container.appendChild(div);
        }
    }
    updateAceptarBtn();
}

function isSection1Complete() {
    const nombre     = document.getElementById('f-nombre').value.trim();
    const numPredios = parseInt(document.getElementById('f-num-predios').value) || 0;
    const codes      = [...document.querySelectorAll('.predio-code')];
    return nombre !== '' &&
           numPredios > 0 &&
           codes.length === numPredios &&
           codes.every(c => c.value.trim() !== '');
}

function updateAceptarBtn() {
    document.getElementById('btn-aceptar').disabled = !isSection1Complete();
}


// ═══════════════════════════════════════════════════════════════════════════════
// 7. TABLA — crear fila y registrar lugar
// ═══════════════════════════════════════════════════════════════════════════════

/** Construye y devuelve el <tr> con los botones de acción para un lugar. */
function crearFilaTabla(id, nombre) {
    const row = document.createElement('tr');
    row.dataset.lugarId = id;
    row.innerHTML = `
        <td>${id}</td>
        <td>${nombre}</td>
        <td>
            <button class="action-btn action-edit" title="Editar"
                    onclick="goToEdit(${id})">✏️</button>
            <button class="action-btn action-del" title="Eliminar">🗑</button>
            <button class="action-btn action-eye" title="Ver detalle"
                    onclick="abrirModalDetalle(${id})">👁</button>
            <button class="action-btn action-lote" title="Agregar lotes"
                    onclick="goToLotes(${id}, '${nombre.replace(/'/g, "\\'")}')">🌾</button>
        </td>`;
    row.style.animation = 'fadeIn .4s ease';
    return row;
}

/** Valida, registra el nuevo lugar en lugaresData y lo añade a la tabla. */
function crearLugar() {
    if (!isSection1Complete()) return;
    rowCount++;
    const nombre  = document.getElementById('f-nombre').value.trim();
    const predios = [...document.querySelectorAll('.predio-code')]
        .map(input => ({ codigo: input.value.trim() }));
    lugaresData[rowCount] = { nombre, predios, lotes: [] };
    document.getElementById('table-body').appendChild(crearFilaTabla(rowCount, nombre));
    goToTable();
    showToast(`✔ Lugar "${nombre}" creado. Agrega lotes con el botón 🌾.`);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 8. VISTA DE LOTES — Agregar lotes a un lugar
// ═══════════════════════════════════════════════════════════════════════════════

function onLotesDetailChange() { updateGuardarLotesBtn(); }

/**
 * Genera dinámicamente una .lote-card por cada lote solicitado (máx. 30).
 * 5 campos .lote-field por tarjeta (orden requerido por guardarLotes):
 *   [0] Área total lote · [1] Área de siembra · [2] Estado fenológico
 *   [3] Cultivo · [4] Fecha de siembra
 * Las tarjetas se crean colapsadas (sin clase 'open') para mejor legibilidad.
 */
function onNumLotesChange() {
    const val       = parseInt(document.getElementById('l-num-lotes').value) || 0;
    const container = document.getElementById('lotes-container');
    container.innerHTML = '';

    if (val > 0 && val <= 30) {
        for (let i = 1; i <= val; i++) {
            const card = document.createElement('div');
            card.className = 'lote-card';
            card.id        = `lote-${i}`;
            card.innerHTML = `
                <div class="lote-card-header" onclick="toggleLote(${i})">
                    <div class="lote-card-title">
                        <span class="lote-status-dot"></span>
                        Lote ${i}
                    </div>
                    <span class="lote-chevron">▼</span>
                </div>
                <div class="lote-card-body">
                    <div class="form-row" style="margin-bottom:12px;">
                        <div class="form-group">
                            <label class="form-label">Área total lote (ha) *</label>
                            <input class="form-input lote-field" type="number" min="0.01" step="0.01"
                                   placeholder="Ej. 2.0" data-lote="${i}" oninput="onLoteFieldChange(${i})">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Área de siembra (ha) *</label>
                            <input class="form-input lote-field" type="number" min="0.01" step="0.01"
                                   placeholder="Ej. 1.5" data-lote="${i}" oninput="onLoteFieldChange(${i})">
                        </div>
                    </div>
                    <div class="form-row triple">
                        <div class="form-group">
                            <label class="form-label">Estado fenológico *</label>
                            <select class="form-select lote-field" data-lote="${i}" onchange="onLoteFieldChange(${i})">
                                <option value="">Seleccionar...</option>
                                ${ESTADOS_FENOLOGICOS.map(e => `<option>${e}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Cultivo *</label>
                            <select class="form-select lote-field" data-lote="${i}" onchange="onLoteFieldChange(${i})">
                                <option value="">Seleccionar...</option>
                                ${CULTIVOS.map(e => `<option>${e}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fecha de siembra *</label>
                            <input class="form-input lote-field" type="date"
                                   data-lote="${i}" oninput="onLoteFieldChange(${i})">
                        </div>
                    </div>
                </div>`;
            container.appendChild(card);
        }
    }
    updateGuardarLotesBtn();
}

/** Expande o colapsa una tarjeta de lote en la vista de creación. */
function toggleLote(i) {
    document.getElementById(`lote-${i}`).classList.toggle('open');
}

/** Actualiza el estado 'complete' de la tarjeta y recalcula el botón guardar. */
function onLoteFieldChange(i) {
    const card     = document.getElementById(`lote-${i}`);
    const complete = [...card.querySelectorAll('.lote-field')].every(f => f.value.trim() !== '');
    card.classList.toggle('complete', complete);
    updateGuardarLotesBtn();
}

function updateGuardarLotesBtn() {
    document.getElementById('btn-guardar-lotes').disabled = !isLotesComplete();
}

/** Valida área total, número de lotes y los 5 campos por lote. */
function isLotesComplete() {
    const areaTotal = parseFloat(document.getElementById('l-area-total').value);
    const numLotes  = parseInt(document.getElementById('l-num-lotes').value) || 0;
    if (!areaTotal || areaTotal <= 0 || numLotes <= 0 || numLotes > 30) return false;
    const fields = document.querySelectorAll('.lote-field');
    if (fields.length !== numLotes * 5) return false;
    return [...fields].every(f => f.value.trim() !== '');
}

/**
 * Persiste los 5 campos de cada lote en lugaresData[activeLugarId].lotes.
 * Orden: [0] area · [1] areaSiembra · [2] estadoFenologico · [3] cultivo · [4] fechaSiembra
 */
function guardarLotes() {
    if (!isLotesComplete() || activeLugarId === null) return;
    const numLotes = parseInt(document.getElementById('l-num-lotes').value);
    const lotes    = [];

    for (let i = 1; i <= numLotes; i++) {
        const fields = [...document.getElementById(`lote-${i}`).querySelectorAll('.lote-field')];
        lotes.push({
            area:             parseFloat(fields[0].value),
            areaSiembra:      parseFloat(fields[1].value),
            estadoFenologico: fields[2].value,
            cultivo:          fields[3].value,
            fechaSiembra:     fields[4].value,
        });
    }

    lugaresData[activeLugarId].lotes     = lotes;
    lugaresData[activeLugarId].areaTotal = parseFloat(document.getElementById('l-area-total').value);
    goToTable();
    showToast(`✔ ${numLotes} lote(s) guardados correctamente.`);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 9. MODAL DE DETALLE — tabs · accordion · paginación
// ═══════════════════════════════════════════════════════════════════════════════

const detallePag = { pagina: 1, porPagina: 5 };

function abrirModalDetalle(lugarId) {
    const lugar = lugaresData[lugarId];
    if (!lugar) { showToast('⚠ No hay información registrada para este lugar.'); return; }
    detallePag.pagina = 1;
    let modal = document.getElementById('modal-detalle');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id        = 'modal-detalle';
        modal.addEventListener('click', e => { if (e.target === modal) cerrarModalDetalle(); });
        document.body.appendChild(modal);
    }
    modal.innerHTML = renderModalDetalle(lugarId, lugar);
    requestAnimationFrame(() => modal.classList.add('show'));
}

function cerrarModalDetalle() {
    const modal = document.getElementById('modal-detalle');
    if (modal) modal.classList.remove('show');
}

function switchDetalleTab(tab) {
    document.querySelectorAll('.detalle-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.detalle-panel').forEach(panel => {
        panel.classList.toggle('active', panel.dataset.panel === tab);
    });
}

function toggleDetalleAccordion(cardId) {
    const card = document.getElementById(cardId);
    if (card) card.classList.toggle('open');
}

/** Construye el panel de lotes: estadísticas + accordion paginado. */
function renderLotesPanel(lotes, lugarId) {
    if (lotes.length === 0) {
        return `<p class="detalle-empty">Sin lotes registrados. Usa el botón 🌾 para agregar.</p>`;
    }

    const areaTotalLotes   = lotes.reduce((s, l) => s + parseFloat(l.area        || 0), 0);
    const areaSiembraTotal = lotes.reduce((s, l) => s + parseFloat(l.areaSiembra || 0), 0);

    const statsHTML = `
        <div class="detalle-stats">
            <div class="detalle-stat">
                <span class="stat-label">Total lotes</span>
                <span class="stat-value">${lotes.length}</span>
            </div>
            <div class="detalle-stat">
                <span class="stat-label">Área total acumulada</span>
                <span class="stat-value">${areaTotalLotes.toFixed(2)} ha</span>
            </div>
            <div class="detalle-stat">
                <span class="stat-label">Área siembra acumulada</span>
                <span class="stat-value">${areaSiembraTotal.toFixed(2)} ha</span>
            </div>
        </div>`;

    const totalPags = Math.ceil(lotes.length / detallePag.porPagina);
    const inicio    = (detallePag.pagina - 1) * detallePag.porPagina;
    const lotesPag  = lotes.slice(inicio, inicio + detallePag.porPagina);

    const acordeonesHTML = lotesPag.map((lote, i) => {
        const idxGlobal = inicio + i;
        const cardId    = `dl-card-${lugarId}-${idxGlobal}`;
        const fecha     = lote.fechaSiembra ? lote.fechaSiembra.split('-').reverse().join('/') : '—';
        return `
            <div class="dl-card" id="${cardId}">
                <div class="dl-card-header" onclick="toggleDetalleAccordion('${cardId}')">
                    <span>🌾 Lote ${idxGlobal + 1}</span>
                    <span class="dl-card-chevron">▼</span>
                </div>
                <div class="dl-card-body">
                    <div class="dl-row"><span>Área del lote</span>
                        <span>${lote.area ? parseFloat(lote.area).toFixed(2) + ' ha' : '—'}</span></div>
                    <div class="dl-row"><span>Área de siembra</span>
                        <span>${lote.areaSiembra ? parseFloat(lote.areaSiembra).toFixed(2) + ' ha' : '—'}</span></div>
                    <div class="dl-row"><span>Estado fenológico</span>
                        <span>${lote.estadoFenologico || '—'}</span></div>
                    <div class="dl-row"><span>Cultivo</span>
                        <span>${lote.cultivo || '—'}</span></div>
                    <div class="dl-row"><span>Fecha de siembra</span>
                        <span>${fecha}</span></div>
                </div>
            </div>`;
    }).join('');

    let pagHTML = '';
    if (totalPags > 1) {
        const btnAnt  = `<button class="pag-btn" ${detallePag.pagina === 1 ? 'disabled' : ''}
            onclick="cambiarPaginaDetalle(${detallePag.pagina - 1})">‹</button>`;
        const btnNums = Array.from({ length: totalPags }, (_, i) => i + 1)
            .map(n => `<button class="pag-btn ${n === detallePag.pagina ? 'pag-btn--activa' : ''}"
                onclick="cambiarPaginaDetalle(${n})">${n}</button>`).join('');
        const btnSig  = `<button class="pag-btn" ${detallePag.pagina === totalPags ? 'disabled' : ''}
            onclick="cambiarPaginaDetalle(${detallePag.pagina + 1})">›</button>`;
        pagHTML = `<div class="detalle-paginacion">${btnAnt}${btnNums}${btnSig}</div>`;
    }

    return statsHTML + acordeonesHTML + pagHTML;
}

function cambiarPaginaDetalle(nuevaPagina) {
    const modal = document.getElementById('modal-detalle');
    if (!modal) return;
    const lugarId = parseInt(modal.dataset.lugarId);
    const lugar   = lugaresData[lugarId];
    if (!lugar) return;
    detallePag.pagina = nuevaPagina;
    const panelLotes = document.getElementById('panel-lotes-content');
    if (panelLotes) panelLotes.innerHTML = renderLotesPanel(lugar.lotes, lugarId);
}

function renderModalDetalle(lugarId, lugar) {
    const { nombre, predios, lotes } = lugar;
    const modal = document.getElementById('modal-detalle');
    if (modal) modal.dataset.lugarId = lugarId;

    const areaTotalPredios = predios.reduce((s, p) => s + parseFloat(p.areaTotal || 0), 0);
    const prediosHTML = `
        <div class="detalle-stats">
            <div class="detalle-stat">
                <span class="stat-label">Total predios</span>
                <span class="stat-value">${predios.length}</span>
            </div>
            <div class="detalle-stat">
                <span class="stat-label">Área total acumulada</span>
                <span class="stat-value">${areaTotalPredios.toFixed(2)} ha</span>
            </div>
        </div>
        <div class="detalle-list">
            ${predios.length === 0
                ? '<p class="detalle-empty">Sin predios registrados.</p>'
                : predios.map((p, idx) => `
                    <div class="detalle-item">
                        <div class="detalle-item-title">Predio ${idx + 1}</div>
                        <div class="detalle-item-row">
                            <span>Código</span><span>${p.codigo || '—'}</span>
                        </div>
                    </div>`).join('')
            }
        </div>`;

    return `
        <div class="modal-box modal-detalle-box">
            <div class="detalle-head">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div class="modal-title">📋 Detalle del lugar</div>
                        <div class="modal-subtitle">${nombre}</div>
                    </div>
                    <button class="modal-close" onclick="cerrarModalDetalle()" title="Cerrar">✕</button>
                </div>
                <div class="detalle-tabs">
                    <button class="detalle-tab active" data-tab="lotes"
                            onclick="switchDetalleTab('lotes')">🌾 Lotes</button>
                    <button class="detalle-tab" data-tab="predios"
                            onclick="switchDetalleTab('predios')">📍 Predios</button>
                </div>
            </div>
            <div class="detalle-body">
                <div class="detalle-panel active" data-panel="lotes">
                    <div id="panel-lotes-content">
                        ${renderLotesPanel(lotes, lugarId)}
                    </div>
                </div>
                <div class="detalle-panel" data-panel="predios">
                    ${prediosHTML}
                </div>
            </div>
            <div class="modal-footer-custom" style="justify-content:flex-end;">
                <button class="btn-solicitar" onclick="cerrarModalDetalle()">Cerrar</button>
            </div>
        </div>`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// 10. TOAST
// ═══════════════════════════════════════════════════════════════════════════════

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
}


// ═══════════════════════════════════════════════════════════════════════════════
// 11. MODAL SOLICITAR CITA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * lugaresUsuario — lista de lugares del usuario disponibles para agendar cita.
 * En producción se poblaría desde la API.
 */
const lugaresUsuario = [
    { id: 1, nombre: 'San Cristobal' },
    { id: 2, nombre: 'Abduzcan'      },
];

/**
 * Crea el modal en el DOM la primera vez (guard con getElementById).
 * Usa .detalle-head + .detalle-body para consistencia con modal-detalle.
 */
function initModalCita() {
    if (document.getElementById('modal-cita')) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id        = 'modal-cita';
    modal.innerHTML = `
        <div class="modal-box modal-detalle-box">
            <div class="detalle-head">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div class="modal-title">📅 Solicitar cita</div>
                        <div class="modal-subtitle">Selecciona los lugares de producción para la inspección</div>
                    </div>
                    <button class="modal-close" onclick="cerrarModalCita()" title="Cerrar">✕</button>
                </div>
            </div>
            <div class="detalle-body">
                <p class="modal-cita-lugares-title">Lugares de producción</p>
                <div id="lugares-list"></div>

                <label class="form-label form-label--obs" for="cita-observacion">
                    Observación <span style="font-weight:400; text-transform:none; letter-spacing:0;">(opcional)</span>
                </label>
                <textarea
                    id="cita-observacion"
                    class="obs-textarea"
                    rows="3"
                    placeholder="Escribe aquí cualquier observación o nota adicional..."></textarea>

                <div class="modal-success" id="modal-success">
                    ✅ La cita ha sido solicitada con éxito.
                </div>
            </div>
            <div class="modal-footer-custom">
                <button class="btn btn-secondary btn-sm" onclick="cerrarModalCita()">Cancelar</button>
                <button class="btn-solicitar" id="btn-solicitar" disabled onclick="solicitarCita()">Aceptar</button>
            </div>
        </div>`;

    modal.addEventListener('click', e => { if (e.target === modal) cerrarModalCita(); });
    document.body.appendChild(modal);
    renderLugares();
}

/** Puebla #lugares-list con una opción por cada lugar. */
function renderLugares() {
    const container = document.getElementById('lugares-list');
    if (!container) return;
    container.innerHTML = '';

    lugaresUsuario.forEach((lugar, idx) => {
        const div = document.createElement('div');
        div.className      = 'lugar-option';
        div.dataset.id     = lugar.id;
        div.dataset.nombre = lugar.nombre;
        div.innerHTML = `
            <div class="lugar-check">✓</div>
            <div class="lugar-info">
                <div class="lugar-id">Lugar #${idx + 1}</div>
                <div class="lugar-nombre">${lugar.nombre}</div>
            </div>`;
        div.addEventListener('click', () => toggleLugar(div));
        container.appendChild(div);
    });
}

/** Alterna la selección de un lugar y habilita/deshabilita el botón Aceptar. */
function toggleLugar(el) {
    el.classList.toggle('selected');
    document.getElementById('btn-solicitar').disabled =
        document.querySelectorAll('.lugar-option.selected').length === 0;
    document.getElementById('modal-success').classList.remove('show');
}

function abrirModalCita() {
    initModalCita();
    document.querySelectorAll('.lugar-option.selected').forEach(el => el.classList.remove('selected'));
    document.getElementById('btn-solicitar').disabled = true;
    document.getElementById('modal-success').classList.remove('show');
    document.getElementById('cita-observacion').value = '';
    requestAnimationFrame(() => document.getElementById('modal-cita').classList.add('show'));
}

function cerrarModalCita() {
    const modal = document.getElementById('modal-cita');
    if (modal) modal.classList.remove('show');
}

/**
 * Confirma la solicitud, muestra el mensaje de éxito 1.8 s,
 * inserta las tarjetas en el grid y cierra el modal.
 */
function solicitarCita() {
    const seleccionados = [...document.querySelectorAll('.lugar-option.selected')].map(el => ({
        id:     el.dataset.id,
        nombre: el.dataset.nombre,
    }));
    if (!seleccionados.length) return;

    const observacion = document.getElementById('cita-observacion').value.trim();

    document.getElementById('btn-solicitar').disabled = true;
    document.getElementById('modal-success').classList.add('show');

    setTimeout(() => {
        agregarTarjetasCita(seleccionados, observacion);
        document.querySelectorAll('.lugar-option.selected').forEach(el => el.classList.remove('selected'));
        document.getElementById('cita-observacion').value = '';
        cerrarModalCita();
        showToast(`✅ Cita solicitada para ${seleccionados.length} lugar${seleccionados.length > 1 ? 'es' : ''}.`);
    }, 1800);
}

/**
 * Inserta una tarjeta "Pendiente" por cada lugar seleccionado al inicio del grid.
 * Usa insertAdjacentHTML para no afectar las tarjetas existentes.
 * Llama a syncFiltroActivo() para respetar el filtro activo en ese momento.
 */
function agregarTarjetasCita(lugares, observacion = '') {
    const grid = document.getElementById('cards-grid');
    if (!grid) return;

    const fechaInspeccion = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    })();

    lugares.forEach(lugar => {
        grid.insertAdjacentHTML('afterbegin', `
            <div class="card" data-estado="pendiente" style="animation: slideUp 0.3s ease;">
                <div class="card__accent card__accent--pendiente"></div>
                <div class="card__inner">
                    <div class="card-header">
                        <span class="card-codigo">${lugar.nombre}</span>
                        <span class="badge badge-revision">Pendiente</span>
                    </div>
                    <div class="card-coords">
                        <div class="coord-row">
                            <div class="coord-icon">📅</div>
                            <span class="coord-text">Fecha inspección: ${fechaInspeccion}</span>
                        </div>
                        <div class="coord-row">
                            <div class="coord-icon">👤</div>
                            <span class="coord-text">Técnico: Por asignar</span>
                        </div>
                    </div>
                </div>
            </div>`);
    });

    syncFiltroActivo();
}


// ═══════════════════════════════════════════════════════════════════════════════
// 12. FILTROS DE TARJETAS DE CITAS
// ═══════════════════════════════════════════════════════════════════════════════

// Relaciona cada clave de filtro con el valor data-estado de las tarjetas.
const FILTRO_MAP = {
    todos:     null,
    pendiente: 'pendiente',
    aceptado:  'aceptado',
    rechazado: 'rechazado',
};

/** Aplica el filtro activo sobre todas las tarjetas del grid. */
function syncFiltroActivo() {
    const btnActivo = document.querySelector('.filtro.active');
    if (!btnActivo) return;
    aplicarFiltro(btnActivo.dataset.filtro || 'todos');
}

/** Muestra u oculta tarjetas según el estado buscado (null = todas). */
function aplicarFiltro(filtro) {
    const estado = FILTRO_MAP[filtro] ?? null;
    document.querySelectorAll('#cards-grid .card').forEach(card => {
        card.style.display = (!estado || card.dataset.estado === estado) ? '' : 'none';
    });
}

/** Conecta los botones .filtro del HTML con la lógica de filtrado. */
function initFiltros() {
    document.querySelectorAll('.filtro').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            aplicarFiltro(btn.dataset.filtro || 'todos');
        });
    });
}

document.addEventListener('DOMContentLoaded', initFiltros);