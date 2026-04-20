// Configuración de la URL de la API
const API_URL = "http://localhost:8003/lugarPro";
const API_URL_ADD = "http://localhost:8003/lugarPro/add";
const API_URL_LOTE = "http://localhost:8003/lote";
const API_URL_ADD_LOTE = "http://localhost:8003/lote/add"





document.addEventListener("DOMContentLoaded", () => {
    // Cargar los datos apenas abra la página
    cargarLugares();
});

/**
 * Función principal para obtener los datos de la API
 */
async function cargarLugares() {
    try {
        const response = await fetch(API_URL);
        const result = await response.json();

        if (result.status === "Success") {
            renderizarTabla(result.data);
        } else {
            showToast("Error al obtener datos: " + result.message, "error");
        }
    } catch (error) {
        console.error("Error en la petición:", error);
        showToast("No se pudo conectar con el servidor", "error");
    }
}

/**
 * Función para pintar las filas en el HTML
 */
function renderizarTabla(lugares) {
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = ""; // Limpiar tabla antes de llenar

    lugares.forEach((lugar, index) => {
        // Extraemos la ubicación del primer predio si existe
        // Si no hay predios, ponemos "N/A"
        const primerPredio = lugar.detalles_predios[0];
        const departamento = primerPredio ? primerPredio.Ubicacion.Departamento : "Sin asignar";
        const municipio = primerPredio ? primerPredio.Ubicacion.Municipio : "Sin asignar";
        const vereda = primerPredio ? primerPredio.Ubicacion.Vereda : "Sin asignar";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <strong>${lugar.Nombre_LugarProduccion}</strong><br>
                <small class="text-muted">${lugar.total_predios} predio(s) vinculado(s)</small>
            </td>
            <td>${departamento}</td>
            <td>${municipio}</td>
            <td>${vereda}</td>
            <td>
                <button class="action-btn action-edit" onclick="editarLugar(${lugar.Id_lugar})" title="Editar">✏️</button>
                <button class="action-btn action-del" onclick="eliminarLugar(${lugar.Id_lugar})" title="Eliminar">🗑</button>
                <button type="button" class="action-btn action-eye" data-bs-toggle="modal" data-bs-target="#modalDetalleLugar" onclick="verDetalle(${lugar.Id_lugar})">👁</button>
                <button class="action-btn action-lote" title="Agregar lotes"
    onclick="goToLotesView(${lugar.Id_lugar})">🌾</button>
            </td>
            `;
        tableBody.appendChild(row);
        
    });
}
        /*<td>
                <button class="action-btn action-edit" title="Editar"
                        onclick="goToEdit(1)">✏️</button>
                <button class="action-btn action-lote" title="Agregar lotes"
                        onclick="goToLotes(1, 'San Cristobal')">🌾</button>
        </td>*/

async function verDetalle(idLugar) {
    try {
        // 1. Obtener datos del lugar y sus predios
        const resLugar = await fetch(`${API_URL}/${idLugar}`);
        const dataLugar = await resLugar.json();
        
        // 2. Obtener todos los lotes
        // Nota: Si tu API permite filtrar por idLugar en la URL, úsalo. 
        // Si no, filtramos manualmente en el siguiente paso.
        const resLotes = await fetch(API_URL_LOTE);
        const dataLotes = await resLotes.json();

        if (dataLugar.status === "Success" && dataLotes.status === "Success") {
            // Filtramos los lotes para que solo queden los del lugar seleccionado
            const lotesFiltrados = dataLotes.data.filter(lote => lote.Id_lugar === idLugar);
            
            llenarModalDinamico(dataLugar.data, lotesFiltrados);
        }
    } catch (error) {
        console.error("Error al cargar detalles:", error);
        showToast("Error al conectar con el servidor", "error");
    }
}

function llenarModalDinamico(lugar, lotes) {
    // 1. Título y Ubicación (usando el primer predio como referencia)
    document.querySelector("#modalDetalleLugar .modal-title").innerHTML = `<span>📋</span> ${lugar.Nombre_LugarProduccion}`;
    const veredaNombre = lugar.predios.length > 0 ? "Vereda ID: " + lugar.predios[0].Id_vereda : "Ubicación no definida";
    document.querySelector("#modalDetalleLugar .px-4.text-muted").innerText = veredaNombre;

    // 2. Renderizar Predios
    const prediosCont = document.getElementById("lista-predios-dinamica");
    const statsPredios = document.getElementById("stats-predios-container");
    prediosCont.innerHTML = "";
    let areaTotalLugar = 0;

    lugar.predios.forEach(p => {
        areaTotalLugar += p.Area_total;
        prediosCont.innerHTML += `
            <div class="predio-card p-3 border rounded shadow-sm mb-2">
                <div class="text-success fw-bold mb-1">${p.Nombre_predio}</div>
                <div class="d-flex justify-content-between small">
                    <span class="text-muted">Propietario:</span> <strong>${p.Nombre_propietario}</strong>
                </div>
                <div class="d-flex justify-content-between small">
                    <span class="text-muted">Área:</span> <strong>${p.Area_total} ha</strong>
                </div>
            </div>`;
    });

    statsPredios.innerHTML = `
        <div class="col-md-6"><div class="stat-card"><label>TOTAL PREDIOS</label><div class="value">${lugar.predios.length}</div></div></div>
        <div class="col-md-6"><div class="stat-card"><label>ÁREA TOTAL</label><div class="value">${areaTotalLugar.toFixed(2)} ha</div></div></div>
    `;

    // 3. Renderizar Lotes (Acordeón)
    const lotesCont = document.getElementById("lista-lotes-dinamica");
    const statsLotes = document.getElementById("stats-lotes-container");
    lotesCont.innerHTML = "";
    let areaSiembraAcumulada = 0;

    if (lotes.length === 0) {
        lotesCont.innerHTML = `<div class="text-center py-4 text-muted">No hay lotes registrados para este lugar.</div>`;
    } else {
        lotes.forEach((lote, index) => {
            areaSiembraAcumulada += lote.Area_siembra || 0;
            const collapseId = `collapseLote${index}`;
            const fecha = lote.Fecha_siembra ? new Date(lote.Fecha_siembra).toLocaleDateString() : "No definida";

            lotesCont.innerHTML += `
                <div class="lote-container mb-2">
                    <div class="lote-header d-flex justify-content-between align-items-center" 
                         data-bs-toggle="collapse" 
                         data-bs-target="#${collapseId}" 
                         style="cursor: pointer;">
                        <span>🌽 Lote ${lote.Numero_Lote}</span>
                        <span class="arrow">▼</span>
                    </div>
                    <div id="${collapseId}" class="collapse">
                        <div class="lote-body p-3 bg-white border border-top-0 rounded-bottom">
                            <div class="d-flex justify-content-between border-bottom py-2">
                                <span>Área del lote</span> <strong>${lote.Area_total} ha</strong>
                            </div>
                            <div class="d-flex justify-content-between border-bottom py-2">
                                <span>Área de siembra</span> <strong>${lote.Area_siembra} ha</strong>
                            </div>
                            <div class="d-flex justify-content-between border-bottom py-2">
                                <span>Estado fenológico</span> <strong>${lote.Estado_fenologico}</strong>
                            </div>
                            <div class="d-flex justify-content-between py-2">
                                <span>Fecha de siembra</span> <strong>${fecha}</strong>
                            </div>
                        </div>
                    </div>
                </div>`;
        });
    }

    // Actualizar Cards de estadísticas de Lotes
    statsLotes.innerHTML = `
        <div class="col-md-4"><div class="stat-card"><label>TOTAL LOTES</label><div class="value">${lotes.length}</div></div></div>
        <div class="col-md-4"><div class="stat-card"><label>ÁREA TOTAL ACUM.</label><div class="value">${areaTotalLugar.toFixed(2)} ha</div></div></div>
        <div class="col-md-4"><div class="stat-card"><label>ÁREA SIEMBRA ACUM.</label><div class="value">${areaSiembraAcumulada.toFixed(2)} ha</div></div></div>
    `;
}

// --- VARIABLES GLOBALES Y ESTADO ---
let cultivosCache = []; // Para no llamar a la API múltiples veces
let lugarActual = null; // Para saber a qué lugar le estamos agregando lotes

// --- 1. CARGA INICIAL DE DATOS ---

/**
 * Obtiene el catálogo de cultivos desde la API al cargar la página
 */
async function cargarCatalogoCultivos() {
    try {
        const response = await fetch('http://localhost:8000/cultivo');
        const result = await response.json();
        if (result.status === "Success") {
            cultivosCache = result.data;
            console.log("Catálogo de cultivos cargado:", cultivosCache.length);
        }
    } catch (error) {
        console.error("Error al obtener cultivos:", error);
    }
}

// Ejecutar carga al iniciar
document.addEventListener('DOMContentLoaded', cargarCatalogoCultivos);

// --- 2. GESTIÓN DE VISTAS (NAVEGACIÓN) ---

function goToTable() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-table').classList.add('active');
}

async function goToLotesView(lugarOrId) {
    let lugar;

    // Si recibimos un ID (número), buscamos el objeto en la base de datos
    if (typeof lugarOrId === "number" || typeof lugarOrId === "string") {
        try {
            const response = await fetch(`${API_URL}/${lugarOrId}`);
            const result = await response.json();
            if (result.status === "Success") {
                lugar = result.data;
            } else {
                showToast("No se encontró la información del lugar", "error");
                return;
            }
        } catch (error) {
            console.error("Error al obtener lugar para lotes:", error);
            return;
        }
    } else {
        // Si ya es un objeto, lo usamos directamente
        lugar = lugarOrId;
    }

    lugarActual = lugar; // Guardamos para el POST posterior

    // 1. Título dinámico
    document.getElementById("lotes-lugar-nombre").innerText = lugar.Nombre_LugarProduccion;

    // 2. Cálculo de Área Total (Suma de sus predios)
    let areaTotal = 0;
    // Ajuste: tu JSON usa 'predios' o 'detalles_predios'
    const listaPredios = lugar.predios || lugar.detalles_predios || [];
    
    if (listaPredios.length > 0) {
        areaTotal = listaPredios.reduce((sum, p) => sum + parseFloat(p.Area_total || 0), 0);
    }
    
    const inputAreaTotal = document.getElementById("l-area-total");
    if (inputAreaTotal) {
        inputAreaTotal.value = areaTotal.toFixed(2);
        inputAreaTotal.readOnly = true;
    }

    // 3. Limpiar formulario previo
    document.getElementById("l-num-lotes").value = "";
    document.getElementById("lotes-container").innerHTML = "";
    document.getElementById("btn-guardar-lotes").disabled = true;

    // 4. Cambiar vista
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-lotes').classList.add('active');
}

// --- 3. LÓGICA DINÁMICA DE LOTES ---

/**
 * Genera las tarjetas de lotes según el número ingresado
 */
async function onNumLotesChange() {
    const numLotes = parseInt(document.getElementById("l-num-lotes").value);
    const container = document.getElementById("lotes-container");
    container.innerHTML = "";

    if (isNaN(numLotes) || numLotes <= 0) {
        document.getElementById("btn-guardar-lotes").disabled = true;
        return;
    }

    // Si por alguna razón falló la carga inicial, reintentamos
    if (cultivosCache.length === 0) await cargarCatalogoCultivos();

    for (let i = 1; i <= numLotes; i++) {
        const loteCard = document.createElement("div");
        // Usamos tus clases de main.css para mantener el estilo verde
        loteCard.className = "form-card mb-3 animate__animated animate__fadeIn"; 
        loteCard.style.borderLeft = "5px solid #28a745"; 

        loteCard.innerHTML = `
            <div class="section-title" style="font-size: 0.9rem;">🟢 Lote ${i}</div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Área total lote (ha) *</label>
                    <input type="number" class="form-input lote-area-total" step="0.1" 
                        placeholder="Ej. 2.0" oninput="onLotesDetailChange()">
                </div>
                <div class="form-group">
                    <label class="form-label">Área de siembra (ha) *</label>
                    <input type="number" class="form-input lote-area-siembra" step="0.1" 
                        placeholder="Ej. 1.5" oninput="onLotesDetailChange()">
                </div>
            </div>
            <div class="form-row mt-2">
                <div class="form-group">
                    <label class="form-label">Estado fenológico *</label>
                    <select class="form-input lote-estado" onchange="onLotesDetailChange()">
                        <option value="">Seleccionar...</option>
                        <option value="Siembra">Siembra</option>
                        <option value="Crecimiento">Crecimiento</option>
                        <option value="Floración">Floración</option>
                        <option value="Cosecha">Cosecha</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Cultivo *</label>
                    <select class="form-input lote-cultivo-id" required onchange="onLotesDetailChange()">
                        <option value="">Seleccionar cultivo...</option>
                        ${cultivosCache.map(c => `
                            <option value="${c.Id_cultivo}">${c.Nombre_especie} - ${c.Variedad}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Fecha de siembra *</label>
                    <input type="date" class="form-input lote-fecha" onchange="onLotesDetailChange()">
                </div>
            </div>
        `;
        container.appendChild(loteCard);
    }
    onLotesDetailChange();
}

/**
 * Valida que todos los campos de los lotes estén llenos para habilitar el botón
 */
function onLotesDetailChange() {
    const areasTotales = document.querySelectorAll('.lote-area-total');
    const areasSiembra = document.querySelectorAll('.lote-area-siembra');
    const cultivos = document.querySelectorAll('.lote-cultivo-id');
    const estados = document.querySelectorAll('.lote-estado');
    const fechas = document.querySelectorAll('.lote-fecha');
    
    let todoLleno = true;

    // Verificar si hay lotes generados
    if (areasTotales.length === 0) todoLleno = false;

    // Validar cada campo
    for (let i = 0; i < areasTotales.length; i++) {
        if (!areasTotales[i].value || !areasSiembra[i].value || 
            !cultivos[i].value || !estados[i].value || !fechas[i].value) {
            todoLleno = false;
            break;
        }
    }

    document.getElementById("btn-guardar-lotes").disabled = !todoLleno;
}

// --- 4. PERSISTENCIA (GUARDAR EN DB) ---

async function guardarLotes() {
    const btnGuardar = document.getElementById("btn-guardar-lotes");
    const container = document.getElementById("lotes-container");
    const lotesCards = container.querySelectorAll('.form-card');
    
    // Bloqueamos el botón para evitar múltiples clics
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = "⌛ Guardando...";

    try {
        // Recorremos cada tarjeta de lote para extraer la información
        for (const card of lotesCards) {
            const dataLote = {
                // El ID del lugar actual que guardamos al abrir la vista
                Id_LugarProduccion: lugarActual.Id_LugarProduccion,
                
                // Extraemos valores de los inputs dentro de esta tarjeta específica
                Area_total: parseFloat(card.querySelector('.lote-area-total').value),
                Area_siembra: parseFloat(card.querySelector('.lote-area-siembra').value),
                Id_cultivo: parseInt(card.querySelector('.lote-cultivo-id').value), // ID numérico
                Estado_fenologico: card.querySelector('.lote-estado').value,
                Fecha_siembra: card.querySelector('.lote-fecha').value
            };

            // Enviamos un POST por cada lote
            const response = await fetch(API_URL_ADD_LOTE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Si usas JWT, aquí deberías incluir el token:
                    // 'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(dataLote)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Error al guardar uno de los lotes");
            }
        }

        // Si todo sale bien
        mostrarToast("✅ Todos los lotes se guardaron correctamente", "success");
        
        // Refrescamos la tabla principal y volvemos
        if (typeof cargarLugares === "function") cargarLugares(); 
        setTimeout(goToTable, 1500);

    } catch (error) {
        console.error("Error en guardarLotes:", error);
        mostrarToast("❌ Error: " + error.message, "danger");
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = "✔ Guardar lotes";
    }
}

/**
 * Función auxiliar para mostrar mensajes al usuario (Toasts)
 */
function mostrarToast(mensaje, tipo) {
    const toastElem = document.getElementById("toast");
    if (toastElem) {
        toastElem.innerText = mensaje;
        toastElem.className = `toast show bg-${tipo} text-white`;
        setTimeout(() => { toastElem.classList.remove("show"); }, 3000);
    } else {
        alert(mensaje);
    }
}

/**
 * Navegación entre vistas (Tabla <-> Formulario)
 */
function goToForm() {
    document.getElementById("view-table").classList.remove("active");
    document.getElementById("view-form").classList.add("active");
}

function goToTable() {
    document.getElementById("view-form").classList.remove("active");
    document.getElementById("view-table").classList.add("active");
}

/**
 * Funciones de acciones (Stubs)
 */
function editarLugar(id) {
    console.log("Editando lugar:", id);
    // Aquí podrías cargar los datos en el formulario para editar
    goToForm();
}

async function eliminarLugar(id) {
    // 1. Confirmación visual para evitar errores accidentales
    if (!confirm("¿Estás seguro de eliminar este lugar de producción? Esta acción liberará los predios asociados.")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, { 
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok && result.status === "Success") {
            // Caso exitoso
            showToast("Lugar eliminado correctamente", "success");
            cargarLugares(); 
        } else {
            // Caso de error controlado (ej: el 400 del backend porque tiene lotes)
            // Usamos el mensaje exacto que configuramos en el backend: 
            // "No se puede eliminar... tiene X lote(s) asociado(s)"
            showToast(result.message || "No se pudo eliminar el lugar", "error");
        }

    } catch (error) {
        // Caso de error de red o servidor caído
        console.error("Error en la petición DELETE:", error);
        showToast("Error de conexión con el servidor", "error");
    }
}

/**
 * Utilidad para mostrar mensajes (Toast)
 */
function showToast(message, type) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.className = `toast show ${type === 'error' ? 'bg-danger' : 'bg-success'}`;
    
    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}

// Funciones para manejar lógica del formulario (puedes completarlas según necesites)
function onPrediosChange() {
    const num = document.getElementById("f-num-predios").value;
    const container = document.getElementById("predios-container");
    container.innerHTML = "";
    // Lógica para generar campos de predios dinámicamente...
}