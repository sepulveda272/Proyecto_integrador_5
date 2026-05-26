// js/inspecciones.js
// ─────────────────────────────────────────────────────────────────────────────
// Responsabilidad: lógica exclusiva de inspeccion.html.
//
// MÓDULOS:
//   1. CatalogoPlagas       — base de datos de plagas por cultivo
//   2. ~~PersistenciaStore~~ — ELIMINADO: ya no existe persistencia en localStorage.
//                             El estado vive exclusivamente en memoria (Map en InspeccionStore).
//   3. InspeccionStore      — almacenamiento SOLO EN MEMORIA (Map volátil, sin localStorage)
//   4. FormularioLote       — formulario de primera inspección por lote
//   5. PaginacionLotes      — paginación de la vista de lotes (máx. 3 por página)
//   6. actualizarProgreso   — helper de barra de progreso (#seccion-cards)
//   7. ModalVerEditar       — modal "Ver / Editar inspección" por lote individual
//   8. ModalInspeccion      — compatibilidad con cards de inspecciones completadas
//   9. Funciones globales   — filtrarInspecciones, abrirVistaLotes, volverACards,
//                             abrirModal, verificarFinalizacion, finalizarInspeccion,
//                             mostrarToast
//  10. Listeners globales   — DOMContentLoaded (Escape, btn-finalizar)
//
// ── CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR ──────────────────────────────────
// [MODIFICADO] Se eliminó completamente el módulo PersistenciaStore (módulo 2),
//              que gestionaba las claves 'sifex_inspecciones' y 'sifex_lugares'
//              en localStorage. Ahora NO se escribe ni se lee ningún dato del
//              almacenamiento del navegador.
//
// [MODIFICADO] InspeccionStore ya no carga datos desde localStorage al arrancar.
//              El Map interno comienza siempre vacío (new Map()), garantizando
//              que cada recarga de página parte desde cero.
//
// [MODIFICADO] InspeccionStore.guardar() ya no llama a PersistenciaStore.guardarInspecciones().
//              Los datos sólo persisten mientras la pestaña está abierta.
//
// [ELIMINADO]  _restaurarEstadoCardsEnDOM() — ya no tiene sentido sin localStorage.
// [ELIMINADO]  _restaurarEstadoLotesEnDOM() — idem.
// [ELIMINADO]  Los bloques de "Persistir estado del lugar en localStorage" dentro
//              de verificarFinalizacion() y finalizarInspeccion().
//
// RESULTADO: al recargar la página todas las tarjetas vuelven a su estado
//            inicial (Pendiente / 25%), sin importar cuántas veces se recargue.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// ═════════════════════════════════════════════════════════════════════════════
// 1. CATÁLOGO DE PLAGAS
//    Estructura: { [cultivoNormalizado]: Plaga[] }
//    Plaga: { id, nombre, img, sintomas }
//    Sin cambios respecto a la versión anterior.
// ═════════════════════════════════════════════════════════════════════════════
const CatalogoPlagas = (() => {

    /**
     * Genera un SVG placeholder con emoji centrado.
     * @param {string} emoji
     * @returns {string} Data URI SVG.
     */
    function svgEmoji(emoji) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
            <rect width="80" height="80" rx="10" fill="#f0f4f0"/>
            <text x="40" y="52" font-size="36" text-anchor="middle">${emoji}</text>
        </svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    const PLAGAS = {
        tomate: [
            { id: 'mosca-blanca',  nombre: 'Mosca blanca (Bemisia tabaci)',         img: svgEmoji('🦟'), sintomas: 'Hojas con amarillamiento clorótico irregular, envés cubierto de ninfas blancas y excreciones de melaza. Puede transmitir virus que causan rizado y mosaico foliar.' },
            { id: 'acaros',        nombre: 'Ácaro rojo (Tetranychus urticae)',       img: svgEmoji('🕷️'), sintomas: 'Punteado fino plateado en el haz. Finas telarañas en el envés. Las hojas afectadas se decoloran y enrollan hacia arriba.' },
            { id: 'trips',         nombre: 'Trips (Frankliniella occidentalis)',     img: svgEmoji('🐛'), sintomas: 'Manchas plateadas y deformaciones en hojas jóvenes. Cicatrices corchosas en frutos. Puede inocular el virus del bronceado del tomate (TSWV).' },
            { id: 'tizon-tardio',  nombre: 'Tizón tardío (Phytophthora infestans)', img: svgEmoji('🍂'), sintomas: 'Manchas acuosas verde-grisáceas que se tornan marrones. Moho blanco-grisáceo en el envés. Lesiones oscuras en tallos y parches en frutos.' },
        ],
        mango: [
            { id: 'escama-blanda', nombre: 'Escama blanda (Coccus hesperidum)',                  img: svgEmoji('🪲'), sintomas: 'Costras ovaladas marrones en ramas y hojas. Genera melaza que favorece fumagina. Ramas infestadas pierden vigor.' },
            { id: 'antracnosis',   nombre: 'Antracnosis (Colletotrichum gloeosporioides)',        img: svgEmoji('🍃'), sintomas: 'Manchas negras irregulares en hojas, flores y frutos. En flores causa marchitez; en frutos lesiones hundidas negras que se amplían en poscosecha.' },
            { id: 'trips-mango',   nombre: 'Trips del mango (Scirtothrips mangiferae)',           img: svgEmoji('🐝'), sintomas: 'Cicatrices plateadas en nervaduras de brotes jóvenes. Los frutos pequeños presentan russeting que reduce su valor comercial.' },
        ],
        piña: [
            { id: 'cochinilla',    nombre: 'Cochinilla harinosa (Dysmicoccus brevipes)',          img: svgEmoji('🦠'), sintomas: 'Colonias con cera blanca harinosa en base de hojas. Inocula el virus de la marchitez. Las plantas muestran enrojecimiento y detención del crecimiento.' },
            { id: 'fusariosis',    nombre: 'Fusariosis (Fusarium subglutinans)',                  img: svgEmoji('🌾'), sintomas: 'Gomosis ámbar que exuda de la fruta. Cavidades internas con micelio blanco-rosado y olor fermentado.' },
            { id: 'acaros-piña',   nombre: 'Ácaro plano (Dolichotetranychus floridanus)',         img: svgEmoji('🕸️'), sintomas: 'Decoloración marrón-rojiza en la base de las hojas. El crecimiento se detiene y los frutos son pequeños y deformes.' },
        ],
        banana: [
            { id: 'sigatoka-negra', nombre: 'Sigatoka negra (Mycosphaerella fijiensis)',          img: svgEmoji('🍌'), sintomas: 'Rayas amarillas que evolucionan a manchas negras con halo amarillo. Puede destruir el 80 % del área foliar en infecciones severas.' },
            { id: 'picudo-negro',   nombre: 'Picudo negro (Cosmopolites sordidus)',               img: svgEmoji('🪳'), sintomas: 'Larvas que barrenan el cormo creando galerías marrones. Amarillamiento, marchitez y volcamiento de plantas.' },
            { id: 'nematodo',       nombre: 'Nematodo barrenador (Radopholus similis)',           img: svgEmoji('🐌'), sintomas: 'Lesiones necróticas en raíces y cormo. Amarillamiento y reducción del crecimiento. Volcamiento con vientos moderados.' },
        ],
    };

    function normalizar(cultivo) {
        return cultivo.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function obtenerPorCultivo(cultivo) {
        return PLAGAS[normalizar(cultivo)] ?? [];
    }

    return { obtenerPorCultivo, normalizar };
})();


// ═════════════════════════════════════════════════════════════════════════════
// 2. CAPA DE PERSISTENCIA — ELIMINADA
//
// [MODIFICADO] El módulo PersistenciaStore ha sido eliminado completamente.
//
// Antes gestionaba dos claves de localStorage:
//   · 'sifex_inspecciones' — datos de lotes inspeccionados
//   · 'sifex_lugares'      — estado de cada lugar de producción
//
// Ahora NO se utiliza localStorage ni sessionStorage ni ningún mecanismo de
// almacenamiento persistente. Todo el estado reside en los Maps/Sets de los
// módulos en memoria y se pierde al recargar la página, que es el
// comportamiento deseado.
// ═════════════════════════════════════════════════════════════════════════════


// ═════════════════════════════════════════════════════════════════════════════
// 3. STORE DE INSPECCIONES — SOLO EN MEMORIA
//
// [MODIFICADO] Ya no carga datos desde localStorage al arrancar.
//              El Map comienza siempre vacío (new Map()) en cada carga de página.
//              InspeccionStore.guardar() ya no llama a ningún método de
//              almacenamiento externo: los datos viven sólo en _datos (Map).
//
//    Estructura de cada entrada (clave = loteId, ej: 'LOTE-001'):
//    {
//      plantasContadas:  number,    — valor registrado por el técnico
//      plagasDetectadas: string[],  — ids de plagas marcadas
//      posiblesPlagas:   Plaga[],   — catálogo completo del cultivo (para edición)
//      cultivo:          string,    — nombre del cultivo
//      inspeccionado:    boolean    — true una vez que el técnico guarda
//    }
// ═════════════════════════════════════════════════════════════════════════════
const InspeccionStore = (() => {

    /**
     * [MODIFICADO] Antes: PersistenciaStore.cargarInspecciones() leía localStorage.
     * Ahora: Map vacío — el estado arranca limpio en cada carga de página.
     * @type {Map<string, Object>}
     */
    const _datos = new Map();

    /**
     * Guarda o actualiza la inspección de un lote.
     * @param {string}      loteId
     * @param {number}      plantasContadas
     * @param {string[]}    plagasDetectadas
     * @param {Object[]}    posiblesPlagas
     * @param {string}      cultivo
     * @param {number|null} idBackend — ID devuelto por el backend tras el POST (opcional)
     */
    function guardar(loteId, plantasContadas, plagasDetectadas, posiblesPlagas, cultivo, idBackend = null) {
        const previo = _datos.get(loteId);
        _datos.set(loteId, {
            plantasContadas,
            plagasDetectadas: [...plagasDetectadas],
            posiblesPlagas:   [...posiblesPlagas],
            cultivo,
            inspeccionado: true,
            idBackend:     idBackend ?? previo?.idBackend ?? null
        });
    }

    /**
     * Devuelve los datos guardados para un lote, o null si no existe.
     * @param {string} loteId
     * @returns {Object|null}
     */
    function obtener(loteId) {
        return _datos.get(loteId) ?? null;
    }

    /**
     * Indica si un lote ya fue inspeccionado y guardado.
     * @param {string} loteId
     * @returns {boolean}
     */
    function estaInspeccionado(loteId) {
        return _datos.has(loteId) && _datos.get(loteId).inspeccionado === true;
    }

    return { guardar, obtener, estaInspeccionado };
})();


// ═════════════════════════════════════════════════════════════════════════════
// 4. FORMULARIO DE PRIMERA INSPECCIÓN POR LOTE
//    Sin cambios de lógica respecto a la versión anterior, excepto que
//    InspeccionStore.guardar() ya no persiste en localStorage (ver módulo 3).
// ═════════════════════════════════════════════════════════════════════════════
const FormularioLote = (() => {

    let loteActual        = null;
    let cultivoActual     = '';
    let plagasCultivo     = [];
    let contadorPlantas   = 0;
    const plagasSeleccionadas = new Set();

    function actualizarContador() {
        const display  = document.getElementById('contador-valor');
        const btnMenos = document.getElementById('contador-menos');
        if (display)  display.textContent = contadorPlantas;
        if (btnMenos) btnMenos.disabled   = contadorPlantas === 0;
    }

    function renderizarPlagas(plagas) {
        const grid  = document.getElementById('plagas-grid');
        const empty = document.getElementById('plagas-empty');
        if (!grid) return;

        grid.innerHTML = '';
        if (!plagas.length) {
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';

        plagas.forEach(plaga => {
            const seleccionada = plagasSeleccionadas.has(plaga.id);
            const card = document.createElement('article');
            card.className = 'plaga-card' + (seleccionada ? ' plaga-card--seleccionada' : '');
            card.dataset.id = plaga.id;
            card.setAttribute('role', 'checkbox');
            card.setAttribute('aria-checked', String(seleccionada));
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Plaga: ${plaga.nombre}`);
            card.innerHTML = `
                <div class="plaga-card__img">
                    <img src="${plaga.img}" alt="${plaga.nombre}">
                    <span class="plaga-card__check" aria-hidden="true">✓</span>
                </div>
                <div class="plaga-card__body">
                    <div class="plaga-card__nombre">${plaga.nombre}</div>
                    <p class="plaga-card__sintomas">${plaga.sintomas}</p>
                </div>`;
            card.addEventListener('click', () => _togglePlaga(plaga.id, card));
            card.addEventListener('keydown', e => {
                if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); _togglePlaga(plaga.id, card); }
            });
            grid.appendChild(card);
        });
    }

    function _togglePlaga(plagaId, card) {
        if (plagasSeleccionadas.has(plagaId)) {
            plagasSeleccionadas.delete(plagaId);
            card.classList.remove('plaga-card--seleccionada');
            card.setAttribute('aria-checked', 'false');
        } else {
            plagasSeleccionadas.add(plagaId);
            card.classList.add('plaga-card--seleccionada');
            card.setAttribute('aria-checked', 'true');
        }
    }

    /**
     * Abre el formulario de inspección para el lote indicado.
     * Restaura datos previos si el lote ya tenía una inspección guardada
     * en memoria durante la sesión actual (no desde localStorage).
     */
    function abrir(loteId, cultivo, loteNum) {
        loteActual    = loteId;
        cultivoActual = cultivo;
        plagasCultivo = CatalogoPlagas.obtenerPorCultivo(cultivo);

        contadorPlantas = 0;
        plagasSeleccionadas.clear();

        // [SIN CAMBIO FUNCIONAL] Ahora InspeccionStore.obtener() consulta el Map
        // en memoria, no localStorage. Si la página se recargó, siempre devuelve null.
        const previo = InspeccionStore.obtener(loteId);
        if (previo) {
            contadorPlantas = previo.plantasContadas;
            previo.plagasDetectadas.forEach(id => plagasSeleccionadas.add(id));
        }

        const elLoteId  = document.getElementById('form-lote-id');
        const elCultivo = document.getElementById('form-cultivo');
        if (elLoteId)  elLoteId.textContent  = loteNum || loteId;
        if (elCultivo) elCultivo.textContent  = cultivo || '—';

        // Hint de plantas sembradas leído del DOM del lote
        const hint    = document.querySelector('.contador-bloque__hint');
        const loteRow = _obtenerFilaLote(loteId);
        let sembradas = '--';
        if (loteRow) {
            loteRow.querySelectorAll('.lote-field').forEach(campo => {
                const lbl = campo.querySelector('.lote-field__label')?.textContent.trim();
                const val = campo.querySelector('.lote-field__value')?.textContent.trim();
                if (lbl === 'Plantas sembradas') sembradas = val;
            });
        }
        if (hint) hint.textContent = `Plantas sembradas: ${sembradas}`;

        actualizarContador();
        renderizarPlagas(plagasCultivo);

        document.getElementById('seccion-lotes').style.display      = 'none';
        document.getElementById('seccion-formulario').style.display = 'block';
    }

    /** Cierra el formulario y regresa a la lista de lotes. */
    function cerrar() {
        document.getElementById('seccion-formulario').style.display = 'none';
        document.getElementById('seccion-lotes').style.display      = 'block';
    }

    function incrementar() { contadorPlantas += 1; actualizarContador(); }

    function decrementar() {
        if (contadorPlantas > 0) { contadorPlantas -= 1; actualizarContador(); }
    }

    /**
     * Guarda la inspección en InspeccionStore, actualiza el DOM y persiste en el backend.
     */
    async function guardar() {
        if (!loteActual) return;

        const plagasArray = Array.from(plagasSeleccionadas);
        InspeccionStore.guardar(loteActual, contadorPlantas, plagasArray, plagasCultivo, cultivoActual);
        _actualizarLoteEnDOM(loteActual);

        const resumen = plagasArray.length
            ? `${contadorPlantas} plantas afectadas · ${plagasArray.length} plaga(s) detectada(s)`
            : `${contadorPlantas} plantas afectadas · Sin plagas detectadas`;

        mostrarToast(`✅ ${loteActual} guardado — ${resumen}`);
        cerrar();
        verificarFinalizacion();

        // Persistir en el backend (no bloquea la UI)
        _sincronizarConBackend(loteActual, plagasArray);
    }

    /**
     * Envía los datos de la inspección al backend.
     * POST si es nueva, PUT si ya tiene idBackend almacenado.
     */
    async function _sincronizarConBackend(loteId, plagasArray) {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        if (!usuario.Id_tecnico || !_idLugarActivo) return;

        // Leer plantas sembradas del DOM del lote
        const loteRow = _obtenerFilaLote(loteId);
        let plantasSembradas = 0;
        if (loteRow) {
            loteRow.querySelectorAll('.lote-field').forEach(campo => {
                const lbl = campo.querySelector('.lote-field__label')?.textContent.trim();
                const val = campo.querySelector('.lote-field__value')?.textContent.trim();
                if (lbl === 'Plantas sembradas') {
                    plantasSembradas = parseInt(val.replace(/[.,\s]/g, '')) || 0;
                }
            });
        }

        const datos       = InspeccionStore.obtener(loteId);
        const nivelAlerta = plagasArray.length > 0 ? Math.min(6, plagasArray.length * 2) : 0;

        try {
            if (datos?.idBackend) {
                // Actualizar inspección existente
                await fetch(`http://localhost:9000/inspeccion/${datos.idBackend}`, {
                    method:  'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({
                        Plantas_revisadas: plantasSembradas,
                        Plantas_afectadas: datos.plantasContadas,
                        Nivel_alerta:      nivelAlerta
                    })
                });
            } else {
                // Crear nueva inspección
                const resp = await fetch('http://localhost:9000/inspeccion/add', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({
                        Plantas_revisadas: plantasSembradas,
                        Plantas_afectadas: datos.plantasContadas,
                        Fecha_inspeccion:  new Date().toISOString().split('T')[0],
                        Nivel_alerta:      nivelAlerta,
                        Id_tecnico:        usuario.Id_tecnico,
                        Id_lugar:          _idLugarActivo
                    })
                });
                if (resp.ok) {
                    const result = await resp.json();
                    InspeccionStore.guardar(loteId, datos.plantasContadas, datos.plagasDetectadas,
                        datos.posiblesPlagas, datos.cultivo, result.data?.id ?? null);
                }
            }
        } catch (e) {
            console.error('Error al sincronizar inspección con backend:', e);
        }
    }

    function _obtenerFilaLote(loteId) {
        return Array.from(document.querySelectorAll('#seccion-lotes .lote-row'))
            .find(row => row.querySelector('.lote-info__numero')?.textContent.trim() === loteId) ?? null;
    }

    /**
     * Actualiza el badge, botón e imagen del lote en el DOM tras guardarlo.
     * Cambia de "Pendiente" a "Completado" y redirige el onclick al modal Ver/Editar.
     */
    function _actualizarLoteEnDOM(loteId) {
        const fila = _obtenerFilaLote(loteId);
        if (!fila) return;

        fila.dataset.estado = 'completado';

        const badge = fila.querySelector('.lote-badge');
        if (badge) {
            badge.className = 'lote-badge lote-badge--comp';
            badge.innerHTML = '<span class="lote-badge__dot"></span>Completado';
        }

        const accion = fila.querySelector('.lote-row__action');
        if (accion) {
            const icon  = accion.querySelector('.action-icon');
            const label = accion.querySelector('.action-label');
            if (icon)  icon.textContent  = '👁️';
            if (label) label.textContent = 'Ver inspección';
            accion.onclick = () => ModalVerEditar.abrir(loteId);
        }

        const imgArea = fila.querySelector('.lote-row__img');
        if (imgArea) imgArea.onclick = () => ModalVerEditar.abrir(loteId);
    }

    return { abrir, cerrar, incrementar, decrementar, guardar };
})();


