import getConnection from "../database/conection.js";

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
