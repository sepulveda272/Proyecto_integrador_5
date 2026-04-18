import getConnection from "../database/conection.js";
import bcryptjs from "bcryptjs";


export const getProductores = async (req, res) => {
    try {
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM productor");

        res.json({
            status: "Success",
            message: "Listado de productores obtenido correctamente",
            total_results: result.length,
            data: result
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
}

export const addProductor = async (req, res) => {
    try {
        const {Numero_identificacion, Tipo_identificacion, Primer_nombre, Segundo_nombre, Primer_apellido, Segundo_apellido, Imagen, Celular, Correo, Password, Estado}= req.body;
        
        
        const salt = await bcryptjs.genSalt(10);
        const hashedEmailPassword = await bcryptjs.hash(Password, salt);

        // 2. Creamos el objeto productor reemplazando la Password original por el Hash
        const productor = {
            Numero_identificacion, 
            Tipo_identificacion, 
            Primer_nombre, 
            Segundo_nombre, 
            Primer_apellido, 
            Segundo_apellido, 
            Imagen, 
            Celular, 
            Correo, 
            Password: hashedEmailPassword, // Guardamos la versión cifrada
            Estado: "Pendiente"
        };

        const connection = await getConnection();

        const result = await connection.query("INSERT INTO productor SET ?", productor)

        const respuestaDatos = { ...productor };
        delete respuestaDatos.Password;

        res.status(201).json({
            status: "Success",
            message: `El productor "${Primer_nombre}" se guardó correctamente.`,
            data: {
                id: result.insertId, 
                ...respuestaDatos           
            }
        });

    } catch (error) {
        res.status(500).json({
            status: "Error",
            message: "No se pudo guardar el productor",
            error: error.message
        });
    }
}

export const getProductor = async (req, res) => {
    try {
        console.log(req.params);
        const {id} = req.params
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM productor WHERE Id_productor = ?", id);
        console.log(result);
        res.json(result)
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
} 

export const deleteProductor = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        // Cambiamos el DELETE por un UPDATE
        const result = await connection.query(
            "UPDATE productor SET Estado = 'Inactivo' WHERE Id_productor = ?", 
            id
        );
        
        // Verificamos si el ID existía
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "Error",
                message: `No se pudo desactivar: El productor con ID ${id} no existe.`
            });
        }

        res.json({
            status: "Success",
            message: `El productor con ID ${id} ha sido marcado como Inactivo correctamente.`
        });

    } catch (error) {
        res.status(500).json({ 
            status: "Error", 
            message: "Error al intentar cambiar el estado del productor",
            details: error.message 
        });
    }
}

export const updateProductor = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            Numero_identificacion, Tipo_identificacion, Primer_nombre, 
            Segundo_nombre, Primer_apellido, Segundo_apellido, 
            Imagen, Celular, Correo, Password, Estado 
        } = req.body;

        // 1. Creamos el objeto con los datos básicos
        const datosAActualizar = { 
            Numero_identificacion, Tipo_identificacion, Primer_nombre, 
            Segundo_nombre, Primer_apellido, Segundo_apellido, 
            Imagen, Celular, Correo, Estado 
        };

        // 2. Lógica para la Contraseña
        if (Password && Password.trim() !== "") {
            
            // Si el usuario envió una nueva contraseña, la encriptamos
            const salt = await bcryptjs.genSalt(10);
            datosAActualizar.Password = await bcryptjs.hash(Password, salt);
        }
        // Si no viene Password, simplemente no se incluye en el objeto y SQL no la toca

        const connection = await getConnection();
        const result = await connection.query(
            "UPDATE productor SET ? WHERE Id_productor = ?", 
            [datosAActualizar, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "Error",
                message: `No se pudo actualizar: El productor con ID ${id} no existe.`
            });
        }

        // 3. Limpiar respuesta
        const respuestaSafe = { ...datosAActualizar };
        delete respuestaSafe.Password;

        res.json({
            status: "Success",
            message: `El productor "${Primer_nombre}" se actualizó correctamente.`,
            data: { id, ...respuestaSafe }
        });

    } catch (error) {
        res.status(500).json({ 
            status: "Error", 
            message: "Error al actualizar el productor",
            details: error.message 
        });
    }
}