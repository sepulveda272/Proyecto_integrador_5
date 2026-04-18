// ═══════════════════════════════════════════════════════════════
//  DATOS
//  En tu app real estos arrays vendrán del backend:
//  fetch('/api/lugares').then(r => r.json())
//  fetch('/api/tecnicos').then(r => r.json())
// ═══════════════════════════════════════════════════════════════

const lugaresCompletados = [
    { id: 'INS001', nombre: 'San Cristobal',     departamento: 'Santander',          municipio: 'Bucaramanga' },
    { id: 'INS002', nombre: 'Abduzcan',           departamento: 'Norte de Santander', municipio: 'Pamplona'    },
    { id: 'INS003', nombre: 'Finca La Esperanza', departamento: 'Antioquia',          municipio: 'Rionegro'    },
];

const tecnicosDisponibles = [
    { id: 'TEC001', nombre: 'Benito Camelo',    departamento: 'Santander',          municipio: 'Bucaramanga'},
    { id: 'TEC002', nombre: 'Laura Figueroa',   departamento: 'Santander',          municipio: 'Floridablanca'},
    { id: 'TEC003', nombre: 'Carlos Martínez',  departamento: 'Santander',          municipio: 'Girón'},
    { id: 'TEC004', nombre: 'Paola Suárez',     departamento: 'Norte de Santander', municipio: 'Pamplona'},
    { id: 'TEC005', nombre: 'Héctor Rondón',    departamento: 'Norte de Santander', municipio: 'Cúcuta'},
    { id: 'TEC006', nombre: 'Marcela Torres',   departamento: 'Norte de Santander', municipio: 'Ocaña'},
    { id: 'TEC007', nombre: 'Andrés Ospina',    departamento: 'Antioquia',          municipio: 'Rionegro'},
    { id: 'TEC008', nombre: 'Sandra Velásquez', departamento: 'Antioquia',          municipio: 'Medellín'},
];

// Estado interno de los modales
let lugarObsSel    = null;
let citaTecnicoSel = null;

// ═══════════════════════════════════════════════════════════════
//  FILTROS SOLICITUDES
// ═══════════════════════════════════════════════════════════════

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

