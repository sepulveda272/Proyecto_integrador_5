import getConnection from "../database/conection.js";
import axios from 'axios';

const CULTIVOS_SERVICE_URL = "http://localhost:8000/cultivo";

export const getLotes = async (req, res) => {
    try {
        const connection = await getConnection();

        // 1. Obtener lotes con el nombre del lugar de producción (Local JOIN)
        const lotes = await connection.query(`
            SELECT l.*, lp.Nombre_LugarProduccion 
            FROM Lote l
            JOIN Lugar_produccion lp ON l.Id_lugar = lp.Id_lugar
        `);

        // 2. Traer la información de los cultivos desde el Microservicio Externo
        // Usamos Promise.all para que las peticiones a los cultivos se hagan en paralelo y sea más rápido
        const lotesConCultivo = await Promise.all(lotes.map(async (lote) => {
            try {
                const response = await axios.get(`${CULTIVOS_SERVICE_URL}/${lote.Id_cultivo}`);
                const datosCultivo = response.data;

                // Como tu microservicio devuelve un array [ { ... } ]
                // Extraemos el primer elemento si existe
                return {
                    ...lote,
                    datos_cultivo: datosCultivo.length > 0 ? datosCultivo[0] : "Cultivo no encontrado"
                };
            } catch (error) {
                // Si falla el microservicio de cultivos para un lote específico
                return {
                    ...lote,
                    datos_cultivo: "Error al conectar con microservicio"
                };
            }
        }));

        res.json({
            status: "Success",
            message: "Listado de lotes obtenido correctamente",
            data: lotesConCultivo
        });

    } catch (error) {
        res.status(500).json({
            status: "Error",
            message: "Error al obtener los lotes",
            error: error.message
        });
    }
};

export const getLoteConCultivo = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        
        // 1. Obtener los datos del lote en la DB local
        const [lote] = await connection.query("SELECT * FROM Lote WHERE Numero_Lote = ?", id);
        
        if (!lote) return res.status(404).json({ message: "Lote no encontrado" });
        

        // 2. Consultar al microservicio de Cultivos usando el Id_cultivo que tenemos
        // Supongamos que el otro microservicio corre en el puerto 4000
        const respuestaCultivo = await axios.get(`${CULTIVOS_SERVICE_URL}/${lote.Id_cultivo}`);
        const datosCultivo = respuestaCultivo.data.data;

        // 3. Unir la información
        res.json({
            status: "Success",
            data: {
                ...lote,
                cultivo: datosCultivo // Aquí ya tienes nombre, variedad, etc.
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error al conectar con el microservicio de cultivos" });
    }
};

export const addLote = async (req, res) => {
    try {
        const { Area_total, Fecha_siembra, Area_siembra, Estado_fenologico, Id_lugar, Id_cultivo } = req.body;

        // 1. VALIDACIÓN EXTERNA: Verificar existencia del cultivo
        try {
            const responseCultivo = await axios.get(`${CULTIVOS_SERVICE_URL}/${Id_cultivo}`);
            
            // IMPORTANTE: Como tu getCultivo hace res.json(result), 
            // responseCultivo.data es un ARREGLO [ {...} ]
            const datosCultivo = responseCultivo.data; 

            // Si el arreglo está vacío, el cultivo no existe en la BD del otro microservicio
            if (!datosCultivo || datosCultivo.length === 0) {
                return res.status(404).json({
                    status: "Error",
                    message: `El cultivo con ID ${Id_cultivo} no existe.`
                });
            }

        } catch (error) {
            // Este catch atrapa errores de conexión o si el microservicio está caído
            return res.status(502).json({
                status: "Error",
                message: "No se pudo validar el cultivo porque el microservicio no responde.",
                error: error.message
            });
        }

        // 2. VALIDACIÓN LÓGICA
        if (parseFloat(Area_siembra) > parseFloat(Area_total)) {
            return res.status(400).json({
                status: "Error",
                message: "El área de siembra no puede ser mayor al área total del lote."
            });
        }

        const connection = await getConnection();

        // 3. Proceder con el registro
        const nuevoLote = { 
            Area_total, Fecha_siembra, Area_siembra, 
            Estado_fenologico, Id_lugar, Id_cultivo,
            Fecha_eliminacion: null 
        };

        const result = await connection.query("INSERT INTO Lote SET ?", nuevoLote);

        res.status(201).json({
            status: "Success",
            message: "Lote registrado correctamente.",
            data: { id: result.insertId, ...nuevoLote }
        });

    } catch (error) {
        res.status(500).json({ 
            status: "Error", 
            message: "Error interno", 
            error: error.message 
        });
    }
};

export const updateLote = async (req, res) => {
    try {
        const { id } = req.params; // Numero_Lote
        const { 
            Area_total, Fecha_siembra, Fecha_eliminacion, 
            Area_siembra, Estado_fenologico, Id_lugar, Id_cultivo 
        } = req.body;

        const connection = await getConnection();

        // 1. VALIDACIÓN EXTERNA (Si intentan cambiar el cultivo)
        if (Id_cultivo) {
            try {
                const response = await axios.get(`${CULTIVOS_SERVICE_URL}/${Id_cultivo}`);
                if (!response.data || response.data.length === 0) {
                    return res.status(404).json({
                        status: "Error",
                        message: "El nuevo cultivo asignado no existe."
                    });
                }
            } catch (error) {
                return res.status(502).json({
                    status: "Error",
                    message: "No se pudo validar el cultivo con el microservicio externo."
                });
            }
        }

        // 2. ACTUALIZACIÓN EN BD
        const datosActualizar = { 
            Area_total, Fecha_siembra, Fecha_eliminacion, 
            Area_siembra, Estado_fenologico, Id_lugar, Id_cultivo 
        };

        const result = await connection.query(
            "UPDATE Lote SET ? WHERE Numero_Lote = ?", 
            [datosActualizar, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "Error", message: "El lote no existe." });
        }

        res.json({
            status: "Success",
            message: "Lote actualizado correctamente.",
            data: datosActualizar
        });

    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const deleteLote = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        const result = await connection.query("DELETE FROM Lote WHERE Numero_Lote = ?", id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: "Error", 
                message: "No se pudo eliminar: el lote no existe." 
            });
        }

        res.json({
            status: "Success",
            message: `Lote número ${id} eliminado exitosamente.`
        });
    } catch (error) {
        res.status(500).json({ 
            status: "Error", 
            message: "Error al eliminar el lote", 
            error: error.message 
        });
    }
};