// ═════════════════════════════════════════════════════════════════════════════
// 5. PAGINACIÓN DE LOTES
//    Sin cambios respecto a la versión anterior.
// ═════════════════════════════════════════════════════════════════════════════
const PaginacionLotes = (() => {

    const LOTES_POR_PAGINA = 3;
    let paginaActual  = 1;
    let todosLosLotes = [];

    function totalPaginas() { return Math.ceil(todosLosLotes.length / LOTES_POR_PAGINA); }

    function mostrarPagina(pagina) {
        paginaActual = Math.max(1, Math.min(pagina, totalPaginas()));
        const inicio = (paginaActual - 1) * LOTES_POR_PAGINA;
        const fin    = inicio + LOTES_POR_PAGINA;
        todosLosLotes.forEach((lote, i) => { lote.style.display = (i >= inicio && i < fin) ? '' : 'none'; });
        renderControles();
    }

    function renderControles() {
        const contenedor = document.getElementById('lotes-paginacion');
        if (!contenedor) return;
        const total = totalPaginas();
        if (total <= 1) { contenedor.style.display = 'none'; return; }

        contenedor.style.display = 'flex';
        contenedor.innerHTML = '';

        const btnAnt = document.createElement('button');
        btnAnt.className = 'pag-btn pag-btn--nav';
        btnAnt.textContent = '← Anterior';
        btnAnt.disabled = paginaActual === 1;
        btnAnt.setAttribute('aria-label', 'Página anterior');
        btnAnt.addEventListener('click', () => mostrarPagina(paginaActual - 1));
        contenedor.appendChild(btnAnt);

        for (let p = 1; p <= total; p++) {
            const btn = document.createElement('button');
            btn.className = 'pag-btn pag-btn--num';
            btn.textContent = String(p);
            btn.setAttribute('aria-label', `Ir a la página ${p}`);
            if (p === paginaActual) {
                btn.classList.add('pag-btn--activa');
                btn.disabled = true;
                btn.setAttribute('aria-current', 'page');
            } else {
                btn.addEventListener('click', ((pg) => () => mostrarPagina(pg))(p));
            }
            contenedor.appendChild(btn);
        }

        const btnSig = document.createElement('button');
        btnSig.className = 'pag-btn pag-btn--nav';
        btnSig.textContent = 'Siguiente →';
        btnSig.disabled = paginaActual === total;
        btnSig.setAttribute('aria-label', 'Página siguiente');
        btnSig.addEventListener('click', () => mostrarPagina(paginaActual + 1));
        contenedor.appendChild(btnSig);
    }

    function init() {
        todosLosLotes = Array.from(document.querySelectorAll('#seccion-lotes .lote-row'));
        paginaActual = 1;
        if (todosLosLotes.length <= LOTES_POR_PAGINA) {
            todosLosLotes.forEach(l => (l.style.display = ''));
            const c = document.getElementById('lotes-paginacion');
            if (c) c.style.display = 'none';
            return;
        }
        mostrarPagina(1);
    }

    return { init, irAPagina: mostrarPagina };
})();


