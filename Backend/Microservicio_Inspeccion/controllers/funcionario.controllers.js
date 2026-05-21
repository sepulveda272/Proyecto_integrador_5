import getConnection from "../database/conection.js";
import bcryptjs from "bcryptjs";

export const getFuncionarios = async (req, res) => {
    try {
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM funcionario_ica");

        res.json({
            status: "Success",
            message: "Listado de funcionarios ICA obtenido correctamente",
            total_results: result.length,
            data: result
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const getFuncionario = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const result = await connection.query(
            "SELECT * FROM funcionario_ica WHERE Id_funcionario = ?", id
        );

        if (result.length === 0) {
            return res.status(404).json({ status: "Error", message: `Funcionario con ID ${id} no encontrado.` });
        }

        res.json({
            status: "Success",
            data: result[0]
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const addFuncionario = async (req, res) => {
    try {
        const {
            Numero_identificacion, Tipo_identificacion, Primer_nombre, Segundo_nombre,
            Primer_apellido, Segundo_apellido, Imagen, Celular, Correo, Password, Estado
        } = req.body;

        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(Password, salt);

        const funcionario = {
            Numero_identificacion, Tipo_identificacion, Primer_nombre, Segundo_nombre,
            Primer_apellido, Segundo_apellido, Imagen, Celular, Correo,
            Password: hashedPassword,
            Estado: Estado || "Activo"
        };

        const connection = await getConnection();
        const result = await connection.query("INSERT INTO funcionario_ica SET ?", funcionario);

        const respuesta = { ...funcionario };
        delete respuesta.Password;

        res.status(201).json({
            status: "Success",
            message: `El funcionario "${Primer_nombre}" se guardó correctamente.`,
            data: { id: result.insertId, ...respuesta }
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const updateFuncionario = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            Numero_identificacion, Tipo_identificacion, Primer_nombre, Segundo_nombre,
            Primer_apellido, Segundo_apellido, Imagen, Celular, Correo, Password, Estado
        } = req.body;

        const datosAActualizar = {
            Numero_identificacion, Tipo_identificacion, Primer_nombre, Segundo_nombre,
            Primer_apellido, Segundo_apellido, Imagen, Celular, Correo, Estado
        };

        if (Password && Password.trim() !== "") {
            const salt = await bcryptjs.genSalt(10);
            datosAActualizar.Password = await bcryptjs.hash(Password, salt);
        }

        const connection = await getConnection();
        const result = await connection.query(
            "UPDATE funcionario_ica SET ? WHERE Id_funcionario = ?",
            [datosAActualizar, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "Error",
                message: `No se pudo actualizar: El funcionario con ID ${id} no existe.`
            });
        }

        const respuesta = { ...datosAActualizar };
        delete respuesta.Password;

        res.json({
            status: "Success",
            message: `El funcionario "${Primer_nombre}" se actualizó correctamente.`,
            data: { id, ...respuesta }
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const deleteFuncionario = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        const result = await connection.query(
            "UPDATE funcionario_ica SET Estado = 'Inactivo' WHERE Id_funcionario = ?", id
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "Error",
                message: `El funcionario con ID ${id} no existe.`
            });
        }

        res.json({
            status: "Success",
            message: `El funcionario con ID ${id} ha sido marcado como Inactivo.`
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};
