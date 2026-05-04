// Configuración de la URL de la API
const API_URL = "http://localhost:8003/lugarPro";
const API_URL_ADD = "http://localhost:8003/lugarPro/add";
const API_URL_LOTE = "http://localhost:8003/lote";
const API_URL_ADD_LOTE = "http://localhost:8003/lote/add";

document.addEventListener("DOMContentLoaded", () => {
  // Cargar los datos apenas abra la página
  cargarLugares();
  cargarCatalogoCultivos()
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
    const departamento = primerPredio
      ? primerPredio.Ubicacion.Departamento
      : "Sin asignar";
    const municipio = primerPredio
      ? primerPredio.Ubicacion.Municipio
      : "Sin asignar";
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
                <button class="action-btn action-lote" title="Agregar lotes" onclick="goToLotesView(${lugar.Id_lugar})">🌾</button>
            </td>
            `;
    tableBody.appendChild(row);
  });
}

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
      const lotesFiltrados = dataLotes.data.filter(
        (lote) => lote.Id_lugar === idLugar,
      );

      llenarModalDinamico(dataLugar.data, lotesFiltrados);
    }
  } catch (error) {
    console.error("Error al cargar detalles:", error);
    showToast("Error al conectar con el servidor", "error");
  }
}

function llenarModalDinamico(lugar, lotes) {
  // 1. Título y Ubicación (usando el primer predio como referencia)
  document.querySelector("#modalDetalleLugar .modal-title").innerHTML =
    `<span>📋</span> ${lugar.Nombre_LugarProduccion}`;
  const veredaNombre =
    lugar.predios.length > 0
      ? "Vereda ID: " + lugar.predios[0].Id_vereda
      : "Ubicación no definida";
  document.querySelector("#modalDetalleLugar .px-4.text-muted").innerText =
    veredaNombre;

  // 2. Renderizar Predios
  const prediosCont = document.getElementById("lista-predios-dinamica");
  const statsPredios = document.getElementById("stats-predios-container");
  prediosCont.innerHTML = "";
  let areaTotalLugar = 0;

  lugar.predios.forEach((p) => {
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
      const fecha = lote.Fecha_siembra
        ? new Date(lote.Fecha_siembra).toLocaleDateString()
        : "No definida";

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
                                <span>Total de platas</span> <strong>${lote.Total_plantas}</strong>
                            </div>
                            <div class="d-flex justify-content-between border-bottom py-2">
                                <span>Cultivo</span> <strong>${lote.datos_cultivo.Nombre_especie}</strong>
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
    const response = await fetch("http://localhost:8000/cultivo");
    const result = await response.json();
    if (result.status === "Success") {
      cultivosCache = result.data;
      console.log("Catálogo de cultivos cargado:", cultivosCache.length);
    }
  } catch (error) {
    console.error("Error al obtener cultivos:", error);
  }
}



// --- 2. GESTIÓN DE VISTAS (NAVEGACIÓN) ---

async function goToLotesView(lugarOrId) {
  let lugar;
  
  // 1. Obtener el lugar
  if (typeof lugarOrId === "number" || typeof lugarOrId === "string") {
    try {
      const response = await fetch(`${API_URL}/${lugarOrId}`);
      const result = await response.json();
      lugar = result.data;
    } catch (error) {
      return console.error(error);
    }
  } else {
    lugar = lugarOrId;
  }

  lugarActual = lugar;

  // --- LIMPIEZA INICIAL ---
  // Limpiamos antes de empezar a poner la información nueva
  const container = document.getElementById("lotes-container");
  document.getElementById("l-num-lotes").value = "";
  container.innerHTML = ""; 

  // 2. OBTENER LOTES EXISTENTES PARA CALCULAR ÁREA OCUPADA
  let areaOcupada = 0;
  try {
    const resLotes = await fetch(API_URL_LOTE);
    const dataLotes = await resLotes.json();

    if (dataLotes.status === "Success") {
      const idBuscar = lugar.Id_lugar || lugar.Id_LugarProduccion;
      const lotesPrevios = dataLotes.data.filter((l) => l.Id_lugar === idBuscar);
      areaOcupada = lotesPrevios.reduce((sum, l) => sum + parseFloat(l.Area_total || 0), 0);
    }
  } catch (error) {
    console.error("Error calculando área ocupada:", error);
  }

  lugarActual.areaOcupadaPrevios = areaOcupada;

  // 3. MOSTRAR INFORMACIÓN EN LA UI
  document.getElementById("lotes-lugar-nombre").innerText = lugar.Nombre_LugarProduccion;

  const areaTotalLugar = (lugar.predios || lugar.detalles_predios || []).reduce(
    (sum, p) => sum + parseFloat(p.Area_total || 0),
    0
  );

  const disponible = areaTotalLugar - areaOcupada;

  // --- CAMBIO: Hacer el input de solo lectura ---
  const inputAreaTotal = document.getElementById("l-area-total");
  inputAreaTotal.value = areaTotalLugar.toFixed(2);
  inputAreaTotal.readOnly = true; // Bloquea la edición manual
  inputAreaTotal.style.backgroundColor = "#e9ecef"; // Color gris de "deshabilitado" visual

  // --- RENDERIZAR ALERTA INFORMATIVA ---
  // Ahora no se borrará porque la limpieza se hizo arriba
  container.innerHTML = `
        <div class="alert alert-info w-100 mb-3 animate__animated animate__fadeIn">
            ℹ️ Área total: <strong>${areaTotalLugar.toFixed(2)} ha</strong> | 
            Ocupada: <strong>${areaOcupada.toFixed(2)} ha</strong> | 
            Disponible: <strong id="area-disponible-valor">${disponible.toFixed(2)} ha</strong>
        </div>`;

  // 4. CAMBIAR VISTA
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.remove("active");
    v.style.display = "none";
  });

  const vistaLotes = document.getElementById("view-lotes");
  if (vistaLotes) {
    vistaLotes.classList.add("active");
    vistaLotes.style.display = "block";
  }
}

// --- 3. LÓGICA DINÁMICA DE LOTES ---

/**
 * Genera las tarjetas de lotes según el número ingresado
 */
async function onNumLotesChange() {
  const numLotes = parseInt(document.getElementById("l-num-lotes").value);
  const container = document.getElementById("lotes-container");

  // Aseguramos que el contenedor de tarjetas sea visible
  container.style.display = "block";
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
    <div class="section-title" style="font-size: 0.9rem; display: flex; justify-content: space-between;">
        <span>🟢 Lote ${i}</span>
        <span style="color: #666; font-weight: normal;">Estado: <b>Siembra</b></span>
    </div>
    
    <input type="hidden" class="lote-estado" value="Siembra">

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
            <label class="form-label">Numero de platas *</label>
            <input type="number" class="form-input lote-total-plantas" placeholder="Ej. 1" onchange="onLotesDetailChange()">
        </div>
        <div class="form-group">
            <label class="form-label">Cultivo *</label>
            <select class="form-input lote-cultivo-id" required onchange="onLotesDetailChange()">
                <option value="">Seleccionar cultivo...</option>
                ${cultivosCache.map(c => `
                    <option value="${c.Id_cultivo}">${c.Nombre_especie} - ${c.Variedad}</option>
                `).join("")}
            </select>
        </div>
    </div>
    <div class="form-row mt-2">
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
  const areasNuevas = document.querySelectorAll(".lote-area-total");
  const areasSiembra = document.querySelectorAll(".lote-area-siembra");
  const totalPlantas = document.querySelectorAll("lote-total-plantas");
  const cultivos = document.querySelectorAll(".lote-cultivo-id");
  const estados = document.querySelectorAll(".lote-estado");
  const fechas = document.querySelectorAll(".lote-fecha");

  // 1. Cálculos de límites
  const areaTotalLugar =
    parseFloat(document.getElementById("l-area-total").value) || 0;
  const areaYaOcupada = lugarActual.areaOcupadaPrevios || 0;
  const areaDisponible = areaTotalLugar - areaYaOcupada;

  let sumaNuevosLotes = 0;
  let todoLleno = true;
  let errorSiembra = false;

  // 2. Validar cada lote generado
  areasNuevas.forEach((input, i) => {
    const valAreaLote = parseFloat(input.value) || 0;
    const valAreaSiembra = parseFloat(areasSiembra[i].value) || 0;

    sumaNuevosLotes += valAreaLote;

    // Verificar si algún campo está vacío
    if (
      !input.value ||
      !areasSiembra[i].value ||
      !cultivos[i].value ||
      !estados[i].value ||
      !fechas[i].value
    ) {
      todoLleno = false;
    }

    // Validación lógica interna: siembra no puede ser > total del lote
    if (valAreaSiembra > valAreaLote) {
      errorSiembra = true;
    }
  });

  const btnGuardar = document.getElementById("btn-guardar-lotes");

  // 3. Lógica de habilitación del botón
  if (sumaNuevosLotes > areaDisponible) {
    btnGuardar.disabled = true;
    showToast(
      `❌ La suma (${sumaNuevosLotes.toFixed(2)} ha) excede lo disponible (${areaDisponible.toFixed(2)} ha)`,
      "error",
    );
  } else if (errorSiembra) {
    btnGuardar.disabled = true;
    showToast(
      `⚠️ El área de siembra no puede ser mayor al área del lote`,
      "error",
    );
  } else {
    // Solo se habilita si todo está lleno, no hay errores de área y hay al menos un lote
    btnGuardar.disabled = !todoLleno || areasNuevas.length === 0;
  }
}

// --- 4. PERSISTENCIA (GUARDAR EN DB) ---

async function guardarLotes() {
  const btnGuardar = document.getElementById("btn-guardar-lotes");
  const container = document.getElementById("lotes-container");
  const lotesCards = container.querySelectorAll(".form-card");

  const areaTotalLugar =
    parseFloat(document.getElementById("l-area-total").value) || 0;
  const areaYaOcupada = lugarActual.areaOcupadaPrevios || 0;
  const areaDisponible = areaTotalLugar - areaYaOcupada;

  let sumaNuevosLotes = 0;
  lotesCards.forEach((card) => {
    sumaNuevosLotes += parseFloat(
      card.querySelector(".lote-area-total").value || 0,
    );
  });

  if (sumaNuevosLotes > areaDisponible) {
    mostrarToast(
      `❌ Error: La suma de nuevos lotes excede el área disponible (${areaDisponible.toFixed(2)} ha)`,
      "danger",
    );
    return;
  }

  btnGuardar.disabled = true;
  btnGuardar.innerHTML = "⌛ Guardando...";

  try {
    for (const card of lotesCards) {
      const dataLote = {
        Id_lugar: lugarActual.Id_lugar || lugarActual.Id_LugarProduccion,
        Area_total: parseFloat(card.querySelector(".lote-area-total").value),
        Area_siembra: parseFloat(
          card.querySelector(".lote-area-siembra").value,
        ),
        Id_cultivo: parseInt(card.querySelector(".lote-cultivo-id").value),
        Total_plantas: card.querySelector(".lote-total-plantas").value,
        Estado_fenologico: card.querySelector(".lote-estado").value,
        Fecha_siembra: card.querySelector(".lote-fecha").value,
      };

      if (dataLote.Area_siembra > dataLote.Area_total) {
        throw new Error(
          `En un lote, el área de siembra (${dataLote.Area_siembra}) es mayor al área total.`,
        );
      }

      const response = await fetch(API_URL_ADD_LOTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataLote),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Error al guardar");
    }

    mostrarToast("✅ Todos los lotes se guardaron correctamente", "success");

    // --- AQUÍ ESTÁ LA SOLUCIÓN ---
    cargarLugares(); // Recarga los datos en la tabla
    setTimeout(goToTable, 1000); // Oculta el formulario y vuelve a la tabla
  } catch (error) {
    console.error("Error en guardarLotes:", error);
    mostrarToast("❌ " + error.message, "danger");
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
    setTimeout(() => {
      toastElem.classList.remove("show");
    }, 3000);
  } else {
    alert(mensaje);
  }
}

/**
 * Navegación entre vistas (Tabla <-> Formulario)
 */
function goToForm() {
  // 1. Ocultar todas las vistas (tabla, lotes, edición)
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.remove("active");
    v.style.display = "none";
  });

  // 2. Activar la vista del formulario
  const viewForm = document.getElementById("view-form");
  if (viewForm) {
    viewForm.classList.add("active");
    viewForm.style.display = "block";
  }

  // 3. Limpiar los campos del formulario para que empiece vacío
  const nombreInput = document.getElementById("f-nombre");
  const numPrediosInput = document.getElementById("f-num-predios");
  const prediosContainer = document.getElementById("predios-container");

  if (nombreInput) nombreInput.value = "";
  if (numPrediosInput) numPrediosInput.value = "";
  if (prediosContainer) prediosContainer.innerHTML = "";

  // Resetear el botón Aceptar
  const btnAceptar = document.getElementById("btn-aceptar");
  if (btnAceptar) {
    btnAceptar.disabled = true;
    btnAceptar.innerHTML = "✔ Aceptar";
  }
}

function goToTable() {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active");
    view.style.display = "none";
  });

  const viewTable = document.getElementById("view-table");
  if (viewTable) {
    viewTable.classList.add("active");
    viewTable.style.display = "block";
  }

  const container = document.getElementById("lotes-container");
  if (container) container.innerHTML = "";

  const inputNumLotes = document.getElementById("l-num-lotes");
  if (inputNumLotes) inputNumLotes.value = "";

  // Resetear el botón de guardado para la próxima entrada
  const btnGuardar = document.getElementById("btn-guardar-lotes");
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = "✔ Guardar lotes";
  }
  
  lugarActual = null;
}

/**
 * Funciones de acciones (Stubs)
 */
async function editarLugar(lugarId) {
    try {
        const response = await fetch(`${API_URL}/${lugarId}`);
        const result = await response.json();
        
        if (result.status !== "Success") throw new Error("No se pudo cargar el lugar");

        // --- LÍNEA CRÍTICA: Guardar en la variable global ---
        lugarActual = result.data; 
        console.log("Datos guardados en lugarActual:", lugarActual);

        const inputId = document.getElementById('edit-lugar-id');
        const txtTitulo = document.getElementById('edit-lugar-nombre-titulo');
        
        if (inputId) inputId.value = lugarId;
        if (txtTitulo) txtTitulo.textContent = lugarActual.Nombre_LugarProduccion || "Lugar sin nombre";

        renderPrediosEdit(lugarActual);
        await renderLotesEdit(lugarActual); 

        resetViews();
        const viewEdit = document.getElementById('view-edit');
        if (viewEdit) {
            viewEdit.style.display = 'block';
            viewEdit.classList.add('active');
        }

    } catch (error) {
        console.error("Error detallado en editarLugar:", error);
        showToast('⚠ Error al obtener datos del servidor.', 'error');
    }
}

function resetViews() {
    // Oculta la tabla principal y cualquier otra vista activa
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.style.display = 'none';
        view.classList.remove('active');
    });
}

function renderPrediosEdit(lugar) {
    const container = document.getElementById('edit-predios-container');
    if (!container) return;

    // Tu API puede devolver 'predios' o 'detalles_predios'
    const predios = lugar.predios || lugar.detalles_predios || [];

    const filasHTML = predios.length === 0
        ? '<p class="edit-empty-msg">Sin predios registrados.</p>'
        : `<div class="predios-edit-list">
            ${predios.map((p, idx) => `
                <div class="predio-edit-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; background: #f9f9f9; border-radius: 8px;">
                    <span><strong>Predio ${idx + 1}:</strong> ${p.Nombre_predio}</span>
                    <button class="btn-del-predio" cursor:pointer;" 
                            onclick="eliminarPredioDeLugar(${lugar.Id_lugar}, ${p.Id_predio})" title="Desvincular">🗑</button>
                </div>
            `).join('')}
           </div>`;

    container.innerHTML = filasHTML + `
        <div class="predio-add-row mt-3" style="display: flex; gap: 10px;">
            <input id="edit-nuevo-predio-id" class="form-input" type="number" placeholder="ID del nuevo predio" style="flex:1;">
            <button class="btn-primary" onclick="agregarPredioALugar(${lugar.Id_lugar})">+ Vincular</button>
        </div>`;
}

async function agregarPredioALugar(idLugar) {
    const input = document.getElementById('edit-nuevo-predio-id');
    const nuevoId = parseInt(input.value);

    // Validación del input
    if (isNaN(nuevoId)) {
        showToast("⚠ Ingresa un ID de predio válido", "error");
        return;
    }

    try {
        // 1. Validar que lugarActual tenga los datos necesarios
        if (!lugarActual || !lugarActual.predios) {
            console.error("lugarActual no está definido o no tiene predios");
            return;
        }

        // 2. Extraer los IDs actuales. 
        // Usamos Id_predio (que es como viene de la base de datos)
        const nuevosPrediosIds = lugarActual.predios.map(p => p.Id_predio);
        
        // 3. Evitar duplicados
        if (nuevosPrediosIds.includes(nuevoId)) {
            showToast("⚠ Este predio ya está vinculado", "error");
            return;
        }

        // 4. Agregar el nuevo ID al array
        nuevosPrediosIds.push(nuevoId);

        // 5. Construir el payload exacto para tu endpoint PUT http://localhost:8003/lugarPro/4
        const payload = {
            "Nombre_LugarProduccion": lugarActual.Nombre_LugarProduccion,
            "Id_productor": lugarActual.Id_productor,
            "prediosIds": nuevosPrediosIds
        };

        console.log("Enviando actualización de predios:", payload);

        const response = await fetch(`${API_URL}/${idLugar}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.status === "Success") {
            showToast("✅ Predio vinculado correctamente", "success");
            input.value = "";
            
            // Recargamos los datos para ver el nuevo predio en la lista
            await editarLugar(idLugar);
        } else {
            // Si el backend responde con error (ej. el predio no existe)
            showToast("❌ " + (result.message || "Error al vincular"), "error");
        }
        
    } catch (error) {
        console.error("Error en agregarPredioALugar:", error);
        showToast("❌ Error de conexión al vincular", "error");
    }
}

