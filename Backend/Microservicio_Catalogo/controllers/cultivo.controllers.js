import getConnection from "../database/conection.js";


export const getCultivos = async (req, res) => {
    try {
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM cultivo");

        res.json({
            status: "Success",
            message: "Listado de cultivos obtenido correctamente",
            total_results: result.length,
            data: result
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
}

export const addCultivo = async (req, res) => {
    try {
        const {Nombre_especie,Variedad,Imagen, Descripcion}= req.body;
        
        
        const cultivo = {Nombre_especie,Variedad,Imagen, Descripcion}
        const connection = await getConnection();

        const result = await connection.query("INSERT INTO cultivo SET ?", cultivo)

        res.status(201).json({
            status: "Success",
            message: `El cultivo "${Nombre_especie}" se guardó correctamente.`,
            data: {
                id: result.insertId, 
                ...cultivo           
            }
        });

    } catch (error) {
        res.status(500).json({
            status: "Error",
            message: "No se pudo guardar el cultivo",
            error: error.message
        });
    }
}

export const getCultivo = async (req, res) => {
    try {
        console.log(req.params);
        const {id} = req.params
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM cultivo WHERE Id_cultivo = ?", id);
        console.log(result);
        res.json(result)
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
} 

export const deleteCultivo = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const result = await connection.query("DELETE FROM cultivo WHERE Id_cultivo = ?", id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "Error",
                message: `No se pudo eliminar: El cultivo con ID ${id} no existe.`
            });
        }

        res.json({
            status: "Success",
            message: `El cultivo con ID ${id} ha sido eliminado correctamente.`
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
}

export const updateCultivo = async (req, res) => {
    try {
        const { id } = req.params;
        const { Nombre_especie, Variedad, Imagen, Descripcion } = req.body;
        const cultivo = { Nombre_especie, Variedad, Imagen, Descripcion };
        
        const connection = await getConnection();
        const result = await connection.query("UPDATE cultivo SET ? WHERE Id_cultivo = ?", [cultivo, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "Error",
                message: `No se pudo actualizar: El cultivo con ID ${id} no existe.`
            });
        }

        res.json({
            status: "Success",
            message: `El cultivo "${Nombre_especie}" (ID: ${id}) se actualizó correctamente.`,
            data: { id, ...cultivo }
        });

    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
}