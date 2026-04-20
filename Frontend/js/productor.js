/**
 * productor.js — SIFEX · Módulo Productor
 * ─────────────────────────────────────────────────────────────────────────────
 * CAMBIOS EN ESTA VERSIÓN
 * ─────────────────────────────────────────────────────────────────────────────
 * [5] BOTÓN ELIMINAR LOTE EN VISTA DE EDICIÓN
 *
 *     Nuevas funciones: eliminarLoteEdit(lugarId, idx)
 *     Afecta a: renderLotesEdit()
 *
 *     — renderLotesEdit(): añade un <button class="btn-del-lote"> en la cabecera
 *       de cada tarjeta (.lote-edit-header). El botón llama a eliminarLoteEdit()
 *       con stopPropagation() para que el clic no abra/cierre el accordion.
 *
 *     — eliminarLoteEdit(lugarId, idx): función nueva que:
 *         1. Obtiene el nombre del lugar y el número de lote para el mensaje.
 *         2. Muestra un confirm() nativo al usuario.
 *         3. Si confirma: elimina el lote del array lugaresData[lugarId].lotes
 *            con splice() y vuelve a llamar a renderLotesEdit() para actualizar
 *            la vista en tiempo real sin recargar la página.
 *         4. Muestra un toast de confirmación con el número de lote eliminado.
 *
 *     — El botón reutiliza la clase .btn-del-predio (main.css §16) para mantener
 *       coherencia visual con el patrón ya establecido de eliminación de predios.
 *       No se requieren estilos CSS nuevos.
 *
 * [4] CAMPOS "ESTADO FENOLÓGICO" Y "ÁREA TOTAL DEL LOTE" EDITABLES EN VISTA EDICIÓN
 *
 *     Afecta a renderLotesEdit() y guardarEdicion():
 *     - renderLotesEdit(): reemplaza el <input disabled> de Estado fenológico por
 *       un <select class="form-select lote-edit-field" id="edit-lote-estado-N">
 *       con las opciones de ESTADOS_FENOLOGICOS preseleccionando el valor guardado.
 *     - renderLotesEdit(): reemplaza el <input disabled> de Área total por un
 *       <input type="number" class="form-input lote-edit-field" id="edit-lote-area-N">
 *       editable, conservando el mismo tipo, min y step.
 *     - guardarEdicion(): lee edit-lote-estado-N y edit-lote-area-N y persiste
 *       lote.estadoFenologico y lote.area respectivamente.
 *     - La nota al pie de tarjeta se actualizó para indicar que solo la fecha
 *       de siembra permanece como solo lectura.
 *     - No se altera ningún otro campo, vista, lógica de validación ni estilo CSS.
 *
 * [1] TARJETAS COLAPSADAS POR DEFECTO (UX)
 *
 *     Afecta a onNumLotesChange() y renderLotesEdit():
 *     - Las tarjetas .lote-card y .lote-edit-card se crean SIN la clase 'open'.
 *     - El usuario las expande manualmente con toggleLote() / toggleLoteEdit().
 *     - Mejora la legibilidad cuando hay muchos lotes: evita una pantalla llena
 *       de formularios abiertos al cargar la vista.
 *
 * [2] CAMPO "CULTIVO" EN VISTA DE EDICIÓN
 *
 *     Afecta a renderLotesEdit() y guardarEdicion():
 *     - renderLotesEdit(): añade un <select id="edit-lote-cultivo-N"> con las
 *       opciones de CULTIVOS. Preselecciona el valor guardado en lote.cultivo.
 *       Reutiliza .form-select del CSS existente (main.css §4).
 *     - guardarEdicion(): lee el nuevo campo y persiste lote.cultivo.
 *       Ya NO persiste lote.fechaSiembra (ver punto 3).
 *
 * [3] FECHA DE SIEMBRA: SOLO LECTURA EN EDICIÓN
 *
 *     Afecta a renderLotesEdit() y guardarEdicion():
 *     - El input de fecha tiene readonly + .form-input.readonly.
 *     - Se quitó la clase .lote-edit-field del input de fecha para que
 *       guardarEdicion() no intente leerla y sobreescribir el valor original.
 *     - El CSS añade .form-input[readonly] { pointer-events: none } para
 *       bloquear el date-picker nativo del navegador (main.css §4 [NUEVO]).
 *     - Se añade <span class="label-hint"> junto al label para indicar
 *       visualmente al usuario que el campo no es editable (main.css §4 [NUEVO]).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VERSIÓN ANTERIOR
 * ─────────────────────────────────────────────────────────────────────────────
 * [FIX] CORRECCIÓN DE CAMPO "CULTIVO" EN VISTA DE LOTES (creación)
 *    - isLotesComplete(): corregido conteo de 4 a 5 campos por lote.
 *    - guardarLotes(): corregido mapeo — cultivo en [3], fecha en [4].
 *    - updateGuardarLotesBtn(): extraída en función independiente.
 *
 * [REFACTOR] ELIMINACIÓN DE INYECCIÓN DINÁMICA DE ESTILOS
 *    - injectEditStyles() eliminada; estilos movidos a main.css §16.
 *    - initEditButtons() eliminada; onclick directo en el HTML.
 *    - inline styles reemplazados por .form-input.readonly.
 *
 * [FEATURE] VISTA DE EDICIÓN, GESTIÓN DE PREDIOS Y LOTES
 *    - showView(), goToEdit(), renderPrediosEdit(), eliminarPredioEdit(),
 *      agregarPredioEdit(), renderLotesEdit(), toggleLoteEdit(),
 *      guardarEdicion() — funcionalidad completa de la vista view-edit.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Estado global ────────────────────────────────────────────────────────────
let rowCount      = 1;    // Contador incremental de filas en la tabla
let activeLugarId = null; // Id del lugar activo en la vista de lotes

/**
 * lugaresData — almacén principal de datos por lugar.
 * Estructura: { [lugarId]: { nombre, predios[], lotes[] } }
 * - predios[]: [{ codigo }]
 * - lotes[]:   [{ area, areaSiembra, estadoFenologico, cultivo, fechaSiembra }]
 */