function abrirModalVerificarCita(card) {
    citaTecnicoSel = null;

    const lugar        = card.dataset.lugar;
    const departamento = card.dataset.departamento;
    const municipio    = card.dataset.municipio;

    // Filtrar técnicos del mismo departamento,
    // ordenando: mismo municipio primero, luego por nombre
    const tecnicos = tecnicosDisponibles
        .filter(t => t.departamento === departamento)
        .sort((a, b) => {
            if (a.municipio === municipio && b.municipio !== municipio) return -1;
            if (b.municipio === municipio && a.municipio !== municipio) return  1;
            return a.nombre.localeCompare(b.nombre);
        });

    // Rellenar encabezado del modal
    document.getElementById('cita-modal-lugar').textContent     = lugar;
    document.getElementById('cita-modal-ubicacion').textContent = `${departamento} · ${municipio}`;

    // Resetear campos
    const fechaInput = document.getElementById('cita-fecha');
    fechaInput.value    = '';
    fechaInput.disabled = true;
    // Fecha mínima: hoy
    fechaInput.min = new Date().toISOString().split('T')[0];

    document.getElementById('btn-aceptar-cita').disabled = true;
    document.getElementById('cita-success-msg').classList.remove('show');

    // Renderizar técnicos
    const lista = document.getElementById('cita-tecnicos-lista');
    lista.innerHTML = '';

    if (tecnicos.length === 0) {
        lista.innerHTML = `
            <div style="padding:20px;text-align:center;color:#8fb09a;font-size:13px;">
                No hay técnicos disponibles en <strong>${departamento}</strong>.
            </div>`;
    } else {
        tecnicos.forEach(tec => {
            const mismoMunicipio = tec.municipio === municipio;
            const item = document.createElement('div');
            item.className  = 'cita-tecnico-item';
            item.dataset.id = tec.id;
            item.innerHTML  = `
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

function cerrarModalCita() {
    document.getElementById('modal-cita-overlay').classList.remove('show');
}

function seleccionarTecnico(el, tecnico) {
    document.querySelectorAll('.cita-tecnico-item').forEach(i => i.classList.remove('sel'));
    el.classList.add('sel');
    citaTecnicoSel = tecnico;

    const fechaInput    = document.getElementById('cita-fecha');
    fechaInput.disabled = false;
    fechaInput.focus();
    validarFormCita();
}

function validarFormCita() {
    const fecha = document.getElementById('cita-fecha').value;
    document.getElementById('btn-aceptar-cita').disabled = !(citaTecnicoSel && fecha);
}

function aceptarCita() {
    const fecha = document.getElementById('cita-fecha').value;
    if (!citaTecnicoSel || !fecha) return;

    const [anio, mes, dia] = fecha.split('-');
    const fechaFormateada  = `${dia}/${mes}/${anio}`;

    // Mensaje de éxito dentro del modal
    const msg = document.getElementById('cita-success-msg');
    msg.innerHTML = `
        ✔ Cita asignada correctamente.<br>
        <small>
            <strong>${citaTecnicoSel.nombre}</strong> realizará la inspección
            el <strong>${fechaFormateada}</strong>.
        </small>
    `;
    msg.classList.add('show');
    document.getElementById('btn-aceptar-cita').disabled = true;

    // Actualizar visualmente la primera card pendiente
    _actualizarCardCita(citaTecnicoSel, fechaFormateada);

    // Cerrar y mostrar toast tras 2.5 s
    setTimeout(() => {
        cerrarModalCita();
        mostrarToast(`✔ Cita asignada a ${citaTecnicoSel.nombre} para el ${fechaFormateada}.`);
    }, 2500);
}

function _actualizarCardCita(tecnico, fecha) {
    const card = document.querySelector('#cards-solicitudes .card[data-estado="pendiente"]');
    if (!card) return;

    card.dataset.estado = 'aceptada';

    const badge = card.querySelector('.badge');
    if (badge) { badge.textContent = 'ACEPTADA'; badge.className = 'badge badge-aprobado'; }

    const coords = card.querySelector('.card-coords');
    if (coords) {
        const linea = document.createElement('div');
        linea.style.cssText = 'margin-top:6px;font-size:12px;color:#3d6b55;font-weight:500;';
        linea.textContent   = `👨‍🔬 ${tecnico.nombre} — ${fecha}`;
        coords.appendChild(linea);
    }
}

// ═══════════════════════════════════════════════════════════════
//  MODAL — AGREGAR OBSERVACIÓN
// ═══════════════════════════════════════════════════════════════

function abrirModalObs() {
    lugarObsSel = null;

    const grid = document.getElementById('lugares-obs-grid');
    grid.innerHTML = '';
    lugaresCompletados.forEach(lugar => {
        const div = document.createElement('div');
        div.className  = 'lugar-obs-card';
        div.dataset.id = lugar.id;
        div.innerHTML  = `
            <div class="lugar-obs-chk"></div>
            <div class="lugar-obs-nombre">${lugar.nombre}</div>
            <div class="lugar-obs-meta">${lugar.id} · ${lugar.municipio}</div>
        `;
        div.addEventListener('click', () => seleccionarLugarObs(div, lugar));
        grid.appendChild(div);
    });

    const ta       = document.getElementById('obs-textarea');
    ta.value       = '';
    ta.disabled    = true;
    ta.placeholder = 'Selecciona primero un lugar de producción...';
    document.getElementById('btn-guardar-obs').disabled = true;
    document.getElementById('obs-counter').textContent  = '';

    document.getElementById('modal-obs-overlay').classList.add('show');
}

function cerrarModalObs() {
    document.getElementById('modal-obs-overlay').classList.remove('show');
}

function seleccionarLugarObs(el, lugar) {
    document.querySelectorAll('.lugar-obs-card').forEach(c => c.classList.remove('sel'));
    el.classList.add('sel');
    lugarObsSel = lugar;

    const ta       = document.getElementById('obs-textarea');
    ta.disabled    = false;
    ta.placeholder = 'Escribe tu observación aquí...';
    ta.focus();
    validarFormObs();
}

function validarFormObs() {
    const txt = document.getElementById('obs-textarea').value.trim();
    document.getElementById('obs-counter').textContent  = txt.length > 0 ? `${txt.length} caracteres` : '';
    document.getElementById('btn-guardar-obs').disabled = !(lugarObsSel && txt.length > 0);
}

function guardarObservacion() {
    const txt = document.getElementById('obs-textarea').value.trim();
    if (!lugarObsSel || !txt) return;

    const hoy   = new Date();
    const fecha = [
        String(hoy.getDate()).padStart(2, '0'),
        String(hoy.getMonth() + 1).padStart(2, '0'),
        hoy.getFullYear()
    ].join('/');

    const tbody = document.getElementById('cuerpoTablaObs');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.style.animation = 'obsRowIn .35s ease';
    tr.innerHTML = `
        <td>${fecha}</td>
        <td>${txt}</td>
        <td><span class="badge badge-calido">${lugarObsSel.id}</span></td>
        <td>
            <button class="action-btn action-edit" title="Editar">✏️</button>
            <button class="action-btn action-del"  title="Eliminar">🗑</button>
            <button class="action-btn action-eye"  title="Ver">👁</button>
        </td>
    `;
    tbody.appendChild(tr);

    cerrarModalObs();
    mostrarToast(`✔ Observación guardada para ${lugarObsSel.nombre}.`);
}

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════

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
    document.getElementById('modal-obs-overlay')?.addEventListener('click', function (e) {
        if (e.target === this) cerrarModalObs();
    });

    document.getElementById('modal-cita-overlay')?.addEventListener('click', function (e) {
        if (e.target === this) cerrarModalCita();
    });

    document.getElementById('toggleSidebar')?.addEventListener('click', function () {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('hidden');
        this.textContent = sidebar.classList.contains('hidden') ? '→ Mostrar menú' : '← Ocultar menú';
    });
});