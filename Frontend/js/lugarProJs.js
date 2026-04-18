// Configuración de la URL de la API
const API_URL = "http://localhost:8003/lugarPro";
const API_URL_ADD = "http://localhost:8003/lugarPro/add";

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
                <button class="action-btn action-eye" onclick="verDetalle(${lugar.Id_lugar})" title="Ver">👁</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
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
    if (confirm("¿Estás seguro de eliminar este lugar de producción?")) {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            const result = await response.json();
            
            if (result.status === "Success") {
                showToast("Lugar eliminado correctamente", "success");
                cargarLugares(); // Recargar tabla
            }
        } catch (error) {
            showToast("Error al eliminar", "error");
        }
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