import getConnection from "../database/conection.js";

export const getPredios = async (req, res) => {
    try {
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM Predio");

        res.json({
            status: "Success",
            message: "Listado de predios obtenido",
            data: result
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const addPredio = async (req, res) => {
    try {
        const { Nombre_predio, Area_total, Nombre_propietario, Coordenadas_lat, Coordenadas_lon, Id_vereda } = req.body;
        
        // El estado inicia siempre como Desocupado y el Id_lugar como null
        const nuevoPredio = { 
            Nombre_predio, Area_total, Nombre_propietario, 
            Coordenadas_lat, Coordenadas_lon, Id_vereda,
            Estado: "Desocupado",
            Id_lugar: null 
        };

        const connection = await getConnection();
        const result = await connection.query("INSERT INTO Predio SET ?", nuevoPredio);

        res.status(201).json({
            status: "Success",
            message: `El predio "${Nombre_predio}" ha sido registrado correctamente.`,
            data: { id: result.insertId, ...nuevoPredio }
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const getPredio = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM Predio WHERE Id_predio = ?", id);

        if (result.length === 0) {
            return res.status(404).json({ status: "Error", message: "Predio no encontrado" });
        }

        res.json({
            status: "Success",
            data: result[0]
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const updatePredio = async (req, res) => {
    try {
        const { id } = req.params;
        const { Nombre_predio, Area_total, Nombre_propietario, Coordenadas_lat, Coordenadas_lon, Estado, Id_vereda } = req.body;
        
        const datosActualizados = { Nombre_predio, Area_total, Nombre_propietario, Coordenadas_lat, Coordenadas_lon, Estado, Id_vereda };
        
        const connection = await getConnection();
        const result = await connection.query("UPDATE Predio SET ? WHERE Id_predio = ?", [datosActualizados, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "Error", message: "No se encontró el predio para actualizar" });
        }

        res.json({
            status: "Success",
            message: "Predio actualizado con éxito",
            data: { id, ...datosActualizados }
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const deletePredio = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        // Opcional: Verificar si está ocupado antes de borrar
        const [check] = await connection.query("SELECT Estado FROM Predio WHERE Id_predio = ?", id);
        if (check && check.Estado === 'Ocupado') {
            return res.status(400).json({ 
                status: "Error", 
                message: "No se puede eliminar un predio que está en uso (Ocupado). Primero libérelo del lugar de producción." 
            });
        }

        const result = await connection.query("DELETE FROM Predio WHERE Id_predio = ?", id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "Error", message: "El predio no existe" });
        }

        res.json({
            status: "Success",
            message: "Predio eliminado correctamente"
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};