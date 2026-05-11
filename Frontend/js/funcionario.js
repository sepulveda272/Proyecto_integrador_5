// ═══════════════════════════════════════════════════════════════
//  funcionario.js  —  SIFEX
//  Versión depurada (v10)
//
//  DEPURACIÓN REALIZADA:
//  ─────────────────────
//  1. HISTORIAL DE VERSIONES ELIMINADO (líneas 1–29 del original)
//     El bloque de historial v1–v9 no aporta al funcionamiento en
//     producción. Si se necesita trazabilidad debe vivir en git o
//     en un CHANGELOG separado.
//
//  2. COMENTARIOS "fetch de producción" ELIMINADOS
//     Los bloques con ejemplos de fetch('/api/…') eran orientativos
//     y no son código ejecutado. Se eliminaron del archivo fuente.
//
//  3. NOTAS "vN — CAMBIOS:" EN FUNCIONES ELIMINADAS
//     Describían diferencias con versiones ya inexistentes. Los
//     comentarios actuales describen únicamente el comportamiento
//     vigente de cada función.
//
//  LO QUE SE CONSERVÓ (todo el código es activo):
//  ────────────────────────────────────────────────
//  Datos/estado:   lugaresCompletados, tecnicosDisponibles,
//                  observacionesRegistradas, reportesLotes,
//                  fechasInspeccion, obsEditLugarId,
//                  citaTecnicoSel, citaCardActual
//  Helpers:        _fechaHoy, _buscarObs, _buscarLugar,
//                  _buscarTecnicoDeLugar, calcularNivelAlerta,
//                  _htmlFechaInspeccion, _botonesAccion,
//                  _claseAcentoFila, _actualizarAcentoFila
//  Tabla obs:      renderTablaObs
//  Modal obs:      abrirModalObsEdit, cerrarModalObsEdit,
//                  validarObsEdit, guardarObsEdit
//  Acciones tabla: eliminarObs (no-op visible), verReporte,
//                  toggleLoteCard, cerrarModalReporte
//  Solicitudes:    filtrarSolicitudes
//  Modal cita:     abrirModalVerificarCita, cerrarModalCita,
//                  rechazarCita, seleccionarTecnico,
//                  validarFormCita, aceptarCita,
//                  _actualizarCardCita
//  Utilidad:       mostrarToast
//  Init:           DOMContentLoaded
//
//  NOTA sobre eliminarObs():
//  Se conserva aunque es no-op: su onclick se inyecta dinámicamente
//  por _botonesAccion(); eliminarla provocaría errores en consola.
// ═══════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
//  DATOS  (mock — reemplazar con llamadas al backend en producción)
// ═══════════════════════════════════════════════════════════════

// Lugares de producción con inspección completada
const lugaresCompletados = [
    { id: 'INS001', nombre: 'San Cristobal',     departamento: 'Santander',          municipio: 'Bucaramanga', tecnicoId: 'TEC001' },
    { id: 'INS002', nombre: 'Abduzcan',           departamento: 'Norte de Santander', municipio: 'Pamplona',    tecnicoId: 'TEC004' },
    { id: 'INS003', nombre: 'Finca La Esperanza', departamento: 'Antioquia',          municipio: 'Rionegro',    tecnicoId: 'TEC007' },
];

// Técnicos disponibles para asignación de citas
const tecnicosDisponibles = [
    { id: 'TEC001', nombre: 'Benito Camelo',    departamento: 'Santander',          municipio: 'Bucaramanga'   },
    { id: 'TEC002', nombre: 'Laura Figueroa',   departamento: 'Santander',          municipio: 'Floridablanca' },
    { id: 'TEC003', nombre: 'Carlos Martínez',  departamento: 'Santander',          municipio: 'Girón'         },
    { id: 'TEC004', nombre: 'Paola Suárez',     departamento: 'Norte de Santander', municipio: 'Pamplona'      },
    { id: 'TEC005', nombre: 'Héctor Rondón',    departamento: 'Norte de Santander', municipio: 'Cúcuta'        },
    { id: 'TEC006', nombre: 'Marcela Torres',   departamento: 'Norte de Santander', municipio: 'Ocaña'         },
    { id: 'TEC007', nombre: 'Andrés Ospina',    departamento: 'Antioquia',          municipio: 'Rionegro'      },
    { id: 'TEC008', nombre: 'Sandra Velásquez', departamento: 'Antioquia',          municipio: 'Medellín'      },
];

// Observaciones registradas por inspección
const observacionesRegistradas = [
    {
        inspeccionId: 'INS001',
        fecha:        '08/03/2026',
        texto:        'Le falta más agüita a esas plantas, papi. Echele ojo.'
    }
];

