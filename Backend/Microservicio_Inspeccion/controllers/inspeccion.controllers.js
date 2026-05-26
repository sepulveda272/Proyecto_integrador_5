import getConnection from "../database/conection.js";
import axios from "axios";

// URL del microservicio de infraestructura para enriquecer con datos del lugar
const INFRAESTRUCTURA_SERVICE_URL = "http://localhost:8003";

export const getInspecciones = async (req, res) => {
    try {
        const connection = await getConnection();

        const querySql = `
            SELECT
                i.*,
                t.Primer_nombre AS Nombre_tecnico,
                t.Primer_apellido AS Apellido_tecnico
            FROM inspeccion_fitosanitario i
            LEFT JOIN tecnico_oficial t ON i.Id_tecnico = t.Id_tecnico
        `;

        const result = await connection.query(querySql);

        res.json({
            status: "Success",
            message: "Listado de inspecciones obtenido correctamente",
            total_results: result.length,
            data: result
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

// OBTENER INSPECCIONES DE UN TÉCNICO ESPECÍFICO
// Endpoint: GET /inspeccion/tecnico/:idTecnico
// Usado cuando el técnico inicia sesión para ver solo sus inspecciones asignadas.
// Enriquece cada inspección con Nombre_LugarProduccion, Departamento y Municipio
// consultando el microservicio de infraestructura en el puerto 8003.
export const getInspeccionesByTecnico = async (req, res) => {
    try {
        const { idTecnico } = req.params;
        const connection = await getConnection();

        const querySql = `
            SELECT
                i.*,
                t.Primer_nombre AS Nombre_tecnico,
                t.Primer_apellido AS Apellido_tecnico
            FROM inspeccion_fitosanitario i
            LEFT JOIN tecnico_oficial t ON i.Id_tecnico = t.Id_tecnico
            WHERE i.Id_tecnico = ?
            ORDER BY i.Fecha_inspeccion ASC
        `;

        const inspecciones = await connection.query(querySql, [idTecnico]);

        // Enriquecer con datos del lugar (nombre, productor, departamento, municipio, vereda)
        // llamando al microservicio de infraestructura en el puerto 8003.
        const inspeccionesCompletas = await Promise.all(inspecciones.map(async (insp) => {
            try {
                const resp  = await axios.get(`${INFRAESTRUCTURA_SERVICE_URL}/lugarPro/${insp.Id_lugar}`);
                const lugar = resp.data?.data;
                const predio = lugar?.predios?.[0];

                return {
                    ...insp,
                    Nombre_LugarProduccion: lugar?.Nombre_LugarProduccion || `Lugar #${insp.Id_lugar}`,
                    Nombre_Productor:  lugar?.Productor_nombre && lugar?.Productor_apellido
                        ? `${lugar.Productor_nombre} ${lugar.Productor_apellido}`
                        : null,
                    Departamento: predio?.Ubicacion?.Departamento || null,
                    Municipio:    predio?.Ubicacion?.Municipio    || null,
                    Vereda:       predio?.Ubicacion?.Vereda       || null
                };
            } catch {
                // Si el microservicio no responde, se muestra el ID como fallback
                return {
                    ...insp,
                    Nombre_LugarProduccion: `Lugar #${insp.Id_lugar}`,
                    Nombre_Productor:  null,
                    Departamento: null,
                    Municipio:    null,
                    Vereda:       null
                };
            }
        }));

        res.json({
            status: "Success",
            message: `Inspecciones del técnico ${idTecnico} obtenidas correctamente`,
            total_results: inspeccionesCompletas.length,
            data: inspeccionesCompletas
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const getInspeccion = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        const querySql = `
            SELECT
                i.*,
                t.Primer_nombre AS Nombre_tecnico,
                t.Primer_apellido AS Apellido_tecnico
            FROM inspeccion_fitosanitario i
            LEFT JOIN tecnico_oficial t ON i.Id_tecnico = t.Id_tecnico
            WHERE i.Id_inspeccion = ?
        `;

        const result = await connection.query(querySql, id);

        if (result.length === 0) {
            return res.status(404).json({ status: "Error", message: `Inspección con ID ${id} no encontrada.` });
        }

        res.json({
            status: "Success",
            data: result[0]
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const addInspeccion = async (req, res) => {
    try {
        const { Plantas_revisadas, Plantas_afectadas, Fecha_inspeccion, Nivel_alerta, Id_tecnico, Id_lugar } = req.body;

        const inspeccion = {
            Plantas_revisadas: Plantas_revisadas || 0,
            Plantas_afectadas: Plantas_afectadas || 0,
            Fecha_inspeccion,
            Nivel_alerta,
            Id_tecnico,
            Id_lugar
        };

        const connection = await getConnection();
        const result = await connection.query("INSERT INTO inspeccion_fitosanitario SET ?", inspeccion);

        res.status(201).json({
            status: "Success",
            message: "Inspección registrada correctamente.",
            data: { id: result.insertId, ...inspeccion }
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const updateInspeccion = async (req, res) => {
    try {
        const { id } = req.params;
        const datosBody = req.body;

        const connection = await getConnection();
        const result = await connection.query(
            "UPDATE inspeccion_fitosanitario SET ? WHERE Id_inspeccion = ?",
            [datosBody, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "Error",
                message: `La inspección con ID ${id} no existe o los datos son idénticos.`
            });
        }

        res.json({
            status: "Success",
            message: `Inspección ${id} actualizada correctamente.`,
            data: datosBody
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const deleteInspeccion = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        // Eliminar observaciones relacionadas antes de eliminar la inspección
        await connection.query("DELETE FROM observaciones WHERE Id_inspeccion = ?", id);

        const result = await connection.query(
            "DELETE FROM inspeccion_fitosanitario WHERE Id_inspeccion = ?", id
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "Error", message: `Inspección con ID ${id} no encontrada.` });
        }

        res.json({
            status: "Success",
            message: `Inspección ${id} y sus observaciones eliminadas correctamente.`
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};