// ═════════════════════════════════════════════════════════════════════════════
// 6. HELPER DE BARRA DE PROGRESO (#seccion-cards)
//    Sin cambios respecto a la versión anterior.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Actualiza la barra de progreso de una tarjeta de inspección en #seccion-cards.
 * @param {HTMLElement} cardEl  — Elemento .card.
 * @param {number}      pct     — Porcentaje 0-100.
 * @param {string}      estado  — 'pendiente' | 'completado'.
 */
function actualizarProgreso(cardEl, pct, estado) {
    if (!cardEl) return;
    const porcentaje = Math.min(100, Math.max(0, Number(pct) || 0));
    const esPend     = estado === 'pendiente';

    const bar = cardEl.querySelector('.prog-bar');
    const val = cardEl.querySelector('.prog-val');

    if (bar) {
        bar.style.width = porcentaje + '%';
        bar.classList.toggle('prog-bar--pend', esPend);
        bar.classList.toggle('prog-bar--comp', !esPend);
    }
    if (val) {
        val.textContent = porcentaje + '%';
        val.classList.toggle('prog-val--pend', esPend);
        val.classList.toggle('prog-val--comp', !esPend);
    }
}


// ═════════════════════════════════════════════════════════════════════════════
// 7. MODAL VER / EDITAR INSPECCIÓN DE LOTE
//    Sin cambios de lógica. Sólo consulta InspeccionStore (memoria).
// ═════════════════════════════════════════════════════════════════════════════
const ModalVerEditar = (() => {

    let _loteId          = null;
    let _modo            = 'lectura';
    let _contadorEdicion = 0;
    const _plagasEdicion = new Set();

    const _overlay = () => document.getElementById('modal-ver-editar-overlay');
    const _body    = () => document.getElementById('mve-body');
    const _footer  = () => document.getElementById('mve-footer');

    function _obtenerFilaLote(loteId) {
        return Array.from(document.querySelectorAll('#seccion-lotes .lote-row'))
            .find(row => row.querySelector('.lote-info__numero')?.textContent.trim() === loteId) ?? null;
    }

    function _datosDOMDelLote(loteId) {
        const fila = _obtenerFilaLote(loteId);
        let cultivo = '—', plantasSembradas = '—';
        if (fila) {
            fila.querySelectorAll('.lote-field').forEach(campo => {
                const lbl = campo.querySelector('.lote-field__label')?.textContent.trim();
                const val = campo.querySelector('.lote-field__value')?.textContent.trim();
                if (lbl === 'Cultivo')           cultivo          = val ?? '—';
                if (lbl === 'Plantas sembradas') plantasSembradas = val ?? '—';
            });
        }
        return { cultivo, plantasSembradas };
    }

    function _renderLectura() {
        const datos  = InspeccionStore.obtener(_loteId);
        const { plantasSembradas } = _datosDOMDelLote(_loteId);
        const body   = _body();
        const footer = _footer();
        if (!body || !footer) return;

        const plantasHTML = `
            <div class="mve-seccion">
                <div class="mve-seccion__titulo"><span class="mve-seccion__icono">🌱</span> Plantas contadas</div>
                <div class="mve-dato-principal">
                    <span class="mve-dato-principal__num">${datos?.plantasContadas ?? 0}</span>
                    <span class="mve-dato-principal__lbl">plantas contadas</span>
                </div>
                <div class="mve-dato-secundario">Plantas sembradas: <strong>${plantasSembradas}</strong></div>
            </div>`;

        const detectadas = datos?.plagasDetectadas ?? [];
        const catalogo   = datos?.posiblesPlagas   ?? [];
        let plagasHTML;

        if (detectadas.length === 0) {
            plagasHTML = `
                <div class="mve-seccion">
                    <div class="mve-seccion__titulo"><span class="mve-seccion__icono">🔍</span> Plagas detectadas</div>
                    <div class="mve-sin-plagas">
                        <span class="mve-sin-plagas__ico">✅</span>
                        <p>No se detectaron plagas en esta inspección.</p>
                    </div>
                </div>`;
        } else {
            const items = detectadas.map(id => { const p = catalogo.find(p => p.id === id); return p ? p.nombre : id; });
            plagasHTML = `
                <div class="mve-seccion">
                    <div class="mve-seccion__titulo">
                        <span class="mve-seccion__icono">⚠️</span> Plagas detectadas
                        <span class="mve-badge-count">${items.length}</span>
                    </div>
                    <ul class="mve-plagas-lista" role="list">
                        ${items.map(nombre => `<li class="mve-plaga-item mve-plaga-item--detectada"><span class="mve-plaga-item__dot"></span><span class="mve-plaga-item__nombre">${nombre}</span></li>`).join('')}
                    </ul>
                </div>`;
        }

        body.innerHTML   = plantasHTML + plagasHTML;
        footer.innerHTML = `<button class="mve-btn mve-btn--editar" onclick="ModalVerEditar.activarEdicion()">✏️ Editar inspección</button>`;
    }

    function _renderEdicion() {
        const datos    = InspeccionStore.obtener(_loteId);
        const catalogo = datos?.posiblesPlagas ?? CatalogoPlagas.obtenerPorCultivo(_datosDOMDelLote(_loteId).cultivo);
        const body     = _body();
        const footer   = _footer();
        if (!body || !footer) return;

        _contadorEdicion = datos?.plantasContadas ?? 0;
        _plagasEdicion.clear();
        (datos?.plagasDetectadas ?? []).forEach(id => _plagasEdicion.add(id));

        const contadorHTML = `
            <div class="mve-seccion">
                <div class="mve-seccion__titulo"><span class="mve-seccion__icono">🌱</span> Plantas contadas</div>
                <div class="mve-contador">
                    <button class="mve-contador__btn" id="mve-btn-menos" onclick="ModalVerEditar._decrementar()" aria-label="Disminuir" ${_contadorEdicion === 0 ? 'disabled' : ''}>−</button>
                    <span class="mve-contador__valor" id="mve-contador-val" aria-live="polite">${_contadorEdicion}</span>
                    <button class="mve-contador__btn" id="mve-btn-mas" onclick="ModalVerEditar._incrementar()" aria-label="Aumentar">+</button>
                </div>
                <p class="mve-contador__hint">Toca − o + para ajustar la cantidad registrada.</p>
            </div>`;

        let plagasEditHTML;
        if (!catalogo.length) {
            plagasEditHTML = `<div class="mve-seccion"><div class="mve-seccion__titulo"><span class="mve-seccion__icono">⚠️</span> Plagas detectadas</div><p class="mve-sin-catalogo">Sin plagas en el catálogo para este cultivo.</p></div>`;
        } else {
            const cards = catalogo.map(plaga => {
                const sel = _plagasEdicion.has(plaga.id);
                return `<label class="mve-plaga-check ${sel ? 'mve-plaga-check--sel' : ''}" data-plaga-id="${plaga.id}" role="checkbox" aria-checked="${sel}" tabindex="0">
                    <span class="mve-plaga-check__tick">${sel ? '✓' : ''}</span>
                    <img class="mve-plaga-check__img" src="${plaga.img}" alt="${plaga.nombre}">
                    <span class="mve-plaga-check__nombre">${plaga.nombre}</span>
                </label>`;
            }).join('');
            plagasEditHTML = `
                <div class="mve-seccion">
                    <div class="mve-seccion__titulo"><span class="mve-seccion__icono">⚠️</span> Plagas detectadas <span class="mve-badge-count" id="mve-plagas-count">${_plagasEdicion.size}</span></div>
                    <p class="mve-seccion__hint">Toca cada plaga para marcarla o desmarcarla.</p>
                    <div class="mve-plagas-grid" id="mve-plagas-grid">${cards}</div>
                </div>`;
        }

        body.innerHTML = contadorHTML + plagasEditHTML;

        const grid = document.getElementById('mve-plagas-grid');
        if (grid) {
            grid.addEventListener('click', e => { const l = e.target.closest('.mve-plaga-check'); if (l) _togglePlagaEdicion(l); });
            grid.addEventListener('keydown', e => {
                if (e.key === ' ' || e.key === 'Enter') { const l = e.target.closest('.mve-plaga-check'); if (l) { e.preventDefault(); _togglePlagaEdicion(l); } }
            });
        }

        footer.innerHTML = `
            <button class="mve-btn mve-btn--cancelar" onclick="ModalVerEditar.cancelarEdicion()">Cancelar</button>
            <button class="mve-btn mve-btn--guardar"  onclick="ModalVerEditar.guardarEdicion()">💾 Guardar cambios</button>`;
    }

    function _incrementar() { _contadorEdicion += 1; _sincronizarContadorEdicion(); }

    function _decrementar() { if (_contadorEdicion > 0) { _contadorEdicion -= 1; _sincronizarContadorEdicion(); } }

    function _sincronizarContadorEdicion() {
        const valEl  = document.getElementById('mve-contador-val');
        const btnMen = document.getElementById('mve-btn-menos');
        if (valEl)  valEl.textContent = _contadorEdicion;
        if (btnMen) btnMen.disabled   = _contadorEdicion === 0;
    }

    function _togglePlagaEdicion(label) {
        const id = label.dataset.plagaId;
        if (!id) return;
        const sel = _plagasEdicion.has(id);
        if (sel) {
            _plagasEdicion.delete(id);
            label.classList.remove('mve-plaga-check--sel');
            label.setAttribute('aria-checked', 'false');
            label.querySelector('.mve-plaga-check__tick').textContent = '';
        } else {
            _plagasEdicion.add(id);
            label.classList.add('mve-plaga-check--sel');
            label.setAttribute('aria-checked', 'true');
            label.querySelector('.mve-plaga-check__tick').textContent = '✓';
        }
        const badge = document.getElementById('mve-plagas-count');
        if (badge) badge.textContent = _plagasEdicion.size;
    }

    function abrir(loteId) {
        _loteId = loteId;
        _modo   = 'lectura';
        const { cultivo } = _datosDOMDelLote(loteId);
        const elTitulo = document.getElementById('mve-titulo');
        const elSub    = document.getElementById('mve-sub');
        if (elTitulo) elTitulo.textContent = loteId;
        if (elSub)    elSub.textContent    = `Cultivo: ${cultivo}`;
        _renderLectura();
        const overlay = _overlay();
        if (overlay) { overlay.classList.add('mve--visible'); requestAnimationFrame(() => overlay.querySelector('.mve__close')?.focus()); }
        document.body.style.overflow = 'hidden';
    }

    function activarEdicion()  { _modo = 'edicion';  _renderEdicion();  }
    function cancelarEdicion() { _modo = 'lectura';  _renderLectura();  }

    async function guardarEdicion() {
        if (!_loteId) return;
        const datos          = InspeccionStore.obtener(_loteId);
        const posiblesPlagas = datos?.posiblesPlagas ?? [];
        const cultivo        = datos?.cultivo        ?? _datosDOMDelLote(_loteId).cultivo;
        const plagasArr      = Array.from(_plagasEdicion);

        InspeccionStore.guardar(_loteId, _contadorEdicion, plagasArr, posiblesPlagas, cultivo, datos?.idBackend ?? null);

        // Persistir edición en el backend si la inspección ya tiene ID
        if (datos?.idBackend) {
            const nivelAlerta = plagasArr.length > 0 ? Math.min(6, plagasArr.length * 2) : 0;
            try {
                await fetch(`http://localhost:9000/inspeccion/${datos.idBackend}`, {
                    method:  'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({
                        Plantas_afectadas: _contadorEdicion,
                        Nivel_alerta:      nivelAlerta
                    })
                });
            } catch (e) {
                console.error('Error al actualizar inspección en backend:', e);
            }
        }

        mostrarToast(`✅ ${_loteId} actualizado correctamente`);
        verificarFinalizacion();
        _modo = 'lectura';
        _renderLectura();
    }

    function cerrar() {
        const overlay = _overlay();
        if (overlay) overlay.classList.remove('mve--visible');
        document.body.style.overflow = '';
        _loteId = null;
        _modo   = 'lectura';
    }

    function cerrarSiOverlay(event) { if (event.target === _overlay()) cerrar(); }

    return { abrir, activarEdicion, cancelarEdicion, guardarEdicion, cerrar, cerrarSiOverlay, _incrementar, _decrementar };
})();