/**
 * Lotes por lugar de producción.
 * Campos por lote:
 *   lote             — nombre del lote
 *   cultivo          — especie o variedad cultivada en el lote  ← NUEVO (v11)
 *   plaga            — plaga detectada (o "Ninguna")
 *   cantidadPlagas   — número de individuos/focos
 *   plantasSembradas — total de plantas sembradas
 *   plantasContadas  — plantas verificadas en la inspección
 *   plantasAfectadas — calculado en JS: sembradas − contadas
 *
 * CAMPO CULTIVO (v11):
 *   Se agrega el campo `cultivo` a cada objeto de lote.
 *   Su valor es una cadena de texto libre con el nombre del cultivo.
 *   Se renderiza en verReporte() como la primera fila del .lote-edit-body,
 *   antes de los datos de plantas, para dar contexto inmediato al inspector.
 *   Si el campo está ausente o es falsy, se muestra "No especificado".
 */
const reportesLotes = {
    INS001: [
        { lote: 'Lote A', cultivo: 'Tomate',    plaga: 'Mosca blanca',  cantidadPlagas: 12, plantasSembradas: 200, plantasContadas: 185 },
        { lote: 'Lote B', cultivo: 'Cebolla',   plaga: 'Áfidos',        cantidadPlagas:  5, plantasSembradas: 150, plantasContadas: 140 },
        { lote: 'Lote C', cultivo: 'Pimentón',  plaga: 'Ninguna',        cantidadPlagas:  0, plantasSembradas: 180, plantasContadas: 180 },
    ],
    INS002: [
        { lote: 'Lote 1', cultivo: 'Café',      plaga: 'Trips',          cantidadPlagas:  8, plantasSembradas: 120, plantasContadas: 112 },
        { lote: 'Lote 2', cultivo: 'Plátano',   plaga: 'Ninguna',        cantidadPlagas:  0, plantasSembradas:  90, plantasContadas:  90 },
    ],
    INS003: [
        { lote: 'Sector Norte', cultivo: 'Aguacate',  plaga: 'Cochinilla', cantidadPlagas: 20, plantasSembradas: 300, plantasContadas: 270 },
        { lote: 'Sector Sur',   cultivo: 'Mango',     plaga: 'Araña roja', cantidadPlagas:  3, plantasSembradas: 250, plantasContadas: 244 },
        { lote: 'Sector Este',  cultivo: 'Maracuyá',  plaga: 'Ninguna',    cantidadPlagas:  0, plantasSembradas: 200, plantasContadas: 200 },
    ],
};

// Fecha de la última inspección por lugar (null = pendiente)
const fechasInspeccion = {
    INS001: '08/03/2026',
    INS002: '15/03/2026',
    INS003: null,
};


// ═══════════════════════════════════════════════════════════════
//  ESTADO DE MÓDULOS
// ═══════════════════════════════════════════════════════════════

// ID del lugar abierto en el modal de observación
let obsEditLugarId = null;

// Técnico seleccionado en el modal de cita
let citaTecnicoSel = null;

// Referencia a la card que abrió el modal de cita.
// Necesario para que aceptarCita() y rechazarCita() operen sobre la card correcta.
let citaCardActual = null;


// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Devuelve la fecha actual formateada como DD/MM/YYYY.
 * Usada en guardarObsEdit() al crear una nueva observación.
 * @returns {string}
 */
function _fechaHoy() {
    const hoy = new Date();
    return [
        String(hoy.getDate()).padStart(2, '0'),
        String(hoy.getMonth() + 1).padStart(2, '0'),
        hoy.getFullYear()
    ].join('/');
}

/**
 * Retorna el objeto de observación para un lugarId dado, o undefined.
 * @param {string} lugarId
 */
function _buscarObs(lugarId) {
    return observacionesRegistradas.find(o => o.inspeccionId === lugarId);
}

/**
 * Retorna el objeto de lugar para un lugarId dado, o undefined.
 * @param {string} lugarId
 */
function _buscarLugar(lugarId) {
    return lugaresCompletados.find(l => l.id === lugarId);
}

/**
 * Retorna el técnico asignado a un lugar, o undefined.
 * @param {string} lugarId
 */
function _buscarTecnicoDeLugar(lugarId) {
    const lugar = _buscarLugar(lugarId);
    if (!lugar?.tecnicoId) return undefined;
    return tecnicosDisponibles.find(t => t.id === lugar.tecnicoId);
}

/**
 * Calcula el nivel de alerta fitosanitaria de un lote.
 *
 * Clasifica el porcentaje de plantas afectadas en 7 niveles:
 *   0 %      → "Sin incidencia"
 *   0–5 %    → "Muy baja"
 *   5–10 %   → "Baja"
 *   10–20 %  → "Moderada"
 *   20–40 %  → "Alta"
 *   40–70 %  → "Muy alta"
 *   > 70 %   → "Crítica"
 *
 * @param {number} afectadas  - Plantas afectadas (sembradas − contadas)
 * @param {number} sembradas  - Total de plantas sembradas
 * @returns {{ label: string, cssClass: string }}
 */