const lugaresData = {
    1: {
        nombre: 'San Cristobal',
        predios: [{ codigo: 'PRD-001' }],
        lotes: []
    }
};

const ESTADOS_FENOLOGICOS = ['Germinación','Plántula','Vegetativo','Floración','Fructificación','Maduración'];
const CULTIVOS            = ['Café','Maíz','Frijol','Papa','Cacao','Aguacate','Plátano','Arroz','Yuca','Tomate'];
const ESTADOS_PREDIO      = ['Activo','Inactivo','En revisión'];


// ═══════════════════════════════════════════════════════════════════════════════
// NAVEGACIÓN — tabla / form / lotes / edit
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * showView — Activa la vista con el id dado y desactiva las demás.
 * @param {string} id - Id del <div class="view"> a activar.
 */
function showView(id) {
    ['view-table', 'view-form', 'view-lotes', 'view-edit'].forEach(v => {
        const el = document.getElementById(v);
        if (el) el.classList.toggle('active', v === id);
    });
}

function goToForm()  { showView('view-form');  resetForm(); }
function goToTable() { showView('view-table'); }

/**
 * goToLotes — Navega a la vista de lotes para el lugar indicado.
 * @param {number} lugarId
 * @param {string} lugarNombre
 */
function goToLotes(lugarId, lugarNombre) {
    activeLugarId = lugarId;
    document.getElementById('lotes-lugar-nombre').textContent = lugarNombre;
    document.getElementById('l-area-total').value            = '';
    document.getElementById('l-num-lotes').value             = '';
    document.getElementById('lotes-container').innerHTML     = '';
    document.getElementById('btn-guardar-lotes').disabled    = true;
    showView('view-lotes');
}

/**
 * goToEdit — Carga los datos del lugar en la vista de edición.
 * @param {number} lugarId
 */
