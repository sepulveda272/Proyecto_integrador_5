import getConnection from "../database/conection.js";
import axios from 'axios';

// URL del microservicio externo mencionado en los comentarios de tu tabla
const INSPECCIONES_SERVICE_URL = "http://localhost:9000/tecnico"; 

// 1. OBTENER TODAS LAS CITAS
export const getCitas = async (req, res) => {
    try {
        const connection = await getConnection();
        
        // 1. Modificamos la consulta con un JOIN para traer el nombre del lugar
        // Ajusta "Lugar_produccion" y "Nombre_LugarProduccion" si los nombres en tu DB son diferentes
        const querySql = `
            SELECT 
                c.*, 
                lp.Nombre_LugarProduccion 
            FROM citas c
            LEFT JOIN Lugar_produccion lp ON c.Id_lugar = lp.Id_lugar
        `;
        
        const citas = await connection.query(querySql);

        // 2. Enriquecer con datos del microservicio externo (Técnicos)
        const citasCompletas = await Promise.all(citas.map(async (cita) => {
            try {
                if (!cita.Id_tecnico) {
                    return { ...cita, datos_tecnico: null };
                }
                
                const response = await axios.get(`${INSPECCIONES_SERVICE_URL}/${cita.Id_tecnico}`);
                
                // Manejo de la respuesta del microservicio
                let infoTecnico = "Técnico no encontrado";
                if (response.data) {
                    infoTecnico = Array.isArray(response.data) && response.data.length > 0 
                        ? response.data[0] 
                        : response.data;
                }

                return {
                    ...cita,
                    datos_tecnico: infoTecnico
                };
            } catch (error) {
                return { 
                    ...cita, 
                    datos_tecnico: "Error al conectar con microservicio de Inspecciones" 
                };
            }
        }));

        res.json({
            status: "Success",
            message: "Listado de citas obtenido correctamente",
            data: citasCompletas
        });
    } catch (error) {
        console.error("Error en getCitas:", error);
        res.status(500).json({ status: "Error", message: error.message });
    }
};

// 2. OBTENER UNA ÚNICA CITA
export const getCita = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        
        const [cita] = await connection.query("SELECT * FROM citas WHERE Id_cita = ?", id);
        
        if (!cita) return res.status(404).json({ message: "Cita no encontrada" });

        // Consultar técnico externo
        let datosTecnico = null;
        try {
            if (cita.Id_tecnico) {
                const response = await axios.get(`${INSPECCIONES_SERVICE_URL}/${cita.Id_tecnico}`);
                datosTecnico = response.data;
            }
        } catch (e) {
            datosTecnico = "No se pudo cargar la info del técnico";
        }

        res.json({
            status: "Success",
            data: { ...cita, tecnico: datosTecnico }
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

// 3. CREAR UNA CITA (POST)
export const addCita = async (req, res) => {
    try {
        const { 
            Hora_inspeccion, Fecha_inspeccion, Id_productor, 
            Id_lugar, Id_tecnico, Estado, Observaciones 
        } = req.body;

        // Validación externa: ¿Existe el técnico?
        if (Id_tecnico) {
            try {
                const response = await axios.get(`${INSPECCIONES_SERVICE_URL}/${Id_tecnico}`);
                if (!response.data || response.data.length === 0) {
                    return res.status(404).json({ status: "Error", message: "El técnico no existe en el sistema de inspecciones." });
                }
            } catch (error) {
                return res.status(502).json({ status: "Error", message: "Error al validar técnico con servicio externo." });
            }
        }

        const connection = await getConnection();
        const nuevaCita = { 
            Hora_inspeccion, Fecha_inspeccion, Id_productor, 
            Id_lugar, Id_tecnico, 
            Estado: Estado || 'Pendiente', // Según el "Predeterminado" de tu imagen
            Observaciones 
        };

        const result = await connection.query("INSERT INTO citas SET ?", nuevaCita);

        res.status(201).json({
            status: "Success",
            message: "Cita programada correctamente",
            data: { id: result.insertId, ...nuevaCita }
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

// 4. ACTUALIZAR UNA CITA (PUT)
export const updateCita = async (req, res) => {
    try {
        const { id } = req.params;
        const datosBody = req.body; // Tomamos todo el cuerpo de la petición

        const connection = await getConnection();

        // 1. VALIDACIÓN DEL TÉCNICO (Solo si Id_tecnico viene en el body)
        if (datosBody.Id_tecnico) {
            try {
                const response = await axios.get(`${INSPECCIONES_SERVICE_URL}/${datosBody.Id_tecnico}`);
                // Si el microservicio devuelve un array vacío
                if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
                    return res.status(404).json({
                        status: "Error",
                        message: `El técnico con ID ${datosBody.Id_tecnico} no existe.`
                    });
                }
            } catch (error) {
                return res.status(502).json({
                    status: "Error",
                    message: "No se pudo validar el técnico con el servicio externo.",
                    error: error.message
                });
            }
        }

        // 2. ACTUALIZACIÓN EN LA BASE DE DATOS
        // Usamos el objeto datosBody directamente para que solo se actualicen los campos enviados
        const result = await connection.query(
            "UPDATE citas SET ? WHERE Id_cita = ?", 
            [datosBody, id]
        );

        // 3. VERIFICACIÓN DE FILAS AFECTADAS
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: "Error", 
                message: "No se realizó ningún cambio. La cita no existe o los datos son idénticos." 
            });
        }

        res.json({
            status: "Success",
            message: "Cita actualizada correctamente.",
            data: datosBody
        });

    } catch (error) {
        res.status(500).json({ 
            status: "Error", 
            message: "Error al procesar la actualización", 
            error: error.message 
        });
    }
};

// 5. ELIMINAR UNA CITA (DELETE)
export const deleteCita = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        const result = await connection.query("DELETE FROM citas WHERE Id_cita = ?", id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "Error", message: "Cita no encontrada." });
        }

        res.json({ status: "Success", message: `Cita ${id} eliminada.` });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};