// ═════════════════════════════════════════════════════════════════════════════
// 8. COMPATIBILIDAD CON ModalInspeccion (cards completadas en #seccion-cards)
//    Sin cambios de lógica. Lee InspeccionStore (memoria) para mostrar resumen.
// ═════════════════════════════════════════════════════════════════════════════
const ModalInspeccion = (() => {

    function abrir(nombre, estado) {
        const overlay  = document.getElementById('modal-ver-editar-overlay');
        const elTitulo = document.getElementById('mve-titulo');
        const elSub    = document.getElementById('mve-sub');
        const body     = document.getElementById('mve-body');
        const footer   = document.getElementById('mve-footer');
        if (!overlay) return;

        if (elTitulo) elTitulo.textContent = `Inspección — ${nombre}`;
        if (elSub)    elSub.textContent    = estado === 'completado' ? '✅ Completada' : '🔄 En curso';

        const filas = document.querySelectorAll('#seccion-lotes .lote-row');
        let html = '';
        filas.forEach(fila => {
            const id       = fila.querySelector('.lote-info__numero')?.textContent.trim() ?? '—';
            const est      = fila.dataset.estado ?? 'pendiente';
            const datos    = InspeccionStore.obtener(id);
            const cls      = est === 'completado' ? 'mve-plaga-item--detectada' : '';
            const etiqueta = est === 'completado'
                ? `✅ ${datos?.plantasContadas ?? 0} plantas · ${datos?.plagasDetectadas?.length ?? 0} plaga(s)`
                : '⏳ Pendiente de inspección';
            html += `<li class="mve-plaga-item ${cls}" style="padding:10px 12px;border-radius:8px;margin-bottom:6px;list-style:none">
                         <strong>${id}</strong><br>
                         <span style="font-size:12px;color:#4a6b57">${etiqueta}</span>
                     </li>`;
        });

        if (body)   body.innerHTML   = `<ul style="padding:0;margin:0">${html || '<li>Sin lotes registrados.</li>'}</ul>`;
        if (footer) footer.innerHTML = '';

        overlay.classList.add('mve--visible');
        document.body.style.overflow = 'hidden';
    }

    function cerrar() {
        const overlay = document.getElementById('modal-ver-editar-overlay');
        if (overlay) overlay.classList.remove('mve--visible');
        document.body.style.overflow = '';
    }

    function cerrarSiOverlay(event) {
        if (event.target === document.getElementById('modal-ver-editar-overlay')) cerrar();
    }

    return { abrir, cerrar, cerrarSiOverlay };
})();