function calcularNivelAlerta(afectadas, sembradas) {
    if (!sembradas || sembradas === 0) {
        return { label: 'Sin datos', cssClass: 'alerta-sin-datos' };
    }
    const pct = (afectadas / sembradas) * 100;
    if (pct === 0)  return { label: 'Sin incidencia', cssClass: 'alerta-sin-incidencia' };
    if (pct <= 5)   return { label: 'Muy baja',       cssClass: 'alerta-muy-baja'       };
    if (pct <= 10)  return { label: 'Baja',           cssClass: 'alerta-baja'           };
    if (pct <= 20)  return { label: 'Moderada',       cssClass: 'alerta-moderada'       };
    if (pct <= 40)  return { label: 'Alta',           cssClass: 'alerta-alta'           };
    if (pct <= 70)  return { label: 'Muy alta',       cssClass: 'alerta-muy-alta'       };
    return                 { label: 'Crítica',        cssClass: 'alerta-critica'        };
}

/**
 * Genera el HTML del chip de fecha de inspección.
 * Muestra "Pendiente" si la fecha es null.
 * Usada en verReporte() para el encabezado del modal.
 *
 * @param {string|null} fecha - Fecha en formato DD/MM/YYYY o null
 * @returns {string} HTML del chip
 */
function _htmlFechaInspeccion(fecha) {
    if (fecha) {
        return `
            <div class="reporte-fecha-inspeccion">
                <span class="reporte-fecha-label">📅 Fecha de inspección</span>
                <span class="reporte-fecha-valor">${fecha}</span>
            </div>`;
    }
    return `
        <div class="reporte-fecha-inspeccion reporte-fecha-inspeccion--pendiente">
            <span class="reporte-fecha-label">📅 Fecha de inspección</span>
            <span class="reporte-fecha-valor reporte-fecha-valor--pendiente">Pendiente</span>
        </div>`;
}

/**
 * Genera el HTML de los botones de acción de una fila de la tabla.
 * Tres botones funcionales: editar (✏️), borrar (🗑), ver reporte (👁).
 * Más un botón visual de descarga sin onclick (solo presentación).
 *
 * @param {string} lugarId - ID del lugar (ej: 'INS001')
 * @returns {string} HTML de los botones
 */
function _botonesAccion(lugarId) {
    return `
        <button
            class="action-btn action-edit"
            title="Editar / Agregar observación"
            onclick="abrirModalObsEdit('${lugarId}')">✏️</button>
        <button
            class="action-btn action-del"
            title="Borrar"
            onclick="eliminarObs('${lugarId}')">🗑</button>
        <button
            class="action-btn action-eye"
            title="Ver reporte"
            onclick="verReporte('${lugarId}')">👁</button>
        <button
            class="action-btn action-btn-descargar"
            title="Descargar"
            type="button">
            <svg xmlns="http://www.w3.org/2000/svg"
                 width="15" height="15"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2.5"
                 stroke-linecap="round"
                 stroke-linejoin="round"
                 aria-hidden="true">
                <path d="M12 3v13M6 11l6 6 6-6"/>
                <line x1="3" y1="21" x2="21" y2="21"/>
            </svg>
        </button>
    `;
}


// ═══════════════════════════════════════════════════════════════
//  ACENTO LATERAL DE FILA
// ═══════════════════════════════════════════════════════════════

/**
 * Devuelve la clase CSS de acento de fila según si el lugar tiene observación.
 * Centraliza la lógica para que renderTablaObs() y _actualizarAcentoFila()
 * estén siempre sincronizados.
 *
 * @param {boolean} tieneObs
 * @returns {'tr--completado'|'tr--pendiente'}
 */
function _claseAcentoFila(tieneObs) {
    return tieneObs ? 'tr--completado' : 'tr--pendiente';
}

/**
 * Actualiza la clase de acento de una fila específica de la tabla
 * sin reconstruir toda la tabla.
 *
 * Se invoca desde guardarObsEdit() justo tras persistir el dato,
 * garantizando la transición visual inmediata y sin parpadeo.
 *
 * @param {string}  lugarId  - ID del lugar (ej: 'INS001')
 * @param {boolean} tieneObs - true si ya existe observación
 */
function _actualizarAcentoFila(lugarId, tieneObs) {
    const tr = document.querySelector(`#cuerpoTablaObs tr[data-lugar-id="${lugarId}"]`);
    if (!tr) return;
    // Elimina ambas clases antes de añadir la nueva para evitar residuos
    tr.classList.remove('tr--pendiente', 'tr--completado');
    tr.classList.add(_claseAcentoFila(tieneObs));
}


// ═══════════════════════════════════════════════════════════════
//  TABLA DE OBSERVACIONES
// ═══════════════════════════════════════════════════════════════

/**
 * Limpia y reconstruye el tbody de la tabla de observaciones.
 *
 * Columnas: Lugar | Fecha Observación | Observación | Técnico | Inspección | Acciones
 *
 * Cada <tr> recibe:
 *   - data-lugar-id: permite localizar la fila en _actualizarAcentoFila()
 *   - clase de acento lateral (.tr--pendiente / .tr--completado) según §23 de main.css
 *
 * El estado (pendiente/completado) se comunica visualmente solo con el
 * acento lateral; no hay columna de estado explícita.
 */