async function eliminarPredioDeLugar(idLugar, idPredioAEliminar) {
    // 1. REGLA: Mínimo un predio
    if (lugarActual.predios.length <= 1) {
        showToast("⚠ No se puede eliminar: el lugar de producción debe tener al menos un predio.", "error");
        return;
    }

    try {
        // 2. CALCULAR ÁREAS
        // Obtenemos el área total de los predios que QUEDARÍAN
        const prediosRestantes = lugarActual.predios.filter(p => p.Id_predio !== idPredioAEliminar);
        const areaTotalPrediosRestantes = prediosRestantes.reduce((sum, p) => sum + parseFloat(p.Area_total || 0), 0);

        // Obtenemos la suma del área de todos los lotes actuales
        // (Asumiendo que los lotes ya están cargados en la interfaz o en el objeto lugarActual)
        // Si no los tienes en lugarActual, puedes sumarlos de los inputs de la vista de edición
        const inputsAreaLotes = document.querySelectorAll('.edit-lote-area-total');
        let areaTotalLotes = 0;
        inputsAreaLotes.forEach(input => areaTotalLotes += parseFloat(input.value || 0));

        // 3. REGLA: El área de predios restantes debe cubrir los lotes
        if (areaTotalPrediosRestantes < areaTotalLotes) {
            showToast(`❌ No se puede eliminar: El área restante (${areaTotalPrediosRestantes} ha) es menor al área ocupada por los lotes (${areaTotalLotes} ha).`, "error");
            return;
        }

        // 4. CONFIRMACIÓN Y ENVÍO
        if (!confirm(`¿Estás seguro de desvincular el predio ${idPredioAEliminar}?`)) return;

        const prediosIdsRestantes = prediosRestantes.map(p => p.Id_predio);

        const payload = {
            "Nombre_LugarProduccion": lugarActual.Nombre_LugarProduccion,
            "Id_productor": lugarActual.Id_productor,
            "prediosIds": prediosIdsRestantes
        };

        const response = await fetch(`${API_URL}/${idLugar}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.status === "Success") {
            showToast("✅ Predio desvinculado y áreas actualizadas", "success");
            await editarLugar(idLugar); // Recargar para refrescar lugarActual
        } else {
            showToast("❌ " + (result.message || "Error al procesar la solicitud"), "error");
        }

    } catch (error) {
        console.error(error);
        showToast("❌ Error al validar la eliminación", "error");
    }
}

async function renderLotesEdit(lugar) {
    const container = document.getElementById('edit-lotes-container');
    if (!container) return;

    const idBusqueda = lugar.Id_lugar || lugar.Id_LugarProduccion;
    
    let lotes = [];
    try {
        const res = await fetch(API_URL_LOTE);
        const json = await res.json();
        // Filtramos por el ID del lugar de producción
        lotes = json.data.filter(l => l.Id_lugar === idBusqueda);
    } catch (e) { console.error("Error cargando lotes:", e); }

    if (lotes.length === 0) {
        container.innerHTML = '<p class="edit-empty-msg">Sin lotes asociados.</p>';
        return;
    }

    const estados = ["Siembra", "Germinación", "Crecimiento", "Floración", "Maduración", "Cosecha", "Finalizado"];

    container.innerHTML = lotes.map((lote, idx) => {
        // Usamos Numero_Lote según tu consola
        const idReal = lote.Numero_Lote; 
        const fSiembra = lote.Fecha_siembra ? lote.Fecha_siembra.substring(0, 10) : '';
        const fEliminacion = lote.Fecha_eliminacion ? lote.Fecha_eliminacion.substring(0, 10) : '';
        // Nombre de la especie viene dentro de datos_cultivo
        const nombreCultivo = lote.datos_cultivo ? lote.datos_cultivo.Nombre_especie : 'Cultivo';

        return `
        <div class="lote-edit-card mb-2" id="lote-edit-card-${idx}" style="border: 1px solid #ddd; border-radius: 8px; margin-bottom:10px;">
            <div class="lote-edit-header" onclick="toggleLoteEdit(${idx})" style="padding: 10px; background: #eee; cursor: pointer; display: flex; justify-content: space-between;">
                <span>🌾 Lote #${idReal} - ${nombreCultivo}</span>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button class="btn-del-predio" title="Eliminar lote ${idReal}"
                            onclick="event.stopPropagation(); eliminarLoteEdit(${idBusqueda}, ${idReal})">
                        🗑
                    </button>
                    <span class="lote-edit-chevron">▼</span>
                </div>
            </div>
            <div class="lote-edit-body p-3" style="display:none; padding: 15px;">
                <input type="hidden" class="edit-lote-id" value="${idReal}">
                <input type="hidden" class="edit-lote-fecha-siembra" value="${lote.Fecha_siembra}">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="font-size: 12px; color: #666;">Fecha Siembra (No editable)</label>
                        <div style="padding: 8px; background: #f0f0f0; border-radius: 4px; font-size: 14px;">${fSiembra}</div>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #666;">Fecha Eliminación (Opcional)</label>
                        <input class="form-input edit-lote-fecha-eliminacion" type="date" value="${fEliminacion}" style="width:100%;">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #666;">Área Total (ha)</label>
                        <input class="form-input edit-lote-area-total" type="number" step="0.1" value="${lote.Area_total}" style="width:100%;">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #666;">Área Siembra (ha)</label>
                        <input class="form-input edit-lote-area-siembra" type="number" step="0.1" value="${lote.Area_siembra}" style="width:100%;">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #666;">Numero de platas</label>
                        <input class="form-input edit-lote-total-plantas" type="number" step="0.1" value="${lote.Total_plantas}" style="width:100%;">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #666;">Cultivo</label>
                        <select class="form-input edit-lote-cultivo" style="width:100%;">
                            ${cultivosCache.map(c => `<option value="${c.Id_cultivo}" ${c.Id_cultivo === lote.Id_cultivo ? 'selected' : ''}>${c.Nombre_especie}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #666;">Estado</label>
                        <select class="form-input edit-lote-estado" style="width:100%;">
                            ${estados.map(e => `<option value="${e}" ${e === lote.Estado_fenologico ? 'selected' : ''}>${e}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

async function eliminarLoteEdit(idLugar, numeroLote) {
    if (!confirm(`¿Estás seguro de eliminar el Lote #${numeroLote}? Esta acción no se puede deshacer.`)) return;

    try {
        const response = await fetch(`${API_URL_LOTE}/${numeroLote}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast("✅ Lote eliminado exitosamente", "success");
            // Refrescamos la vista de edición actual
            await editarLugar(idLugar); 
        } else {
            const res = await response.json();
            showToast("❌ Error: " + (res.message || "No se pudo eliminar"), "error");
        }
    } catch (error) {
        console.error(error);
        showToast("❌ Error de conexión al eliminar el lote", "error");
    }
}

function toggleLoteEdit(idx) {
    const card = document.getElementById(`lote-edit-card-${idx}`);
    if (!card) return;

    const body = card.querySelector('.lote-edit-body');
    const chevron = card.querySelector('.lote-edit-chevron');

    // Cambiamos la visibilidad del cuerpo
    if (body.style.display === 'none' || body.style.display === '') {
        body.style.display = 'block';
        chevron.textContent = '▲'; // Cambia la flecha hacia arriba
        card.style.borderColor = '#4CAF50'; // Opcional: Resaltar el abierto
    } else {
        body.style.display = 'none';
        chevron.textContent = '▼'; // Cambia la flecha hacia abajo
        card.style.borderColor = '#ddd';
    }
}

async function guardarEdicion() {
    const idLugarActual = parseInt(document.getElementById('edit-lugar-id').value);
    const cards = document.querySelectorAll('.lote-edit-card');
    const btn = document.querySelector('#view-edit .btn-primary');

    try {
        btn.disabled = true;
        btn.innerHTML = "⌛ Validando...";

        // --- 1. PREPARACIÓN Y VALIDACIÓN INICIAL ---
        let sumaAreaLotes = 0;
        const lotesAActualizar = [];

        for (const card of cards) {
            const areaTotalLote = parseFloat(card.querySelector('.edit-lote-area-total').value || 0);
            const areaSiembraLote = parseFloat(card.querySelector('.edit-lote-area-siembra').value || 0);
            const idLote = card.querySelector('.edit-lote-id').value;

            // REGLA: El área de siembra no puede ser mayor al área del lote
            if (areaSiembraLote > areaTotalLote) {
                showToast(`⚠ Lote #${idLote}: El área de siembra (${areaSiembraLote}ha) no puede superar el área total del lote (${areaTotalLote}ha)`, "error");
                btn.disabled = false;
                btn.innerHTML = "✔ Guardar cambios";
                return; // Detiene el proceso
            }

            sumaAreaLotes += areaTotalLote;

            // Guardamos los datos temporalmente para no leer el DOM otra vez en el fetch
            lotesAActualizar.push({
                id: idLote,
                payload: {
                    "Estado_fenologico": card.querySelector('.edit-lote-estado').value,
                    "Fecha_eliminacion": card.querySelector('.edit-lote-fecha-eliminacion').value || null,
                    "Area_total": areaTotalLote,
                    "Fecha_siembra": card.querySelector('.edit-lote-fecha-siembra').value,
                    "Total_plantas": card.querySelector('.edit-lote-total-plantas').value,
                    "Area_siembra": areaSiembraLote,
                    "Id_lugar": idLugarActual,
                    "Id_cultivo": parseInt(card.querySelector('.edit-lote-cultivo').value)
                }
            });
        }

        // --- 2. VALIDACIÓN CONTRA EL LUGAR DE PRODUCCIÓN ---
        // Sumamos el área de los predios vinculados actualmente en lugarActual
        const areaDisponibleLugar = lugarActual.predios.reduce((sum, p) => sum + parseFloat(p.Area_total || 0), 0);

        // REGLA: Suma de lotes no puede ser mayor al área total del lugar (predios)
        if (sumaAreaLotes > areaDisponibleLugar) {
            showToast(`❌ El área total de los lotes (${sumaAreaLotes.toFixed(2)}ha) supera el área de los predios del lugar (${areaDisponibleLugar.toFixed(2)}ha)`, "error");
            btn.disabled = false;
            btn.innerHTML = "✔ Guardar cambios";
            return;
        }

        // --- 3. EJECUCIÓN DE LAS PETICIONES ---
        btn.innerHTML = "⌛ Guardando...";
        for (const lote of lotesAActualizar) {
            const response = await fetch(`http://localhost:8003/lote/${lote.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lote.payload)
            });

            if (!response.ok) throw new Error(`Error al actualizar el lote ${lote.id}`);
        }

        showToast("✅ Cambios en lotes guardados correctamente", "success");
        goToTable();
        cargarLugares();

    } catch (error) {
        console.error(error);
        showToast("❌ Error al guardar los cambios", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "✔ Guardar cambios";
    }
}

async function eliminarLugar(id) {
  // 1. Confirmación visual para evitar errores accidentales
  if (
    !confirm(
      "¿Estás seguro de eliminar este lugar de producción? Esta acción liberará los predios asociados.",
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
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
  toast.className = `toast show ${type === "error" ? "bg-danger" : "bg-success"}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

// Funciones para manejar lógica del formulario (puedes completarlas según necesites)
function onPrediosChange() {
  const num = parseInt(document.getElementById("f-num-predios").value);
  const container = document.getElementById("predios-container");
  container.innerHTML = "";
  container.style.display = "block";

  if (isNaN(num) || num <= 0) {
    verificarFormularioLugar();
    return;
  }

  for (let i = 1; i <= num; i++) {
    const div = document.createElement("div");
    div.className = "form-group mt-3 animate__animated animate__fadeIn";
    div.innerHTML = `
            <label class="form-label">ID del Predio #${i} *</label>
            <input type="number" class="form-input predio-id-input" 
                   placeholder="Ingrese el ID del predio" oninput="verificarFormularioLugar()">
        `;
    container.appendChild(div);
  }
  verificarFormularioLugar();
}

function verificarFormularioLugar() {
  const nombre = document.getElementById("f-nombre").value.trim();
  const numPredios = document.getElementById("f-num-predios").value;
  const inputsPredios = document.querySelectorAll(".predio-id-input");

  let prediosCompletos = inputsPredios.length > 0;
  inputsPredios.forEach((input) => {
    if (!input.value.trim()) prediosCompletos = false;
  });

  const btnAceptar = document.getElementById("btn-aceptar");
  btnAceptar.disabled = !(nombre && numPredios > 0 && prediosCompletos);
}

// Agregamos el listener al nombre también
document
  .getElementById("f-nombre")
  .addEventListener("input", verificarFormularioLugar);

async function crearLugar() {
  const btnAceptar = document.getElementById("btn-aceptar");

  // 1. Obtener datos del Productor (localStorage)
  const usuarioStorage = JSON.parse(localStorage.getItem("usuario"));
  if (!usuarioStorage || !usuarioStorage.Id_productor) {
    showToast(
      "Error: No se encontró información del productor. Inicie sesión de nuevo.",
      "error",
    );
    return;
  }

  // 2. Recolectar datos del formulario
  const nombre = document.getElementById("f-nombre").value.trim();
  const inputsPredios = document.querySelectorAll(".predio-id-input");
  const prediosIds = Array.from(inputsPredios).map((input) =>
    parseInt(input.value),
  );

  // 3. Construir el objeto para el backend
  const nuevoLugar = {
    Nombre_LugarProduccion: nombre,
    Id_productor: usuarioStorage.Id_productor,
    prediosIds: prediosIds,
  };

  try {
    btnAceptar.disabled = true;
    btnAceptar.innerHTML = "Guardando...";

    const response = await fetch(API_URL_ADD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoLugar),
    });

    const result = await response.json();

    if (response.ok && result.status === "Success") {
      showToast("✅ Lugar de producción creado con éxito", "success");

      // Regresar a la tabla y recargar datos
      goToTable();
      cargarLugares();
    } else {
      showToast("❌ Error: " + (result.message || "No se pudo crear"), "error");
      btnAceptar.disabled = false;
      btnAceptar.innerHTML = "✔ Aceptar";
    }
  } catch (error) {
    console.error("Error en crearLugar:", error);
    showToast("Error de conexión con el servidor", "error");
    btnAceptar.disabled = false;
    btnAceptar.innerHTML = "✔ Aceptar";
  }
}
