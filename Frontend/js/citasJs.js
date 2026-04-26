const API_URL_CITA = "http://localhost:8003/cita";
const API_URL_LUGAR = "http://localhost:8003/lugarPro";



// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarCitas();
    initFiltros();
});


// ═══════════════════════════════════════════════════════════════════════════════
// 1. LISTAR TODAS LAS CITAS (GET)
// ═══════════════════════════════════════════════════════════════════════════════

async function cargarCitas() {
    try {
        const response = await fetch(API_URL_CITA);
        const result = await response.json();

        if (result.status === "Success") {
            renderizarTarjetas(result.data);
        }
    } catch (error) {
        console.error("Error al cargar citas:", error);
        showToast("❌ No se pudieron cargar las citas.");
    }
}

function renderizarTarjetas(citas) {
    const grid = document.getElementById('cards-grid');
    if (!grid) return;
    grid.innerHTML = ''; 

    citas.forEach(cita => {
        const estadoClase = cita.Estado.toLowerCase();
        const badgeClase = estadoClase === 'pendiente' ? 'badge-revision' : 'badge-aprobado';
        
        const fecha = cita.Fecha_inspeccion ? new Date(cita.Fecha_inspeccion).toLocaleDateString() : 'Por definir';
        const tecnicoNombre = cita.datos_tecnico?.Nombre || 'Por asignar';


        grid.insertAdjacentHTML('beforeend', `
            <div class="card" data-estado="${estadoClase}">
                <div class="card__accent card__accent--${estadoClase}"></div>
                <div class="card__inner">
                    <div class="card-header">
                        <span class="card-codigo">${cita.Nombre_LugarProduccion}</span>
                        <span class="badge ${badgeClase}">${cita.Estado}</span>
                    </div>
                    <div class="card-coords">
                        <div class="coord-row">
                            <div class="coord-icon">📅</div>
                            <span class="coord-text">Fecha: ${fecha} - ${cita.Hora_inspeccion || ''}</span>
                        </div>
                        <div class="coord-row">
                            <div class="coord-icon">👤</div>
                            <span class="coord-text">Técnico: ${tecnicoNombre}</span>
                        </div>
                        <div class="coord-row">
                            <div class="coord-icon">📝</div>
                            <span class="coord-text">Obs: ${cita.Observaciones || 'Sin observaciones'}</span>
                        </div>
                    </div>
                </div>
            </div>`);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SOLICITAR CITA (POST)
// ═══════════════════════════════════════════════════════════════════════════════

async function solicitarCita() {
    const seleccionados = [...document.querySelectorAll('.lugar-option.selected')];
    if (!seleccionados.length) return;

    const observacion = document.getElementById('cita-observacion').value.trim();
    const btnSolicitar = document.getElementById('btn-solicitar');
    
    btnSolicitar.disabled = true;
    const idProductor = 1; 

    try {
        for (const el of seleccionados) {
            const nuevaCita = {
                Id_productor: idProductor,
                Id_lugar: el.dataset.id,
                Observaciones: observacion,
                Estado: "Pendiente",
                Fecha_inspeccion: null, 
                Hora_inspeccion: null
            };

            // CORRECCIÓN: Se añade /add a la URL como indicaste
            const response = await fetch(`${API_URL_CITA}/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaCita)
            });

            if (!response.ok) throw new Error("Error en el servidor");
        }

        document.getElementById('modal-success').classList.add('show');

        setTimeout(() => {
            cerrarModalCita();
            cargarCitas(); 
            showToast(`✅ Cita solicitada con éxito.`);
        }, 1500);

    } catch (error) {
        console.error("Error al solicitar cita:", error);
        showToast("❌ Error al enviar la solicitud.");
        btnSolicitar.disabled = false;
    }
}

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

async function renderLugares() {
    const container = document.getElementById('lugares-list');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;">Cargando lugares...</p>';

    try {
        const response = await fetch(API_URL_LUGAR);
        const result = await response.json();

        // Asumimos que tu API devuelve { status: "Success", data: [...] }
        // o directamente el array. Ajusta según sea necesario.
        const lugares = result.data || result; 

        container.innerHTML = ''; // Limpiar mensaje de carga

        if (lugares.length === 0) {
            container.innerHTML = '<p>No tienes lugares registrados.</p>';
            return;
        }

        lugares.forEach((lugar, idx) => {
            const div = document.createElement('div');
            div.className      = 'lugar-option';
            // IMPORTANTE: Asegúrate que los nombres coincidan con tu BD (ej: Id_lugar, Nombre_LugarProduccion)
            div.dataset.id     = lugar.Id_lugar; 
            div.dataset.nombre = lugar.Nombre_LugarProduccion; 
            div.innerHTML = `
                <div class="lugar-check">✓</div>
                <div class="lugar-info">
                    <div class="lugar-id">Lugar #${idx + 1}</div>
                    <div class="lugar-nombre">${lugar.Nombre_LugarProduccion}</div>
                </div>`;
            div.addEventListener('click', () => toggleLugar(div));
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Error al cargar lugares:", error);
        container.innerHTML = '<p style="color:red;">Error al cargar los lugares.</p>';
    }
}

function initFiltros() {
    const botones = document.querySelectorAll('.filtro');
    
    botones.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Cambiar la clase activa visualmente
            botones.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 2. Obtener el valor del filtro
            const filtro = btn.dataset.filtro;

            // 3. Ejecutar el filtrado de tarjetas
            filtrarTarjetas(filtro);
        });
    });
}

/**
 * Muestra u oculta las tarjetas en el DOM
 * @param {string} estado - El estado a mostrar (todos, pendiente, aceptado, rechazado)
 */
function filtrarTarjetas(estado) {
    const tarjetas = document.querySelectorAll('#cards-grid .card');

    tarjetas.forEach(tarjeta => {
        // Obtenemos el estado de la tarjeta (que asignamos en renderizarTarjetas)
        const estadoTarjeta = tarjeta.dataset.estado;

        if (estado === 'todos' || estadoTarjeta === estado) {
            tarjeta.style.display = ''; // Mostrar (usa el display original: block, flex, etc)
            tarjeta.style.animation = 'fadeIn 0.3s ease'; // Opcional: efecto visual
        } else {
            tarjeta.style.display = 'none'; // Ocultar
        }
    });
}


function showToast(mensaje) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = mensaje;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    } else {
        alert(mensaje); // Fallback por si no existe el elemento toast
    }
}