function renderTablaObs() {
    const tbody = document.getElementById('cuerpoTablaObs');
    if (!tbody) return;

    tbody.innerHTML = '';

    lugaresCompletados.forEach(lugar => {
        const obs     = _buscarObs(lugar.id);
        const tecnico = _buscarTecnicoDeLugar(lugar.id);
        const tr      = document.createElement('tr');

        tr.dataset.lugarId = lugar.id;
        tr.classList.add(_claseAcentoFila(!!obs));

        // Celda Técnico — solo nombre; "—" si no hay técnico asignado
        const celdaTecnico = tecnico
            ? `<td>${tecnico.nombre}</td>`
            : `<td class="td-vacio">—</td>`;

        if (obs) {
            tr.innerHTML = `
                <td>
                    ${lugar.nombre}
                    <br><small class="td-meta">${lugar.municipio}, ${lugar.departamento}</small>
                </td>
                <td>${obs.fecha}</td>
                <td>${obs.texto}</td>
                ${celdaTecnico}
                <td><span class="badge badge-calido">${lugar.id}</span></td>
                <td>${_botonesAccion(lugar.id)}</td>
            `;
        } else {
            tr.innerHTML = `
                <td>
                    ${lugar.nombre}
                    <br><small class="td-meta">${lugar.municipio}, ${lugar.departamento}</small>
                </td>
                <td class="td-vacio">—</td>
                <td class="td-pendiente">Sin observación registrada</td>
                ${celdaTecnico}
                <td><span class="badge badge-calido">${lugar.id}</span></td>
                <td>${_botonesAccion(lugar.id)}</td>
            `;
        }

        tbody.appendChild(tr);
    });
}


// ═══════════════════════════════════════════════════════════════
//  MODAL — AGREGAR / EDITAR OBSERVACIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * Abre el modal de observación adaptado al modo correspondiente:
 *   - AGREGAR: textarea vacío, título "Nueva observación".
 *   - EDITAR:  textarea pre-cargado, título "Editar observación".
 *
 * @param {string} lugarId
 */
function abrirModalObsEdit(lugarId) {
    const lugar = _buscarLugar(lugarId);
    const obs   = _buscarObs(lugarId);
    if (!lugar) return;

    obsEditLugarId = lugarId;

    const titulo     = document.getElementById('modal-obs-titulo');
    const sub        = document.getElementById('modal-obs-sub');
    const btnGuardar = document.getElementById('btn-guardar-obs');
    const textarea   = document.getElementById('obs-edit-textarea');
    const counter    = document.getElementById('obs-edit-counter');
    const lugarInfo  = document.getElementById('obs-edit-lugar-info');

    lugarInfo.innerHTML = `
        <div class="obs-edit-lugar-nombre">${lugar.nombre}</div>
        <div class="obs-edit-lugar-meta">${lugar.id} · ${lugar.municipio}, ${lugar.departamento}</div>
    `;

    if (obs) {
        titulo.textContent     = 'Editar observación';
        sub.textContent        = `Fecha original: ${obs.fecha}`;
        btnGuardar.textContent = 'Actualizar observación';
        textarea.value         = obs.texto;
    } else {
        titulo.textContent     = 'Nueva observación';
        sub.textContent        = 'El lugar quedará registrado como completado al guardar';
        btnGuardar.textContent = 'Guardar observación';
        textarea.value         = '';
    }

    counter.textContent = textarea.value.length > 0 ? `${textarea.value.length} caracteres` : '';
    btnGuardar.disabled = textarea.value.trim().length === 0;

    document.getElementById('modal-obs-edit-overlay').classList.add('show');
    textarea.focus();
}

/**
 * Cierra el modal de observación y limpia el estado interno.
 */
function cerrarModalObsEdit() {
    document.getElementById('modal-obs-edit-overlay').classList.remove('show');
    obsEditLugarId = null;
}

/**
 * Actualiza el contador de caracteres y habilita/deshabilita el botón guardar.
 * Enlazado al evento input del textarea en DOMContentLoaded.
 */
function validarObsEdit() {
    const txt     = document.getElementById('obs-edit-textarea').value.trim();
    const counter = document.getElementById('obs-edit-counter');
    const btn     = document.getElementById('btn-guardar-obs');

    counter.textContent = txt.length > 0 ? `${txt.length} caracteres` : '';
    btn.disabled        = txt.length === 0;
}

/**
 * Persiste el cambio en observacionesRegistradas[], actualiza el acento
 * visual de la fila afectada de forma inmediata y re-renderiza la tabla.
 */
function guardarObsEdit() {
    const txt = document.getElementById('obs-edit-textarea').value.trim();
    if (!obsEditLugarId || txt.length === 0) return;

    const lugar    = _buscarLugar(obsEditLugarId);
    const obsExist = _buscarObs(obsEditLugarId);

    if (obsExist) {
        obsExist.texto = txt;
        mostrarToast(`✔ Observación de ${lugar.nombre} actualizada.`);
    } else {
        observacionesRegistradas.push({
            inspeccionId: obsEditLugarId,
            fecha:        _fechaHoy(),
            texto:        txt
        });
        mostrarToast(`✔ Observación guardada para ${lugar.nombre}.`);
    }

    // Actualizar acento antes de re-renderizar para garantizar la transición inmediata
    _actualizarAcentoFila(obsEditLugarId, !!_buscarObs(obsEditLugarId));

    cerrarModalObsEdit();
    renderTablaObs();
}


