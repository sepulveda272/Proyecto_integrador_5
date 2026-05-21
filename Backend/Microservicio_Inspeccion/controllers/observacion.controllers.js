import getConnection from "../database/conection.js";

export const getObservaciones = async (req, res) => {
    try {
        const connection = await getConnection();

        const querySql = `
            SELECT
                o.*,
                i.Fecha_inspeccion,
                i.Nivel_alerta,
                f.Primer_nombre AS Nombre_funcionario,
                f.Primer_apellido AS Apellido_funcionario
            FROM observaciones o
            LEFT JOIN inspeccion_fitosanitario i ON o.Id_inspeccion = i.Id_inspeccion
            LEFT JOIN funcionario_ica f ON o.Id_funcionario = f.Id_funcionario
        `;

        const result = await connection.query(querySql);

        res.json({
            status: "Success",
            message: "Listado de observaciones obtenido correctamente",
            total_results: result.length,
            data: result
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const getObservacion = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        const querySql = `
            SELECT
                o.*,
                i.Fecha_inspeccion,
                i.Nivel_alerta,
                f.Primer_nombre AS Nombre_funcionario,
                f.Primer_apellido AS Apellido_funcionario
            FROM observaciones o
            LEFT JOIN inspeccion_fitosanitario i ON o.Id_inspeccion = i.Id_inspeccion
            LEFT JOIN funcionario_ica f ON o.Id_funcionario = f.Id_funcionario
            WHERE o.Id_observacion = ?
        `;

        const result = await connection.query(querySql, id);

        if (result.length === 0) {
            return res.status(404).json({ status: "Error", message: `Observación con ID ${id} no encontrada.` });
        }

        res.json({
            status: "Success",
            data: result[0]
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const addObservacion = async (req, res) => {
    try {
        const { Fecha_observacion, Observaciones, Id_inspeccion, Id_funcionario } = req.body;

        const observacion = {
            Fecha_observacion: Fecha_observacion || new Date(),
            Observaciones,
            Id_inspeccion,
            Id_funcionario
        };

        const connection = await getConnection();
        const result = await connection.query("INSERT INTO observaciones SET ?", observacion);

        res.status(201).json({
            status: "Success",
            message: "Observación registrada correctamente.",
            data: { id: result.insertId, ...observacion }
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const updateObservacion = async (req, res) => {
    try {
        const { id } = req.params;
        const datosBody = req.body;

        const connection = await getConnection();
        const result = await connection.query(
            "UPDATE observaciones SET ? WHERE Id_observacion = ?",
            [datosBody, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "Error",
                message: `La observación con ID ${id} no existe o los datos son idénticos.`
            });
        }

        res.json({
            status: "Success",
            message: `Observación ${id} actualizada correctamente.`,
            data: datosBody
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const deleteObservacion = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        const result = await connection.query(
            "DELETE FROM observaciones WHERE Id_observacion = ?", id
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "Error", message: `Observación con ID ${id} no encontrada.` });
        }

        res.json({
            status: "Success",
            message: `Observación ${id} eliminada correctamente.`
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};