// ═════════════════════════════════════════════════════════════════════════════
// 9. FUNCIONES GLOBALES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Nombre del lugar de producción actualmente en inspección.
 * Se establece al abrir la vista de lotes y se usa en finalizarInspeccion().
 * @type {string}
 */
let _lugarActivo = '';

/**
 * ID numérico del lugar en la base de datos (Id_lugar de infraestructura).
 * Se usa al guardar inspecciones en el backend.
 * @type {number}
 */
let _idLugarActivo = 0;

/**
 * Filtra las cards de inspección por estado.
 * @param {string}      estado — 'todos' | 'pendiente' | 'completado'
 * @param {HTMLElement} btn    — Botón pulsado (se marca como activo).
 */
function filtrarInspecciones(estado, btn) {
    document.querySelectorAll('.filtro').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#seccion-cards .card').forEach(card => {
        card.style.display = (estado === 'todos' || card.dataset.estado === estado) ? '' : 'none';
    });
}

/**
 * Transiciona a la vista de lotes de una inspección y carga los lotes
 * reales del lugar de producción desde el backend.
 *
 * @param {string} nombre    — Nombre del predio.
 * @param {string} ubicacion — Texto de ubicación.
 * @param {number} idLugar   — ID del lugar de producción.
 */
function abrirVistaLotes(nombre, ubicacion, idLugar = 0) {
    _lugarActivo   = nombre;
    _idLugarActivo = idLugar;

    document.getElementById('seccion-cards').style.display      = 'none';
    document.getElementById('seccion-formulario').style.display = 'none';
    document.querySelector('.header').style.display             = 'none';

    const secLotes = document.getElementById('seccion-lotes');
    secLotes.style.display = 'block';
    document.getElementById('lotes-titulo').textContent = 'Lotes — ' + nombre;
    document.getElementById('lotes-sub').textContent    = ubicacion + ' · Inspección en curso';

    // Mostrar indicador de carga mientras se obtienen los lotes
    const listaLotes = document.getElementById('lista-lotes');
    if (listaLotes) {
        listaLotes.innerHTML = '<p style="padding:20px;color:var(--text-muted,#888)">⏳ Cargando lotes...</p>';
    }

    // Cargar lotes desde el backend
    _cargarLotesDelLugar(idLugar).then(() => {
        requestAnimationFrame(() => {
            PaginacionLotes.init();
            verificarFinalizacion();
        });
    });
}