// ═══════════════════════════════════════════════════════════════
//  ACCIONES DE TABLA
// ═══════════════════════════════════════════════════════════════

/**
 * Botón "Borrar" — no-op intencionado.
 * El botón mantiene apariencia visual pero sin funcionalidad activa.
 * CONSERVADO: su onclick se inyecta dinámicamente en _botonesAccion();
 * eliminarla provocaría errores en consola al pulsar el botón.
 *
 * @param {string} _lugarId — ignorado intencionalmente
 */
function eliminarObs(_lugarId) {
    // Sin implementación por requerimiento.
}

/**
 * Abre el modal "Ver reporte" con acordeón de lotes para el lugarId dado.
 *
 * El modal muestra:
 *   1. Chip de fecha de inspección (generado por _htmlFechaInspeccion).
 *   2. Resumen general: plantas sembradas / contadas / afectadas.
 *   3. Acordeón de lotes con nivel de alerta calculado por calcularNivelAlerta().
 *
 * CAMPO CULTIVO (v11):
 *   Cada tarjeta de lote incluye ahora una fila "Cultivo" como primera fila
 *   del .lote-edit-body. Su valor proviene de lote.cultivo; si el campo está
 *   ausente o es falsy, muestra "No especificado".
 *   La fila reutiliza las clases .reporte-lote-fila, .reporte-lote-campo y
 *   .reporte-lote-valor ya existentes en main.css — sin clases nuevas.
 *
 * Los lotes se titulan secuencialmente "Lote 1", "Lote 2", etc.
 *
 * @param {string} lugarId
 */
