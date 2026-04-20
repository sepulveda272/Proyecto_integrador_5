import getConnection from "../database/conection.js";

export const getLugaresProduccion = async (req, res) => {
    try {
        const connection = await getConnection();

        // 1. Consulta con todos los JOINs necesarios para la ubicación
        const query = `
            SELECT 
                l.Id_lugar, 
                l.Nombre_LugarProduccion, 
                l.Id_productor,
                p.Id_predio,
                p.Nombre_predio,
                p.Area_total,
                p.Estado,
                v.Nombre_Vereda,
                m.Nombre_Municipio,
                d.Nombre_Depart
            FROM Lugar_produccion l
            LEFT JOIN Predio p ON l.Id_lugar = p.Id_lugar
            LEFT JOIN Vereda v ON p.Id_vereda = v.Id_vereda
            LEFT JOIN Municipio m ON v.Id_municipio = m.Id_municipio
            LEFT JOIN Departamento d ON m.Id_Departamento = d.Id_Departamento
        `;

        const rows = await connection.query(query);

        // 2. Agrupamos los datos en JavaScript
        const lugaresAgrupados = rows.reduce((acc, row) => {
            let lugar = acc.find(item => item.Id_lugar === row.Id_lugar);

            if (!lugar) {
                lugar = {
                    Id_lugar: row.Id_lugar,
                    Nombre_LugarProduccion: row.Nombre_LugarProduccion,
                    Id_productor: row.Id_productor,
                    total_predios: 0,
                    detalles_predios: []
                };
                acc.push(lugar);
            }

            if (row.Id_predio) {
                lugar.detalles_predios.push({
                    Id_predio: row.Id_predio,
                    Nombre_predio: row.Nombre_predio,
                    Area_total: row.Area_total,
                    Estado: row.Estado,
                    Ubicacion: {
                        Vereda: row.Nombre_Vereda,
                        Municipio: row.Nombre_Municipio,
                        Departamento: row.Nombre_Depart
                    }
                });
                lugar.total_predios = lugar.detalles_predios.length;
            }

            return acc;
        }, []);

        res.json({
            status: "Success",
            message: "Listado de lugares con predios y ubicación completa",
            data: lugaresAgrupados
        });

    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const addLugarProduccion = async (req, res) => {
    try {
        const { Nombre_LugarProduccion, Id_productor, prediosIds } = req.body;

        if (!prediosIds || !Array.isArray(prediosIds) || prediosIds.length === 0) {
            return res.status(400).json({
                status: "Error",
                message: "Debe seleccionar al menos un predio."
            });
        }

        const connection = await getConnection();

        // 2. OBTENER DATOS GEOGRÁFICOS
        // Quitamos la desestructuración [detallesPredios] y lo manejamos directamente
        const resultadoQuery = await connection.query(`
            SELECT p.Id_predio, p.Estado, v.Id_municipio, m.Id_Departamento
            FROM Predio p
            JOIN Vereda v ON p.Id_vereda = v.Id_vereda
            JOIN Municipio m ON v.Id_municipio = m.Id_municipio
            WHERE p.Id_predio IN (?)
        `, [prediosIds]);

        // IMPORTANTE: Algunos drivers devuelven [rows, fields], otros solo rows.
        // Forzamos a que detallesPredios sea el arreglo de filas.
        const detallesPredios = Array.isArray(resultadoQuery[0]) ? resultadoQuery[0] : resultadoQuery;

        // A. Verificar si todos existen y están desocupados
        if (detallesPredios.length !== prediosIds.length) {
            return res.status(400).json({
                status: "Error",
                message: "Uno o más predios seleccionados no existen."
            });
        }

        const todosDisponibles = detallesPredios.every(p => p.Estado === 'Desocupado');
        if (!todosDisponibles) {
            return res.status(400).json({
                status: "Error",
                message: "Uno o más predios ya se encuentran 'Ocupados'."
            });
        }

        // B. Verificar mismo Municipio y Departamento
        const refMunicipio = detallesPredios[0].Id_municipio;
        const refDepto = detallesPredios[0].Id_Departamento;

        const mismaUbicacion = detallesPredios.every(p => 
            p.Id_municipio === refMunicipio && p.Id_Departamento === refDepto
        );

        if (!mismaUbicacion) {
            return res.status(400).json({
                status: "Error",
                message: "No se pudo crear el lugar: las veredas no pertenecen al mismo municipio o departamento."
            });
        }

        // 3. Crear el Lugar de Producción
        const resultLugar = await connection.query(
            "INSERT INTO Lugar_produccion (Nombre_LugarProduccion, Id_productor) VALUES (?, ?)", 
            [Nombre_LugarProduccion, Id_productor]
        );
        
        // Manejo de insertId según el driver
        const idGenerado = resultLugar.insertId || resultLugar[0].insertId;

        // 4. Actualizar Predios
        await connection.query(
            "UPDATE Predio SET Id_lugar = ?, Estado = 'Ocupado' WHERE Id_predio IN (?)",
            [idGenerado, prediosIds]
        );

        res.status(201).json({
            status: "Success",
            message: `Registro exitoso del lugar "${Nombre_LugarProduccion}".`
        });

    } catch (error) {
        res.status(500).json({
            status: "Error",
            message: "Error al procesar el registro",
            error: error.message
        });
    }
};

export const getLugarProduccion = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        // 1. Consultar datos del lugar
        const [lugar] = await connection.query("SELECT * FROM Lugar_produccion WHERE Id_lugar = ?", id);

        if (!lugar) {
            return res.status(404).json({ status: "Error", message: "Lugar no encontrado" });
        }

        // 2. Consultar los predios asociados a ese lugar
        const predios = await connection.query("SELECT * FROM Predio WHERE Id_lugar = ?", id);

        res.json({
            status: "Success",
            data: {
                ...lugar,
                predios: predios // Array con los predios detallados
            }
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const updateLugarProduccion = async (req, res) => {
    try {
        const { id } = req.params;
        const { Nombre_LugarProduccion, prediosIds } = req.body; 

        const connection = await getConnection();

        // 1. VALIDACIÓN GEOGRÁFICA (Solo si se envían predios para actualizar)
        if (prediosIds && Array.isArray(prediosIds) && prediosIds.length > 0) {
            
            const resultadoQuery = await connection.query(`
                SELECT p.Id_predio, p.Estado, p.Id_lugar, v.Id_municipio, m.Id_Departamento
                FROM Predio p
                JOIN Vereda v ON p.Id_vereda = v.Id_vereda
                JOIN Municipio m ON v.Id_municipio = m.Id_municipio
                WHERE p.Id_predio IN (?)
            `, [prediosIds]);

            const detallesPredios = Array.isArray(resultadoQuery[0]) ? resultadoQuery[0] : resultadoQuery;

            // A. ¿Existen todos?
            if (detallesPredios.length !== prediosIds.length) {
                return res.status(400).json({
                    status: "Error",
                    message: "Uno o más de los nuevos predios seleccionados no existen."
                });
            }

            // B. ¿Están disponibles? 
            // (Nota: Un predio es válido si está 'Desocupado' O si ya pertenecía a este lugar 'id')
            const todosDisponibles = detallesPredios.every(p => 
                p.Estado === 'Desocupado' || p.Id_lugar == id
            );
            
            if (!todosDisponibles) {
                return res.status(400).json({
                    status: "Error",
                    message: "Uno o más predios ya pertenecen a otro lugar de producción."
                });
            }

            // C. ¿Mismo Municipio y Departamento?
            const refMunicipio = detallesPredios[0].Id_municipio;
            const refDepto = detallesPredios[0].Id_Departamento;

            const mismaUbicacion = detallesPredios.every(p => 
                p.Id_municipio === refMunicipio && p.Id_Departamento === refDepto
            );

            if (!mismaUbicacion) {
                return res.status(400).json({
                    status: "Error",
                    message: "Actualización denegada: los predios seleccionados deben ser del mismo municipio y departamento."
                });
            }

            // --- SI PASA TODAS LAS VALIDACIONES, PROCEDEMOS A LOS CAMBIOS ---

            // 2. LIBERAR: Predios antiguos (los ponemos en NULL y Desocupado)
            await connection.query(
                "UPDATE Predio SET Id_lugar = NULL, Estado = 'Desocupado' WHERE Id_lugar = ?",
                [id]
            );

            // 3. VINCULAR: Asignar los nuevos predios
            await connection.query(
                "UPDATE Predio SET Id_lugar = ?, Estado = 'Ocupado' WHERE Id_predio IN (?)",
                [id, prediosIds]
            );
        }

        // 4. Actualizar datos básicos (Nombre)
        const result = await connection.query(
            "UPDATE Lugar_produccion SET Nombre_LugarProduccion = ? WHERE Id_lugar = ?", 
            [Nombre_LugarProduccion, id]
        );

        if (result.affectedRows === 0 && (!prediosIds)) {
            return res.status(404).json({ status: "Error", message: "El lugar de producción no existe." });
        }

        res.json({
            status: "Success",
            message: "Lugar de producción actualizado correctamente con validación geográfica.",
            data: { id, Nombre_LugarProduccion, predios_vinculados: prediosIds }
        });

    } catch (error) {
        res.status(500).json({ 
            status: "Error", 
            message: "Error al actualizar el lugar", 
            error: error.message 
        });
    }
};

export const deleteLugarProduccion = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        // 1. VERIFICACIÓN: ¿Tiene lotes asociados?
        const [lotes] = await connection.query(
            "SELECT COUNT(*) AS total FROM Lote WHERE Id_lugar = ?", 
            [id]
        );

        // Dependiendo del driver, lotes puede ser el objeto directo o el primer elemento
        const totalLotes = Array.isArray(lotes) ? lotes[0].total : lotes.total;

        if (totalLotes > 0) {
            return res.status(400).json({
                status: "Error",
                message: `No se puede eliminar el lugar de producción porque tiene ${totalLotes} lote(s) asociado(s). Primero debe eliminar los lotes.`
            });
        }

        // 2. LIBERAR PREDIOS: Si no hay lotes, procedemos a limpiar la relación en la tabla Predio
        await connection.query(
            "UPDATE Predio SET Id_lugar = NULL, Estado = 'Desocupado' WHERE Id_lugar = ?", 
            [id]
        );

        // 3. BORRAR LUGAR: Ahora sí borramos el registro de Lugar_produccion
        const result = await connection.query("DELETE FROM Lugar_produccion WHERE Id_lugar = ?", id);

        // El resultado puede variar según el driver (mysql2 devuelve [rows, fields])
        const affectedRows = result.affectedRows !== undefined ? result.affectedRows : result[0].affectedRows;

        if (affectedRows === 0) {
            return res.status(404).json({
                status: "Error",
                message: "El lugar de producción no existe o ya fue eliminado."
            });
        }

        res.json({
            status: "Success",
            message: "Lugar de producción eliminado y predios liberados correctamente."
        });

    } catch (error) {
        res.status(500).json({ 
            status: "Error", 
            message: "Error al intentar eliminar el lugar de producción",
            error: error.message 
        });
    }
};