/**
 * Carga los lotes reales del lugar de producción desde el backend
 * y los renderiza en #lista-lotes dentro de #seccion-lotes.
 *
 * Endpoint: GET http://localhost:8003/lote  (filtrando por Id_lugar)
 * Nota: El microservicio de infraestructura corre en el puerto 8003.
 *
 * @param {number} idLugar
 */
async function _cargarLotesDelLugar(idLugar) {
    const listaLotes = document.getElementById('lista-lotes');
    if (!listaLotes) return;

    try {
        const resp = await fetch(`http://localhost:8003/lote`);
        if (!resp.ok) throw new Error('Error al obtener lotes');
        const result = await resp.json();

        // Filtrar solo los lotes del lugar activo
        const lotes = (result.data || []).filter(l => Number(l.Id_lugar) === Number(idLugar));

        if (!lotes.length) {
            listaLotes.innerHTML = '<p style="padding:20px;color:var(--text-muted,#888)">ℹ️ Este lugar de producción no tiene lotes registrados.</p>';
            return;
        }

        listaLotes.innerHTML = '';

        lotes.forEach(lote => {
            const loteId       = `LOTE-${lote.Numero_Lote}`;
            const datosCultivo = (typeof lote.datos_cultivo === 'object' && lote.datos_cultivo !== null)
                ? lote.datos_cultivo : null;
            const cultivo      = datosCultivo?.Nombre_especie
                ? `${datosCultivo.Nombre_especie}${datosCultivo.Variedad ? ' · ' + datosCultivo.Variedad : ''}`
                : '—';
            const imagenCultivo = datosCultivo?.Imagen || null;
            const fecha    = lote.Fecha_siembra
                ? new Date(lote.Fecha_siembra).toLocaleDateString('es-CO')
                : '—';
            const esFenologico = lote.Estado_fenologico || '—';
            const totalPlantas = lote.Total_plantas ?? '—';
            const areaTotal    = lote.Area_total    ?? '—';
            const areaSiembra  = lote.Area_siembra  ?? '—';

            const yaInspeccionado = InspeccionStore.estaInspeccionado(loteId);

            const row = document.createElement('article');
            row.className    = 'lote-row';
            row.dataset.id   = loteId;
            row.dataset.estado = yaInspeccionado ? 'completado' : 'pendiente';

            row.innerHTML = `
                <div class="lote-row__img" onclick="${yaInspeccionado ? `ModalVerEditar.abrir('${loteId}')` : `abrirModal('${loteId}')`}">
                    ${imagenCultivo
                        ? `<img class="img-cultivo" src="${imagenCultivo}" alt="${cultivo}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`
                        : `<span style="font-size:2rem">🌱</span>`}
                </div>
                <div class="lote-row__info">
                    <div class="lote-info__numero">${loteId}</div>
                    <div class="lote-fields">
                        <div class="lote-field">
                            <span class="lote-field__label">Cultivo</span>
                            <span class="lote-field__value">${cultivo}</span>
                        </div>
                        <div class="lote-field">
                            <span class="lote-field__label">Plantas sembradas</span>
                            <span class="lote-field__value">${totalPlantas}</span>
                        </div>
                        <div class="lote-field">
                            <span class="lote-field__label">Área total</span>
                            <span class="lote-field__value">${areaTotal} ha</span>
                        </div>
                        <div class="lote-field">
                            <span class="lote-field__label">Área siembra</span>
                            <span class="lote-field__value">${areaSiembra} ha</span>
                        </div>
                        <div class="lote-field">
                            <span class="lote-field__label">Estado fenológico</span>
                            <span class="lote-field__value">${esFenologico}</span>
                        </div>
                        <div class="lote-field">
                            <span class="lote-field__label">Fecha siembra</span>
                            <span class="lote-field__value">${fecha}</span>
                        </div>
                    </div>
                </div>
                <div class="lote-row__meta">
                    <span class="lote-badge ${yaInspeccionado ? 'lote-badge--comp' : 'lote-badge--pend'}">
                        <span class="lote-badge__dot"></span>
                        ${yaInspeccionado ? 'Completado' : 'Pendiente'}
                    </span>
                    <button class="lote-row__action" onclick="${yaInspeccionado ? `ModalVerEditar.abrir('${loteId}')` : `abrirModal('${loteId}')`}">
                        <span class="action-icon">${yaInspeccionado ? '👁️' : '🔍'}</span>
                        <span class="action-label">${yaInspeccionado ? 'Ver inspección' : 'Inspeccionar'}</span>
                    </button>
                </div>
            `;

            listaLotes.appendChild(row);
        });

    } catch (e) {
        console.error('Error al cargar lotes:', e);
        if (listaLotes) {
            listaLotes.innerHTML = '<p style="padding:20px;color:#c0392b">❌ No se pudieron cargar los lotes. Verifica tu conexión.</p>';
        }
    }
}

/** Regresa desde la vista de lotes a la vista de cards. */
function volverACards() {
    document.getElementById('seccion-lotes').style.display      = 'none';
    document.getElementById('seccion-formulario').style.display = 'none';
    document.getElementById('seccion-cards').style.display      = 'grid';
    document.querySelector('.header').style.display             = 'flex';
}

/**
 * Punto de entrada desde los botones de acción de los lotes.
 * Si el lote ya fue inspeccionado → abre el modal Ver/Editar.
 * Si no → abre el formulario de primera inspección.
 * @param {string} loteId
 */
function abrirModal(loteId) {
    if (InspeccionStore.estaInspeccionado(loteId)) {
        ModalVerEditar.abrir(loteId);
        return;
    }

    const loteRow = Array.from(document.querySelectorAll('#seccion-lotes .lote-row'))
        .find(row => row.querySelector('.lote-info__numero')?.textContent.trim() === loteId);

    let cultivo = '';
    let loteNum = loteId;

    if (loteRow) {
        loteRow.querySelectorAll('.lote-field').forEach(campo => {
            const lbl = campo.querySelector('.lote-field__label');
            const val = campo.querySelector('.lote-field__value');
            if (lbl && val && lbl.textContent.trim() === 'Cultivo') cultivo = val.textContent.trim();
        });
        const numEl = loteRow.querySelector('.lote-info__numero');
        if (numEl) loteNum = numEl.textContent.trim();
    }

    FormularioLote.abrir(loteId, cultivo, loteNum);
}

/**
 * Evalúa si todos los lotes están inspeccionados y habilita/deshabilita #btn-finalizar.
 * Actualiza el contador del botón y la barra de progreso de la card activa.
 *
 * [MODIFICADO] Se eliminó el bloque que guardaba el progreso en localStorage.
 * El progreso calculado aquí (pct) ya no se persiste entre recargas.
 */
function verificarFinalizacion() {
    const btnFinalizar = document.getElementById('btn-finalizar');
    if (!btnFinalizar) return;

    const filas        = document.querySelectorAll('#seccion-lotes .lote-row');
    const total        = filas.length;
    let inspeccionados = 0;

    filas.forEach(fila => {
        const id = fila.querySelector('.lote-info__numero')?.textContent.trim();
        if (id && InspeccionStore.estaInspeccionado(id)) inspeccionados++;
    });

    const todos = inspeccionados === total && total > 0;
    btnFinalizar.disabled = !todos;
    btnFinalizar.title    = todos
        ? '¡Todos los lotes inspeccionados! Listo para finalizar.'
        : `${inspeccionados} de ${total} lotes inspeccionados`;

    const contador = btnFinalizar.querySelector('.btn-finalizar__contador');
    if (contador) contador.textContent = `${inspeccionados}/${total}`;

    // Actualizar barra de progreso de la card activa en tiempo real (solo en memoria)
    const pct    = total > 0 ? Math.round((inspeccionados / total) * 100) : 0;
    const estado = todos ? 'completado' : 'pendiente';
    const cardEl = _obtenerCardActiva();
    if (cardEl) actualizarProgreso(cardEl, pct, estado);

    // [ELIMINADO] Bloque que persistía el progreso parcial en localStorage:
    // if (_lugarActivo) {
    //     const lugaresGuardados = PersistenciaStore.cargarLugares();
    //     lugaresGuardados[_lugarActivo] = { estado, progreso: pct };
    //     PersistenciaStore.guardarLugares(lugaresGuardados);
    // }
}

/**
 * Obtiene la card de #seccion-cards que corresponde al lugar activo.
 * @returns {HTMLElement|null}
 */
function _obtenerCardActiva() {
    if (!_lugarActivo) return null;
    let cardEncontrada = null;
    document.querySelectorAll('#seccion-cards .card').forEach(card => {
        const codigo = card.querySelector('.card-codigo')?.textContent?.trim();
        if (codigo === _lugarActivo) cardEncontrada = card;
    });
    return cardEncontrada;
}

/**
 * Acción del botón "Finalizar inspección".
 *
 * 1. Cambia el estado del lugar de producción a "Completado" en el DOM.
 * 2. Actualiza el badge, el acento de color y el botón de la card.
 * 3. Actualiza la barra de progreso al 100%.
 * 4. [MODIFICADO] Ya NO persiste el estado en localStorage.
 *    El cambio a "Completado" vive sólo en el DOM de la sesión actual.
 *    Al recargar la página, la card volverá a su estado inicial (Pendiente).
 * 5. Muestra un toast de confirmación.
 * 6. Redirige automáticamente a la vista de cards (#seccion-cards).
 */
function finalizarInspeccion() {
    if (!_lugarActivo) {
        volverACards();
        return;
    }

    // ── 1. Actualizar la card en el DOM ──
    const cardEl = _obtenerCardActiva();
    if (cardEl) {
        cardEl.dataset.estado = 'completado';

        // Badge: Pendiente → Completado
        const badge = cardEl.querySelector('.badge');
        if (badge) {
            badge.className   = 'badge badge-aprobado';
            badge.textContent = 'Completado';
        }

        // Acento de color (franja lateral)
        const acento = cardEl.querySelector('.card__accent');
        if (acento) acento.className = 'card__accent card__accent--aprobado';

        // Botón: "Continuar inspección" → "Ver inspección"
        const btnCard    = cardEl.querySelector('.btn-detalles');
        const nombreLugar = _lugarActivo;
        if (btnCard) {
            btnCard.textContent = 'Ver inspección';
            btnCard.onclick     = () => ModalInspeccion.abrir(nombreLugar, 'completado');
        }

        // Barra de progreso al 100% con color de completado
        actualizarProgreso(cardEl, 100, 'completado');
    }

    // [ELIMINADO] Bloque que guardaba el estado del lugar en localStorage:
    // const lugaresGuardados       = PersistenciaStore.cargarLugares();
    // lugaresGuardados[_lugarActivo] = { estado: 'completado', progreso: 100 };
    // PersistenciaStore.guardarLugares(lugaresGuardados);

    // ── 2. Toast + redirección a #seccion-cards ──
    mostrarToast(`✅ Inspección de "${_lugarActivo}" finalizada correctamente`);

    // Pequeño delay para que el toast sea visible antes de cambiar la vista
    setTimeout(() => { volverACards(); }, 600);
}

/**
 * Muestra un mensaje temporal en #toast.
 * @param {string} mensaje
 */
function mostrarToast(mensaje) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}


// ═════════════════════════════════════════════════════════════════════════════
// [ELIMINADO] HELPERS PRIVADOS de restauración desde localStorage
//
// Las funciones _restaurarEstadoCardsEnDOM() y _restaurarEstadoLotesEnDOM()
// han sido eliminadas completamente porque:
//   · Leían de localStorage para reconstruir el estado visual tras una recarga.
//   · Sin localStorage, no hay datos que restaurar.
//   · El requisito es que al recargar todo vuelva al estado inicial.
// ═════════════════════════════════════════════════════════════════════════════


// ═════════════════════════════════════════════════════════════════════════════
// 10. LISTENERS GLOBALES
// ═════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

    // Cargar inspecciones previas del técnico desde el backend
    _cargarInspeccionesDesdeBackend();

    // Tecla Escape cierra el modal Ver/Editar si está abierto
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('modal-ver-editar-overlay');
            if (overlay?.classList.contains('mve--visible')) ModalVerEditar.cerrar();
        }
    });

    // El botón Finalizar arranca deshabilitado (refuerzo JS además del atributo HTML)
    const btnFinalizar = document.getElementById('btn-finalizar');
    if (btnFinalizar) btnFinalizar.disabled = true;
});

/**
 * Consulta las inspecciones asignadas al técnico logueado usando el endpoint
 * dedicado GET /inspeccion/tecnico/:idTecnico y renderiza las cards.
 * También actualiza el nombre en el topbar con el dato del localStorage.
 */
async function _cargarInspeccionesDesdeBackend() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (!usuario.Id_tecnico) return;

    // Mostrar nombre del técnico en el topbar
    const spanUser = document.getElementById('topbar-user');
    if (spanUser && usuario.Primer_nombre) {
        spanUser.textContent =
            `${usuario.Primer_nombre} ${usuario.Segundo_nombre || ''} ${usuario.Primer_apellido || ''} ${usuario.Segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
    }

    try {
        const resp = await fetch(`http://localhost:9000/inspeccion/tecnico/${usuario.Id_tecnico}`);
        if (!resp.ok) throw new Error('Error al obtener inspecciones');
        const result = await resp.json();
        _renderizarCards(result.data || []);
    } catch (e) {
        console.error('Error al cargar inspecciones del técnico:', e);
        const grid = document.getElementById('seccion-cards');
        if (grid) grid.innerHTML = '<p style="padding:24px;color:#c0392b">❌ No se pudieron cargar las inspecciones. Verifica tu conexión.</p>';
    }
}

/**
 * Limpia #seccion-cards y renderiza una card por cada inspección.
 *
 * Estado de la card:
 *   · "completado"  →  Plantas_revisadas > 0  (el técnico ya inspeccionó)
 *   · "pendiente"   →  Plantas_revisadas === 0 (inspección aún no realizada)
 *
 * Cada card almacena data-id-lugar para que abrirVistaLotes() funcione.
 *
 * @param {Array} inspecciones - Array devuelto por GET /inspeccion/tecnico/:id
 */
function _renderizarCards(inspecciones) {
    const grid = document.getElementById('seccion-cards');
    if (!grid) return;
    grid.innerHTML = '';

    if (!inspecciones.length) {
        grid.innerHTML = '<p style="padding:24px; color:var(--text-muted, #888)">No tienes inspecciones asignadas actualmente.</p>';
        return;
    }

    inspecciones.forEach(insp => {
        const estaCompleta = (insp.Plantas_revisadas ?? 0) > 0;
        const estado       = estaCompleta ? 'completado' : 'pendiente';
        const pct          = estaCompleta ? 100 : 0;
        const nombre       = insp.Nombre_LugarProduccion || `Lugar #${insp.Id_lugar}`;
        const productor    = insp.Nombre_Productor || null;

        // Construir texto de ubicación con departamento, municipio y vereda
        const partesUbicacion = [insp.Departamento, insp.Municipio, insp.Vereda].filter(Boolean);
        const ubicacion = partesUbicacion.join(' · ');

        const fecha = insp.Fecha_inspeccion
            ? new Date(insp.Fecha_inspeccion).toLocaleDateString('es-CO')
            : 'Por definir';

        // Texto del botón según porcentaje
        let textoBtnAccion;
        if (estaCompleta) {
            textoBtnAccion = 'Ver inspección ➜';
        } else if (pct === 0) {
            textoBtnAccion = 'Empezar inspección ➜';
        } else {
            textoBtnAccion = 'Continuar inspección ➜';
        }

        // Escapar comillas simples para uso seguro en atributos onclick
        const nombreEsc   = nombre.replace(/'/g, "\\'");
        const ubicEsc     = ubicacion.replace(/'/g, "\\'");

        const card = document.createElement('div');
        card.className        = 'card';
        card.dataset.estado   = estado;
        card.dataset.idLugar  = insp.Id_lugar;
        card.dataset.totalLotes = 1;

        card.innerHTML = `
            <div class="card__accent card__accent--${estaCompleta ? 'aprobado' : 'pendiente'}"></div>
            <div class="card__inner">
                <div class="card-header">
                    <span class="card-codigo">${nombre}</span>
                    <span class="badge ${estaCompleta ? 'badge-aprobado' : 'badge-revision'}">
                        ${estaCompleta ? 'Completado' : 'Pendiente'}
                    </span>
                </div>
                <div class="card-coords">
                    ${productor ? `
                    <div class="coord-row">
                        <div class="coord-icon">👤</div>
                        <span class="coord-text">Productor: <strong>${productor}</strong></span>
                    </div>` : ''}
                    ${ubicacion ? `
                    <div class="coord-row">
                        <div class="coord-icon">📍</div>
                        <span class="coord-text">${ubicacion}</span>
                    </div>` : ''}
                    <div class="coord-row">
                        <div class="coord-icon">📅</div>
                        <span class="coord-text">Fecha: <strong>${fecha}</strong></span>
                    </div>
                </div>
                <div class="prog-wrap">
                    <div class="prog-label">
                        <span class="prog-key">Progreso</span>
                        <span class="prog-val ${estaCompleta ? 'prog-val--comp' : 'prog-val--pend'}">${pct}%</span>
                    </div>
                    <div class="prog-track">
                        <div class="prog-bar ${estaCompleta ? 'prog-bar--comp' : 'prog-bar--pend'}"
                             style="width:${pct}%"></div>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn-detalles"
                    onclick="abrirVistaLotes('${nombreEsc}', '${ubicEsc}', ${insp.Id_lugar})">
                    ${textoBtnAccion}
                </button>
            </div>
        `;

        grid.appendChild(card);
    });
}