function verReporte(lugarId) {
    const lugar = _buscarLugar(lugarId);
    if (!lugar) return;

    const lotes = reportesLotes[lugarId] ?? [];

    // Cabecera del modal
    document.getElementById('modal-reporte-titulo').textContent = 'Ver reporte';
    document.getElementById('modal-reporte-sub').textContent    =
        `${lugar.nombre} · ${lugar.municipio}, ${lugar.departamento}`;

    // Chip de fecha — se crea una sola vez y se reutiliza en aperturas posteriores
    const fechaLugar = fechasInspeccion[lugarId] ?? null;
    let fechaContenedor = document.getElementById('reporte-fecha-contenedor');
    if (!fechaContenedor) {
        fechaContenedor    = document.createElement('div');
        fechaContenedor.id = 'reporte-fecha-contenedor';
        const resumen      = document.getElementById('reporte-resumen');
        resumen.parentNode.insertBefore(fechaContenedor, resumen);
    }
    fechaContenedor.innerHTML = _htmlFechaInspeccion(fechaLugar);

    // Resumen general de plantas
    const totalSembradas = lotes.reduce((s, l) => s + l.plantasSembradas, 0);
    const totalContadas  = lotes.reduce((s, l) => s + l.plantasContadas,  0);
    const totalAfectadas = totalSembradas - totalContadas;
    const claseAfectadas = totalAfectadas > 0 ? 'reporte-resumen-valor--dano' : '';

    document.getElementById('reporte-resumen').innerHTML = lotes.length === 0
        ? ''
        : `
            <div class="reporte-resumen-item">
                <span class="reporte-resumen-label">🌱 Plantas sembradas</span>
                <span class="reporte-resumen-valor">${totalSembradas}</span>
            </div>
            <div class="reporte-resumen-item">
                <span class="reporte-resumen-label">🔍 Plantas contadas</span>
                <span class="reporte-resumen-valor">${totalContadas}</span>
            </div>
            <div class="reporte-resumen-item">
                <span class="reporte-resumen-label">⚠️ Plantas afectadas</span>
                <span class="reporte-resumen-valor ${claseAfectadas}">${totalAfectadas}</span>
            </div>
        `;

    // Acordeón de lotes
    const contenedor = document.getElementById('reporte-lotes-acordeon');

    if (lotes.length === 0) {
        contenedor.innerHTML = `
            <div class="edit-empty-msg">
                No hay lotes registrados para este lugar de producción.
            </div>`;
    } else {
        contenedor.innerHTML = lotes.map((lote, idx) => {
            const tituloLote = `Lote ${idx + 1}`;
            const afectadas  = lote.plantasSembradas - lote.plantasContadas;
            const claseAfect = afectadas > 0 ? 'reporte-afectadas--con-dano' : '';
            const alerta     = calcularNivelAlerta(afectadas, lote.plantasSembradas);
            const sinPlagas  = lote.cantidadPlagas === 0 || lote.plaga === 'Ninguna';
            const plagasHTML = sinPlagas
                ? `<span class="reporte-lote-sin-plagas">Sin plagas detectadas</span>`
                : `<span class="reporte-lote-plaga-tag">${lote.plaga}</span>`;

            return `
                <div class="reporte-lote-card lote-edit-card" id="reporte-lote-${idx}">
                    <div class="lote-edit-header"
                         onclick="toggleLoteCard('reporte-lote-${idx}')">
                        <span>${tituloLote}</span>
                        <div class="lote-header-right">
                            <span class="badge-alerta ${alerta.cssClass}">${alerta.label}</span>
                            <span class="lote-edit-chevron">▾</span>
                        </div>
                    </div>
                    <div class="lote-edit-body">
                        <div class="reporte-lote-datos">

                            <!--
                                CAMPO CULTIVO (v11)
                                ───────────────────
                                Se ubica como primera fila del cuerpo de la tarjeta
                                para dar contexto inmediato antes de los datos numéricos.

                                • Fuente del dato: lote.cultivo (string en reportesLotes[]).
                                • Si el campo falta o es falsy, muestra "No especificado".
                                • Clases reutilizadas: .reporte-lote-fila, .reporte-lote-campo,
                                  .reporte-lote-valor — sin clases nuevas.
                            -->
                            <div class="reporte-lote-fila">
                                <span class="reporte-lote-campo">Cultivo</span>
                                <span class="reporte-lote-valor">${lote.cultivo || 'No especificado'}</span>
                            </div>

                            <div class="reporte-lote-fila">
                                <span class="reporte-lote-campo">Plantas sembradas</span>
                                <span class="reporte-lote-valor">${lote.plantasSembradas}</span>
                            </div>
                            <div class="reporte-lote-fila">
                                <span class="reporte-lote-campo">Plantas contadas</span>
                                <span class="reporte-lote-valor">${lote.plantasContadas}</span>
                            </div>
                            <div class="reporte-lote-fila">
                                <span class="reporte-lote-campo">Plantas afectadas</span>
                                <span class="reporte-lote-valor reporte-num ${claseAfect}">${afectadas}</span>
                            </div>
                            <div class="reporte-lote-fila">
                                <span class="reporte-lote-campo">Nivel de alerta</span>
                                <span class="reporte-lote-valor">
                                    <span class="badge-alerta ${alerta.cssClass}">${alerta.label}</span>
                                </span>
                            </div>
                            <div class="reporte-lote-fila reporte-lote-fila--plagas">
                                <span class="reporte-lote-campo">Plagas</span>
                                <span class="reporte-lote-valor">${plagasHTML}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    document.getElementById('modal-reporte-overlay').classList.add('show');
}

/**
 * Alterna el estado abierto/cerrado de una tarjeta de lote en el acordeón.
 * Invocado desde el onclick del .lote-edit-header generado en verReporte().
 *
 * @param {string} cardId - id del elemento .reporte-lote-card
 */
function toggleLoteCard(cardId) {
    const card = document.getElementById(cardId);
    if (card) card.classList.toggle('open');
}

/**
 * Cierra el modal "Ver reporte" y colapsa todas las tarjetas del acordeón
 * para que la próxima apertura siempre inicie con todo cerrado.
 */
function cerrarModalReporte() {
    document.getElementById('modal-reporte-overlay').classList.remove('show');
    document.querySelectorAll('#reporte-lotes-acordeon .reporte-lote-card')
        .forEach(c => c.classList.remove('open'));
}


// ═══════════════════════════════════════════════════════════════
//  FILTROS — SOLICITUDES
// ═══════════════════════════════════════════════════════════════

/**
 * Filtra las cards de solicitudes por estado.
 * Invocado desde los botones de filtro en solicitudes.html.
 *
 * @param {string}      estado - 'todos' | 'pendiente' | 'rechazada' | 'aceptada'
 * @param {HTMLElement} btn    - botón que disparó el filtro (para marcar .active)
 */
function filtrarSolicitudes(estado, btn) {
    document.querySelectorAll('.filtro').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#cards-solicitudes .card').forEach(card => {
        card.style.display = (estado === 'todos' || card.dataset.estado === estado) ? '' : 'none';
    });
}


// ═══════════════════════════════════════════════════════════════
//  MODAL — VERIFICAR CITA
// ═══════════════════════════════════════════════════════════════

/**
 * Abre el modal de verificación de cita para la card dada.
 * Filtra los técnicos por departamento y los ordena priorizando
 * los del mismo municipio al tope de la lista.
 *
 * @param {HTMLElement} card - Elemento .card que disparó la acción
 */
function abrirModalVerificarCita(card) {
    citaTecnicoSel = null;
    citaCardActual = card; // Se guarda para que aceptarCita/rechazarCita operen sobre la card correcta

    const lugar        = card.dataset.lugar;
    const departamento = card.dataset.departamento;
    const municipio    = card.dataset.municipio;

    const tecnicos = tecnicosDisponibles
        .filter(t => t.departamento === departamento)
        .sort((a, b) => {
            if (a.municipio === municipio && b.municipio !== municipio) return -1;
            if (b.municipio === municipio && a.municipio !== municipio) return  1;
            return a.nombre.localeCompare(b.nombre);
        });

    document.getElementById('cita-modal-lugar').textContent     = lugar;
    document.getElementById('cita-modal-ubicacion').textContent = `${departamento} · ${municipio}`;

    const fechaInput    = document.getElementById('cita-fecha');
    fechaInput.value    = '';
    fechaInput.disabled = true;
    fechaInput.min      = new Date().toISOString().split('T')[0];

    const horaInput    = document.getElementById('cita-hora');
    horaInput.value    = '';
    horaInput.disabled = true;

    document.getElementById('btn-aceptar-cita').disabled = true;
    document.getElementById('cita-success-msg').classList.remove('show');

    const lista = document.getElementById('cita-tecnicos-lista');
    lista.innerHTML = '';

    if (tecnicos.length === 0) {
        lista.innerHTML = `
            <div class="cita-sin-tecnicos">
                No hay técnicos disponibles en <strong>${departamento}</strong>.
            </div>`;
    } else {
        tecnicos.forEach(tec => {
            const mismoMunicipio = tec.municipio === municipio;
            const item           = document.createElement('div');
            item.className       = 'cita-tecnico-item';
            item.dataset.id      = tec.id;
            item.innerHTML       = `
                <div class="cita-tecnico-chk"></div>
                <div class="cita-tecnico-info">
                    <div class="cita-tecnico-nombre">${tec.nombre}</div>
                    <div class="cita-tecnico-meta">
                        ${tec.municipio}
                        <span class="cita-tecnico-tag ${mismoMunicipio ? '' : 'cita-tecnico-tag--cercano'}">
                            ${mismoMunicipio ? 'Mismo municipio' : 'Zona cercana'}
                        </span>
                    </div>
                </div>
            `;
            item.addEventListener('click', () => seleccionarTecnico(item, tec));
            lista.appendChild(item);
        });
    }

    document.getElementById('modal-cita-overlay').classList.add('show');
}

/**
 * Cierra el modal de cita y limpia la referencia a la card activa.
 */
function cerrarModalCita() {
    document.getElementById('modal-cita-overlay').classList.remove('show');
    citaCardActual = null;
}

/**
 * Marca la cita de la card activa como RECHAZADA:
 *   1. Cambia data-estado a "rechazada" (para que los filtros funcionen).
 *   2. Actualiza el badge a .badge-rechazado (rojo, §3 main.css).
 *   3. Actualiza el acento lateral a .card__accent--rechazado.
 *   4. Cierra el modal y muestra un toast de confirmación.
 */
function rechazarCita() {
    // Caso defensivo: si no hay card activa, solo cerrar
    if (!citaCardActual) {
        document.getElementById('modal-cita-overlay').classList.remove('show');
        return;
    }

    citaCardActual.dataset.estado = 'rechazada';

    const badge = citaCardActual.querySelector('.badge');
    if (badge) {
        badge.className   = 'badge badge-rechazado';
        badge.textContent = 'RECHAZADA';
    }

    const acento = citaCardActual.querySelector('.card__accent');
    if (acento) {
        acento.className = 'card__accent card__accent--rechazado';
    }

    const lugarNombre = citaCardActual.dataset.lugar || 'la solicitud';
    document.getElementById('modal-cita-overlay').classList.remove('show');
    citaCardActual = null;
    mostrarToast(`✕ Cita de "${lugarNombre}" marcada como rechazada.`);
}

/**
 * Selecciona un técnico en la lista del modal de cita.
 * Habilita el campo de fecha y limpia/deshabilita la hora
 * en caso de que hubiera una selección previa.
 *
 * @param {HTMLElement} el      - Elemento .cita-tecnico-item seleccionado
 * @param {object}      tecnico - Objeto técnico de tecnicosDisponibles
 */
function seleccionarTecnico(el, tecnico) {
    document.querySelectorAll('.cita-tecnico-item').forEach(i => i.classList.remove('sel'));
    el.classList.add('sel');
    citaTecnicoSel = tecnico;

    const fechaInput    = document.getElementById('cita-fecha');
    fechaInput.disabled = false;
    fechaInput.focus();

    // Resetear y deshabilitar hora al cambiar de técnico
    const horaInput    = document.getElementById('cita-hora');
    horaInput.value    = '';
    horaInput.disabled = true;

    validarFormCita();
}

/**
 * Habilita el campo de hora cuando hay fecha seleccionada
 * y activa/desactiva el botón "Aceptar cita" según completitud del formulario.
 * Enlazado al evento onchange de los inputs de fecha y hora en solicitudes.html.
 */
function validarFormCita() {
    const fecha     = document.getElementById('cita-fecha').value;
    const horaInput = document.getElementById('cita-hora');
    const hora      = horaInput.value;

    // La hora solo se habilita si ya hay fecha seleccionada
    horaInput.disabled = !fecha;
    if (!fecha) horaInput.value = '';

    document.getElementById('btn-aceptar-cita').disabled =
        !(citaTecnicoSel && fecha && hora);
}

/**
 * Confirma la cita: muestra el mensaje de éxito en el modal,
 * actualiza la card y cierra el modal con un toast de confirmación.
 */
function aceptarCita() {
    const fecha = document.getElementById('cita-fecha').value;
    const hora  = document.getElementById('cita-hora').value;
    if (!citaTecnicoSel || !fecha || !hora) return;

    const [anio, mes, dia] = fecha.split('-');
    const fechaFormateada  = `${dia}/${mes}/${anio}`;
    const horaFormateada   = hora;

    const msg = document.getElementById('cita-success-msg');
    msg.innerHTML = `
        ✔ Cita asignada correctamente.<br>
        <small>
            <strong>${citaTecnicoSel.nombre}</strong> realizará la inspección
            el <strong>${fechaFormateada}</strong> a las <strong>${horaFormateada}</strong>.
        </small>
    `;
    msg.classList.add('show');
    document.getElementById('btn-aceptar-cita').disabled = true;

    _actualizarCardCita(citaTecnicoSel, fechaFormateada, horaFormateada);

    setTimeout(() => {
        cerrarModalCita();
        mostrarToast(`✔ Cita asignada a ${citaTecnicoSel.nombre} para el ${fechaFormateada} a las ${horaFormateada}.`);
    }, 2500);
}

/**
 * Actualiza visualmente la card tras aceptar una cita:
 *
 *   1. data-estado → "aceptada" (para que los filtros funcionen).
 *   2. Badge → "ACEPTADA" con .badge-aprobado (§3 main.css).
 *   3. Acento lateral → .card__accent--aprobado (§10 main.css).
 *   4. Inserta tres .coord-row con técnico, fecha y hora,
 *      reutilizando la estructura HTML de las filas existentes.
 *   5. Oculta .card-actions (botón "Verificar cita") con display:none.
 *      No se elimina del DOM para poder revertirlo si fuera necesario.
 *
 * @param {object} tecnico         - Técnico seleccionado { nombre, ... }
 * @param {string} fechaFormateada - Fecha en formato DD/MM/AAAA
 * @param {string} horaFormateada  - Hora en formato HH:MM
 */
function _actualizarCardCita(tecnico, fechaFormateada, horaFormateada) {
    const card = citaCardActual;
    if (!card) return;

    // 1. Estado
    card.dataset.estado = 'aceptada';

    // 2. Badge
    const badge = card.querySelector('.badge');
    if (badge) {
        badge.textContent = 'ACEPTADA';
        badge.className   = 'badge badge-aprobado';
    }

    // 3. Acento lateral
    const acento = card.querySelector('.card__accent');
    if (acento) {
        acento.className = 'card__accent card__accent--aprobado';
    }

    // 4. Filas de cita — reutiliza .coord-row / .coord-icon / .coord-text (§10 main.css)
    const coords = card.querySelector('.card-coords');
    if (coords) {
        const separador = document.createElement('hr');
        separador.style.cssText = 'border:none; border-top:1px solid var(--border); margin:4px 0;';
        coords.appendChild(separador);

        [
            { icon: '👨‍🔬', label: 'Técnico', valor: tecnico.nombre  },
            { icon: '📅',  label: 'Fecha',   valor: fechaFormateada },
            { icon: '🕐',  label: 'Hora',    valor: horaFormateada  },
        ].forEach(({ icon, label, valor }) => {
            const fila = document.createElement('div');
            fila.className = 'coord-row';
            fila.innerHTML = `
                <div class="coord-icon">${icon}</div>
                <span class="coord-text"><strong>${label}:</strong> ${valor}</span>
            `;
            coords.appendChild(fila);
        });
    }

    // 5. Ocultar botón "Verificar cita" — display:none conserva el elemento en el DOM
    const actions = card.querySelector('.card-actions');
    if (actions) actions.style.display = 'none';
}


// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════

/**
 * Muestra una notificación tipo toast en la esquina inferior derecha.
 * Se oculta automáticamente tras 3.5 segundos.
 * El elemento #toast está presente en todos los HTML del módulo.
 *
 * @param {string} mensaje - Texto a mostrar
 */
function mostrarToast(mensaje) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}


// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

    // Poblar la tabla de observaciones al cargar (observaciones.html)
    renderTablaObs();

    // Contador en tiempo real del textarea del modal de observación (observaciones.html)
    document.getElementById('obs-edit-textarea')
        ?.addEventListener('input', validarObsEdit);

    // Cerrar modal de observación al hacer clic fuera de él (observaciones.html)
    document.getElementById('modal-obs-edit-overlay')
        ?.addEventListener('click', function (e) {
            if (e.target === this) cerrarModalObsEdit();
        });

    // Cerrar modal de reporte al hacer clic fuera de él (observaciones.html)
    document.getElementById('modal-reporte-overlay')
        ?.addEventListener('click', function (e) {
            if (e.target === this) cerrarModalReporte();
        });

    // Cerrar modal de cita al hacer clic fuera de él (solicitudes.html)
    document.getElementById('modal-cita-overlay')
        ?.addEventListener('click', function (e) {
            if (e.target === this) cerrarModalCita();
        });

    // Toggle de visibilidad del sidebar (presente en todos los HTML)
    document.getElementById('toggleSidebar')
        ?.addEventListener('click', function () {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('hidden');
            this.textContent = sidebar.classList.contains('hidden')
                ? '→ Mostrar menú'
                : '← Ocultar menú';
        });

});