function goToEdit(lugarId) {
    const lugar = lugaresData[lugarId];
    if (!lugar) {
        showToast('⚠ No se encontraron datos para este lugar.');
        return;
    }
    document.getElementById('edit-lugar-id').value              = lugarId;
    document.getElementById('edit-lugar-nombre-titulo').textContent = lugar.nombre;
    renderPrediosEdit(lugarId);
    renderLotesEdit(lugarId);
    showView('view-edit');
}


// ═══════════════════════════════════════════════════════════════════════════════
// EDICIÓN — Predios
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * renderPrediosEdit — Lista editable de predios en #edit-predios-container.
 * Clases CSS (main.css §16): .predios-edit-list, .predio-edit-row,
 *   .predio-edit-label, .predio-edit-code, .btn-del-predio, .predio-add-row.
 * @param {number} lugarId
 */
function renderPrediosEdit(lugarId) {
    const lugar     = lugaresData[lugarId];
    const container = document.getElementById('edit-predios-container');
    if (!container || !lugar) return;

    const predios   = lugar.predios;
    const filasHTML = predios.length === 0
        ? '<p class="edit-empty-msg">Sin predios registrados.</p>'
        : `<div class="predios-edit-list">
            ${predios.map((p, idx) => `
                <div class="predio-edit-row" id="predio-edit-row-${idx}">
                    <span class="predio-edit-label">Predio ${idx + 1}</span>
                    <span class="predio-edit-code">${p.codigo || p.nombre || '—'}</span>
                    <button class="btn-del-predio" title="Eliminar predio"
                            onclick="eliminarPredioEdit(${lugarId}, ${idx})">🗑</button>
                </div>
            `).join('')}
           </div>`;

    const addRowHTML = `
        <div class="predio-add-row">
            <input id="edit-nuevo-predio-code" class="form-input"
                   type="text" placeholder="Código del nuevo predio (Ej. PRD-002)">
            <button class="btn-agregar" onclick="agregarPredioEdit(${lugarId})">+ Agregar predio</button>
        </div>
    `;

    container.innerHTML = filasHTML + addRowHTML;
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
// EDICIÓN — Lotes (accordion)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * renderLotesEdit
 * ───────────────
 * Renderiza las tarjetas accordion de lotes en #edit-lotes-container.
 *
 * Campos por tarjeta:
 *   ✏  Área de siembra (ha)   — editable  [.lote-edit-field]
 *   ✏  Cultivo                — editable  [.lote-edit-field]
 *   ✏  Estado fenológico      — editable  [.lote-edit-field]
 *   ✏  Área total lote (ha)   — editable  [.lote-edit-field]
 *   🔒  Fecha de siembra      — solo lectura (readonly)
 *
 * Cabecera de tarjeta: [CAMBIO 5]
 *   🗑  Botón eliminar lote   — llama a eliminarLoteEdit(lugarId, idx)
 *       con stopPropagation() para no interferir con el toggle del accordion.
 *       Reutiliza .btn-del-predio (main.css §16).
 *
 * Estado inicial: COLAPSADAS (sin clase 'open')
 *
 * CSS reutilizado:
 *   main.css §16: .lote-edit-card, .lote-edit-header, .lote-edit-chevron,
 *                 .lote-edit-body, .lote-edit-note, .btn-del-predio
 *   main.css §4:  .form-input, .form-input.readonly, .form-select, .label-hint
 *   main.css §12: .form-row, .form-row.triple, .form-group, .form-label
 *
 * @param {number} lugarId
 */
function renderLotesEdit(lugarId) {
    const lugar     = lugaresData[lugarId];
    const container = document.getElementById('edit-lotes-container');
    if (!container || !lugar) return;

    const lotes = lugar.lotes;

    if (lotes.length === 0) {
        container.innerHTML = '<p class="edit-empty-msg">Sin lotes registrados. Usa el botón 🌾 para agregar lotes.</p>';
        return;
    }

    container.innerHTML = lotes.map((lote, idx) => {
        // Opciones del select Cultivo con preselección del valor guardado
        const cultivoOptions = CULTIVOS.map(c =>
            `<option value="${c}"${lote.cultivo === c ? ' selected' : ''}>${c}</option>`
        ).join('');

        /*
         * [CAMBIO 4] Estado fenológico: ahora editable mediante <select>.
         * - Antes era un <input disabled> de solo lectura.
         * - Ahora usa <select class="form-select lote-edit-field"> con las
         *   opciones de ESTADOS_FENOLOGICOS, preseleccionando lote.estadoFenologico.
         * - .lote-edit-field permite que guardarEdicion() lea y persista el valor.
         * - Se elimina el atributo disabled para habilitar la interacción.
         * - Se reutiliza .form-select del CSS existente (main.css §4).
         */
        const estadoOptions = ESTADOS_FENOLOGICOS.map(e =>
            `<option value="${e}"${lote.estadoFenologico === e ? ' selected' : ''}>${e}</option>`
        ).join('');

        return `
        <!--
            [CAMBIO 5 — ACTUALIZADO] Wrapper por lote.
            Estructura: [ .lote-edit-card (flex:1) ] [ btn-del-predio ]
            El botón 🗑 queda fuera de la tarjeta, alineado verticalmente
            al centro del wrapper. No se requiere stopPropagation() porque
            el botón ya no comparte contenedor con el header del accordion.
        -->
        <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px;">
            <div class="lote-edit-card" id="lote-edit-card-${idx}" style="flex:1; margin-bottom:0;">
            <div class="lote-edit-header" onclick="toggleLoteEdit(${idx})">
                <span>🌾 Lote ${idx + 1}</span>
                <span class="lote-edit-chevron">▼</span>
            </div>
            <div class="lote-edit-body">

                <!-- Fila 1: Área de siembra (editable) + Fecha de siembra (solo lectura) -->
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Área de siembra (ha)</label>
                        <input class="form-input lote-edit-field"
                               type="number" min="0.01" step="0.01"
                               id="edit-lote-siembra-${idx}"
                               value="${lote.areaSiembra || ''}"
                               placeholder="Ej. 1.5">
                    </div>
                    <div class="form-group">
                        <!--
                            Fecha de siembra: solo lectura.
                            - readonly: bloquea edición por teclado.
                            - .form-input.readonly: fondo verde claro (CSS §4).
                            - Sin .lote-edit-field: guardarEdicion() no la sobreescribe.
                        -->
                        <label class="form-label">
                            Fecha de siembra
                            <span class="label-hint">(solo lectura)</span>
                        </label>
                        <input class="form-input readonly"
                               type="date"
                               id="edit-lote-fecha-${idx}"
                               value="${lote.fechaSiembra || ''}"
                               readonly>
                    </div>
                </div>

                <!-- Fila 2: Cultivo (editable) + Estado fenológico (editable) [CAMBIO 4] -->
                <div class="form-row" style="margin-top:8px;">
                    <div class="form-group">
                        <label class="form-label">Cultivo</label>
                        <select class="form-select lote-edit-field"
                                id="edit-lote-cultivo-${idx}">
                            <option value="">Seleccionar...</option>
                            ${cultivoOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <!--
                            [CAMBIO 4] Estado fenológico: cambiado de <input disabled>
                            a <select> editable. Permite al usuario actualizar la etapa
                            del cultivo directamente desde la vista de edición, sin
                            necesidad de regresar a la vista de agregar lotes.
                            .lote-edit-field asegura que guardarEdicion() persista el valor.
                        -->
                        <label class="form-label">Estado fenológico</label>
                        <select class="form-select lote-edit-field"
                                id="edit-lote-estado-${idx}">
                            <option value="">Seleccionar...</option>
                            ${estadoOptions}
                        </select>
                    </div>
                </div>

                <!-- Fila 3: Área total del lote (editable) [CAMBIO 4] -->
                <div class="form-row" style="margin-top:8px;">
                    <div class="form-group">
                        <!--
                            [CAMBIO 4] Área total lote: cambiado de <input disabled>
                            a <input> editable. Permite corregir el área total registrada
                            sin tener que recrear todos los lotes desde cero.
                            - Se eliminan los atributos disabled y readonly.
                            - Se añade .lote-edit-field para que guardarEdicion() lo persista.
                            - Se conserva el mismo placeholder y tipo "number".
                        -->
                        <label class="form-label">Área total lote (ha)</label>
                        <input class="form-input lote-edit-field"
                               type="number" min="0.01" step="0.01"
                               id="edit-lote-area-${idx}"
                               value="${lote.area || ''}"
                               placeholder="Ej. 2.0">
                    </div>
                </div>

                <p class="lote-edit-note">
                    * Fecha de siembra es de solo lectura. Los demás campos pueden
                    modificarse directamente en esta vista.
                </p>
            </div>
        </div>
            <!-- Botón eliminar fuera de la tarjeta, alineado al inicio del wrapper -->
            <button class="btn-del-predio"
                    title="Eliminar lote ${idx + 1}"
                    style="margin-top:6px; flex-shrink:0;"
                    onclick="eliminarLoteEdit(${lugarId}, ${idx})">🗑</button>
        </div>
    `}).join('');
}

/**
 * toggleLoteEdit — Expande/colapsa tarjeta en la vista de edición.
 * @param {number} idx - Índice del lote.
 */
function toggleLoteEdit(idx) {
    const card = document.getElementById(`lote-edit-card-${idx}`);
    if (card) card.classList.toggle('open');
}

/**
 * eliminarLoteEdit — [CAMBIO 5] Elimina un lote del lugar en edición.
 * ──────────────────────────────────────────────────────────────────────
 * Flujo:
 *   1. Recupera el lugar desde lugaresData para construir el mensaje de
 *      confirmación con el nombre del lugar y el número de lote (1-based).
 *   2. Muestra un confirm() nativo. Si el usuario cancela, no hace nada.
 *   3. Elimina el lote del array con splice(idx, 1): operación O(n) sobre
 *      el array in-place, sin crear copias. Compatible con guardarEdicion()
 *      ya que éste itera lugar.lotes con forEach y lee los inputs por idx.
 *   4. Vuelve a llamar renderLotesEdit(lugarId) para re-renderizar todas las
 *      tarjetas con los índices actualizados (evita referencias huérfanas).
 *   5. Emite un toast visible para confirmar la acción al usuario.
 *
 * Nota: el patrón es idéntico a eliminarPredioEdit() para mantener consistencia.
 *
 * @param {number} lugarId - Id del lugar activo en la vista de edición.
 * @param {number} idx     - Índice 0-based del lote en lugar.lotes[].
 */
function eliminarLoteEdit(lugarId, idx) {
    const lugar = lugaresData[lugarId];
    if (!lugar) return;

    // Número de lote visible para el usuario (1-based)
    const numLote = idx + 1;

    // Confirmación explícita antes de una acción destructiva irreversible
    const confirmado = confirm(
        `¿Eliminar Lote ${numLote} del lugar "${lugar.nombre}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    // Eliminar el lote del array de datos en memoria
    lugar.lotes.splice(idx, 1);

    // Re-renderizar las tarjetas para reflejar el cambio en tiempo real
    renderLotesEdit(lugarId);

    showToast(`🗑 Lote ${numLote} eliminado correctamente.`);
}


// ═══════════════════════════════════════════════════════════════════════════════
// EDICIÓN — Guardar cambios
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * guardarEdicion
 * ──────────────
 * Persiste los cambios editables de la vista de edición:
 *   - areaSiembra:      leído de edit-lote-siembra-N
 *   - cultivo:          leído de edit-lote-cultivo-N
 *   - estadoFenologico: leído de edit-lote-estado-N  ← [NUEVO - cambio 4]
 *   - area:             leído de edit-lote-area-N    ← [NUEVO - cambio 4]
 *   - fechaSiembra:     NO se modifica (campo readonly)
 *
 * Los predios se actualizan en tiempo real (agregar/eliminar).
 * El nombre del lugar no es editable: se conserva sin cambios.
 */
function guardarEdicion() {
    const lugarId = parseInt(document.getElementById('edit-lugar-id').value);
    const lugar   = lugaresData[lugarId];
    if (!lugar) return;

    lugar.lotes.forEach((lote, idx) => {
        const siembraInput = document.getElementById(`edit-lote-siembra-${idx}`);
        const cultivoInput = document.getElementById(`edit-lote-cultivo-${idx}`);

        /*
         * [CAMBIO 4] Leer y persistir estado fenológico.
         * - Se obtiene el <select id="edit-lote-estado-N"> que reemplazó al
         *   <input disabled> anterior.
         * - Si el select existe y tiene un valor seleccionado, se actualiza
         *   lote.estadoFenologico en lugaresData para mantener consistencia
         *   con el modal de detalle y cualquier otro lugar que consuma el dato.
         */
        const estadoInput  = document.getElementById(`edit-lote-estado-${idx}`);

        /*
         * [CAMBIO 4] Leer y persistir área total del lote.
         * - Se obtiene el <input id="edit-lote-area-N"> que reemplazó al
         *   <input disabled> anterior.
         * - parseFloat garantiza que el valor sea numérico, igual que en
         *   guardarLotes() para mantener consistencia de tipo.
         */
        const areaInput    = document.getElementById(`edit-lote-area-${idx}`);

        if (siembraInput) lote.areaSiembra      = parseFloat(siembraInput.value) || lote.areaSiembra;
        if (cultivoInput) lote.cultivo           = cultivoInput.value;

        // [CAMBIO 4] Persistir estado fenológico seleccionado
        if (estadoInput  && estadoInput.value)  lote.estadoFenologico = estadoInput.value;

        // [CAMBIO 4] Persistir área total editada
        if (areaInput    && areaInput.value)    lote.area             = parseFloat(areaInput.value);

        // lote.fechaSiembra intacta — campo readonly no se lee
    });

    goToTable();
    showToast(`✔ Lugar "${lugar.nombre}" actualizado correctamente.`);
}


// ═══════════════════════════════════════════════════════════════════════════════
// FORMULARIO DE CREACIÓN — Sección 1
// ═══════════════════════════════════════════════════════════════════════════════

function resetForm() {
    ['f-nombre', 'f-num-predios'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('predios-container').innerHTML = '';
    updateAceptarBtn();
}

function onBasicChange() { updateAceptarBtn(); }

/**
 * onPrediosChange — Renderiza un input de código por cada predio.
 * Clases CSS: .predio-item, .predio-label (main.css §12).
 */
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
                       style="flex:1;">
            `;
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
// TABLA — crear fila y registrar lugar
// ═══════════════════════════════════════════════════════════════════════════════

function crearFilaTabla(id, nombre) {
    const row = document.createElement('tr');
    row.dataset.lugarId = id;
    row.innerHTML = `
        <td>${id}</td>
        <td>${nombre}</td>
        <td>
            <button class="action-btn action-edit" title="Editar"
                    onclick="goToEdit(${id})">✏️</button>
            <button class="action-btn action-del"  title="Eliminar">🗑</button>
            <button class="action-btn action-eye"  title="Ver detalle"
                    onclick="abrirModalDetalle(${id})">👁</button>
            <button class="action-btn action-lote" title="Agregar lotes"
                    onclick="goToLotes(${id}, '${nombre.replace(/'/g, "\\'")}')">🌾</button>
        </td>
    `;
    row.style.animation = 'fadeIn .4s ease';
    return row;
}

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
// VISTA DE LOTES — Agregar lotes a un lugar
// ═══════════════════════════════════════════════════════════════════════════════

function onLotesDetailChange() { updateGuardarLotesBtn(); }

/**
 * onNumLotesChange
 * ────────────────
 * Genera dinámicamente una .lote-card por cada lote solicitado (máx. 30).
 *
 * 5 campos .lote-field por tarjeta (orden estricto para guardarLotes()):
 *   [0] Área total lote     (input number)
 *   [1] Área de siembra     (input number)
 *   [2] Estado fenológico   (select)
 *   [3] Cultivo             (select)
 *   [4] Fecha de siembra    (input date)
 *
 * [CAMBIO 1] Tarjetas creadas SIN clase 'open' → colapsadas por defecto.
 * Usar .form-row.triple para la fila de 3 selects (CSS §12 ya lo define).
 */
function onNumLotesChange() {
    const val       = parseInt(document.getElementById('l-num-lotes').value) || 0;
    const container = document.getElementById('lotes-container');
    container.innerHTML = '';

    if (val > 0 && val <= 30) {
        for (let i = 1; i <= val; i++) {
            const card = document.createElement('div');
            // [CAMBIO 1] Sin 'open': colapsada por defecto
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
                    <!-- Fila 1: Áreas -->
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
                    <!-- Fila 2: Estado fenológico, Cultivo y Fecha de siembra -->
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
                </div>
            `;
            container.appendChild(card);
        }
    }
    updateGuardarLotesBtn();
}

/** toggleLote — Expande/colapsa tarjeta en la vista de creación de lotes. */
function toggleLote(i) {
    document.getElementById(`lote-${i}`).classList.toggle('open');
}

/**
 * onLoteFieldChange — Actualiza el estado 'complete' de la tarjeta
 * y recalcula el botón de guardar.
 */
function onLoteFieldChange(i) {
    const card     = document.getElementById(`lote-${i}`);
    const complete = [...card.querySelectorAll('.lote-field')].every(f => f.value.trim() !== '');
    card.classList.toggle('complete', complete);
    updateGuardarLotesBtn();
}

function updateGuardarLotesBtn() {
    document.getElementById('btn-guardar-lotes').disabled = !isLotesComplete();
}

/**
 * isLotesComplete — Valida área total, número de lotes y los 5 campos por lote.
 * @returns {boolean}
 */
function isLotesComplete() {
    const areaTotal = parseFloat(document.getElementById('l-area-total').value);
    const numLotes  = parseInt(document.getElementById('l-num-lotes').value) || 0;
    if (!areaTotal || areaTotal <= 0 || numLotes <= 0 || numLotes > 30) return false;
    const fields = document.querySelectorAll('.lote-field');
    if (fields.length !== numLotes * 5) return false;
    return [...fields].every(f => f.value.trim() !== '');
}

/**
 * guardarLotes
 * ────────────
 * Persiste los 5 campos de cada lote en lugaresData[activeLugarId].lotes.
 * Orden: [0] area, [1] areaSiembra, [2] estadoFenologico, [3] cultivo, [4] fechaSiembra
 */
function guardarLotes() {
    if (!isLotesComplete() || activeLugarId === null) return;

    const numLotes = parseInt(document.getElementById('l-num-lotes').value);
    const lotes    = [];

    for (let i = 1; i <= numLotes; i++) {
        const fields = [...document.getElementById(`lote-${i}`).querySelectorAll('.lote-field')];
        lotes.push({
            area            : parseFloat(fields[0].value),
            areaSiembra     : parseFloat(fields[1].value),
            estadoFenologico: fields[2].value,
            cultivo         : fields[3].value,
            fechaSiembra    : fields[4].value,
        });
    }

    lugaresData[activeLugarId].lotes     = lotes;
    lugaresData[activeLugarId].areaTotal = parseFloat(document.getElementById('l-area-total').value);

    goToTable();
    showToast(`✔ ${numLotes} lote(s) guardados correctamente.`);
}


// ═══════════════════════════════════════════════════════════════════════════════
// MODAL DE DETALLES — tabs · accordion · paginación
// ═══════════════════════════════════════════════════════════════════════════════

const detallePag = { pagina: 1, porPagina: 5 };

function abrirModalDetalle(lugarId) {
    const lugar = lugaresData[lugarId];
    if (!lugar) {
        showToast('⚠ No hay información registrada para este lugar.');
        return;
    }
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

/**
 * renderLotesPanel — Panel de lotes del modal de detalle con estadísticas,
 * accordion paginado y controles de navegación.
 * El campo Cultivo se muestra en cada tarjeta.
 */
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
        </div>
    `;

    const totalPags = Math.ceil(lotes.length / detallePag.porPagina);
    const inicio    = (detallePag.pagina - 1) * detallePag.porPagina;
    const lotesPag  = lotes.slice(inicio, inicio + detallePag.porPagina);

    const acordeonesHTML = lotesPag.map((lote, i) => {
        const idxGlobal = inicio + i;
        const cardId    = `dl-card-${lugarId}-${idxGlobal}`;
        const fecha     = lote.fechaSiembra
            ? lote.fechaSiembra.split('-').reverse().join('/')
            : '—';

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
            </div>
        `;
    }).join('');

    let pagHTML = '';
    if (totalPags > 1) {
        const btnAnterior  = `<button class="pag-btn" ${detallePag.pagina === 1 ? 'disabled' : ''}
            onclick="cambiarPaginaDetalle(${detallePag.pagina - 1})">‹</button>`;
        const btnNumeros   = Array.from({ length: totalPags }, (_, i) => i + 1)
            .map(n => `<button class="pag-btn ${n === detallePag.pagina ? 'pag-btn--activa' : ''}"
                onclick="cambiarPaginaDetalle(${n})">${n}</button>`).join('');
        const btnSiguiente = `<button class="pag-btn" ${detallePag.pagina === totalPags ? 'disabled' : ''}
            onclick="cambiarPaginaDetalle(${detallePag.pagina + 1})">›</button>`;
        pagHTML = `<div class="detalle-paginacion">${btnAnterior}${btnNumeros}${btnSiguiente}</div>`;
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
                    </div>
                `).join('')
            }
        </div>
    `;

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
        </div>
    `;
}


// ═══════════════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════════════

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
}


// ═══════════════════════════════════════════════════════════════════════════════
// MODAL AGENDAR CITA
// ═══════════════════════════════════════════════════════════════════════════════

const lugaresUsuario = [
    { id: 1, nombre: 'San Cristobal' },
    { id: 2, nombre: 'Abduzcan'      },
];

function initModalCita() {
    if (document.getElementById('modal-cita')) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id        = 'modal-cita';
    modal.innerHTML = `
        <div>
            <div class="modal-box modal-detalle-box">
                <button class="modal-close" onclick="cerrarModalCita()">✕</button>
                <div class="modal-title">📅 Solicitar cita</div>
                <div class="modal-subtitle">Selecciona los lugares de producción para la inspección</div>
                <div id="lugares-list"></div>
                <div class="modal-success" id="modal-success">✅ La cita ha sido solicitada con éxito.</div>
                <div class="modal-footer-custom">
                    <button class="btn btn-secondary btn-sm" onclick="cerrarModalCita()">Cancelar</button>
                    <button class="btn-solicitar" id="btn-solicitar" disabled onclick="solicitarCita()">Aceptar</button>
                </div>
            </div>
        </div>
    `;
    modal.addEventListener('click', e => { if (e.target === modal) cerrarModalCita(); });
    document.body.appendChild(modal);
    renderLugares();
}

function renderLugares() {
    const container = document.getElementById('lugares-list');
    container.innerHTML = '';
    lugaresUsuario.forEach(lugar => {
        const div = document.createElement('div');
        div.className  = 'lugar-option';
        div.dataset.id = lugar.id;
        div.innerHTML  = `
            <div class="lugar-check">✓</div>
            <div class="lugar-info">
                <div class="lugar-id">Lugar #${lugar.id}</div>
                <div class="lugar-nombre">${lugar.nombre}</div>
            </div>
        `;
        div.addEventListener('click', () => toggleLugar(div));
        container.appendChild(div);
    });
}

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
    requestAnimationFrame(() => document.getElementById('modal-cita').classList.add('show'));
}

function cerrarModalCita() {
    document.getElementById('modal-cita').classList.remove('show');
}

function solicitarCita() {
    const seleccionados = [...document.querySelectorAll('.lugar-option.selected')].map(el => el.dataset.id);
    if (!seleccionados.length) return;
    document.getElementById('modal-success').classList.add('show');
    document.getElementById('btn-solicitar').disabled = true;
    setTimeout(() => {
        document.querySelectorAll('.lugar-option.selected').forEach(el => el.classList.remove('selected'));
        cerrarModalCita();
    }, 2000);
}